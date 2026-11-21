import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Category,
  Product,
  ProductListQuery,
  ProductListQuerySchema,
  ProductListResponse,
} from '@bc/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  @ApiOperation({ summary: 'List ACTIVE products (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page, 1-50 (default 12)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category slug' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Case-insensitive search over Persian/English names' })
  @ApiOkResponse({ description: 'Paginated product list (ProductListResponse contract)' })
  list(
    @Query(new ZodValidationPipe(ProductListQuerySchema)) query: ProductListQuery,
  ): Promise<ProductListResponse> {
    return this.productsService.list(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Fetch a single ACTIVE product by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Unique product slug' })
  @ApiOkResponse({ description: 'Product contract' })
  @ApiNotFoundResponse({ description: 'محصول یافت نشد (no ACTIVE product with this slug)' })
  async findBySlug(@Param('slug') slug: string): Promise<Product> {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }
    return product;
  }

  @Get('categories')
  @ApiOperation({ summary: 'List active categories with counts of ACTIVE products' })
  @ApiOkResponse({ description: 'Array of Category contracts with productCount' })
  listCategories(): Promise<Category[]> {
    return this.productsService.listCategories();
  }
}
