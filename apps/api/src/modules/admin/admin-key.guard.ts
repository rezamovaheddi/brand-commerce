import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * BOOTSTRAP ADMIN GUARD — NOT production RBAC (that lands in P4 with real
 * identity). Behavior:
 *  - ADMIN_API_KEY unset/empty  → every admin route 404s (feature off)
 *  - wrong key                  → 401
 *  - matching key               → through
 * The key travels in the `x-admin-key` header. Replace wholesale with RBAC.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configured = this.config.get<string>('ADMIN_API_KEY');
    if (!configured) {
      throw new NotFoundException();
    }
    const request = context.switchToHttp().getRequest();
    const provided = request.headers?.['x-admin-key'];
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('کلید ادمین ارسال نشده است');
    }
    if (provided !== configured) {
      throw new UnauthorizedException('کلید ادمین معتبر نیست');
    }
    return true;
  }
}
