import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestActor } from '../auth/rbac.types';

/**
 * Injects the authenticated actor context into controller route handlers.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestActor | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.actor;
  },
);
