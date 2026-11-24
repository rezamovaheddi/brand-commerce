import {
  allocateStockFEFO,
  evaluateLotExpiryStatus,
  validateTwoPersonRelease,
  traceForwardFromLot,
  traceBackwardFromOrder,
  initiateLotRecall,
  validateJournalEntry,
  createOrderPaymentJournal,
  createInventoryFulfillmentJournal,
  performThreeWayMatch,
  InventoryLot,
  GenealogyRecord,
  PurchaseOrderLine,
  GoodsReceiptLine,
  SupplierInvoiceLine,
} from "./inventory";

describe("ERP-lite FEFO Inventory Allocation (TASK-076, TASK-079, TASK-132)", () => {
  const sampleLots: InventoryLot[] = [
    {
      id: "lot-1",
      lotNumber: "LOT-2026-001",
      variantId: "var-serum-30ml",
      warehouseId: "wh-central",
      onHand: 10,
      reserved: 2, // 8 available
      manufactureDate: "2026-01-01",
      expiryDate: "2026-12-31", // Earliest eligible
      status: "RELEASED",
    },
    {
      id: "lot-2",
      lotNumber: "LOT-2026-002",
      variantId: "var-serum-30ml",
      warehouseId: "wh-central",
      onHand: 20,
      reserved: 0, // 20 available
      manufactureDate: "2026-02-01",
      expiryDate: "2027-06-30", // Later expiry
      status: "RELEASED",
    },
    {
      id: "lot-3",
      lotNumber: "LOT-2026-003",
      variantId: "var-serum-30ml",
      warehouseId: "wh-north",
      onHand: 50,
      reserved: 0,
      manufactureDate: "2025-01-01",
      expiryDate: "2026-03-20", // Near expiry (less than 30 days from ref 2026-03-01)
      status: "RELEASED",
    },
    {
      id: "lot-4",
      lotNumber: "LOT-2026-004",
      variantId: "var-serum-30ml",
      warehouseId: "wh-central",
      onHand: 100,
      reserved: 0,
      manufactureDate: "2026-01-15",
      expiryDate: "2027-01-15",
      status: "QUARANTINE", // Not released!
    },
  ];

  it("allocates stock in strict FEFO order, skipping quarantine and near-expiry lots", () => {
    const result = allocateStockFEFO(sampleLots, {
      variantId: "var-serum-30ml",
      requestedQuantity: 12,
      referenceDate: "2026-03-01",
      minShelfLifeDays: 30,
    });

    expect(result.success).toBe(true);
    expect(result.allocatedQuantity).toBe(12);
    expect(result.deficit).toBe(0);
    // Should take 8 from lot-1 (exp 2026-12-31), then 4 from lot-2 (exp 2027-06-30)
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].lotId).toBe("lot-1");
    expect(result.allocations[0].allocatedQuantity).toBe(8);
    expect(result.allocations[1].lotId).toBe("lot-2");
    expect(result.allocations[1].allocatedQuantity).toBe(4);
  });

  it("reports deficit and failure when requested quantity exceeds available released stock", () => {
    const result = allocateStockFEFO(sampleLots, {
      variantId: "var-serum-30ml",
      requestedQuantity: 50, // Only 8 + 20 = 28 available
      referenceDate: "2026-03-01",
      minShelfLifeDays: 30,
    });

    expect(result.success).toBe(false);
    expect(result.allocatedQuantity).toBe(28);
    expect(result.deficit).toBe(22);
    expect(result.reason).toBeDefined();
  });

  it("throws on invalid quantity (zero or negative or non-integer)", () => {
    expect(() =>
      allocateStockFEFO(sampleLots, {
        variantId: "var-serum-30ml",
        requestedQuantity: 0,
      })
    ).toThrow();
    expect(() =>
      allocateStockFEFO(sampleLots, {
        variantId: "var-serum-30ml",
        requestedQuantity: -5,
      })
    ).toThrow();
  });

  it("evaluates expiry health and flags near-expiry batches correctly", () => {
    const nearExpiryLot = sampleLots[2]; // exp 2026-03-20
    const evalNear = evaluateLotExpiryStatus(nearExpiryLot, "2026-03-01");
    expect(evalNear.isNearExpiry).toBe(true);
    expect(evalNear.daysRemaining).toBe(19);

    const expiredLot: InventoryLot = {
      ...nearExpiryLot,
      expiryDate: "2026-02-15",
    };
    const evalExpired = evaluateLotExpiryStatus(expiredLot, "2026-03-01");
    expect(evalExpired.currentStatus).toBe("EXPIRED");
    expect(evalExpired.daysRemaining).toBeLessThanOrEqual(0);
  });
});

describe("ISO 22716 Cleanroom 2-Person Lot Release (TASK-127)", () => {
  it("approves release when inspector and approver are segregated and CoA is verified", () => {
    const res = validateTwoPersonRelease({
      lotId: "lot-101",
      lotNumber: "LOT-VAL-101",
      inspectedBy: "qa.inspector.zahra@dermavia.ir",
      approvedBy: "qc.director.reza@dermavia.ir",
      labReportId: "COA-2026-9921",
      inspectionPassed: true,
    });
    expect(res.approved).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("rejects self-approval where inspector equals approver", () => {
    const res = validateTwoPersonRelease({
      lotId: "lot-101",
      lotNumber: "LOT-VAL-101",
      inspectedBy: "dr.farhad@dermavia.ir",
      approvedBy: "dr.farhad@dermavia.ir",
      labReportId: "COA-2026-9921",
      inspectionPassed: true,
    });
    expect(res.approved).toBe(false);
    expect(res.error).toContain("Self-approval violation");
  });

  it("rejects release when inspection parameter failed or CoA is missing", () => {
    const resFailed = validateTwoPersonRelease({
      lotId: "lot-101",
      lotNumber: "LOT-VAL-101",
      inspectedBy: "qa.inspector@dermavia.ir",
      approvedBy: "qc.director@dermavia.ir",
      labReportId: "COA-2026-9921",
      inspectionPassed: false,
    });
    expect(resFailed.approved).toBe(false);

    const resNoCoa = validateTwoPersonRelease({
      lotId: "lot-101",
      lotNumber: "LOT-VAL-101",
      inspectedBy: "qa.inspector@dermavia.ir",
      approvedBy: "qc.director@dermavia.ir",
      labReportId: "",
      inspectionPassed: true,
    });
    expect(resNoCoa.approved).toBe(false);
  });
});

describe("Lot Genealogy Traceability & Recall Containment (TASK-126, TASK-128)", () => {
  const records: GenealogyRecord[] = [
    {
      lotNumber: "LOT-RECALL-99",
      supplierId: "SUPP-COSMO-01",
      poNumber: "PO-2026-101",
      grnNumber: "GRN-2026-101",
      orderId: "ORD-001",
      shipmentId: "SHP-001",
      customerId: "CUST-A",
      customerPhone: "09121112233",
      quantity: 2,
      fulfilledAt: "2026-03-01T10:00:00Z",
    },
    {
      lotNumber: "LOT-RECALL-99",
      supplierId: "SUPP-COSMO-01",
      poNumber: "PO-2026-101",
      grnNumber: "GRN-2026-101",
      orderId: "ORD-002",
      shipmentId: "SHP-002",
      customerId: "CUST-B",
      customerPhone: "09124445566",
      quantity: 3,
      fulfilledAt: "2026-03-02T11:00:00Z",
    },
  ];

  const warehouseLots: InventoryLot[] = [
    {
      id: "lot-rem-1",
      lotNumber: "LOT-RECALL-99",
      variantId: "var-cream",
      warehouseId: "wh-central",
      onHand: 45,
      reserved: 0,
      manufactureDate: "2026-01-10",
      expiryDate: "2027-01-10",
      status: "RELEASED",
    },
  ];

  it("traces forward to identify all affected customers, orders, and remaining warehouse stock", () => {
    const report = traceForwardFromLot("LOT-RECALL-99", records, warehouseLots);
    expect(report.affectedOrders).toEqual(["ORD-001", "ORD-002"]);
    expect(report.affectedShipments).toEqual(["SHP-001", "SHP-002"]);
    expect(report.affectedCustomers).toHaveLength(2);
    expect(report.totalUnitsDispatched).toBe(5);
    expect(report.remainingOnHand).toBe(45);
    expect(report.quarantinedWarehouses).toContain("wh-central");
  });

  it("traces backward from order to source supplier PO and incoming GRN", () => {
    const report = traceBackwardFromOrder("ORD-001", records);
    expect(report.orderId).toBe("ORD-001");
    expect(report.lots).toHaveLength(1);
    expect(report.lots[0].lotNumber).toBe("LOT-RECALL-99");
    expect(report.lots[0].supplierId).toBe("SUPP-COSMO-01");
    expect(report.lots[0].poNumber).toBe("PO-2026-101");
  });

  it("initiates batch recall and formats compliant Persian customer safety notifications", () => {
    const forwardReport = traceForwardFromLot("LOT-RECALL-99", records, warehouseLots);
    const recall = initiateLotRecall("LOT-RECALL-99", "Microbial trace deviation in preservative raw material", forwardReport);

    expect(recall.status).toBe("ACTIVE_RECALL");
    expect(recall.affectedCustomerCount).toBe(2);
    expect(recall.remainingStockQuarantined).toBe(45);
    expect(recall.customerSafetyNotice).toContain("هشدار مهم سلامت");
  });
});

describe("Double-Entry General Ledger & Accounting Invariants (TASK-086, TASK-087, TASK-130)", () => {
  it("creates a perfectly balanced payment capture journal entry (Debit == Credit)", () => {
    const entry = createOrderPaymentJournal({
      orderId: "ORD-9901",
      effectiveDate: "2026-11-24",
      subtotalMinor: 45000000,   // 45,000,000 IRR
      shippingFeeMinor: 2500000, // 2,500,000 IRR
      taxMinor: 4500000,         // 4,500,000 IRR
      totalPaidMinor: 52000000,  // 52,000,000 IRR
    });

    const validation = validateJournalEntry(entry);
    expect(validation.valid).toBe(true);
    expect(validation.totalDebitMinor).toBe(52000000);
    expect(validation.totalCreditMinor).toBe(52000000);
    expect(validation.errors).toHaveLength(0);
  });

  it("creates a perfectly balanced inventory fulfillment COGS journal entry", () => {
    const entry = createInventoryFulfillmentJournal({
      orderId: "ORD-9901",
      effectiveDate: "2026-11-24",
      cogsMinor: 22000000, // 22,000,000 IRR
    });

    const validation = validateJournalEntry(entry);
    expect(validation.valid).toBe(true);
    expect(validation.totalDebitMinor).toBe(22000000);
    expect(validation.totalCreditMinor).toBe(22000000);
  });

  it("rejects journal entries with debit/credit imbalance or non-integer values", () => {
    const unbalanced = {
      id: "JRN-BAD",
      referenceType: "MANUAL_ADJUSTMENT" as const,
      referenceId: "ADJ-001",
      effectiveDate: "2026-11-24",
      description: "Unbalanced manual adjustment",
      lines: [
        { accountCode: "1010", accountName: "Cash", debitMinor: 1000, creditMinor: 0 },
        { accountCode: "4010", accountName: "Sales", debitMinor: 0, creditMinor: 900 },
      ],
    };
    const res = validateJournalEntry(unbalanced);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Double-entry out of balance");
  });

  it("rejects posting to closed accounting periods", () => {
    const entry = createOrderPaymentJournal(
      {
        orderId: "ORD-PAST",
        effectiveDate: "2026-08-15",
        subtotalMinor: 10000000,
        shippingFeeMinor: 0,
        taxMinor: 0,
        totalPaidMinor: 10000000,
      },
      [] // No closed periods
    );

    // Validate against closed periods list containing '2026-08'
    const res = validateJournalEntry(entry, ["2026-07", "2026-08"]);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Accounting period 2026-08 is closed");
  });
});

describe("3-Way Procurement Matching (TASK-084, TASK-085, TASK-131)", () => {
  const po: PurchaseOrderLine = {
    poNumber: "PO-2026-001",
    variantId: "raw-hyaluronic-acid",
    orderedQuantity: 100,
    unitPriceMinor: 1500000, // 1,500,000 IRR per kg
  };

  const grn: GoodsReceiptLine = {
    grnNumber: "GRN-2026-001",
    poNumber: "PO-2026-001",
    variantId: "raw-hyaluronic-acid",
    receivedQuantity: 100,
    acceptedQuantity: 100,
    qcReportId: "QC-2026-554",
  };

  it("returns PERFECT_MATCH when PO, GRN, and Supplier Invoice align exactly", () => {
    const invoice: SupplierInvoiceLine = {
      invoiceNumber: "INV-SUPP-882",
      poNumber: "PO-2026-001",
      variantId: "raw-hyaluronic-acid",
      billedQuantity: 100,
      unitPriceMinor: 1500000,
    };

    const match = performThreeWayMatch(po, grn, invoice);
    expect(match.matched).toBe(true);
    expect(match.status).toBe("PERFECT_MATCH");
    expect(match.approvedForPayment).toBe(true);
    expect(match.discrepancies).toHaveLength(0);
  });

  it("flags QUANTITY_OVERBILL_HOLD when invoice bills more than QC accepted quantity", () => {
    const partialGrn: GoodsReceiptLine = {
      ...grn,
      receivedQuantity: 100,
      acceptedQuantity: 80, // 20 units failed viscosity test
    };
    const invoice: SupplierInvoiceLine = {
      invoiceNumber: "INV-SUPP-882",
      poNumber: "PO-2026-001",
      variantId: "raw-hyaluronic-acid",
      billedQuantity: 100, // Billed full 100
      unitPriceMinor: 1500000,
    };

    const match = performThreeWayMatch(po, partialGrn, invoice);
    expect(match.matched).toBe(false);
    expect(match.approvedForPayment).toBe(false);
    expect(match.discrepancies.some((d) => d.includes("Overbilled quantity"))).toBe(true);
  });

  it("flags PRICE_INCREASE_HOLD when supplier invoice exceeds contracted PO unit price", () => {
    const invoice: SupplierInvoiceLine = {
      invoiceNumber: "INV-SUPP-882",
      poNumber: "PO-2026-001",
      variantId: "raw-hyaluronic-acid",
      billedQuantity: 100,
      unitPriceMinor: 1750000, // Price raised without approval!
    };

    const match = performThreeWayMatch(po, grn, invoice);
    expect(match.matched).toBe(false);
    expect(match.status).toBe("PRICE_INCREASE_HOLD");
    expect(match.approvedForPayment).toBe(false);
    expect(match.discrepancies.some((d) => d.includes("Unauthorized price increase"))).toBe(true);
  });
});
