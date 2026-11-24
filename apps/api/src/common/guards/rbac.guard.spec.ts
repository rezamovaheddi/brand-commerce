import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/require-permission.decorator';
import type { PermissionCode } from '@bc/domain';

describe('RbacGuard — Server-Side RBAC & Policy Enforcement (TASK-033)', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  function createMockContext(options: {
    isPublic?: boolean;
    permissions?: PermissionCode[];
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  }): ExecutionContext {
    const handler = () => {};
    const cls = class MockController {};

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return options.isPublic ?? false;
      if (key === PERMISSIONS_KEY) return options.permissions ?? [];
      return undefined;
    });

    const mockRequest: {
      headers: Record<string, string>;
      params: Record<string, string>;
      body: Record<string, unknown>;
      actor?: unknown;
    } = {
      headers: options.headers || {},
      params: options.params || {},
      body: options.body || {},
    };

    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access to routes explicitly marked public with @PublicRoute()', () => {
    const ctx = createMockContext({ isPublic: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('enforces default-deny when a route has neither public nor permission metadata', () => {
    const ctx = createMockContext({ isPublic: false, permissions: [] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    try {
      guard.canActivate(ctx);
    } catch (err: unknown) {
      const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(res.code).toBe('DEFAULT_DENY');
    }
  });

  it('rejects requests from actors with no roles with DEFAULT_DENY', () => {
    const ctx = createMockContext({
      permissions: ['cart.manage:self'],
      headers: {
        'x-user-id': 'cust-1',
        'x-roles': '',
      },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects access when role lacks the required permission code', () => {
    const ctx = createMockContext({
      permissions: ['journal.post:entity'],
      headers: {
        'x-user-id': 'clerk-1',
        'x-roles': 'FINANCE_CLERK',
      },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  describe('Resource Scoping Guardrails', () => {
    it('allows retail customer access to :self permission when resource ownership matches', () => {
      const ctx = createMockContext({
        permissions: ['cart.manage:self'],
        headers: {
          'x-user-id': 'cust-10',
          'x-roles': 'CUSTOMER',
          'x-resource-owner': 'true',
        },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects retail customer access to :self permission when ownership is false', () => {
      const ctx = createMockContext({
        permissions: ['cart.manage:self'],
        headers: {
          'x-user-id': 'cust-10',
          'x-roles': 'CUSTOMER',
          'x-resource-owner': 'false',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('OWNERSHIP_REQUIRED');
      }
    });

    it('allows B2B buyer access when targetOrg matches assigned organizations', () => {
      const ctx = createMockContext({
        permissions: ['cart.manage:assigned'],
        headers: {
          'x-user-id': 'buyer-1',
          'x-roles': 'ORG_BUYER',
          'x-assigned-orgs': 'org-alpha, org-beta',
          'x-target-org': 'org-alpha',
        },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('blocks B2B buyer access when targetOrg does not match assigned organizations', () => {
      const ctx = createMockContext({
        permissions: ['cart.manage:assigned'],
        headers: {
          'x-user-id': 'buyer-1',
          'x-roles': 'ORG_BUYER',
          'x-assigned-orgs': 'org-alpha',
          'x-target-org': 'org-gamma',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('ORG_SCOPE_MISMATCH');
      }
    });

    it('blocks warehouse operator when operating on unassigned warehouse location', () => {
      const ctx = createMockContext({
        permissions: ['receipt.scan:assigned'],
        headers: {
          'x-user-id': 'operator-1',
          'x-roles': 'WAREHOUSE_OPERATOR',
          'x-assigned-warehouses': 'wh-tehran',
          'x-target-warehouse': 'wh-isfahan',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('WAREHOUSE_SCOPE_MISMATCH');
      }
    });

    it('blocks regulatory officer when operating outside assigned market jurisdiction', () => {
      const ctx = createMockContext({
        permissions: ['claim.approve:market'],
        headers: {
          'x-user-id': 'reg-1',
          'x-roles': 'REGULATORY_OFFICER',
          'x-assigned-markets': 'mkt-iran',
          'x-target-market': 'mkt-uae',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('MARKET_SCOPE_MISMATCH');
      }
    });
  });

  describe('Maker-Checker & Separation of Duties', () => {
    it('blocks sales manager from approving quotes they authored (maker-checker violation)', () => {
      const ctx = createMockContext({
        permissions: ['quote.approve:policy'],
        headers: {
          'x-user-id': 'sm-1',
          'x-roles': 'SALES_MANAGER',
          'x-is-self-created': 'true',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('MAKER_CHECKER_VIOLATION');
      }
    });

    it('requires MFA step-up verification for finance controller journal postings', () => {
      // Without MFA
      const noMfaCtx = createMockContext({
        permissions: ['journal.post:entity'],
        headers: {
          'x-user-id': 'controller-1',
          'x-roles': 'FINANCE_CONTROLLER',
          'x-is-self-created': 'false',
          'x-mfa-verified': 'false',
        },
      });
      expect(() => guard.canActivate(noMfaCtx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(noMfaCtx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('MFA_STEPUP_REQUIRED');
      }

      // With MFA
      const withMfaCtx = createMockContext({
        permissions: ['journal.post:entity'],
        headers: {
          'x-user-id': 'controller-1',
          'x-roles': 'FINANCE_CONTROLLER',
          'x-is-self-created': 'false',
          'x-mfa-verified': 'true',
        },
      });
      expect(guard.canActivate(withMfaCtx)).toBe(true);
    });

    it('blocks warehouse manager from releasing lot under regulatory recall without compliance clearance', () => {
      const recallCtx = createMockContext({
        permissions: ['lot.release:assigned'],
        headers: {
          'x-user-id': 'wm-1',
          'x-roles': 'WAREHOUSE_MANAGER',
          'x-under-regulatory-recall': 'true',
        },
      });
      expect(() => guard.canActivate(recallCtx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(recallCtx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('REGULATORY_CLEARANCE_REQUIRED');
      }

      // With compliance clearance ID
      const clearedCtx = createMockContext({
        permissions: ['lot.release:assigned'],
        headers: {
          'x-user-id': 'wm-1',
          'x-roles': 'WAREHOUSE_MANAGER',
          'x-under-regulatory-recall': 'true',
          'x-compliance-clearance-id': 'MOH-RECALL-CLEAR-2026-9901',
        },
      });
      expect(guard.canActivate(clearedCtx)).toBe(true);
    });
  });

  describe('Machine vs Human Boundary', () => {
    it('permits machine identity for integration service webhook ingest', () => {
      const ctx = createMockContext({
        permissions: ['payment.webhook.ingest:provider'],
        headers: {
          'x-user-id': 'svc-shaparak',
          'x-roles': 'INTEGRATION_SERVICE',
          'x-is-machine': 'true',
        },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies interactive human user on integration service endpoints', () => {
      const ctx = createMockContext({
        permissions: ['payment.webhook.ingest:provider'],
        headers: {
          'x-user-id': 'user-interactive',
          'x-roles': 'INTEGRATION_SERVICE',
          'x-is-machine': 'false',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('MACHINE_IDENTITY_REQUIRED');
      }
    });

    it('denies machine tokens attempting to masquerade as retail customer', () => {
      const ctx = createMockContext({
        permissions: ['checkout.create:self'],
        headers: {
          'x-user-id': 'bot-crawler',
          'x-roles': 'CUSTOMER',
          'x-is-machine': 'true',
          'x-resource-owner': 'true',
        },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      try {
        guard.canActivate(ctx);
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe('HUMAN_IDENTITY_REQUIRED');
      }
    });
  });
});
