import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckoutRequestSchema, type CheckoutRequest, Order } from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CheckoutService } from './checkout.service';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'تبدیل سبد خرید به سفارش پیش‌نویس (بدون پرداخت)' })
  @ApiCreatedResponse({ description: 'سفارش پیش‌نویس با اسنپ‌شات اقلام', type: Object })
  @ApiBadRequestResponse({ description: 'سبد خالی/قابل تسویه نیست/مقدار نامعتبر' })
  @ApiNotFoundResponse({ description: 'سبد خرید یافت نشد' })
  async checkout(
    @Body(new ZodValidationPipe(CheckoutRequestSchema)) input: CheckoutRequest,
  ): Promise<Order> {
    return this.checkoutService.checkout(input);
  }
}
