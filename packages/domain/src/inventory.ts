/**
 * Pure Domain Rules for ERP-lite Multi-Warehouse FEFO Inventory, Traceability,
 * Double-Entry Accounting & 3-Way Procurement Matching (TASK-076..091, TASK-126..132).
 *
 * Strict zero-IO invariants:
 * - FEFO (First-Expired, First-Out) stock allocation
 * - Minimum shelf-life preservation (refuses near-expiry dispatch)
 * - ISO 22716 Cleanroom 2-person segregation of duties for lot release
 * - Forward & backward lot genealogy traceability and instant recall containment
 * - Double-entry financial journal zero-variance (Debit == Credit in integer minor units)
 * - Accounting period-close immutability
 * - Procurement 3-way matching (PO vs. GRN vs. Supplier Invoice)
 */

export type LotStatus =
  | "QUARANTINE"
  | "RELEASED"
  | "REJECTED"
  | "RECALLED"
  | "EXPIRED";

export interface InventoryLot {
  id: string;
  lotNumber: string;
  variantId: string;
  warehouseId: string;
  locationCode?: string;
  onHand: number;
  reserved: number;
  manufactureDate: string; // YYYY-MM-DD
  expiryDate: string;      // YYYY-MM-DD
  status: LotStatus;
}

export interface FEFOAllocationRequest {
  variantId: string;
  requestedQuantity: number;
  minShelfLifeDays?: number;
  referenceDate?: string; // YYYY-MM-DD, defaults to current UTC date if omitted
}

export interface LotAllocationSlice {
  lotId: string;
  lotNumber: string;
  warehouseId: string;
  locationCode?: string;
  allocatedQuantity: number;
  expiryDate: string;
}

export interface FEFOAllocationResult {
  success: boolean;
  variantId: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  deficit: number;
  allocations: LotAllocationSlice[];
  reason?: string;
}

/**
 * Calculates remaining shelf-life days between reference date and expiry date.
 */
export function getDaysUntilExpiry(expiryDate: string, referenceDate: string): number {
  const exp = new Date(expiryDate).getTime();
  const ref = new Date(referenceDate).getTime();
  const diffMs = exp - ref;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Pure FEFO Stock Allocation Algorithm.
 * Selects only 'RELEASED' lots that satisfy minimum shelf-life requirements,
 * sorted ascending by expiryDate (oldest eligible batches first).
 */
export function allocateStockFEFO(
  lots: InventoryLot[],
  request: FEFOAllocationRequest
): FEFOAllocationResult {
  if (!Number.isInteger(request.requestedQuantity) || request.requestedQuantity <= 0) {
    throw new Error(`Invalid requested quantity: ${String(request.requestedQuantity)}`);
  }

  const refDate = request.referenceDate || new Date().toISOString().substring(0, 10);
  const minShelfLife = request.minShelfLifeDays ?? 30;

  // Filter eligible lots: must be RELEASED, matching variant, and above min shelf-life
  const eligibleLots = lots
    .filter((lot) => {
      if (lot.variantId !== request.variantId) return false;
      if (lot.status !== "RELEASED") return false;
      const daysRemaining = getDaysUntilExpiry(lot.expiryDate, refDate);
      return daysRemaining >= minShelfLife;
    })
    .sort((a, b) => {
      const expA = new Date(a.expiryDate).getTime();
      const expB = new Date(b.expiryDate).getTime();
      if (expA !== expB) return expA - expB; // Earlier expiry first
      return a.lotNumber.localeCompare(b.lotNumber);
    });

  let remainingToAllocate = request.requestedQuantity;
  const allocations: LotAllocationSlice[] = [];

  for (const lot of eligibleLots) {
    if (remainingToAllocate <= 0) break;
    const availableInLot = Math.max(0, lot.onHand - lot.reserved);
    if (availableInLot <= 0) continue;

    const takeQty = Math.min(availableInLot, remainingToAllocate);
    allocations.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      warehouseId: lot.warehouseId,
      locationCode: lot.locationCode,
      allocatedQuantity: takeQty,
      expiryDate: lot.expiryDate,
    });
    remainingToAllocate -= takeQty;
  }

  const allocatedTotal = request.requestedQuantity - remainingToAllocate;
  const isComplete = remainingToAllocate === 0;

  return {
    success: isComplete,
    variantId: request.variantId,
    requestedQuantity: request.requestedQuantity,
    allocatedQuantity: allocatedTotal,
    deficit: remainingToAllocate,
    allocations,
    reason: isComplete ? undefined : "Insufficient eligible released stock meeting shelf-life rules",
  };
}

/**
 * Evaluates lot health and flags near-expiry (< 60 days) or expired batches.
 */
export function evaluateLotExpiryStatus(
  lot: InventoryLot,
  referenceDate: string
): { currentStatus: LotStatus; daysRemaining: number; isNearExpiry: boolean } {
  const daysRemaining = getDaysUntilExpiry(lot.expiryDate, referenceDate);
  let currentStatus = lot.status;
  if (daysRemaining <= 0) {
    currentStatus = "EXPIRED";
  }
  const isNearExpiry = daysRemaining > 0 && daysRemaining <= 60;
  return {
    currentStatus,
    daysRemaining,
    isNearExpiry,
  };
}

/**
 * ISO 22716 Cleanroom 2-Person Segregation of Duties for Quarantine Release.
 */
export interface TwoPersonReleaseRequest {
  lotId: string;
  lotNumber: string;
  inspectedBy: string; // QA Inspector
  approvedBy: string;  // QC Director / Pharmacist
  labReportId: string; // Certificate of Analysis (CoA) ID
  inspectionPassed: boolean;
  notes?: string;
}

export function validateTwoPersonRelease(
  request: TwoPersonReleaseRequest
): { approved: boolean; error?: string } {
  if (!request.inspectedBy || !request.approvedBy) {
    return { approved: false, error: "Both inspector and approver identities are required" };
  }
  if (request.inspectedBy.trim().toLowerCase() === request.approvedBy.trim().toLowerCase()) {
    return {
      approved: false,
      error: "Self-approval violation: Inspector and Approver must be distinct individuals (ISO 22716)",
    };
  }
  if (!request.labReportId || request.labReportId.trim() === "") {
    return { approved: false, error: "Missing mandatory Certificate of Analysis (CoA) lab report ID" };
  }
  if (!request.inspectionPassed) {
    return { approved: false, error: "Cannot release lot with failed quality inspection parameters" };
  }
  return { approved: true };
}

/**
 * Lot Genealogy & Batch Recall Engine (TASK-126, TASK-128).
 */
export interface GenealogyRecord {
  lotNumber: string;
  supplierId: string;
  poNumber: string;
  grnNumber: string;
  orderId: string;
  shipmentId: string;
  customerId: string;
  customerPhone: string;
  quantity: number;
  fulfilledAt: string;
}

export interface ForwardTraceReport {
  lotNumber: string;
  affectedOrders: string[];
  affectedShipments: string[];
  affectedCustomers: { customerId: string; customerPhone: string }[];
  totalUnitsDispatched: number;
  remainingOnHand: number;
  quarantinedWarehouses: string[];
}

export function traceForwardFromLot(
  targetLotNumber: string,
  records: GenealogyRecord[],
  warehouseLots: InventoryLot[]
): ForwardTraceReport {
  const matchingRecords = records.filter((r) => r.lotNumber === targetLotNumber);
  const affectedOrders = Array.from(new Set(matchingRecords.map((r) => r.orderId)));
  const affectedShipments = Array.from(new Set(matchingRecords.map((r) => r.shipmentId)));
  
  const customerMap = new Map<string, string>();
  for (const r of matchingRecords) {
    customerMap.set(r.customerId, r.customerPhone);
  }
  const affectedCustomers = Array.from(customerMap.entries()).map(([customerId, customerPhone]) => ({
    customerId,
    customerPhone,
  }));

  const totalUnitsDispatched = matchingRecords.reduce((acc, r) => acc + r.quantity, 0);

  const matchingWarehouseLots = warehouseLots.filter((l) => l.lotNumber === targetLotNumber);
  const remainingOnHand = matchingWarehouseLots.reduce((acc, l) => acc + l.onHand, 0);
  const quarantinedWarehouses = Array.from(new Set(matchingWarehouseLots.map((l) => l.warehouseId)));

  return {
    lotNumber: targetLotNumber,
    affectedOrders,
    affectedShipments,
    affectedCustomers,
    totalUnitsDispatched,
    remainingOnHand,
    quarantinedWarehouses,
  };
}

export interface BackwardTraceReport {
  orderId: string;
  lots: {
    lotNumber: string;
    supplierId: string;
    poNumber: string;
    grnNumber: string;
    quantity: number;
  }[];
}

export function traceBackwardFromOrder(
  targetOrderId: string,
  records: GenealogyRecord[]
): BackwardTraceReport {
  const matching = records.filter((r) => r.orderId === targetOrderId);
  return {
    orderId: targetOrderId,
    lots: matching.map((m) => ({
      lotNumber: m.lotNumber,
      supplierId: m.supplierId,
      poNumber: m.poNumber,
      grnNumber: m.grnNumber,
      quantity: m.quantity,
    })),
  };
}

export interface RecallCampaign {
  recallId: string;
  lotNumber: string;
  status: "ACTIVE_RECALL";
  reason: string;
  initiatedAt: string;
  affectedCustomerCount: number;
  remainingStockQuarantined: number;
  customerSafetyNotice: string;
}

export function initiateLotRecall(
  lotNumber: string,
  reason: string,
  traceReport: ForwardTraceReport
): RecallCampaign {
  return {
    recallId: `REC-${lotNumber}-${Date.now()}`,
    lotNumber,
    status: "ACTIVE_RECALL",
    reason,
    initiatedAt: new Date().toISOString(),
    affectedCustomerCount: traceReport.affectedCustomers.length,
    remainingStockQuarantined: traceReport.remainingOnHand,
    customerSafetyNotice: `هشدار مهم سلامت: به علت بررسی‌های کنترل کیفیت بر روی بچ شماره ${lotNumber}، لطفاً مصرف فرآورده را بلافاصله متوقف فرمایید. هزینه محصول مرجوع و عودت داده خواهد شد.`,
  };
}

/**
 * Double-Entry General Ledger (TASK-086, TASK-087, TASK-130).
 */
export interface JournalLine {
  accountCode: string;
  accountName: string;
  debitMinor: number;
  creditMinor: number;
}

export interface JournalEntry {
  id: string;
  referenceType: "ORDER_PAYMENT" | "ORDER_REFUND" | "INVENTORY_FULFILLMENT" | "MANUAL_ADJUSTMENT";
  referenceId: string;
  effectiveDate: string; // YYYY-MM-DD
  description: string;
  lines: JournalLine[];
}

export interface JournalValidationResult {
  valid: boolean;
  totalDebitMinor: number;
  totalCreditMinor: number;
  errors: string[];
}

export function validateJournalEntry(
  entry: JournalEntry,
  closedPeriods: string[] = []
): JournalValidationResult {
  const errors: string[] = [];

  if (!entry.lines || entry.lines.length < 2) {
    errors.push("Journal entry must have at least two balanced lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of entry.lines || []) {
    if (!Number.isInteger(line.debitMinor) || line.debitMinor < 0) {
      errors.push(`Invalid debit amount on account ${line.accountCode}: ${String(line.debitMinor)}`);
    }
    if (!Number.isInteger(line.creditMinor) || line.creditMinor < 0) {
      errors.push(`Invalid credit amount on account ${line.accountCode}: ${String(line.creditMinor)}`);
    }
    if (line.debitMinor > 0 && line.creditMinor > 0) {
      errors.push(`Account ${line.accountCode} cannot have both debit and credit in single line`);
    }
    totalDebit += line.debitMinor || 0;
    totalCredit += line.creditMinor || 0;
  }

  if (totalDebit !== totalCredit) {
    errors.push(`Double-entry out of balance: Debit=${totalDebit} IRR != Credit=${totalCredit} IRR (Variance: ${totalDebit - totalCredit})`);
  }

  if (totalDebit === 0) {
    errors.push("Journal entry total value cannot be zero");
  }

  // Check accounting period close (e.g. "1404-11" or "2026-11")
  const period = entry.effectiveDate.substring(0, 7);
  if (closedPeriods.includes(period)) {
    errors.push(`Accounting period ${period} is closed. Modifications prohibited.`);
  }

  return {
    valid: errors.length === 0,
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    errors,
  };
}

export interface OrderPaymentEventPayload {
  orderId: string;
  effectiveDate: string;
  subtotalMinor: number;
  shippingFeeMinor: number;
  taxMinor: number;
  totalPaidMinor: number;
}

export function createOrderPaymentJournal(
  payload: OrderPaymentEventPayload,
  closedPeriods: string[] = []
): JournalEntry {
  const expectedTotal = payload.subtotalMinor + payload.shippingFeeMinor + payload.taxMinor;
  if (expectedTotal !== payload.totalPaidMinor) {
    throw new Error(`Total paid (${payload.totalPaidMinor}) does not equal subtotal + shipping + tax (${expectedTotal})`);
  }

  const entry: JournalEntry = {
    id: `JRN-PAY-${payload.orderId}`,
    referenceType: "ORDER_PAYMENT",
    referenceId: payload.orderId,
    effectiveDate: payload.effectiveDate,
    description: `Order payment settlement for ${payload.orderId}`,
    lines: [
      {
        accountCode: "1010",
        accountName: "Cash & Payment Gateway Clearing",
        debitMinor: payload.totalPaidMinor,
        creditMinor: 0,
      },
      {
        accountCode: "4010",
        accountName: "Gross Product Sales Revenue",
        debitMinor: 0,
        creditMinor: payload.subtotalMinor,
      },
      ...(payload.shippingFeeMinor > 0
        ? [
            {
              accountCode: "4020",
              accountName: "Shipping & Fulfillment Revenue",
              debitMinor: 0,
              creditMinor: payload.shippingFeeMinor,
            },
          ]
        : []),
      ...(payload.taxMinor > 0
        ? [
            {
              accountCode: "2030",
              accountName: "Value Added Tax (VAT) Payable",
              debitMinor: 0,
              creditMinor: payload.taxMinor,
            },
          ]
        : []),
    ],
  };

  const validation = validateJournalEntry(entry, closedPeriods);
  if (!validation.valid) {
    throw new Error(`Failed to create valid payment journal: ${validation.errors.join("; ")}`);
  }
  return entry;
}

export interface InventoryFulfillmentEventPayload {
  orderId: string;
  effectiveDate: string;
  cogsMinor: number; // Cost of goods sold in IRR
}

export function createInventoryFulfillmentJournal(
  payload: InventoryFulfillmentEventPayload,
  closedPeriods: string[] = []
): JournalEntry {
  const entry: JournalEntry = {
    id: `JRN-FUL-${payload.orderId}`,
    referenceType: "INVENTORY_FULFILLMENT",
    referenceId: payload.orderId,
    effectiveDate: payload.effectiveDate,
    description: `COGS recognition for fulfilled order ${payload.orderId}`,
    lines: [
      {
        accountCode: "5010",
        accountName: "Cost of Goods Sold (COGS)",
        debitMinor: payload.cogsMinor,
        creditMinor: 0,
      },
      {
        accountCode: "1030",
        accountName: "Finished Goods Inventory Asset",
        debitMinor: 0,
        creditMinor: payload.cogsMinor,
      },
    ],
  };

  const validation = validateJournalEntry(entry, closedPeriods);
  if (!validation.valid) {
    throw new Error(`Failed to create fulfillment journal: ${validation.errors.join("; ")}`);
  }
  return entry;
}

/**
 * 3-Way Procurement Matching (TASK-084, TASK-085, TASK-131).
 */
export interface PurchaseOrderLine {
  poNumber: string;
  variantId: string;
  orderedQuantity: number;
  unitPriceMinor: number;
}

export interface GoodsReceiptLine {
  grnNumber: string;
  poNumber: string;
  variantId: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  qcReportId: string;
}

export interface SupplierInvoiceLine {
  invoiceNumber: string;
  poNumber: string;
  variantId: string;
  billedQuantity: number;
  unitPriceMinor: number;
}

export interface ThreeWayMatchResult {
  matched: boolean;
  status: "PERFECT_MATCH" | "QUANTITY_OVERBILL_HOLD" | "PRICE_INCREASE_HOLD" | "QC_REJECTION_HOLD";
  approvedForPayment: boolean;
  discrepancies: string[];
}

export function performThreeWayMatch(
  po: PurchaseOrderLine,
  grn: GoodsReceiptLine,
  invoice: SupplierInvoiceLine
): ThreeWayMatchResult {
  const discrepancies: string[] = [];

  if (po.poNumber !== grn.poNumber || po.poNumber !== invoice.poNumber) {
    discrepancies.push("PO number mismatch across documents");
  }

  if (po.variantId !== grn.variantId || po.variantId !== invoice.variantId) {
    discrepancies.push("Variant SKU mismatch across documents");
  }

  // QC acceptance check
  if (grn.acceptedQuantity < grn.receivedQuantity) {
    discrepancies.push(`QC rejected ${grn.receivedQuantity - grn.acceptedQuantity} units during incoming inspection`);
  }

  // Quantity match: Invoiced quantity cannot exceed QC accepted quantity
  if (invoice.billedQuantity > grn.acceptedQuantity) {
    discrepancies.push(`Overbilled quantity: Billed ${invoice.billedQuantity} > Accepted ${grn.acceptedQuantity}`);
  }

  // Price match: Invoiced unit price cannot exceed authorized PO unit price
  if (invoice.unitPriceMinor > po.unitPriceMinor) {
    discrepancies.push(`Unauthorized price increase: Billed unit price ${invoice.unitPriceMinor} IRR > PO price ${po.unitPriceMinor} IRR`);
  }

  if (discrepancies.length === 0) {
    return {
      matched: true,
      status: "PERFECT_MATCH",
      approvedForPayment: true,
      discrepancies: [],
    };
  }

  let status: ThreeWayMatchResult["status"] = "QUANTITY_OVERBILL_HOLD";
  if (invoice.unitPriceMinor > po.unitPriceMinor) {
    status = "PRICE_INCREASE_HOLD";
  } else if (grn.acceptedQuantity < invoice.billedQuantity && grn.acceptedQuantity < grn.receivedQuantity) {
    status = "QC_REJECTION_HOLD";
  }

  return {
    matched: false,
    status,
    approvedForPayment: false,
    discrepancies,
  };
}
