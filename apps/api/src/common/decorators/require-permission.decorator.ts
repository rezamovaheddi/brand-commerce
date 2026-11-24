import { SetMetadata, CustomDecorator } from '@nestjs/common';
import type { PermissionCode } from '@bc/domain';

export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Declare one or more granular permissions required to execute the target route.
 * Multiple permissions are evaluated with AND logic (all must be satisfied).
 */
export const RequirePermission = (...permissions: PermissionCode[]): CustomDecorator<string> =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Explicitly mark a route as public to bypass the Default-Deny guard policy.
 */
export const PublicRoute = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
