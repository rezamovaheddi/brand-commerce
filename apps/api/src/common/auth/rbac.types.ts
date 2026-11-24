import type { EnterpriseRole, PermissionCode, EvaluationContext, EvaluationResult } from '@bc/domain';

export type { EnterpriseRole, PermissionCode, EvaluationContext, EvaluationResult };

/**
 * Resolved actor attached to Express Request object after RBAC extraction.
 */
export interface RequestActor extends EvaluationContext {
  /** Raw authorization header if present */
  readonly authHeader?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: RequestActor;
    }
  }
}
