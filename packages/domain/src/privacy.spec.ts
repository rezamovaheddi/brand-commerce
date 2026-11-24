import {
  DATA_CLASSIFICATIONS,
  maskIpAddress,
  isConsentActive,
  recordConsent,
  generateDataSubjectExport,
  evaluateErasureRequest,
  anonymizeCustomerProfile,
  DataSubjectProfile,
  DataSubjectOrderSummary,
  LegalHoldRecord,
  PrivacyConsentRecord,
  TEN_YEARS_MS,
} from "./privacy";

describe("Canonical Data Privacy, Consent Ledger & Retention Engine (N20)", () => {
  it("defines all 5 canonical data classification tiers with complete metadata", () => {
    const tiers = Object.keys(DATA_CLASSIFICATIONS);
    expect(tiers).toHaveLength(5);
    expect(tiers).toEqual(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED", "SECRET"]);

    for (const tier of tiers) {
      const policy = DATA_CLASSIFICATIONS[tier as keyof typeof DATA_CLASSIFICATIONS];
      expect(policy.tier).toBe(tier);
      expect(policy.categoryFa).toBeTruthy();
      expect(policy.processingControls).toBeTruthy();
      expect(policy.retentionPolicy).toBeTruthy();
      expect(policy.owner).toBeTruthy();
    }
  });

  describe("IP Address Anonymization", () => {
    it("masks IPv4 host bytes to zero subnet for privacy-safe logs", () => {
      expect(maskIpAddress("192.168.1.105")).toBe("192.168.1.0");
      expect(maskIpAddress("5.200.44.12")).toBe("5.200.44.0");
    });

    it("masks IPv6 host interfaces to zero for privacy-safe logs", () => {
      expect(maskIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3::0");
    });

    it("handles invalid or empty IP addresses safely", () => {
      expect(maskIpAddress("invalid")).toBe("0.0.0.0");
    });
  });

  describe("Purpose-Based Consent Ledger & State Machine", () => {
    const customerId = "cust-priv-1";

    it("considers TRANSACTIONAL_ESSENTIAL active by default for all users", () => {
      expect(isConsentActive(customerId, "TRANSACTIONAL_ESSENTIAL", [])).toBe(true);
    });

    it("enforces Default-Deny when no affirmative consent has been captured", () => {
      expect(isConsentActive(customerId, "MARKETING_EMAIL", [])).toBe(false);
      expect(isConsentActive(customerId, "MARKETING_SMS", [])).toBe(false);
      expect(isConsentActive(customerId, "THIRD_PARTY_SHARING", [])).toBe(false);
    });

    it("activates marketing consent upon capture of GRANTED event", () => {
      const history: PrivacyConsentRecord[] = [
        {
          id: "con-1",
          customerId,
          purpose: "MARKETING_EMAIL",
          channel: "WEB",
          status: "GRANTED",
          version: "v1.0",
          timestamp: "2026-01-01T10:00:00Z",
        },
      ];

      expect(isConsentActive(customerId, "MARKETING_EMAIL", history)).toBe(true);
    });

    it("immediately deactivates marketing consent when a REVOKED event is appended", () => {
      const history: PrivacyConsentRecord[] = [
        {
          id: "con-1",
          customerId,
          purpose: "MARKETING_EMAIL",
          channel: "WEB",
          status: "GRANTED",
          version: "v1.0",
          timestamp: "2026-01-01T10:00:00Z",
        },
        {
          id: "con-2",
          customerId,
          purpose: "MARKETING_EMAIL",
          channel: "WEB",
          status: "REVOKED",
          version: "v1.0",
          timestamp: "2026-02-01T12:00:00Z",
        },
      ];

      expect(isConsentActive(customerId, "MARKETING_EMAIL", history)).toBe(false);
    });

    it("appends new consent events to immutable ledger and masks raw IP", () => {
      const initial: PrivacyConsentRecord[] = [];
      const updated = recordConsent(initial, {
        id: "con-new-1",
        customerId,
        purpose: "MARKETING_SMS",
        channel: "SMS_OPT_IN",
        status: "GRANTED",
        version: "v2.0",
        ipAddressMasked: "185.120.40.99",
      });

      expect(updated).toHaveLength(1);
      expect(updated[0].ipAddressMasked).toBe("185.120.40.0");
      expect(updated[0].status).toBe("GRANTED");
    });
  });

  describe("Data Subject Access Rights (DSAR) - Export & Erasure", () => {
    const mockProfile: DataSubjectProfile = {
      id: "usr-priv-77",
      fullName: "سارا کیانی",
      mobile: "+989123456789",
      email: "sara.kiani@example.com",
      nationalId: "0012345678",
      addresses: [
        {
          id: "addr-1",
          province: "تهران",
          city: "تهران",
          detail: "خیابان ولیعصر، پلاک ۴۲",
          postalCode: "1939512345",
        },
      ],
      createdAt: "2026-01-10T08:00:00Z",
      updatedAt: "2026-01-10T08:00:00Z",
    };

    const mockOrders: DataSubjectOrderSummary[] = [
      {
        orderId: "ord-101",
        orderNumber: "BC-2026-000101",
        status: "DELIVERED",
        amountMinor: 15000000,
        currency: "IRR",
        createdAt: "2026-02-15T14:30:00Z",
      },
    ];

    it("generates structured portable JSON export bundle for data subject", () => {
      const exportBundle = generateDataSubjectExport(mockProfile, mockOrders, [
        {
          id: "c-1",
          customerId: mockProfile.id,
          purpose: "MARKETING_EMAIL",
          channel: "WEB",
          status: "GRANTED",
          version: "v1",
          timestamp: "2026-01-10T08:00:00Z",
        },
      ]);

      expect(exportBundle.subjectId).toBe(mockProfile.id);
      expect(exportBundle.classification).toBe("CONFIDENTIAL");
      expect(exportBundle.profile.fullName).toBe("سارا کیانی");
      expect(exportBundle.orders).toHaveLength(1);
      expect(exportBundle.consents).toHaveLength(1);
      expect(exportBundle.legalNoticeFa).toContain("Brand Commerce");
    });

    it("blocks erasure when active legal hold exists (LEGAL_HOLD_BLOCKED)", () => {
      const legalHolds: LegalHoldRecord[] = [
        {
          holdId: "HOLD-IFDA-009",
          customerId: mockProfile.id,
          statutoryRequirement: "IFDA_SAFETY_RECALL",
          reason: "بررسی فارماکوویژیلانس گزارش رخداد ناخواسته",
          issuedAt: "2026-03-01T00:00:00Z",
          active: true,
        },
      ];

      const result = evaluateErasureRequest(mockProfile.id, mockOrders, legalHolds);
      expect(result.decision).toBe("REJECT_LEGAL_HOLD");
      expect(result.code).toBe("LEGAL_HOLD_BLOCKED");
      expect(result.activeHoldIds).toContain("HOLD-IFDA-009");
    });

    it("requires pseudonymization when orders are within 10-year statutory retention (Iranian Tax Code)", () => {
      const result = evaluateErasureRequest(mockProfile.id, mockOrders, []);
      expect(result.decision).toBe("PROCEED_PSEUDONYMIZATION");
      expect(result.code).toBe("STATUTORY_HOLD_PSEUDONYMIZATION");
      expect(result.statutoryRetentionOrdersCount).toBe(1);
    });

    it("allows full erasure when customer has no legal hold and orders exceed 10-year statutory window", () => {
      const elevenYearsAgoMs = Date.now() - (TEN_YEARS_MS + 365 * 24 * 3600 * 1000);
      const ancientOrders: DataSubjectOrderSummary[] = [
        {
          orderId: "ord-ancient",
          orderNumber: "BC-2015-000001",
          status: "DELIVERED",
          amountMinor: 2000000,
          currency: "IRR",
          createdAt: new Date(elevenYearsAgoMs).toISOString(),
        },
      ];

      const result = evaluateErasureRequest(mockProfile.id, ancientOrders, []);
      expect(result.decision).toBe("PROCEED_FULL_ERASURE");
      expect(result.code).toBe("ERASURE_APPROVED");
      expect(result.statutoryRetentionOrdersCount).toBe(0);
    });

    it("irreversibly pseudonymizes personal identifying attributes while preserving referential ID", () => {
      const scrubbed = anonymizeCustomerProfile(mockProfile);

      expect(scrubbed.id).toBe(mockProfile.id);
      expect(scrubbed.fullName).toMatch(/کاربر ناشناس \[[a-zA-Z0-9_-]+\]/);
      expect(scrubbed.mobile).toBe("+989000000000");
      expect(scrubbed.email).toMatch(/anonymized-.*@brand-commerce\.local/);
      expect(scrubbed.nationalId).toBeUndefined();
      expect(scrubbed.addresses).toHaveLength(0);
    });
  });
});
