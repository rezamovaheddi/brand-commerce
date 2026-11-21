import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Category,
  Product,
  ProductListQuery,
  ProductListResponse,
} from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { toContract } from './product.mapper';

/** Read model for the public catalog: only ACTIVE rows are ever exposed. */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductListQuery): Promise<ProductListResponse> {
    const { page, limit, category, q } = query;

    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(category !== undefined ? { category: { is: { slug: category } } } : {}),
      ...(q !== undefined ? { OR: this.buildNameSearch(q) } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { variants: true, category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: rows.map(toContract),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Returns null when the slug is unknown or the product is not ACTIVE. */
  async findBySlug(slug: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { slug },
      include: { variants: true, category: true },
    });
    if (!row || row.status !== 'ACTIVE') {
      return null;
    }
    return toContract(row);
  }

  async listCategories(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { status: 'ACTIVE' } } } } },
    });

    return rows.map((row) => ({
      slug: row.slug,
      nameFa: row.nameFa,
      nameEn: row.nameEn,
      productCount: row._count.products,
    }));
  }

  private buildNameSearch(q: string): Prisma.ProductWhereInput[] {
    return [
      { nameFa: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
    ];
  }
}
