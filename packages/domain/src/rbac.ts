/**
 * Canonical Enterprise Role-Based Access Control (RBAC) & Policy Engine
 *
 * Source: 03-architecture/rbac-permission-matrix-fa.csv
 * Standard: Least-Privilege, Maker-Checker, Resource-Scoping, Default-Deny.
 *
 * Roles: 18 Canonical Enterprise Roles
 * Permissions: 105 Granular Permission Codes
 * Grants: 119 Explicit Rule Mappings with Default-Deny
 */

export type EnterpriseRole =
  | "CUSTOMER"
  | "ORG_OWNER"
  | "ORG_BUYER"
  | "ORG_FINANCE"
  | "SALES_AGENT"
  | "SALES_MANAGER"
  | "SUPPORT_AGENT"
  | "WAREHOUSE_OPERATOR"
  | "WAREHOUSE_MANAGER"
  | "PROCUREMENT_AGENT"
  | "FINANCE_CLERK"
  | "FINANCE_CONTROLLER"
  | "CONTENT_EDITOR"
  | "CLAIMS_REVIEWER"
  | "REGULATORY_OFFICER"
  | "SYSTEM_ADMIN"
  | "AUDITOR"
  | "INTEGRATION_SERVICE";

export interface RoleMetadata {
  readonly code: EnterpriseRole;
  readonly titleFa: string;
  readonly scopeDescription: string;
  readonly guardsSummary: string;
  readonly isMachineRole?: boolean;
}

export const ENTERPRISE_ROLES: Readonly<Record<EnterpriseRole, RoleMetadata>> = {
  CUSTOMER: {
    code: "CUSTOMER",
    titleFa: "مشتری خرده",
    scopeDescription: "Own customer identity/orders only",
    guardsSummary: "Actor must own the resource; step-up for sensitive profile changes",
  },
  ORG_OWNER: {
    code: "ORG_OWNER",
    titleFa: "مالک سازمان",
    scopeDescription: "Assigned organization(s) only",
    guardsSummary: "Active membership + owner role; accept quote only within policy and validity",
  },
  ORG_BUYER: {
    code: "ORG_BUYER",
    titleFa: "خریدار سازمانی",
    scopeDescription: "Assigned organization(s) only",
    guardsSummary: "Order amount and category limits; no credit-limit change",
  },
  ORG_FINANCE: {
    code: "ORG_FINANCE",
    titleFa: "مالی سازمان",
    scopeDescription: "Assigned organization(s) only",
    guardsSummary: "No order price override; no internal journal access",
  },
  SALES_AGENT: {
    code: "SALES_AGENT",
    titleFa: "کارشناس فروش",
    scopeDescription: "Assigned leads/accounts only",
    guardsSummary: "Cannot approve own exceptional discount or credit request",
  },
  SALES_MANAGER: {
    code: "SALES_MANAGER",
    titleFa: "مدیر فروش",
    scopeDescription: "Assigned region/team",
    guardsSummary: "Approval threshold and separation of duties; own quote approval blocked",
  },
  SUPPORT_AGENT: {
    code: "SUPPORT_AGENT",
    titleFa: "پشتیبانی",
    scopeDescription: "Assigned customer/order tickets",
    guardsSummary: "PII masked by default; no refund execution or finance write",
  },
  WAREHOUSE_OPERATOR: {
    code: "WAREHOUSE_OPERATOR",
    titleFa: "اپراتور انبار",
    scopeDescription: "Assigned warehouse/location",
    guardsSummary: "No manual stock increase; movements require source document and scan/audit",
  },
  WAREHOUSE_MANAGER: {
    code: "WAREHOUSE_MANAGER",
    titleFa: "مدیر انبار",
    scopeDescription: "Assigned warehouse(s)",
    guardsSummary: "Second approval for material adjustment; recalled lot never releasable without compliance clearance",
  },
  PROCUREMENT_AGENT: {
    code: "PROCUREMENT_AGENT",
    titleFa: "کارشناس تدارکات",
    scopeDescription: "Assigned suppliers/categories",
    guardsSummary: "PO approval separated from creator; no supplier bank detail changes without verification",
  },
  FINANCE_CLERK: {
    code: "FINANCE_CLERK",
    titleFa: "کارشناس مالی",
    scopeDescription: "Assigned legal entity",
    guardsSummary: "Cannot post or approve own journal/refund/credit adjustment",
  },
  FINANCE_CONTROLLER: {
    code: "FINANCE_CONTROLLER",
    titleFa: "مدیر/کنترلر مالی",
    scopeDescription: "Assigned legal entity",
    guardsSummary: "MFA step-up; maker-checker; immutable journal and reason required",
  },
  CONTENT_EDITOR: {
    code: "CONTENT_EDITOR",
    titleFa: "ویرایشگر محتوا",
    scopeDescription: "Assigned locales/sections",
    guardsSummary: "Cannot publish claims-restricted content or write commerce data",
  },
  CLAIMS_REVIEWER: {
    code: "CLAIMS_REVIEWER",
    titleFa: "بازبین ادعا",
    scopeDescription: "Assigned products/markets",
    guardsSummary: "No self-approval; evidence must be attached and versioned",
  },
  REGULATORY_OFFICER: {
    code: "REGULATORY_OFFICER",
    titleFa: "مسئول رگولاتوری/ایمنی",
    scopeDescription: "Assigned markets/products",
    guardsSummary: "Named human owner; market scope; legal escalation and audit",
  },
  SYSTEM_ADMIN: {
    code: "SYSTEM_ADMIN",
    titleFa: "مدیر سامانه",
    scopeDescription: "Technical configuration only",
    guardsSummary: "Cannot modify journal, order totals, stock ledger, claim approval or customer data without separate business role",
  },
  AUDITOR: {
    code: "AUDITOR",
    titleFa: "حسابرس",
    scopeDescription: "Read-only assigned legal entity/scope",
    guardsSummary: "Read-only; exports time-limited, logged and approved",
  },
  INTEGRATION_SERVICE: {
    code: "INTEGRATION_SERVICE",
    titleFa: "حساب سرویس یکپارچه‌سازی",
    scopeDescription: "Named provider + narrow endpoints",
    guardsSummary: "Machine identity, mTLS/signature, provider allowlist, no interactive login",
    isMachineRole: true,
  },
} as const;

export type PermissionCode =
  | "accounting.export.read:approved"
  | "accounting_period.close:entity"
  | "address.manage:self"
  | "adverse_event.read:restricted"
  | "ar_ap.read:entity"
  | "audit.read:assigned"
  | "audit.read:security"
  | "carrier.event.ingest:provider"
  | "cart.manage:assigned"
  | "cart.manage:self"
  | "catalog.read:b2b"
  | "checkout.create:self"
  | "claim.approve:market"
  | "claim.comment:assigned"
  | "claim.evidence.read:assigned"
  | "claim.submit_review:assigned"
  | "claim.withdraw:market"
  | "claims.read:assigned"
  | "cms.article.draft:assigned"
  | "cms.asset.upload:assigned"
  | "cms.page.draft:assigned"
  | "cms.page.edit:assigned"
  | "cms.translation.edit:assigned"
  | "consent.manage:self"
  | "credit.adjustment.request:entity"
  | "credit.read:assigned"
  | "credit_limit.approve:threshold"
  | "customer.timeline.read:limited"
  | "discount.approve:threshold"
  | "export.request:assigned"
  | "finance.read:assigned"
  | "finance_report.read:entity"
  | "goods_receipt.read:assigned"
  | "integration.secret.rotate"
  | "inventory.read:assigned"
  | "invoice.read:assigned"
  | "invoice.read:entity"
  | "journal.approve:entity"
  | "journal.draft:entity"
  | "journal.post:entity"
  | "journal.reverse:entity"
  | "lead.read:assigned"
  | "lead.read:team"
  | "lead.update:assigned"
  | "lot.quarantine.request:assigned"
  | "lot.quarantine:assigned"
  | "lot.release:assigned"
  | "loyalty.read:self"
  | "membership.invite:assigned"
  | "membership.revoke:assigned"
  | "order.create:assigned"
  | "order.read:assigned"
  | "order.read:limited"
  | "order.read:self"
  | "org.application.read:assigned"
  | "org.application.recommend:team"
  | "org.document.upload:assigned"
  | "org.profile.update:assigned"
  | "org.read:assigned"
  | "pack.confirm:assigned"
  | "payment.initiate:assigned"
  | "payment.reconcile:entity"
  | "payment.webhook.ingest:provider"
  | "payment_receipt.upload:assigned"
  | "pick.confirm:assigned"
  | "price_list.read:assigned"
  | "product.market_release.approve:market"
  | "profile.read:self"
  | "profile.update:self"
  | "purchase_order.create:assigned"
  | "purchase_order.submit:assigned"
  | "purchase_request.create:assigned"
  | "quick_order.create:assigned"
  | "quote.accept:assigned"
  | "quote.approve:policy"
  | "quote.create:assigned"
  | "quote.read:assigned"
  | "quote.revise:assigned"
  | "quote.submit_for_approval:assigned"
  | "recall.approve:market"
  | "recall.close:market"
  | "recall.execute:assigned"
  | "receipt.scan:assigned"
  | "referral.read:self"
  | "refund.approve:threshold"
  | "refund.request:entity"
  | "reservation.override:threshold"
  | "return.request.create:customer"
  | "return.request:self"
  | "rfq.create:assigned"
  | "rfq.read:assigned"
  | "role.permission.manage"
  | "sales_report.read:team"
  | "shipment.dispatch:assigned"
  | "statement.read:assigned"
  | "stock_adjustment.request:assigned"
  | "stock_count.create:assigned"
  | "supplier.read:assigned"
  | "supplier_document.upload:assigned"
  | "system.config.manage"
  | "tax.invoice.status.ingest:provider"
  | "ticket.create:assigned"
  | "ticket.read:assigned"
  | "ticket.update:assigned"
  | "user.admin.manage";

/**
 * Exact canonical mapping from Source A: rbac-permission-matrix-fa.csv
 * Total: 18 roles, 119 permission assignments.
 */
export const ROLE_PERMISSIONS: Readonly<Record<EnterpriseRole, readonly PermissionCode[]>> = {
  CUSTOMER: [
    "profile.read:self",
    "profile.update:self",
    "address.manage:self",
    "cart.manage:self",
    "checkout.create:self",
    "order.read:self",
    "return.request:self",
    "loyalty.read:self",
    "referral.read:self",
    "consent.manage:self",
  ],
  ORG_OWNER: [
    "org.read:assigned",
    "org.profile.update:assigned",
    "membership.invite:assigned",
    "membership.revoke:assigned",
    "org.document.upload:assigned",
    "price_list.read:assigned",
    "quote.read:assigned",
    "quote.accept:assigned",
    "order.create:assigned",
    "order.read:assigned",
    "statement.read:assigned",
    "credit.read:assigned",
    "ticket.create:assigned",
  ],
  ORG_BUYER: [
    "org.read:assigned",
    "catalog.read:b2b",
    "price_list.read:assigned",
    "cart.manage:assigned",
    "quick_order.create:assigned",
    "rfq.create:assigned",
    "quote.read:assigned",
    "order.create:assigned",
    "order.read:assigned",
    "ticket.create:assigned",
  ],
  ORG_FINANCE: [
    "org.read:assigned",
    "invoice.read:assigned",
    "statement.read:assigned",
    "credit.read:assigned",
    "payment.initiate:assigned",
    "payment_receipt.upload:assigned",
  ],
  SALES_AGENT: [
    "lead.read:assigned",
    "lead.update:assigned",
    "org.application.read:assigned",
    "rfq.read:assigned",
    "quote.create:assigned",
    "quote.revise:assigned",
    "quote.submit_for_approval:assigned",
    "order.read:assigned",
    "ticket.read:assigned",
  ],
  SALES_MANAGER: [
    "lead.read:team",
    "quote.approve:policy",
    "discount.approve:threshold",
    "org.application.recommend:team",
    "sales_report.read:team",
  ],
  SUPPORT_AGENT: [
    "ticket.read:assigned",
    "ticket.update:assigned",
    "customer.timeline.read:limited",
    "order.read:limited",
    "return.request.create:customer",
  ],
  WAREHOUSE_OPERATOR: [
    "inventory.read:assigned",
    "receipt.scan:assigned",
    "pick.confirm:assigned",
    "pack.confirm:assigned",
    "shipment.dispatch:assigned",
    "lot.quarantine.request:assigned",
  ],
  WAREHOUSE_MANAGER: [
    "inventory.read:assigned",
    "stock_count.create:assigned",
    "stock_adjustment.request:assigned",
    "lot.quarantine:assigned",
    "lot.release:assigned",
    "recall.execute:assigned",
    "reservation.override:threshold",
  ],
  PROCUREMENT_AGENT: [
    "supplier.read:assigned",
    "purchase_request.create:assigned",
    "purchase_order.create:assigned",
    "purchase_order.submit:assigned",
    "goods_receipt.read:assigned",
    "supplier_document.upload:assigned",
  ],
  FINANCE_CLERK: [
    "invoice.read:entity",
    "payment.reconcile:entity",
    "journal.draft:entity",
    "refund.request:entity",
    "credit.adjustment.request:entity",
    "ar_ap.read:entity",
  ],
  FINANCE_CONTROLLER: [
    "journal.approve:entity",
    "journal.post:entity",
    "journal.reverse:entity",
    "refund.approve:threshold",
    "credit_limit.approve:threshold",
    "accounting_period.close:entity",
    "finance_report.read:entity",
  ],
  CONTENT_EDITOR: [
    "cms.page.draft:assigned",
    "cms.page.edit:assigned",
    "cms.article.draft:assigned",
    "cms.asset.upload:assigned",
    "cms.translation.edit:assigned",
  ],
  CLAIMS_REVIEWER: [
    "claim.evidence.read:assigned",
    "claim.submit_review:assigned",
    "claim.comment:assigned",
  ],
  REGULATORY_OFFICER: [
    "claim.approve:market",
    "claim.withdraw:market",
    "product.market_release.approve:market",
    "adverse_event.read:restricted",
    "recall.approve:market",
    "recall.close:market",
  ],
  SYSTEM_ADMIN: [
    "user.admin.manage",
    "role.permission.manage",
    "integration.secret.rotate",
    "system.config.manage",
    "audit.read:security",
  ],
  AUDITOR: [
    "audit.read:assigned",
    "finance.read:assigned",
    "order.read:assigned",
    "inventory.read:assigned",
    "claims.read:assigned",
    "export.request:assigned",
  ],
  INTEGRATION_SERVICE: [
    "payment.webhook.ingest:provider",
    "carrier.event.ingest:provider",
    "tax.invoice.status.ingest:provider",
    "accounting.export.read:approved",
  ],
} as const;

export interface EvaluationContext {
  /** Identifier of the executing actor */
  readonly actorId: string;
  /** Roles assigned to the actor */
  readonly roles: readonly EnterpriseRole[];
  /** Flag indicating whether the actor is a machine / service account */
  readonly isMachineIdentity?: boolean;
  /** Step-up MFA verification verified in current session */
  readonly mfaVerified?: boolean;
  /** Whether the actor is the resource owner (used for :self scope) */
  readonly isResourceOwner?: boolean;
  /** Whether the actor was the creator of the target resource (maker-checker separation of duties) */
  readonly isSelfCreated?: boolean;
  /** Assigned organization IDs for scoped checks */
  readonly assignedOrgIds?: readonly string[];
  /** Target resource organization ID */
  readonly targetOrgId?: string;
  /** Assigned warehouse IDs for scoped checks */
  readonly assignedWarehouseIds?: readonly string[];
  /** Target warehouse ID */
  readonly targetWarehouseId?: string;
  /** Assigned legal entity IDs for finance scope */
  readonly assignedEntityIds?: readonly string[];
  /** Target legal entity ID */
  readonly targetEntityId?: string;
  /** Assigned market IDs for regulatory scope */
  readonly assignedMarketIds?: readonly string[];
  /** Target market ID */
  readonly targetMarketId?: string;
  /** Whether the lot is under mandatory regulatory quarantine (e.g. active recall) */
  readonly isUnderRegulatoryRecall?: boolean;
  /** Documented compliance clearance reference if releasing a recalled lot */
  readonly complianceClearanceId?: string;
}

export type EvaluationDecision = "ALLOW" | "DENY";

export interface EvaluationResult {
  readonly decision: EvaluationDecision;
  readonly code:
    | "GRANTED"
    | "DEFAULT_DENY"
    | "OWNERSHIP_REQUIRED"
    | "ORG_SCOPE_MISMATCH"
    | "WAREHOUSE_SCOPE_MISMATCH"
    | "ENTITY_SCOPE_MISMATCH"
    | "MARKET_SCOPE_MISMATCH"
    | "MAKER_CHECKER_VIOLATION"
    | "MFA_STEPUP_REQUIRED"
    | "MACHINE_IDENTITY_REQUIRED"
    | "HUMAN_IDENTITY_REQUIRED"
    | "REGULATORY_CLEARANCE_REQUIRED"
    | "SYSTEM_ADMIN_SEPARATION_VIOLATION";
  readonly reason: string;
  readonly matchedRole?: EnterpriseRole;
  readonly permission: PermissionCode;
}

/** Check if a single role has a permission granted in the canonical matrix. */
export function hasRolePermission(role: EnterpriseRole, permission: PermissionCode): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions?.includes(permission));
}

/** Retrieve all canonical permissions for a role. */
export function getRolePermissions(role: EnterpriseRole): readonly PermissionCode[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Check if role is an approved enterprise role code. */
export function isEnterpriseRole(role: string): role is EnterpriseRole {
  return Object.prototype.hasOwnProperty.call(ENTERPRISE_ROLES, role);
}

/**
 * Pure evaluation of permission and policy guards against context.
 * Strictly enforces DEFAULT-DENY, resource scopes, and separation of duties.
 */
export function evaluateAccess(context: EvaluationContext, permission: PermissionCode): EvaluationResult {
  // 1. Identify which actor roles grant this permission
  const grantingRoles = context.roles.filter((role) => hasRolePermission(role, permission));

  if (grantingRoles.length === 0) {
    return {
      decision: "DENY",
      code: "DEFAULT_DENY",
      reason: `Permission '${permission}' is not granted to any of the actor's roles (${context.roles.join(", ") || "NONE"}). Default-deny applies.`,
      permission,
    };
  }

  // Evaluate policy guards across granting roles
  for (const role of grantingRoles) {
    // A. Machine Identity Guard: INTEGRATION_SERVICE requires machine identity
    if (role === "INTEGRATION_SERVICE" && !context.isMachineIdentity) {
      continue; // try other roles or deny
    }

    // B. Human Identity Guard: Non-integration roles reject machine identities without human escalation
    if (role !== "INTEGRATION_SERVICE" && context.isMachineIdentity) {
      continue;
    }

    // C. System Admin Separation of Duties Guard:
    // System admin CANNOT modify journal, orders, inventory stock ledger, or customer data
    if (role === "SYSTEM_ADMIN") {
      const isBusinessDataPerm =
        permission.startsWith("journal.") ||
        permission.startsWith("order.") ||
        permission.startsWith("inventory.") ||
        permission.startsWith("profile.") ||
        permission.startsWith("refund.");
      if (isBusinessDataPerm) {
        return {
          decision: "DENY",
          code: "SYSTEM_ADMIN_SEPARATION_VIOLATION",
          reason: "SYSTEM_ADMIN cannot execute business or financial modifications without a separate business role.",
          matchedRole: role,
          permission,
        };
      }
    }

    // D. Scope: :self
    if (permission.endsWith(":self")) {
      if (!context.isResourceOwner) {
        return {
          decision: "DENY",
          code: "OWNERSHIP_REQUIRED",
          reason: `Permission '${permission}' requires resource ownership (actor must own the target resource).`,
          matchedRole: role,
          permission,
        };
      }
    }

    // E. Scope: :assigned (Org)
    if (
      role === "ORG_OWNER" ||
      role === "ORG_BUYER" ||
      role === "ORG_FINANCE"
    ) {
      if (context.targetOrgId && context.assignedOrgIds) {
        if (!context.assignedOrgIds.includes(context.targetOrgId)) {
          return {
            decision: "DENY",
            code: "ORG_SCOPE_MISMATCH",
            reason: `Target organization '${context.targetOrgId}' is not in the actor's assigned organizations.`,
            matchedRole: role,
            permission,
          };
        }
      }
    }

    // F. Scope: Warehouse
    if (role === "WAREHOUSE_OPERATOR" || role === "WAREHOUSE_MANAGER") {
      if (context.targetWarehouseId && context.assignedWarehouseIds) {
        if (!context.assignedWarehouseIds.includes(context.targetWarehouseId)) {
          return {
            decision: "DENY",
            code: "WAREHOUSE_SCOPE_MISMATCH",
            reason: `Target warehouse '${context.targetWarehouseId}' is not in the actor's assigned warehouses.`,
            matchedRole: role,
            permission,
          };
        }
      }
    }

    // G. Scope: Entity (Finance)
    if (role === "FINANCE_CLERK" || role === "FINANCE_CONTROLLER" || role === "AUDITOR") {
      if (context.targetEntityId && context.assignedEntityIds) {
        if (!context.assignedEntityIds.includes(context.targetEntityId)) {
          return {
            decision: "DENY",
            code: "ENTITY_SCOPE_MISMATCH",
            reason: `Target legal entity '${context.targetEntityId}' is not in the actor's assigned entities.`,
            matchedRole: role,
            permission,
          };
        }
      }
    }

    // H. Scope: Market (Regulatory)
    if (role === "REGULATORY_OFFICER" || role === "CLAIMS_REVIEWER") {
      if (context.targetMarketId && context.assignedMarketIds) {
        if (!context.assignedMarketIds.includes(context.targetMarketId)) {
          return {
            decision: "DENY",
            code: "MARKET_SCOPE_MISMATCH",
            reason: `Target market '${context.targetMarketId}' is not in the actor's assigned markets.`,
            matchedRole: role,
            permission,
          };
        }
      }
    }

    // I. Maker-Checker / Separation of Duties:
    // Sales Manager cannot approve own quote
    if (role === "SALES_MANAGER" && permission === "quote.approve:policy") {
      if (context.isSelfCreated) {
        return {
          decision: "DENY",
          code: "MAKER_CHECKER_VIOLATION",
          reason: "Separation of duties: Sales manager cannot approve quotes they authored.",
          matchedRole: role,
          permission,
        };
      }
    }

    // Finance Controller cannot approve/post own journal entry and requires MFA
    if (
      role === "FINANCE_CONTROLLER" &&
      (permission === "journal.approve:entity" ||
        permission === "journal.post:entity" ||
        permission === "accounting_period.close:entity")
    ) {
      if (context.isSelfCreated) {
        return {
          decision: "DENY",
          code: "MAKER_CHECKER_VIOLATION",
          reason: "Maker-checker violation: Finance controller cannot approve or post their own journal draft.",
          matchedRole: role,
          permission,
        };
      }
      if (!context.mfaVerified) {
        return {
          decision: "DENY",
          code: "MFA_STEPUP_REQUIRED",
          reason: `Step-up multi-factor authentication (MFA) is required for sensitive operation '${permission}'.`,
          matchedRole: role,
          permission,
        };
      }
    }

    // Claims Reviewer cannot self-approve
    if (role === "CLAIMS_REVIEWER" && context.isSelfCreated) {
      return {
        decision: "DENY",
        code: "MAKER_CHECKER_VIOLATION",
        reason: "Separation of duties: Claims reviewer cannot review or comment on own claim submissions.",
        matchedRole: role,
        permission,
      };
    }

    // Warehouse lot release: recalled lot cannot be released without compliance clearance
    if (role === "WAREHOUSE_MANAGER" && permission === "lot.release:assigned") {
      if (context.isUnderRegulatoryRecall && !context.complianceClearanceId) {
        return {
          decision: "DENY",
          code: "REGULATORY_CLEARANCE_REQUIRED",
          reason: "Quarantined/recalled lot cannot be released without documented regulatory compliance clearance.",
          matchedRole: role,
          permission,
        };
      }
    }

    // All guards passed for this role
    return {
      decision: "ALLOW",
      code: "GRANTED",
      reason: `Access granted by role '${role}' for permission '${permission}'.`,
      matchedRole: role,
      permission,
    };
  }

  // If machine identity or human identity checks filtered all roles out
  if (context.isMachineIdentity) {
    return {
      decision: "DENY",
      code: "HUMAN_IDENTITY_REQUIRED",
      reason: "Machine identities are restricted to INTEGRATION_SERVICE roles.",
      permission,
    };
  }

  return {
    decision: "DENY",
    code: "MACHINE_IDENTITY_REQUIRED",
    reason: "Integration service permissions require a machine identity.",
    permission,
  };
}

/** Assert access or throw an authorization error with audit details. */
export function assertAccess(context: EvaluationContext, permission: PermissionCode): void {
  const result = evaluateAccess(context, permission);
  if (result.decision !== "ALLOW") {
    throw new Error(`[FORBIDDEN:${result.code}] ${result.reason}`);
  }
}
