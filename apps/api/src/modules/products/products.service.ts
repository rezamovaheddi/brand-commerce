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

/**
 * Computes a deterministic search relevance score for ranking catalog results (GAP-013).
 * Higher score = more relevant result:
 * - Exact title match: 100
 * - Prefix match (title starts with query): 60
 * - Substring match within title: 30
 * - Description match: 10
 */
export function computeSearchRelevance(
  product: { nameFa: string; nameEn: string; descriptionFa?: string | null; descriptionEn?: string | null },
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const fa = (product.nameFa || '').trim().toLowerCase();
  const en = (product.nameEn || '').trim().toLowerCase();

  let score = 0;
  if (fa === q || en === q) {
    score = 100;
  } else if (fa.startsWith(q) || en.startsWith(q)) {
    score = 60;
  } else if (fa.includes(q) || en.includes(q)) {
    score = 30;
  } else if (
    (product.descriptionFa && product.descriptionFa.toLowerCase().includes(q)) ||
    (product.descriptionEn && product.descriptionEn.toLowerCase().includes(q))
  ) {
    score = 10;
  }
  return score;
}

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
        include: { variants: { include: { inventory: true } }, category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = rows.map(toContract);
    if (q) {
      items.sort((a, b) => {
        const scoreA = computeSearchRelevance(a, q);
        const scoreB = computeSearchRelevance(b, q);
        return scoreB - scoreA;
      });
    }

    return {
      items,
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
      include: { variants: { include: { inventory: true } }, category: true },
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
