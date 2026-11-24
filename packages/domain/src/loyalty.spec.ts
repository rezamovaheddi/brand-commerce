import {
  calculateLoyaltyTier,
  computeLoyaltyLedger,
  canAccrueLoyaltyPoints,
  validateReferralQualification,
  assertLedgerBoundary,
  triageAdverseEvent,
  canDispatchCommunication,
  type LoyaltyMovement,
  type ConsentRecord,
} from "./loyalty";

describe("Loyalty, CRM & Regulatory Domain Rules (TASK-092..098, 133..136)", () => {
  describe("Tier Calculations", () => {
    it("assigns correct tiers based on lifetime points", () => {
      expect(calculateLoyaltyTier(0)).toBe("PEARL");
      expect(calculateLoyaltyTier(999)).toBe("PEARL");
      expect(calculateLoyaltyTier(1000)).toBe("GOLD");
      expect(calculateLoyaltyTier(1999)).toBe("GOLD");
      expect(calculateLoyaltyTier(2000)).toBe("ETHEREAL_VIP");
      expect(calculateLoyaltyTier(5500)).toBe("ETHEREAL_VIP");
    });

    it("throws on negative points", () => {
      expect(() => calculateLoyaltyTier(-10)).toThrow(/invalid points/);
    });
  });

  describe("Append-Only Loyalty Ledger Balance", () => {
    it("computes balance, earned, spent, and available correctly", () => {
      const movements: LoyaltyMovement[] = [
        { id: "m1", accountId: "acc-1", type: "ACCRUAL", points: 500, createdAt: "2026-01-01" },
        { id: "m2", accountId: "acc-1", type: "BONUS", points: 100, createdAt: "2026-01-02" },
        { id: "m3", accountId: "acc-1", type: "REDEMPTION_RESERVE", points: 200, createdAt: "2026-01-03" },
      ];

      const summary = computeLoyaltyLedger(movements);
      expect(summary.totalEarned).toBe(600);
      expect(summary.totalSpent).toBe(0);
      expect(summary.currentBalance).toBe(600);
      expect(summary.reservedPoints).toBe(200);
      expect(summary.availablePoints).toBe(400); // 600 - 200
    });

    it("commits redemption and releases reservation correctly", () => {
      const movements: LoyaltyMovement[] = [
        { id: "m1", accountId: "acc-1", type: "ACCRUAL", points: 500, createdAt: "2026-01-01" },
        { id: "m2", accountId: "acc-1", type: "REDEMPTION_RESERVE", points: 150, createdAt: "2026-01-02" },
        { id: "m3", accountId: "acc-1", type: "REDEMPTION_COMMIT", points: 150, createdAt: "2026-01-02" },
      ];

      const summary = computeLoyaltyLedger(movements);
      expect(summary.currentBalance).toBe(350);
      expect(summary.reservedPoints).toBe(0);
      expect(summary.availablePoints).toBe(350);
      expect(summary.totalSpent).toBe(150);
    });

    it("throws error if ledger creates negative balance", () => {
      const movements: LoyaltyMovement[] = [
        { id: "m1", accountId: "acc-1", type: "ACCRUAL", points: 100, createdAt: "2026-01-01" },
        { id: "m2", accountId: "acc-1", type: "REDEMPTION_COMMIT", points: 250, createdAt: "2026-01-02" },
      ];

      expect(() => computeLoyaltyLedger(movements)).toThrow(/Negative loyalty balance detected/);
    });

    it("throws error if reservation exceeds available balance", () => {
      const movements: LoyaltyMovement[] = [
        { id: "m1", accountId: "acc-1", type: "ACCRUAL", points: 100, createdAt: "2026-01-01" },
        { id: "m2", accountId: "acc-1", type: "REDEMPTION_RESERVE", points: 150, createdAt: "2026-01-02" },
      ];

      expect(() => computeLoyaltyLedger(movements)).toThrow(/Over-reserved points detected/);
    });
  });

  describe("Return Window Accrual Qualification (TASK-093)", () => {
    it("allows accrual only after order is DELIVERED and 7-day return window elapsed", () => {
      const deliveredTime = "2026-01-10T10:00:00.000Z";

      // 1. Order not delivered yet
      expect(canAccrueLoyaltyPoints("PAID", deliveredTime, 7)).toBe(false);

      // 2. Order delivered 3 days ago (window active)
      const day3 = new Date("2026-01-13T10:00:00.000Z");
      expect(canAccrueLoyaltyPoints("DELIVERED", deliveredTime, 7, day3)).toBe(false);

      // 3. Order delivered 8 days ago (window elapsed -> qualified!)
      const day8 = new Date("2026-01-18T10:00:00.000Z");
      expect(canAccrueLoyaltyPoints("DELIVERED", deliveredTime, 7, day8)).toBe(true);
    });
  });

  describe("Anti-Fraud Referral Qualification (TASK-096/097)", () => {
    it("rejects self-referrals with matching phone numbers", () => {
      expect(validateReferralQualification("09121112233", "09121112233", 0)).toBe("self_referral");
      expect(validateReferralQualification("+989121112233", "09121112233", 0)).toBe("self_referral");
    });

    it("rejects referrals targeting pre-existing customers", () => {
      expect(validateReferralQualification("09121112233", "09124445566", 2)).toBe("existing_customer");
    });

    it("approves genuine new customer referrals", () => {
      expect(validateReferralQualification("09121112233", "09124445566", 0)).toBe("ok");
    });
  });

  describe("Ledger Boundary Isolation (TASK-135)", () => {
    it("enforces strict separation between consumer points and partner commission", () => {
      expect(() => assertLedgerBoundary("CONSUMER_LOYALTY", "POINTS")).not.toThrow();
      expect(() => assertLedgerBoundary("PARTNER_COMMISSION", "IRR_MINOR")).not.toThrow();

      expect(() => assertLedgerBoundary("CONSUMER_LOYALTY", "IRR_MINOR")).toThrow(/Consumer loyalty ledger must only be denominated in POINTS/);
      expect(() => assertLedgerBoundary("PARTNER_COMMISSION", "POINTS")).toThrow(/Partner commercial commission ledger must only be denominated in IRR_MINOR/);
    });
  });

  describe("Pharmacovigilance & Adverse Event Triage (TASK-133)", () => {
    it("triages serious reactions to immediate IFDA reporting and batch freeze", () => {
      const triage = triageAdverseEvent("SERIOUS", false);
      expect(triage.isEmergency).toBe(true);
      expect(triage.regulatorySlaHours).toBe(24);
      expect(triage.notifyRole).toBe("IFDA_REGULATORY_DIRECTOR");
      expect(triage.requiresImmediateLotFreeze).toBe(true);
    });

    it("triages mild reactions to routine clinical queue", () => {
      const triage = triageAdverseEvent("MILD", false);
      expect(triage.isEmergency).toBe(false);
      expect(triage.regulatorySlaHours).toBe(72);
      expect(triage.notifyRole).toBe("CLINICAL_SPECIALIST");
      expect(triage.requiresImmediateLotFreeze).toBe(false);
    });
  });

  describe("Consent Ledger (TASK-134)", () => {
    const userConsents: ConsentRecord[] = [
      { purpose: "MARKETING_EMAIL", granted: false, updatedAt: "2026-01-01" },
      { purpose: "CLINICAL_UPDATES", granted: true, updatedAt: "2026-01-01" },
    ];

    it("allows transactional SMS regardless of marketing preferences", () => {
      expect(canDispatchCommunication(userConsents, "TRANSACTIONAL_SMS")).toBe(true);
    });

    it("honors granted and revoked marketing consents strictly", () => {
      expect(canDispatchCommunication(userConsents, "MARKETING_EMAIL")).toBe(false);
      expect(canDispatchCommunication(userConsents, "CLINICAL_UPDATES")).toBe(true);
    });
  });
});
