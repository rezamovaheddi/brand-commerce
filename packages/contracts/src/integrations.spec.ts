import {
  validateIranianNationalId,
  validateTaxMemoryId,
  isColdChainRequired,
  PaymentIntentInputSchema,
  TaxInvoiceIssueInputSchema,
  AccountingJournalExportSchema,
  ShipmentTrackingOutputSchema,
} from "./integrations";

describe("Canonical Provider Capability Contracts (TASK-185)", () => {
  describe("validateIranianNationalId", () => {
    it("should accept valid 10-digit Iranian national IDs with matching Modulo-11 checksum", () => {
      // Valid national IDs generated with exact Modulo-11 checksum formula
      expect(validateIranianNationalId("0010350810")).toBe(true);
      expect(validateIranianNationalId("1280387521")).toBe(true);
      expect(validateIranianNationalId("0499370899")).toBe(true);
    });

    it("should reject national IDs with invalid checksum digits", () => {
      expect(validateIranianNationalId("0010350812")).toBe(false);
      expect(validateIranianNationalId("1280387529")).toBe(false);
    });

    it("should reject uniform repetitive sequences", () => {
      expect(validateIranianNationalId("0000000000")).toBe(false);
      expect(validateIranianNationalId("1111111111")).toBe(false);
      expect(validateIranianNationalId("9999999999")).toBe(false);
    });

    it("should reject malformed non-10-digit strings", () => {
      expect(validateIranianNationalId("12345")).toBe(false);
      expect(validateIranianNationalId("00103508110")).toBe(false);
      expect(validateIranianNationalId("001035081A")).toBe(false);
    });
  });

  describe("validateTaxMemoryId", () => {
    it("should accept 22-character alphanumeric INTA tax memory IDs", () => {
      expect(validateTaxMemoryId("A12B34C56D78E90F123456")).toBe(true);
      expect(validateTaxMemoryId("1002003004005006007008")).toBe(true);
    });

    it("should reject tax memory IDs not exactly 22 characters", () => {
      expect(validateTaxMemoryId("A12B34C56D78E90F12")).toBe(false);
      expect(validateTaxMemoryId("A12B34C56D78E90F1234567890")).toBe(false);
    });
  });

  describe("isColdChainRequired", () => {
    it("should return true for biological serums and peptide ampoules", () => {
      expect(isColdChainRequired("BIOLOGICAL_SERUM")).toBe(true);
      expect(isColdChainRequired("peptide_ampoule")).toBe(true);
      expect(isColdChainRequired("ACTIVE_ENZYME_TREATMENT")).toBe(true);
    });

    it("should return false for ambient standard cosmetic products", () => {
      expect(isColdChainRequired("DAILY_MOISTURIZER")).toBe(false);
      expect(isColdChainRequired("CLEANSING_OIL")).toBe(false);
    });
  });

  describe("PaymentIntentInputSchema", () => {
    it("should validate valid payment intent payload in minor units IRR", () => {
      const payload = {
        orderId: "ord_101",
        amountMinor: 2500000,
        currency: "IRR",
        customerPhone: "09121112233",
        callbackUrl: "https://dermavia.com/api/v1/payments/callback",
      };

      const parsed = PaymentIntentInputSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("should reject floating-point amounts and non-IRR currencies", () => {
      const floatPayload = {
        orderId: "ord_102",
        amountMinor: 2500000.5,
        currency: "IRR",
        customerPhone: "09121112233",
        callbackUrl: "https://dermavia.com/api/v1/payments/callback",
      };

      const parsed = PaymentIntentInputSchema.safeParse(floatPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("TaxInvoiceIssueInputSchema", () => {
    it("should validate Iranian e-invoice submission format", () => {
      const invoice = {
        invoiceNumber: "INV-1404-0091",
        orderReferenceId: "ord_101",
        sellerEconomicCode: "12345678901234",
        buyerNationalIdOrEconomic: "0010350811",
        subtotalMinor: 10000000,
        vatAmountMinor: 1000000,
        totalAmountMinor: 11000000,
        issuedAt: new Date().toISOString(),
      };

      const parsed = TaxInvoiceIssueInputSchema.safeParse(invoice);
      expect(parsed.success).toBe(true);
    });
  });

  describe("AccountingJournalExportSchema", () => {
    it("should validate double-entry journal export payload", () => {
      const journal = {
        journalId: "JRN-1404-888",
        documentDate: new Date().toISOString(),
        fiscalPeriod: "1404-09",
        sourceModule: "COMMERCE",
        lines: [
          {
            accountCode: "1010-CASH",
            accountNameFa: "موجودی نقد و بانک",
            debitMinor: 5000000,
            creditMinor: 0,
            lineDescription: "واریز وجه سفارش مشتری",
          },
          {
            accountCode: "4010-SALES",
            accountNameFa: "درآمد فروش محصولات",
            debitMinor: 0,
            creditMinor: 5000000,
            lineDescription: "فروش سرم طلا درماویا",
          },
        ],
      };

      const parsed = AccountingJournalExportSchema.safeParse(journal);
      expect(parsed.success).toBe(true);
    });
  });

  describe("ShipmentTrackingOutputSchema", () => {
    it("should validate carrier tracking output with cold-chain temperature telemetry", () => {
      const tracking = {
        trackingNumber: "TRK-EXP-9001",
        carrier: "Tipax Cold-Chain Logistics",
        currentStatus: "IN_TRANSIT",
        isColdChainCompliant: true,
        minTemperatureObservedC: 3.8,
        maxTemperatureObservedC: 5.2,
        statusHistory: [
          {
            status: "PICKED_UP",
            location: "Tehran Central Hub",
            timestamp: new Date().toISOString(),
            description: "مرسوله از انبار مرکزی تحویل گرفته شد",
          },
        ],
      };

      const parsed = ShipmentTrackingOutputSchema.safeParse(tracking);
      expect(parsed.success).toBe(true);
    });
  });
});
