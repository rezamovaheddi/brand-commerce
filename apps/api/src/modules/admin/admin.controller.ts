import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminB2BDecisionSchema,
  AdminInventoryItem,
  AdminLedgerResponse,
  AdminOrderListResponse,
  AdminOrderStatusQuerySchema,
  AdjustStockSchema,
  CreateOrgMemberSchema,
  IssueQuoteSchema,
  type AdminB2BDecision,
  type AdjustStock,
  type AdminOrderStatusQuery,
  type CreateOrgMember,
  type IssueQuote,
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

  // ---- B2B application review (P4 scaffold) --------------------------------

  @Get('b2b/applications')
  @ApiOperation({ summary: 'فهرست درخواست‌های همکاری B2B' })
  @ApiOkResponse({ description: 'درخواست‌ها', type: Object })
  async listB2BApplications(@Query('status') status?: string) {
    return this.adminService.listB2BApplications(status || undefined);
  }

  @Post('b2b/applications/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تأیید درخواست → ایجاد سازمان + عضویت OWNER' })
  @ApiOkResponse({ description: 'درخواست تأیید شد', type: Object })
  @ApiBadRequestResponse({ description: 'وضعیت درخواست اجازه تأیید نمی‌دهد' })
  async approveB2B(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminB2BDecisionSchema)) input: AdminB2BDecision,
  ) {
    return this.adminService.approveB2B(id, input.note);
  }

  @Post('b2b/applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رد درخواست با یادداشت' })
  @ApiOkResponse({ description: 'درخواست رد شد', type: Object })
  async rejectB2B(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminB2BDecisionSchema)) input: AdminB2BDecision,
  ) {
    return this.adminService.rejectB2B(id, input.note);
  }

  @Post('b2b/applications/:id/request-info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'درخواست اطلاعات تکمیلی' })
  @ApiOkResponse({ description: 'وضعیت NEEDS_INFO', type: Object })
  async requestInfoB2B(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminB2BDecisionSchema)) input: AdminB2BDecision,
  ) {
    return this.adminService.requestInfoB2B(id, input.note);
  }

  // ---- RFQ pricing + revisions (admin) --------------------------------------

  @Get('b2b/rfqs')
  @ApiOperation({ summary: 'فهرست درخواست‌های قیمت' })
  @ApiOkResponse({ description: 'RFQها', type: Object })
  async listRfqs(@Query('status') status?: string) {
    return this.adminService.listRfqs(status || undefined);
  }

  @Post('b2b/rfqs/:id/quote')
  @ApiOperation({ summary: 'صدور پیش‌فاکتور + Revision 1 (قیمت‌ها SAMPLE)' })
  @ApiCreatedResponse({ description: 'پیش‌فاکتور SENT', type: Object })
  @ApiBadRequestResponse({ description: 'قابل قیمت‌گذاری نیست / خط بدون محصول' })
  async issueQuote(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(IssueQuoteSchema)) input: IssueQuote,
  ) {
    return this.adminService.issueQuote(id, input);
  }

  @Post('b2b/quotes/:id/revisions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'افزودن Revision جدید (تغییرناپذیر)' })
  @ApiOkResponse({ description: 'Revision n+1', type: Object })
  async addRevision(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(IssueQuoteSchema)) input: IssueQuote,
  ) {
    return this.adminService.addRevision(id, input);
  }

  // ---- Organization members + access keys (N16) -------------------------------

  @Get('b2b/orgs')
  @ApiOperation({ summary: 'فهرست سازمان‌ها + تعداد اعضا' })
  @ApiOkResponse({ description: 'سازمان‌ها', type: Object })
  async listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Get('b2b/orgs/:id/members')
  @ApiOperation({ summary: 'اعضای یک سازمان (بدون کلید)' })
  @ApiOkResponse({ description: 'اعضای سازمان', type: Object })
  @ApiNotFoundResponse({ description: 'سازمان یافت نشد' })
  async listOrgMembers(@Param('id') id: string) {
    return this.adminService.listOrgMembers(id);
  }

  @Post('b2b/orgs/:id/members')
  @ApiOperation({ summary: 'ایجاد عضو + صدور کلید (کلید فقط یک‌بار نمایش داده می‌شود)' })
  @ApiCreatedResponse({ description: 'عضو ساخته شد؛ accessKey یک‌بار نمایش داده می‌شود', type: Object })
  @ApiConflictResponse({ description: 'عضو تکراری (شماره/نقش یا ایمیل)' })
  @ApiNotFoundResponse({ description: 'سازمان یافت نشد' })
  async createOrgMember(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateOrgMemberSchema)) input: CreateOrgMember,
  ) {
    return this.adminService.createOrgMember(id, input);
  }

  @Post('b2b/members/:id/key')
  @ApiOperation({ summary: 'صدور مجدد کلید عضو (کلید قبلی بی‌اعتبار می‌شود)' })
  @ApiCreatedResponse({ description: 'کلید جدید یک‌بار نمایش داده می‌شود', type: Object })
  @ApiNotFoundResponse({ description: 'عضو یافت نشد' })
  async issueOrgMemberKey(@Param('id') id: string) {
    return this.adminService.issueOrgMemberKey(id);
  }

  @Post('b2b/members/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'باطل‌سازی کلید عضو' })
  @ApiOkResponse({ description: 'وضعیت عضو پس از ابطال', type: Object })
  @ApiBadRequestResponse({ description: 'قبلاً باطل شده یا کلید ندارد' })
  @ApiNotFoundResponse({ description: 'عضو یافت نشد' })
  async revokeOrgMemberKey(@Param('id') id: string) {
    return this.adminService.revokeOrgMemberKey(id);
  }
}
