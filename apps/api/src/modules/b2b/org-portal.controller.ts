import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  AcceptQuoteSchema,
  CreateRfqSchema,
  RfqAttachmentInputSchema,
  type AcceptQuote,
  type CreateRfq,
  type OrgMe,
  type QuoteAcceptResponse,
  type Rfq,
  type RfqAttachmentMeta,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { B2bService } from './b2b.service';
import { OrgMember, OrgMemberContext, OrgMemberGuard } from './org-member.guard';

/**
 * Organization portal endpoints (N16). Every route requires a valid,
 * unrevoked member key via OrgMemberGuard; data access is scoped to the
 * member's own organization. Cross-org reads are answered with 404.
 */
@ApiTags('b2b-org')
@ApiSecurity('x-org-key')
@UseGuards(OrgMemberGuard)
@Controller('b2b/org')
export class OrgPortalController {
  constructor(private readonly b2bService: B2bService) {}

  @Get('me')
  @ApiOperation({ summary: 'هویت سازمانی کلید (نام سازمان، عضو، نقش)' })
  @ApiOkResponse({ description: 'اطلاعات عضو سازمان', type: Object })
  @ApiUnauthorizedResponse({ description: 'کلید سازمانی نامعتبر/باطل' })
  @ApiForbiddenResponse({ description: 'کلید باطل شده یا سازمان تعلیق است' })
  async me(@OrgMember() member: OrgMemberContext): Promise<OrgMe> {
    return this.b2bService.orgMe(member);
  }

  @Post('rfqs')
  @ApiOperation({ summary: 'ثبت درخواست قیمت متعلق به سازمان (نقش OWNER/BUYER)' })
  @ApiCreatedResponse({ description: 'RFQ سازمانی ثبت شد', type: Object })
  @ApiForbiddenResponse({ description: 'نقش ACCOUNTANT اجازه ثبت ندارد' })
  async submitRfq(
    @OrgMember() member: OrgMemberContext,
    @Body(new ZodValidationPipe(CreateRfqSchema)) input: CreateRfq,
  ): Promise<Rfq> {
    return this.b2bService.submitOrgRfq(member, input);
  }

  @Get('rfqs')
  @ApiOperation({ summary: 'فهرست درخواست‌های قیمت همین سازمان' })
  @ApiOkResponse({ description: 'RFQهای سازمان', type: Object })
  async listRfqs(
    @OrgMember() member: OrgMemberContext,
    @Query('status') status?: string,
  ): Promise<{ items: Rfq[] }> {
    return this.b2bService.listOrgRfqs(member, status || undefined);
  }

  @Get('rfqs/:id')
  @ApiOperation({ summary: 'مشاهده RFQ سازمانی (سایر سازمان‌ها: 404)' })
  @ApiOkResponse({ description: 'RFQ با quote', type: Object })
  @ApiNotFoundResponse({ description: 'یافت نشد یا متعلق به سازمان دیگری است' })
  async getRfq(@OrgMember() member: OrgMemberContext, @Param('id') id: string): Promise<Rfq> {
    return this.b2bService.getOrgRfq(member, id);
  }

  @Post('rfqs/:id/attachments')
  @ApiOperation({ summary: 'بارگذاری پیوست روی RFQ سازمانی (نقش OWNER/BUYER)' })
  @ApiCreatedResponse({ description: 'متادیتای پیوست', type: Object })
  @ApiForbiddenResponse({ description: 'نقش ACCOUNTANT اجازه بارگذاری ندارد' })
  @ApiNotFoundResponse({ description: 'RFQ متعلق به سازمان دیگر است' })
  async addAttachment(
    @OrgMember() member: OrgMemberContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RfqAttachmentInputSchema)) input: {
      filename: string;
      mime: string;
      contentBase64: string;
    },
  ): Promise<RfqAttachmentMeta> {
    // Ownership first (404 cross-org), then the purchasing-role rule.
    await this.b2bService.getOrgRfq(member, id);
    if (!(['OWNER', 'BUYER'] as const).includes(member.role as 'OWNER' | 'BUYER')) {
      throw new ForbiddenException('نقش شما (حساب‌دار) اجازه بارگذاری پیوست ندارد');
    }
    return this.b2bService.addRfqAttachment(id, input);
  }

  @Get('rfqs/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'دانلود پیوست سازمانی (سایر سازمان‌ها: 404)' })
  @ApiNotFoundResponse({ description: 'یافت نشد یا متعلق به سازمان دیگری است' })
  async downloadAttachment(
    @OrgMember() member: OrgMemberContext,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { meta, data } = await this.b2bService.getOrgRfqAttachment(member, id, attachmentId);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attachment-${meta.id}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    );
    res.end(data);
  }

  @Post('quotes/:id/accept')
  @ApiOperation({ summary: 'پذیرش پیش‌فاکتور سازمانی → سفارش (نقش OWNER/BUYER)' })
  @ApiCreatedResponse({ description: 'سفارش DRAFT ساخته شد', type: Object })
  @ApiNotFoundResponse({ description: 'متعلق به سازمان دیگر است' })
  @ApiForbiddenResponse({ description: 'نقش ACCOUNTANT اجازه پذیرش ندارد' })
  @ApiBadRequestResponse({ description: 'منقضی/پذیرفته‌شده' })
  async acceptQuote(
    @OrgMember() member: OrgMemberContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AcceptQuoteSchema)) address: AcceptQuote,
  ): Promise<QuoteAcceptResponse> {
    return this.b2bService.acceptOrgQuote(member, id, address);
  }
}
