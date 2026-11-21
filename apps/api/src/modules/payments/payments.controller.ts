import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  SandboxCallbackSchema,
  type PayOrderResponse,
  type Payment,
  type SandboxCallback,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/pay')
  @ApiOperation({ summary: 'شروع پرداخت SANDBOX برای سفارش پیش‌نویس' })
  @ApiCreatedResponse({ description: 'پرداخت آزمایشی ایجاد شد', type: Object })
  @ApiBadRequestResponse({ description: 'وضعیت سفارش قابل پرداخت نیست' })
  @ApiNotFoundResponse({ description: 'سفارش یافت نشد' })
  async pay(
    @Param('id') orderId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<PayOrderResponse> {
    return this.paymentsService.pay(orderId, idempotencyKey || undefined);
  }

  @Post(':id/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'وب‌هوک درگاه (امضای HMAC الزامی)' })
  @ApiOkResponse({ description: 'وضعیت پرداخت به‌روزرسانی شد', type: Object })
  @ApiUnauthorizedResponse({ description: 'امضای درگاه معتبر نیست' })
  @ApiBadRequestResponse({ description: 'پرداخت در وضعیت نهایی است' })
  async callback(
    @Param('id') paymentId: string,
    @Body(new ZodValidationPipe(SandboxCallbackSchema)) body: SandboxCallback,
  ): Promise<Payment> {
    return this.paymentsService.callback(paymentId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده پرداخت' })
  @ApiOkResponse({ description: 'پرداخت', type: Object })
  @ApiNotFoundResponse({ description: 'پرداخت یافت نشد' })
  async get(@Param('id') paymentId: string): Promise<Payment> {
    return this.paymentsService.get(paymentId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'بازگشت وجه SANDBOX' })
  @ApiOkResponse({ description: 'پرداخت بازگشت داده شد', type: Object })
  @ApiBadRequestResponse({ description: 'وضعیت پرداخت قابل بازگشت نیست' })
  async refund(@Param('id') paymentId: string): Promise<PayOrderResponse> {
    return this.paymentsService.refund(paymentId);
  }

  @Post(':id/sandbox-confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تأیید شبیه‌ساز درگاه (فقط در حالت SANDBOX)' })
  @ApiOkResponse({ description: 'پرداخت به‌روزرسانی شد', type: Object })
  @ApiNotFoundResponse({ description: 'در حالت تولید این مسیر وجود ندارد' })
  async sandboxConfirm(
    @Param('id') paymentId: string,
    @Body(new ZodValidationPipe(SandboxCallbackSchema.omit({ signature: true })))
    body: { result: 'succeeded' | 'failed' },
  ): Promise<Payment> {
    return this.paymentsService.sandboxConfirm(paymentId, body.result);
  }
}
