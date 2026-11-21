import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AcceptQuoteSchema,
  B2BApplication,
  CreateB2BApplicationSchema,
  CreateRfqSchema,
  type AcceptQuote,
  type CreateB2BApplication,
  type CreateRfq,
  type QuoteAcceptResponse,
  type Rfq,
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
