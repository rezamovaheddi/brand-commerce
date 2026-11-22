import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  AcceptQuoteSchema,
  B2BApplication,
  CreateB2BApplicationSchema,
  CreateRfqSchema,
  RfqAttachmentInputSchema,
  type AcceptQuote,
  type ApplicationAttachmentMeta,
  type CreateB2BApplication,
  type CreateRfq,
  type QuoteAcceptResponse,
  type Rfq,
  type RfqAttachmentMeta,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { B2bService } from './b2b.service';

/** Public distributor-application + RFQ endpoints (B3/B4-lite). No auth: anyone
 *  may APPLY/REQUEST; only the keyed admin console reviews and prices (see
 *  admin module). */
@ApiTags('b2b')
@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  @Post('applications')
  @ApiOperation({ summary: 'ثبت درخواست همکاری توزیع/آژانس' })
  @ApiCreatedResponse({ description: 'درخواست ثبت شد (SUBMITTED)', type: Object })
  @ApiBadRequestResponse({ description: 'مقادیر نامعتبر' })
  async submit(
    @Body(new ZodValidationPipe(CreateB2BApplicationSchema)) input: CreateB2BApplication,
  ): Promise<B2BApplication> {
    return this.b2bService.submit(input);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'پیگیری وضعیت درخواست' })
  @ApiOkResponse({ description: 'وضعیت درخواست', type: Object })
  @ApiNotFoundResponse({ description: 'درخواست یافت نشد' })
  async getStatus(@Param('id') id: string): Promise<B2BApplication> {
    return this.b2bService.get(id);
  }

  // ---- B3 application attachments (license/permit documents) ------------------

  @Post('applications/:id/attachments')
  @ApiOperation({ summary: 'بارگذاری مدرک (جواز/مجوز) — PDF/PNG/JPEG، حداکثر ۵۱۲KB، تا ۳ فایل' })
  @ApiCreatedResponse({ description: 'متادیتای مدرک', type: Object })
  @ApiBadRequestResponse({ description: 'نوع/حجم/نام نامعتبر یا سقف ۳ فایل' })
  @ApiNotFoundResponse({ description: 'درخواست همکاری یافت نشد' })
  async addApplicationAttachment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RfqAttachmentInputSchema)) input: {
      filename: string;
      mime: string;
      contentBase64: string;
    },
  ): Promise<ApplicationAttachmentMeta> {
    return this.b2bService.addApplicationAttachment(id, input);
  }

  @Get('applications/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'دانلود مدرک پیوست‌شده به درخواست همکاری' })
  @ApiNotFoundResponse({ description: 'مدرک یافت نشد' })
  async downloadApplicationAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { meta, data } = await this.b2bService.getApplicationAttachment(id, attachmentId);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="document-${meta.id}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    );
    res.end(data);
  }

  @Post('rfqs')
  @ApiOperation({ summary: 'ثبت درخواست قیمت (RFQ)' })
  @ApiCreatedResponse({ description: 'RFQ ثبت شد (SUBMITTED)', type: Object })
  @ApiBadRequestResponse({ description: 'مقادیر نامعتبر' })
  async submitRfq(
    @Body(new ZodValidationPipe(CreateRfqSchema)) input: CreateRfq,
  ): Promise<Rfq> {
    return this.b2bService.submitRfq(input);
  }

  @Get('rfqs/:id')
  @ApiOperation({ summary: 'مشاهده RFQ و پیش‌فاکتورهای آن' })
  @ApiOkResponse({ description: 'RFQ با quote', type: Object })
  @ApiNotFoundResponse({ description: 'درخواست قیمت یافت نشد' })
  async getRfq(@Param('id') id: string): Promise<Rfq> {
    return this.b2bService.getRfq(id);
  }

  // ---- attachments (B3-lite; access by RFQ id, same trust level as tracking) --

  @Post('rfqs/:id/attachments')
  @ApiOperation({ summary: 'بارگذاری پیوست (PDF/PNG/JPEG، حداکثر ۵۱۲KB، تا ۳ فایل)' })
  @ApiCreatedResponse({ description: 'متادیتای پیوست', type: Object })
  @ApiBadRequestResponse({ description: 'نوع/حجم/نام نامعتبر یا سقف ۳ فایل' })
  @ApiNotFoundResponse({ description: 'درخواست قیمت یافت نشد' })
  async addAttachment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RfqAttachmentInputSchema)) input: {
      filename: string;
      mime: string;
      contentBase64: string;
    },
  ): Promise<RfqAttachmentMeta> {
    return this.b2bService.addRfqAttachment(id, input);
  }

  @Get('rfqs/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'دانلود پیوست' })
  @ApiNotFoundResponse({ description: 'پیوست یافت نشد' })
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { meta, data } = await this.b2bService.getRfqAttachment(id, attachmentId);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attachment-${meta.id}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    );
    res.end(data);
  }

  @Post('quotes/:id/accept')
  @ApiOperation({ summary: 'پذیرش پیش‌فاکتور → تبدیل اتمیک به سفارش (با رزرو موجودی)' })
  @ApiCreatedResponse({ description: 'سفارش DRAFT ساخته شد', type: Object })
  @ApiBadRequestResponse({ description: 'منقضی/پذیرفته‌شده/قابل پذیرش نیست' })
  async acceptQuote(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AcceptQuoteSchema)) address: AcceptQuote,
  ): Promise<QuoteAcceptResponse> {
    return this.b2bService.acceptQuote(id, address);
  }
}
