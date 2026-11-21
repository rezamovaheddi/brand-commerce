import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddCartItem,
  AddCartItemSchema,
  Cart,
  UpdateCartItem,
  UpdateCartItemSchema,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CartsService } from './carts.service';

/**
 * Guest cart endpoints (P2 slice). All bodies are validated against the shared
 * zod contracts; every response is a server-computed Cart contract.
 */
@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an empty guest cart' })
  @ApiCreatedResponse({ description: 'New ACTIVE cart (Cart contract) with zero totals' })
  create(): Promise<Cart> {
    return this.cartsService.create();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a cart with server-computed totals' })
  @ApiParam({ name: 'id', type: String, description: 'Cart id' })
  @ApiOkResponse({ description: 'Cart contract (lines with inactive variants are skipped at read time)' })
  @ApiNotFoundResponse({ description: 'سبد خرید یافت نشد (unknown cart id)' })
  get(@Param('id') id: string): Promise<Cart> {
    return this.cartsService.get(id);
  }

  @Post(':id/items')
  @ApiOperation({
    summary: 'Add a variant to the cart (merges with an existing line, quantity clamped 1..99)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Cart id' })
  @ApiCreatedResponse({ description: 'Updated Cart contract' })
  @ApiNotFoundResponse({
    description: 'سبد خرید یافت نشد (unknown cart) / این محصول برای فروش در دسترس نیست (inactive variant)',
  })
  @ApiBadRequestResponse({ description: 'Body failed AddCartItemSchema (message is an array)' })
  addItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddCartItemSchema)) body: AddCartItem,
  ): Promise<Cart> {
    return this.cartsService.addItem(id, body);
  }

  @Patch(':id/items/:variantId')
  @ApiOperation({ summary: 'Replace the quantity of a cart line' })
  @ApiParam({ name: 'id', type: String, description: 'Cart id' })
  @ApiParam({ name: 'variantId', type: String, description: 'Product variant id' })
  @ApiOkResponse({ description: 'Updated Cart contract' })
  @ApiNotFoundResponse({
    description: 'سبد خرید یافت نشد (unknown cart) / این مورد در سبد خرید یافت نشد (unknown line)',
  })
  @ApiBadRequestResponse({ description: 'Body failed UpdateCartItemSchema (message is an array)' })
  updateItem(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) body: UpdateCartItem,
  ): Promise<Cart> {
    return this.cartsService.updateItem(id, variantId, body);
  }

  @Delete(':id/items/:variantId')
  @ApiOperation({ summary: 'Remove a line from the cart' })
  @ApiParam({ name: 'id', type: String, description: 'Cart id' })
  @ApiParam({ name: 'variantId', type: String, description: 'Product variant id' })
  @ApiOkResponse({ description: 'Updated Cart contract' })
  @ApiNotFoundResponse({
    description: 'سبد خرید یافت نشد (unknown cart) / این مورد در سبد خرید یافت نشد (unknown line)',
  })
  removeItem(@Param('id') id: string, @Param('variantId') variantId: string): Promise<Cart> {
    return this.cartsService.removeItem(id, variantId);
  }
}
