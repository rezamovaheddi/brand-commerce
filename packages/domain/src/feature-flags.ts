/**
 * Feature Flags & Cohort Rollout Engine (Pure domain rules - TASK-196).
 * Follows OpenFeature evaluation concepts with default-safe fallback.
 */

export type FeatureFlagKey =
  | "FEATURE_B2B_OEM"
  | "FEATURE_SAMPLE_BADGES"
  | "FEATURE_LOYALTY_PROGRAM"
  | "FEATURE_SYNTHETIC_MONITOR"
  | "FEATURE_TOMAN_CURRENCY";

export interface FeatureEvaluationContext {
  orgId?: string;
  role?: string;
  clientIp?: string;
  environment?: "development" | "staging" | "production";
}

export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  defaultValue: boolean;
  description: string;
  allowedRoles?: string[];
  allowedEnvs?: string[];
}

export const FEATURE_REGISTRY: Readonly<Record<FeatureFlagKey, FeatureFlagDefinition>> = {
  FEATURE_B2B_OEM: {
    key: "FEATURE_B2B_OEM",
    defaultValue: true,
    description: "Enables OEM custom formulation and technical specification intake",
    allowedRoles: ["OWNER", "BUYER", "ADMIN"],
  },
  FEATURE_SAMPLE_BADGES: {
    key: "FEATURE_SAMPLE_BADGES",
    defaultValue: true,
    description: "Enforces honest sample data disclosures (DEC-006 / ADR-0004)",
  },
  FEATURE_LOYALTY_PROGRAM: {
    key: "FEATURE_LOYALTY_PROGRAM",
    defaultValue: false,
    description: "Customer loyalty points ledger (P3/P6 gate - pending business decision D-13)",
  },
  FEATURE_SYNTHETIC_MONITOR: {
    key: "FEATURE_SYNTHETIC_MONITOR",
    defaultValue: true,
    description: "Telemetry probes and synthetic uptime SLA monitor (GAP-033)",
  },
  FEATURE_TOMAN_CURRENCY: {
    key: "FEATURE_TOMAN_CURRENCY",
    defaultValue: false,
    description: "Toman currency display converter (pending business decision CUR-01)",
  },
} as const;

/**
 * Evaluates a feature flag safely with given context and optional overrides.
 * Never throws — always falls back to defaultValue if an unknown flag is passed.
 */
export function evaluateFeatureFlag(
  key: string,
  context: FeatureEvaluationContext = {},
  overrides: Partial<Record<FeatureFlagKey, boolean>> = {}
): boolean {
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    const overrideVal = overrides[key as FeatureFlagKey];
    if (typeof overrideVal === "boolean") return overrideVal;
  }

  const def = FEATURE_REGISTRY[key as FeatureFlagKey];
  if (!def) {
    return false;
  }

  // If roles restricted, check context.role
  if (def.allowedRoles && def.allowedRoles.length > 0) {
    if (!context.role || !def.allowedRoles.includes(context.role.toUpperCase())) {
      return false;
    }
  }

  // If envs restricted, check context.environment
  if (def.allowedEnvs && def.allowedEnvs.length > 0) {
    if (!context.environment || !def.allowedEnvs.includes(context.environment)) {
      return false;
    }
  }

  return def.defaultValue;
}

/**
 * Returns all active feature flags evaluated against the given context.
 */
export function evaluateAllFeatureFlags(
  context: FeatureEvaluationContext = {},
  overrides: Partial<Record<FeatureFlagKey, boolean>> = {}
): Record<FeatureFlagKey, boolean> {
  const result = {} as Record<FeatureFlagKey, boolean>;
  for (const key of Object.keys(FEATURE_REGISTRY) as FeatureFlagKey[]) {
    result[key] = evaluateFeatureFlag(key, context, overrides);
  }
  return result;
}
