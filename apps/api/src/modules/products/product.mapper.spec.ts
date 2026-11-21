import { ProductSchema } from '@bc/contracts';
import { ProductRowWithRelations, ProductVariantRow, toContract } from './product.mapper';

const defaultVariant: ProductVariantRow = {
  id: 'variant-1',
  sku: 'DMV-CLN-150',
  titleFa: 'حجم ۱۵۰ میلی‌لیتر',
  titleEn: '150 ml',
  priceMinor: 1890000,
  currency: 'IRR',
  isDefault: true,
  status: 'ACTIVE',
  inventory: { onHand: 25, reserved: 5 },
};

const backupVariant: ProductVariantRow = {
  id: 'variant-2',
  sku: 'DMV-CLN-150-B',
  titleFa: 'حجم ۱۵۰ میلی‌لیتر (پشتیبان)',
  titleEn: '150 ml (backup)',
  priceMinor: 1990000,
  currency: 'IRR',
  isDefault: false,
  status: 'ACTIVE',
  inventory: null,
};

function buildRow(overrides: Partial<ProductRowWithRelations> = {}): ProductRowWithRelations {
  return {
    id: 'product-1',
    slug: 'ethereal-gentle-cleanser',
    nameFa: 'ژل شست‌وشوی ملایم اتیریال',
    nameEn: 'Ethereal Gentle Cleanser',
    descriptionFa: 'توضیح فارسی نمونه',
    descriptionEn: 'English sample description',
    status: 'ACTIVE',
    isSample: true,
    category: { slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers' },
    variants: [defaultVariant, backupVariant],
    ...overrides,
  };
}

describe('toContract', () => {
  it('maps a prisma-shaped row to the exact Product contract shape', () => {
    const contract = toContract(buildRow());

    expect(contract).toEqual({
      id: 'product-1',
      slug: 'ethereal-gentle-cleanser',
      nameFa: 'ژل شست‌وشوی ملایم اتیریال',
      nameEn: 'Ethereal Gentle Cleanser',
      descriptionFa: 'توضیح فارسی نمونه',
      descriptionEn: 'English sample description',
      status: 'ACTIVE',
      isSample: true,
      category: { slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers' },
      variants: [
        {
          id: 'variant-1',
          sku: 'DMV-CLN-150',
          titleFa: 'حجم ۱۵۰ میلی‌لیتر',
          titleEn: '150 ml',
          priceMinor: 1890000,
          currency: 'IRR',
          isDefault: true,
          status: 'ACTIVE',
        },
        {
          id: 'variant-2',
          sku: 'DMV-CLN-150-B',
          titleFa: 'حجم ۱۵۰ میلی‌لیتر (پشتیبان)',
          titleEn: '150 ml (backup)',
          priceMinor: 1990000,
          currency: 'IRR',
          isDefault: false,
          status: 'ACTIVE',
        },
      ],
    });
    expect(() => ProductSchema.parse(contract)).not.toThrow();
  });

  it('keeps exactly one default variant identifiable in the contract', () => {
    const contract = toContract(buildRow());

    const defaults = contract.variants.filter((variant) => variant.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.sku).toBe('DMV-CLN-150');
    expect(defaults[0]?.priceMinor).toBe(1890000);
  });

  it('preserves isSample and status from the row', () => {
    const archived = toContract(buildRow({ status: 'ARCHIVED', isSample: true }));
    const draft = toContract(buildRow({ status: 'DRAFT', isSample: false }));

    expect(archived.status).toBe('ARCHIVED');
    expect(archived.isSample).toBe(true);
    expect(draft.status).toBe('DRAFT');
    expect(draft.isSample).toBe(false);
  });

  it('maps a missing category to null', () => {
    const orphan = toContract(buildRow({ category: null }));

    expect(orphan.category).toBeNull();
    expect(() => ProductSchema.parse(orphan)).not.toThrow();
  });

  it('does not leak non-contract fields into the payload', () => {
    const contract = toContract(buildRow());

    expect(Object.keys(contract).sort()).toEqual([
      'category',
      'descriptionEn',
      'descriptionFa',
      'id',
      'isSample',
      'nameEn',
      'nameFa',
      'slug',
      'status',
      'variants',
    ]);
  });
});
