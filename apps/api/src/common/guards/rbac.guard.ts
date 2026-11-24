import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  evaluateAccess,
  isEnterpriseRole,
  type EnterpriseRole,
  type PermissionCode,
} from '@bc/domain';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/require-permission.decorator';
import type { RequestActor } from '../auth/rbac.types';

function parseListHeader(value: unknown): string[] | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
  }
  return undefined;
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check if route is explicitly marked public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Retrieve required permissions from handler or class
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // Default-Deny: route without permission or public annotation is blocked by default
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'DEFAULT_DENY',
        message: 'هیچ مجوزی برای این مسیر تنظیم نشده است؛ دسترسی به صورت پیش‌فرض مسدود است (Default-Deny).',
      });
    }

    // 3. Extract HTTP request and security headers
    const request = context.switchToHttp().getRequest();
    const headers = request.headers || {};
    const params = request.params || {};
    const body = request.body || {};

    const actorId =
      (typeof headers['x-actor-id'] === 'string' && headers['x-actor-id'].trim()) ||
      (typeof headers['x-user-id'] === 'string' && headers['x-user-id'].trim()) ||
      'anonymous';

    // Parse role header into canonical enterprise roles
    const rawRoles = parseListHeader(headers['x-roles']) || [];
    const roles: EnterpriseRole[] = rawRoles.filter((r): r is EnterpriseRole => isEnterpriseRole(r));

    // Scoping resolution
    const assignedOrgIds = parseListHeader(headers['x-assigned-orgs']);
    const targetOrgId =
      (typeof headers['x-target-org'] === 'string' && headers['x-target-org'].trim()) ||
      (typeof params.orgId === 'string' && params.orgId.trim()) ||
      (typeof body.organizationId === 'string' && body.organizationId.trim()) ||
      undefined;

    const assignedWarehouseIds = parseListHeader(headers['x-assigned-warehouses']);
    const targetWarehouseId =
      (typeof headers['x-target-warehouse'] === 'string' && headers['x-target-warehouse'].trim()) ||
      (typeof params.warehouseId === 'string' && params.warehouseId.trim()) ||
      (typeof body.warehouseId === 'string' && body.warehouseId.trim()) ||
      undefined;

    const assignedEntityIds = parseListHeader(headers['x-assigned-entities']);
    const targetEntityId =
      (typeof headers['x-target-entity'] === 'string' && headers['x-target-entity'].trim()) ||
      (typeof params.entityId === 'string' && params.entityId.trim()) ||
      (typeof body.entityId === 'string' && body.entityId.trim()) ||
      undefined;

    const assignedMarketIds = parseListHeader(headers['x-assigned-markets']);
    const targetMarketId =
      (typeof headers['x-target-market'] === 'string' && headers['x-target-market'].trim()) ||
      (typeof params.marketId === 'string' && params.marketId.trim()) ||
      (typeof body.marketId === 'string' && body.marketId.trim()) ||
      undefined;

    // Security flags and maker-checker invariants
    const isMachineIdentity =
      headers['x-is-machine'] === 'true' ||
      Boolean(headers['x-machine-token'] && String(headers['x-machine-token']).trim().length > 0);

    const mfaVerified =
      headers['x-mfa-verified'] === 'true' ||
      Boolean(headers['x-mfa-token'] && String(headers['x-mfa-token']).trim().length > 0);

    const isResourceOwner =
      headers['x-resource-owner'] === 'true' ||
      (Boolean(params.userId) && params.userId === actorId) ||
      (Boolean(params.customerId) && params.customerId === actorId);

    const isSelfCreated = headers['x-is-self-created'] === 'true';

    const isUnderRegulatoryRecall = headers['x-under-regulatory-recall'] === 'true';
    const complianceClearanceId =
      typeof headers['x-compliance-clearance-id'] === 'string' &&
      headers['x-compliance-clearance-id'].trim().length > 0
        ? headers['x-compliance-clearance-id'].trim()
        : undefined;

    const actorContext: RequestActor = {
      actorId,
      roles,
      isMachineIdentity,
      mfaVerified,
      isResourceOwner,
      isSelfCreated,
      assignedOrgIds,
      targetOrgId,
      assignedWarehouseIds,
      targetWarehouseId,
      assignedEntityIds,
      targetEntityId,
      assignedMarketIds,
      targetMarketId,
      isUnderRegulatoryRecall,
      complianceClearanceId,
      authHeader: typeof headers.authorization === 'string' ? headers.authorization : undefined,
    };

    // Attach resolved actor to request
    request.actor = actorContext;

    // 4. Evaluate each required permission
    for (const permission of requiredPermissions) {
      const result = evaluateAccess(actorContext, permission);
      if (result.decision !== 'ALLOW') {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: result.code,
          reason: result.reason,
          permission,
          matchedRole: result.matchedRole,
        });
      }
    }

    return true;
  }
}
