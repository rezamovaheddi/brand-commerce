import { createHash } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { OrgMemberRole } from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * N16 bootstrap access control for organization endpoints: the presented
 * `x-org-key` (operator-issued high-entropy secret) resolves to exactly one
 * membership. Only the SHA-256 hash is stored; comparison is by unique-index
 * lookup of the hash — the plaintext is never persisted. Real Identity
 * credentials replace this in P7.
 */

export interface OrgMemberContext {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationIsSample: boolean;
  memberName: string;
  role: OrgMemberRole;
}

/** Param decorator for controllers: the member resolved by OrgMemberGuard. */
export const OrgMember = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrgMemberContext => {
    const request = context.switchToHttp().getRequest();
    if (!request.orgMember) {
      // Guard misconfiguration — fail loud rather than proceeding unauthenticated.
      throw new UnauthorizedException('احراز سازمانی انجام نشده است');
    }
    return request.orgMember as OrgMemberContext;
  },
);

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-org-key'];
    if (typeof header !== 'string' || header.trim() === '') {
      throw new UnauthorizedException('کلید سازمانی ارسال نشده است (x-org-key)');
    }
    const keyHash = createHash('sha256').update(header.trim()).digest('hex');
    const member = await this.prisma.organizationMembership.findUnique({
      where: { keyHash },
      include: { organization: { select: { id: true, name: true, status: true, isSample: true } } },
    });
    if (!member) {
      throw new UnauthorizedException('کلید سازمانی نامعتبر است');
    }
    if (member.keyRevokedAt !== null) {
      throw new ForbiddenException('این کلید سازمانی باطل شده است');
    }
    if (member.organization.status === 'SUSPENDED') {
      throw new ForbiddenException('سازمان شما تعلیق شده است');
    }
    request.orgMember = {
      membershipId: member.id,
      organizationId: member.organization.id,
      organizationName: member.organization.name,
      organizationIsSample: member.organization.isSample,
      memberName: member.contactName,
      role: member.role,
    } satisfies OrgMemberContext;
    // Best-effort telemetry; never blocks the request.
    void this.prisma.organizationMembership
      .update({ where: { id: member.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return true;
  }
}
