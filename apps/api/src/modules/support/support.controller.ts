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
  CreateLeadSchema,
  CreateTicketSchema,
  TicketReplySchema,
  type CreateLead,
  type CreateTicket,
  type Lead,
  type Ticket,
  type TicketReply,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { SupportService } from './support.service';

/**
 * Public CRM-lite surface (TASK-099 + K3): guest support tickets and
 * contact/demo-form leads, tracked by id — same bootstrap trust level as
 * applications/RFQ tracking until Identity (P7).
 */
@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'باز کردن تیکت پشتیبانی' })
  @ApiCreatedResponse({ description: 'تیکت OPEN با پیام اول ساخته شد', type: Object })
  @ApiBadRequestResponse({ description: 'مقادیر نامعتبر' })
  async createTicket(
    @Body(new ZodValidationPipe(CreateTicketSchema)) input: CreateTicket,
  ): Promise<Ticket> {
    return this.supportService.createTicket(input);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'مشاهده تیکت و گفت‌وگوی آن' })
  @ApiOkResponse({ description: 'تیکت با timeline', type: Object })
  @ApiNotFoundResponse({ description: 'تیکت یافت نشد' })
  async getTicket(@Param('id') id: string): Promise<Ticket> {
    return this.supportService.getTicket(id);
  }

  @Post('tickets/:id/replies')
  @ApiOperation({ summary: 'پاسخ مشتری به تیکت (تا قبل از بسته‌شدن)' })
  @ApiCreatedResponse({ description: 'پیام CUSTOMER اضافه شد', type: Object })
  @ApiBadRequestResponse({ description: 'تیکت بسته است' })
  @ApiNotFoundResponse({ description: 'تیکت یافت نشد' })
  async reply(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TicketReplySchema)) input: TicketReply,
  ): Promise<Ticket> {
    return this.supportService.replyToTicket(id, input);
  }

  @Post('leads')
  @ApiOperation({ summary: 'ثبت تماس/درخواست مشاوره (K3 → سرنخ CRM)' })
  @ApiCreatedResponse({ description: 'سرنخ NEW ثبت شد', type: Object })
  async createLead(
    @Body(new ZodValidationPipe(CreateLeadSchema)) input: CreateLead,
  ): Promise<Lead> {
    return this.supportService.createLead(input);
  }
}
