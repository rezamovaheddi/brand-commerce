import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
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
import { Response } from 'express';
import {
  AdminB2BDecisionSchema,
  AdminInventoryItem,
  AdminLedgerResponse,
  AdminOrderListResponse,
  AdminOrderStatusQuerySchema,
  AdminLeadUpdateSchema,
  AdminTicketUpdateSchema,
  AdjustStockSchema,
  CreateOrgMemberSchema,
  IssueQuoteSchema,
  TicketReplySchema,
  type AdminB2BDecision,
  type AdminLeadUpdate,
  type AdminTicketUpdate,
  type AdjustStock,
  type AdminOrderStatusQuery,
  type CreateOrgMember,
  type IssueQuote,
  type TicketReply,
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

  @Get('audit-logs')
  @ApiOperation({ summary: 'فهرست لاگ‌های ممیزی امنیتی (تغییرناپذیر GAP-031)' })
  @ApiOkResponse({ description: 'ردیف‌های لاگ ممیزی', type: Object })
  async listAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listAuditLogs(entityType, action, limit);
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

  @Get('b2b/rfqs/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'دانلود پیوست RFQ (بررسی قیمت‌گذاری)' })
  @ApiNotFoundResponse({ description: 'پیوست یافت نشد' })
  async downloadRfqAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { meta, data } = await this.adminService.downloadRfqAttachment(id, attachmentId);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attachment-${attachmentId}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    );
    res.end(data);
  }

  @Get('b2b/applications/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'دانلود مدرک درخواست همکاری (بررسی B3/B4)' })
  @ApiNotFoundResponse({ description: 'مدرک یافت نشد' })
  async downloadApplicationAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { meta, data } = await this.adminService.downloadApplicationAttachment(id, attachmentId);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="document-${attachmentId}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    );
    res.end(data);
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

  // ---- CRM-lite (TASK-099 + K3) --------------------------------------------------

  @Get('crm/tickets')
  @ApiOperation({ summary: 'فهرست تیکت‌های پشتیبانی' })
  @ApiOkResponse({ description: 'تیکت‌ها با timeline', type: Object })
  async listTickets(@Query('status') status?: string) {
    return this.adminService.listTickets(status || undefined);
  }

  @Post('crm/tickets/:id/replies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'پاسخ اپراتور به تیکت (پیام AGENT در timeline)' })
  @ApiOkResponse({ description: 'تیکت پس از پاسخ', type: Object })
  @ApiBadRequestResponse({ description: 'تیکت بسته است' })
  @ApiNotFoundResponse({ description: 'تیکت یافت نشد' })
  async replyTicket(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TicketReplySchema)) input: TicketReply,
  ) {
    return this.adminService.replyTicket(id, input);
  }

  @Post('crm/tickets/:id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تغییر وضعیت (ماشین وضعیت domain) / اولویت تیکت' })
  @ApiOkResponse({ description: 'تیکت پس از تغییر', type: Object })
  @ApiBadRequestResponse({ description: 'گذار وضعیت مجاز نیست' })
  @ApiNotFoundResponse({ description: 'تیکت یافت نشد' })
  async updateTicket(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminTicketUpdateSchema)) input: AdminTicketUpdate,
  ) {
    return this.adminService.updateTicket(id, input);
  }

  @Get('crm/leads')
  @ApiOperation({ summary: 'فهرست سرنخ‌های CRM (فرم تماس/دمو)' })
  @ApiOkResponse({ description: 'سرنخ‌ها', type: Object })
  async listLeads(@Query('status') status?: string) {
    return this.adminService.listLeads(status || undefined);
  }

  @Post('crm/leads/:id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تغییر وضعیت سرنخ' })
  @ApiOkResponse({ description: 'سرنخ پس از تغییر', type: Object })
  @ApiNotFoundResponse({ description: 'سرنخ یافت نشد' })
  async updateLead(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminLeadUpdateSchema)) input: AdminLeadUpdate,
  ) {
    return this.adminService.updateLead(id, input);
  }

  @Get('crm/customers/:phone')
  @ApiOperation({ summary: 'پروفایل ۳۶۰-lite مشتری بر اساس شماره (سفارش/تیکت/درخواست/سازمان)' })
  @ApiOkResponse({ description: 'پروفایل تجمیعی', type: Object })
  async customerProfile(@Param('phone') phone: string) {
    return this.adminService.customerProfile(phone);
  }
}
