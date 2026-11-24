import {
  evaluateFeatureFlag,
  evaluateAllFeatureFlags,
  FEATURE_REGISTRY,
} from "./feature-flags";

describe("Feature Flags Domain Engine", () => {
  it("evaluates default values accurately", () => {
    expect(evaluateFeatureFlag("FEATURE_B2B_OEM", { role: "BUYER" })).toBe(true);
    expect(evaluateFeatureFlag("FEATURE_SAMPLE_BADGES")).toBe(true);
    expect(evaluateFeatureFlag("FEATURE_LOYALTY_PROGRAM")).toBe(false);
    expect(evaluateFeatureFlag("FEATURE_TOMAN_CURRENCY")).toBe(false);
  });

  it("handles role-gated flags", () => {
    // FEATURE_B2B_OEM requires OWNER, BUYER, or ADMIN
    expect(evaluateFeatureFlag("FEATURE_B2B_OEM", { role: "BUYER" })).toBe(true);
    expect(evaluateFeatureFlag("FEATURE_B2B_OEM", { role: "OWNER" })).toBe(true);
    expect(evaluateFeatureFlag("FEATURE_B2B_OEM", { role: "GUEST" })).toBe(false);
    expect(evaluateFeatureFlag("FEATURE_B2B_OEM", {})).toBe(false);
  });

  it("safely handles unknown flags with default fallback false", () => {
    expect(evaluateFeatureFlag("NON_EXISTENT_FLAG")).toBe(false);
  });

  it("respects explicit runtime overrides", () => {
    expect(
      evaluateFeatureFlag("FEATURE_LOYALTY_PROGRAM", {}, { FEATURE_LOYALTY_PROGRAM: true })
    ).toBe(true);
    expect(
      evaluateFeatureFlag("FEATURE_B2B_OEM", { role: "BUYER" }, { FEATURE_B2B_OEM: false })
    ).toBe(false);
  });

  it("evaluates all feature flags in registry as a dictionary", () => {
    const flags = evaluateAllFeatureFlags({ role: "ADMIN" });
    expect(flags).toBeDefined();
    for (const key of Object.keys(FEATURE_REGISTRY)) {
      expect(typeof flags[key as keyof typeof flags]).toBe("boolean");
    }
    expect(flags.FEATURE_SAMPLE_BADGES).toBe(true);
  });
});
