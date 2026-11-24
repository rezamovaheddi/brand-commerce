import {
  InMemoryFeatureFlagProvider,
  FeatureFlagDefinition,
  getDeterministicBucket,
} from "./feature-flags";

describe("OpenFeature Flag Governance & Provider (TASK-196 / S-061)", () => {
  const sampleFlags: FeatureFlagDefinition<boolean>[] = [
    {
      key: "b2b_instant_quote_pilot",
      description: "Enables instant pricing engine for Gold-tier clinics",
      owner: "b2b-product-lead@brandcommerce.local",
      lifecycle: "PILOT",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-12-31T23:59:59.000Z",
      defaultSafeValue: false,
      enabled: true,
      rule: {
        targetTiers: ["GOLD", "CLINIC_VIP"],
        requiredRoles: ["B2B_BUYER"],
      },
    },
    {
      key: "checkout_one_click_rollout",
      description: "50% deterministic gradual rollout of express checkout",
      owner: "checkout-lead@brandcommerce.local",
      lifecycle: "EXPERIMENTAL",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-12-31T23:59:59.000Z",
      defaultSafeValue: false,
      enabled: true,
      rule: {
        percentageRollout: 50,
      },
    },
    {
      key: "legacy_coupon_engine",
      description: "Deprecated coupon system flag",
      owner: "marketing-lead@brandcommerce.local",
      lifecycle: "RETIRED",
      createdAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2025-06-01T00:00:00.000Z",
      defaultSafeValue: false,
      enabled: false,
    },
    {
      key: "expired_campaign_banner",
      description: "Expired seasonal promo flag",
      owner: "growth@brandcommerce.local",
      lifecycle: "PILOT",
      createdAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2025-02-01T00:00:00.000Z", // Past date
      defaultSafeValue: false,
      enabled: true,
    },
  ];

  const provider = new InMemoryFeatureFlagProvider(sampleFlags);

  it("evaluates tier and role targeting correctly", () => {
    // Eligible user: Gold tier + B2B_BUYER role
    const eligibleContext = {
      targetingKey: "usr_clinic_001",
      orgId: "org_derma_gold",
      organizationTier: "GOLD" as const,
      roles: ["B2B_BUYER"],
    };
    const result1 = provider.evaluateBoolean("b2b_instant_quote_pilot", false, eligibleContext);
    expect(result1.value).toBe(true);
    expect(result1.reason).toBe("TARGETING_MATCH");

    // Ineligible user: Standard tier (even with B2B_BUYER role)
    const ineligibleContext = {
      targetingKey: "usr_standard_002",
      orgId: "org_small_shop",
      organizationTier: "STANDARD" as const,
      roles: ["B2B_BUYER"],
    };
    const result2 = provider.evaluateBoolean("b2b_instant_quote_pilot", false, ineligibleContext);
    expect(result2.value).toBe(false);
    expect(result2.reason).toBe("DEFAULT");
  });

  it("strictly enforces server-side entitlement isolation (cannot bypass RBAC)", () => {
    // Missing required role: Gold tier but user does NOT have B2B_BUYER role
    const noRoleContext = {
      targetingKey: "usr_guest_003",
      orgId: "org_derma_gold",
      organizationTier: "GOLD" as const,
      roles: [], // No roles
    };
    const result = provider.evaluateBoolean("b2b_instant_quote_pilot", false, noRoleContext);
    expect(result.value).toBe(false);
    expect(result.reason).toBe("DEFAULT");
  });

  it("performs deterministic percentage rollouts consistently", () => {
    const bucketA = getDeterministicBucket("user_alpha", "checkout_one_click_rollout");
    const bucketB = getDeterministicBucket("user_beta", "checkout_one_click_rollout");

    expect(typeof bucketA).toBe("number");
    expect(typeof bucketB).toBe("number");
    expect(bucketA).toBeGreaterThanOrEqual(0);
    expect(bucketA).toBeLessThan(100);

    // Repeated evaluations with same key must return identical results
    const eval1 = provider.evaluateBoolean("checkout_one_click_rollout", false, {
      targetingKey: "user_alpha",
      roles: [],
    });
    const eval2 = provider.evaluateBoolean("checkout_one_click_rollout", false, {
      targetingKey: "user_alpha",
      roles: [],
    });

    expect(eval1.value).toBe(eval2.value);
    expect(eval1.reason).toBe(eval2.reason);
  });

  it("returns defaultSafeValue when flag is retired, disabled, or expired", () => {
    const context = { targetingKey: "user_gamma", roles: [] };

    // Retired flag
    const retiredResult = provider.evaluateBoolean("legacy_coupon_engine", true, context);
    expect(retiredResult.value).toBe(false);
    expect(retiredResult.reason).toBe("FLAG_DISABLED");

    // Expired flag
    const expiredResult = provider.evaluateBoolean("expired_campaign_banner", true, context);
    expect(expiredResult.value).toBe(false);
    expect(expiredResult.reason).toBe("FLAG_EXPIRED");

    // Non-existent flag
    const unknownResult = provider.evaluateBoolean("unknown_flag_key", false, context);
    expect(unknownResult.value).toBe(false);
    expect(unknownResult.reason).toBe("DEFAULT");
  });
});
