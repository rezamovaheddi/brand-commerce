import { z } from "zod";

/**
 * OpenFeature Standard-Compatible Feature Flag Governance (TASK-196 / S-061).
 *
 * Implements server-side evaluated feature flags with:
 * - Deterministic hash-based cohort rollouts
 * - Lifecycle state tracking (EXPERIMENTAL -> PILOT -> GA -> DEPRECATED -> RETIRED)
 * - Mandatory ownership and expiry dates
 * - Fail-safe defaults
 * - Strict isolation from authorization/entitlement scopes (flags NEVER grant RBAC roles)
 */

export const FlagLifecycleSchema = z.enum([
  "EXPERIMENTAL",
  "PILOT",
  "GENERAL_AVAILABILITY",
  "DEPRECATED",
  "RETIRED",
]);
export type FlagLifecycle = z.infer<typeof FlagLifecycleSchema>;

export const EvaluationContextSchema = z.object({
  targetingKey: z.string().min(1),
  userId: z.string().optional(),
  orgId: z.string().optional(),
  organizationTier: z.enum(["STANDARD", "SILVER", "GOLD", "CLINIC_VIP"]).optional(),
  region: z.string().length(2).optional(),
  /** User's verified server-side roles (used ONLY for gating, NOT granted by flags) */
  roles: z.array(z.string()).default([]),
});
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;

export interface FlagRule {
  /** Target percentage (0-100) for deterministic hash bucketing */
  percentageRollout?: number;
  /** Required organization tiers */
  targetTiers?: string[];
  /** Allowed geographical regions */
  allowedRegions?: string[];
  /** Required pre-existing roles (RBAC prerequisite) */
  requiredRoles?: string[];
}

export interface FeatureFlagDefinition<T = boolean> {
  key: string;
  description: string;
  owner: string;
  lifecycle: FlagLifecycle;
  createdAt: string;
  expiresAt: string;
  defaultSafeValue: T;
  enabled: boolean;
  rule?: FlagRule;
}

export interface EvaluationResult<T = boolean> {
  flagKey: string;
  value: T;
  reason: "DEFAULT" | "TARGETING_MATCH" | "PERCENTAGE_ROLLOUT" | "FLAG_DISABLED" | "FLAG_EXPIRED" | "ERROR";
  variant?: string;
}

/**
 * Deterministic hash bucketing helper for consistent user experiences.
 * Uses FNV-1a 32-bit algorithm to bucket (targetingKey + flagKey) into 0..99.
 * Universal implementation (zero Node built-in dependencies for browser compatibility).
 */
export function getDeterministicBucket(targetingKey: string, flagKey: string): number {
  const combined = `${targetingKey}:${flagKey}`;
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash % 100);
}

export class InMemoryFeatureFlagProvider {
  private flags = new Map<string, FeatureFlagDefinition<unknown>>();

  constructor(initialFlags: FeatureFlagDefinition<unknown>[] = []) {
    for (const flag of initialFlags) {
      this.registerFlag(flag);
    }
  }

  public registerFlag(flag: FeatureFlagDefinition<unknown>): void {
    this.flags.set(flag.key, flag);
  }

  public getFlag(key: string): FeatureFlagDefinition<unknown> | undefined {
    return this.flags.get(key);
  }

  public getAllFlags(): FeatureFlagDefinition<unknown>[] {
    return Array.from(this.flags.values());
  }

  /**
   * Evaluates a boolean feature flag against an EvaluationContext.
   * Guarantees default-safe behavior if disabled, expired, or an error occurs.
   */
  public evaluateBoolean(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext
  ): EvaluationResult<boolean> {
    const flag = this.flags.get(flagKey) as FeatureFlagDefinition<boolean> | undefined;

    if (!flag) {
      return { flagKey, value: defaultValue, reason: "DEFAULT" };
    }

    if (!flag.enabled || flag.lifecycle === "RETIRED") {
      return { flagKey, value: flag.defaultSafeValue, reason: "FLAG_DISABLED" };
    }

    // Expiry verification
    const now = new Date().toISOString();
    if (flag.expiresAt < now) {
      return { flagKey, value: flag.defaultSafeValue, reason: "FLAG_EXPIRED" };
    }

    // Evaluate rules if present
    if (flag.rule) {
      const { targetTiers, allowedRegions, requiredRoles, percentageRollout } = flag.rule;

      // 1. RBAC Prerequisite Check: Feature flag CANNOT bypass server-side entitlement
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) => context.roles.includes(role));
        if (!hasRequiredRole) {
          return { flagKey, value: flag.defaultSafeValue, reason: "DEFAULT" };
        }
      }

      // 2. Organization Tier Check
      if (targetTiers && targetTiers.length > 0) {
        if (!context.organizationTier || !targetTiers.includes(context.organizationTier)) {
          return { flagKey, value: flag.defaultSafeValue, reason: "DEFAULT" };
        }
      }

      // 3. Geographic Region Check
      if (allowedRegions && allowedRegions.length > 0) {
        if (!context.region || !allowedRegions.includes(context.region)) {
          return { flagKey, value: flag.defaultSafeValue, reason: "DEFAULT" };
        }
      }

      // 4. Percentage Rollout Check (Deterministic)
      if (typeof percentageRollout === "number") {
        const bucket = getDeterministicBucket(context.targetingKey, flagKey);
        if (bucket < percentageRollout) {
          return { flagKey, value: true, reason: "PERCENTAGE_ROLLOUT" };
        } else {
          return { flagKey, value: flag.defaultSafeValue, reason: "DEFAULT" };
        }
      }

      return { flagKey, value: true, reason: "TARGETING_MATCH" };
    }

    // Default enabled value
    return { flagKey, value: true, reason: "TARGETING_MATCH" };
  }
}
