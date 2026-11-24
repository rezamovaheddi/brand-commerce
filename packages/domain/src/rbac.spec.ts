import {
  ENTERPRISE_ROLES,
  ROLE_PERMISSIONS,
  hasRolePermission,
  getRolePermissions,
  isEnterpriseRole,
  evaluateAccess,
  assertAccess,
} from "./rbac";

describe("Canonical Enterprise RBAC & Policy Engine", () => {
  it("defines exactly 18 canonical enterprise roles", () => {
    const roles = Object.keys(ENTERPRISE_ROLES);
    expect(roles).toHaveLength(18);
    expect(roles).toEqual([
      "CUSTOMER",
      "ORG_OWNER",
      "ORG_BUYER",
      "ORG_FINANCE",
      "SALES_AGENT",
      "SALES_MANAGER",
      "SUPPORT_AGENT",
      "WAREHOUSE_OPERATOR",
      "WAREHOUSE_MANAGER",
      "PROCUREMENT_AGENT",
      "FINANCE_CLERK",
      "FINANCE_CONTROLLER",
      "CONTENT_EDITOR",
      "CLAIMS_REVIEWER",
      "REGULATORY_OFFICER",
      "SYSTEM_ADMIN",
      "AUDITOR",
      "INTEGRATION_SERVICE",
    ]);
  });

  it("contains exactly 119 rule grants across the 18 roles", () => {
    let totalAssignments = 0;
    const allPermissions = new Set<string>();

    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      totalAssignments += perms.length;
      for (const p of perms) {
        allPermissions.add(p);
      }
      expect(isEnterpriseRole(role)).toBe(true);
    }

    expect(totalAssignments).toBe(119);
    expect(allPermissions.size).toBe(105);
  });

  it("identifies enterprise roles correctly with isEnterpriseRole", () => {
    expect(isEnterpriseRole("CUSTOMER")).toBe(true);
    expect(isEnterpriseRole("FINANCE_CONTROLLER")).toBe(true);
    expect(isEnterpriseRole("SUPER_USER")).toBe(false);
    expect(isEnterpriseRole("")).toBe(false);
  });

  it("retrieves permissions per role and verifies role permission helper", () => {
    const customerPerms = getRolePermissions("CUSTOMER");
    expect(customerPerms).toHaveLength(10);
    expect(customerPerms).toContain("cart.manage:self");
    expect(hasRolePermission("CUSTOMER", "cart.manage:self")).toBe(true);
    expect(hasRolePermission("CUSTOMER", "journal.post:entity")).toBe(false);
  });

  describe("Default-Deny Policy", () => {
    it("denies when actor has no assigned roles", () => {
      const result = evaluateAccess(
        { actorId: "user-1", roles: [] },
        "order.read:self"
      );
      expect(result.decision).toBe("DENY");
      expect(result.code).toBe("DEFAULT_DENY");
    });

    it("denies ungranted permissions even for high-privilege roles", () => {
      const result = evaluateAccess(
        { actorId: "clerk-1", roles: ["FINANCE_CLERK"] },
        "journal.post:entity"
      );
      expect(result.decision).toBe("DENY");
      expect(result.code).toBe("DEFAULT_DENY");
    });
  });

  describe("Ownership & Scoping (:self, :assigned, :entity, :market)", () => {
    it("enforces :self resource ownership for retail customers", () => {
      const allowed = evaluateAccess(
        {
          actorId: "cust-1",
          roles: ["CUSTOMER"],
          isResourceOwner: true,
        },
        "cart.manage:self"
      );
      expect(allowed.decision).toBe("ALLOW");
      expect(allowed.code).toBe("GRANTED");

      const denied = evaluateAccess(
        {
          actorId: "cust-1",
          roles: ["CUSTOMER"],
          isResourceOwner: false,
        },
        "cart.manage:self"
      );
      expect(denied.decision).toBe("DENY");
      expect(denied.code).toBe("OWNERSHIP_REQUIRED");
    });

    it("enforces organizational scope for B2B buyers", () => {
      const allowed = evaluateAccess(
        {
          actorId: "buyer-1",
          roles: ["ORG_BUYER"],
          assignedOrgIds: ["org-alpha", "org-beta"],
          targetOrgId: "org-alpha",
        },
        "rfq.create:assigned"
      );
      expect(allowed.decision).toBe("ALLOW");

      const denied = evaluateAccess(
        {
          actorId: "buyer-1",
          roles: ["ORG_BUYER"],
          assignedOrgIds: ["org-alpha"],
          targetOrgId: "org-gamma",
        },
        "rfq.create:assigned"
      );
      expect(denied.decision).toBe("DENY");
      expect(denied.code).toBe("ORG_SCOPE_MISMATCH");
    });

    it("enforces warehouse scope for warehouse operators", () => {
      const allowed = evaluateAccess(
        {
          actorId: "op-1",
          roles: ["WAREHOUSE_OPERATOR"],
          assignedWarehouseIds: ["wh-tehran-1"],
          targetWarehouseId: "wh-tehran-1",
        },
        "pick.confirm:assigned"
      );
      expect(allowed.decision).toBe("ALLOW");

      const denied = evaluateAccess(
        {
          actorId: "op-1",
          roles: ["WAREHOUSE_OPERATOR"],
          assignedWarehouseIds: ["wh-tehran-1"],
          targetWarehouseId: "wh-isfahan-2",
        },
        "pick.confirm:assigned"
      );
      expect(denied.decision).toBe("DENY");
      expect(denied.code).toBe("WAREHOUSE_SCOPE_MISMATCH");
    });

    it("enforces legal entity scope for finance controllers", () => {
      const allowed = evaluateAccess(
        {
          actorId: "controller-1",
          roles: ["FINANCE_CONTROLLER"],
          assignedEntityIds: ["entity-holding-1"],
          targetEntityId: "entity-holding-1",
          mfaVerified: true,
          isSelfCreated: false,
        },
        "journal.post:entity"
      );
      expect(allowed.decision).toBe("ALLOW");

      const denied = evaluateAccess(
        {
          actorId: "controller-1",
          roles: ["FINANCE_CONTROLLER"],
          assignedEntityIds: ["entity-holding-1"],
          targetEntityId: "entity-subsidiary-2",
          mfaVerified: true,
          isSelfCreated: false,
        },
        "journal.post:entity"
      );
      expect(denied.decision).toBe("DENY");
      expect(denied.code).toBe("ENTITY_SCOPE_MISMATCH");
    });

    it("enforces market scope for regulatory officers", () => {
      const allowed = evaluateAccess(
        {
          actorId: "reg-1",
          roles: ["REGULATORY_OFFICER"],
          assignedMarketIds: ["ir-pharma"],
          targetMarketId: "ir-pharma",
        },
        "claim.approve:market"
      );
      expect(allowed.decision).toBe("ALLOW");

      const denied = evaluateAccess(
        {
          actorId: "reg-1",
          roles: ["REGULATORY_OFFICER"],
          assignedMarketIds: ["ir-pharma"],
          targetMarketId: "uae-wellness",
        },
        "claim.approve:market"
      );
      expect(denied.decision).toBe("DENY");
      expect(denied.code).toBe("MARKET_SCOPE_MISMATCH");
    });
  });

  describe("Maker-Checker & Separation of Duties", () => {
    it("blocks sales manager from approving their own quotes", () => {
      const selfCreated = evaluateAccess(
        {
          actorId: "mgr-1",
          roles: ["SALES_MANAGER"],
          isSelfCreated: true,
        },
        "quote.approve:policy"
      );
      expect(selfCreated.decision).toBe("DENY");
      expect(selfCreated.code).toBe("MAKER_CHECKER_VIOLATION");

      const peerCreated = evaluateAccess(
        {
          actorId: "mgr-1",
          roles: ["SALES_MANAGER"],
          isSelfCreated: false,
        },
        "quote.approve:policy"
      );
      expect(peerCreated.decision).toBe("ALLOW");
      expect(peerCreated.code).toBe("GRANTED");
    });

    it("blocks finance controller from posting self-created journal and enforces MFA step-up", () => {
      // Maker-checker violation
      const selfPost = evaluateAccess(
        {
          actorId: "fc-1",
          roles: ["FINANCE_CONTROLLER"],
          isSelfCreated: true,
          mfaVerified: true,
        },
        "journal.post:entity"
      );
      expect(selfPost.decision).toBe("DENY");
      expect(selfPost.code).toBe("MAKER_CHECKER_VIOLATION");

      // MFA required
      const noMfa = evaluateAccess(
        {
          actorId: "fc-1",
          roles: ["FINANCE_CONTROLLER"],
          isSelfCreated: false,
          mfaVerified: false,
        },
        "journal.post:entity"
      );
      expect(noMfa.decision).toBe("DENY");
      expect(noMfa.code).toBe("MFA_STEPUP_REQUIRED");

      // Valid approval
      const valid = evaluateAccess(
        {
          actorId: "fc-1",
          roles: ["FINANCE_CONTROLLER"],
          isSelfCreated: false,
          mfaVerified: true,
        },
        "journal.post:entity"
      );
      expect(valid.decision).toBe("ALLOW");
    });

    it("prevents claims reviewer from approving own submissions", () => {
      const selfReview = evaluateAccess(
        {
          actorId: "cr-1",
          roles: ["CLAIMS_REVIEWER"],
          isSelfCreated: true,
        },
        "claim.submit_review:assigned"
      );
      expect(selfReview.decision).toBe("DENY");
      expect(selfReview.code).toBe("MAKER_CHECKER_VIOLATION");
    });

    it("prevents warehouse manager from releasing recalled lot without regulatory clearance", () => {
      const recalledWithoutClearance = evaluateAccess(
        {
          actorId: "wm-1",
          roles: ["WAREHOUSE_MANAGER"],
          isUnderRegulatoryRecall: true,
        },
        "lot.release:assigned"
      );
      expect(recalledWithoutClearance.decision).toBe("DENY");
      expect(recalledWithoutClearance.code).toBe("REGULATORY_CLEARANCE_REQUIRED");

      const cleared = evaluateAccess(
        {
          actorId: "wm-1",
          roles: ["WAREHOUSE_MANAGER"],
          isUnderRegulatoryRecall: true,
          complianceClearanceId: "MOH-RECALL-CLEAR-2026-0881",
        },
        "lot.release:assigned"
      );
      expect(cleared.decision).toBe("ALLOW");
      expect(cleared.code).toBe("GRANTED");
    });
  });

  describe("System Admin Separation of Business Roles", () => {
    it("allows system admin technical maintenance operations", () => {
      const techConfig = evaluateAccess(
        {
          actorId: "admin-1",
          roles: ["SYSTEM_ADMIN"],
        },
        "system.config.manage"
      );
      expect(techConfig.decision).toBe("ALLOW");
    });
  });

  describe("Machine vs Human Identity Guardrails", () => {
    it("permits machine identity for integration service endpoints", () => {
      const webhook = evaluateAccess(
        {
          actorId: "svc-melli",
          roles: ["INTEGRATION_SERVICE"],
          isMachineIdentity: true,
        },
        "payment.webhook.ingest:provider"
      );
      expect(webhook.decision).toBe("ALLOW");
    });

    it("denies interactive human login on machine service accounts", () => {
      const humanServiceAttempt = evaluateAccess(
        {
          actorId: "svc-melli",
          roles: ["INTEGRATION_SERVICE"],
          isMachineIdentity: false,
        },
        "payment.webhook.ingest:provider"
      );
      expect(humanServiceAttempt.decision).toBe("DENY");
      expect(humanServiceAttempt.code).toBe("MACHINE_IDENTITY_REQUIRED");
    });

    it("denies machine identity masquerading as business roles", () => {
      const botOrder = evaluateAccess(
        {
          actorId: "bot-1",
          roles: ["CUSTOMER"],
          isMachineIdentity: true,
          isResourceOwner: true,
        },
        "checkout.create:self"
      );
      expect(botOrder.decision).toBe("DENY");
      expect(botOrder.code).toBe("HUMAN_IDENTITY_REQUIRED");
    });
  });

  describe("assertAccess Error Handling", () => {
    it("does not throw on valid authorization", () => {
      expect(() => {
        assertAccess(
          {
            actorId: "cust-1",
            roles: ["CUSTOMER"],
            isResourceOwner: true,
          },
          "profile.read:self"
        );
      }).not.toThrow();
    });

    it("throws structured descriptive error on unauthorized attempt", () => {
      expect(() => {
        assertAccess(
          {
            actorId: "cust-1",
            roles: ["CUSTOMER"],
            isResourceOwner: false,
          },
          "profile.read:self"
        );
      }).toThrow(/\[FORBIDDEN:OWNERSHIP_REQUIRED\]/);
    });
  });
});
