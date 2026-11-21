import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminInventoryItem,
  AdminLedgerResponse,
  AdminOrderListResponse,
  AdminOrderStatusQuerySchema,
  AdjustStockSchema,
  type AdjustStock,
  type AdminOrderStatusQuery,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';

/**
 * Bootstrap operator console — every route sits behind AdminKeyGuard.
 * ADMIN_API_KEY unset ⇒ all routes 404 (feature off).
 */
@ApiTags('admin')
@ApiSecurity('x-admin-key')
@UseGuards(AdminKeyGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  @ApiOperation({ summary: 'فهرست همه سفارش‌ها (اپراتور)' })
  @ApiOkResponse({ description: 'صفحه سفارش‌ها', type: Object })
  async listOrders(
    @Query(new ZodValidationPipe(AdminOrderStatusQuerySchema)) query: AdminOrderStatusQuery,
  ): Promise<AdminOrderListResponse> {
    return this.adminService.listOrders(query.page, query.limit, query.status);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'فهرست موجودی واریانت‌ها' })
  @ApiOkResponse({ description: 'موجودی واریانت‌ها', type: Object })
  async listInventory(): Promise<{ items: AdminInventoryItem[] }> {
    return { items: await this.adminService.listInventory() };
  }

  @Post('inventory/:variantId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'اصلاح موجودی (با ردیف دفتر ADJUSTMENT)' })
  @ApiOkResponse({ description: 'موجودی پس از اصلاح', type: Object })
  @ApiBadRequestResponse({ description: 'موجودی منفی یا مقدار نامعتبر' })
  @ApiNotFoundResponse({ description: 'واریانت موجودی ندارد' })
  async adjust(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(AdjustStockSchema)) input: AdjustStock,
  ): Promise<AdminInventoryItem> {
    return this.adminService.adjustStock(variantId, input);
  }

  @Get('ledger')
  @ApiOperation({ summary: '۱۰۰ ردیف آخر دفتر موجودی' })
  @ApiOkResponse({ description: 'ردیف‌های دفتر', type: Object })
  async ledger(@Query('variantId') variantId?: string): Promise<AdminLedgerResponse> {
    return this.adminService.listLedger(variantId || undefined);
  }
}
