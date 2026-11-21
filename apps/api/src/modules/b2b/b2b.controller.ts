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
  B2BApplication,
  CreateB2BApplicationSchema,
  type CreateB2BApplication,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { B2bService } from './b2b.service';

/** Public distributor-application endpoints (B3/B4-lite). No auth: anyone may
 *  APPLY; only the keyed admin console reviews (see admin module). */
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
}
