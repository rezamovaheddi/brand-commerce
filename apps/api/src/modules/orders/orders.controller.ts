import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Order } from '@bc/contracts';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('by-phone/:phone')
  @ApiOperation({ summary: 'فهرست سفارش‌های یک شماره تماس' })
  @ApiParam({ name: 'phone', description: 'شماره تلفن مشتری' })
  @ApiOkResponse({ description: 'فهرست سفارش‌ها', type: [Object] })
  async listOrdersByPhone(@Param('phone') phone: string): Promise<Order[]> {
    return this.ordersService.listByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده سفارش' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiOkResponse({ description: 'سفارش با اسنپ‌شات اقلام', type: Object })
  @ApiNotFoundResponse({ description: 'سفارش یافت نشد' })
  async getOrder(@Param('id') id: string): Promise<Order> {
    return this.ordersService.get(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'لغو سفارش پیش‌نویس' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiOkResponse({ description: 'سفارش لغو‌شده', type: Object })
  @ApiNotFoundResponse({ description: 'سفارش یافت نشد' })
  async cancelOrder(@Param('id') id: string): Promise<Order> {
    return this.ordersService.cancel(id);
  }
}
