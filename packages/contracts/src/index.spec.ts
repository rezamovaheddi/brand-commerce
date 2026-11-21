import {
  ProductSchema,
  ProductListQuerySchema,
  ProductListResponseSchema,
  CartSchema,
  AddCartItemSchema,
  CheckoutRequestSchema,
  OrderSchema,
  HealthResponseSchema,
  ApiErrorSchema,
} from "./index";

/**
 * Contract tests: the fixtures below are the canonical wire shapes shared by
 * API and Storefront. Any change that breaks these parses is a breaking
 * contract change and must fail CI.
 */

const validVariant = {
  variantId: "v1",
  sku: "DMV-SRM-30C",
  productNameFa: "سرم ویتامین C اتیریال",
  productNameEn: "Ethereal Vitamin C Serum",
  titleFa: "حجم ۳۰ میلی‌لیتر",
  titleEn: "30 ml",
  quantity: 2,
  unitPriceMinor: 3_950_000,
  currency: "IRR",
  lineTotalMinor: 7_900_000,
};

const validProduct = {
  id: "p1",
  slug: "ethereal-vitamin-c-serum",
  nameFa: "سرم ویتامین C اتیریال",
  nameEn: "Ethereal Vitamin C Serum",
  descriptionFa: "سرم روشن‌کننده. (داده نمونه)",
  descriptionEn: "Brightening serum. (Sample data)",
  status: "ACTIVE",
  isSample: true,
  category: { slug: "serums", nameFa: "سرم‌ها", nameEn: "Serums" },
  variants: [
    {
      id: "v1",
      sku: "DMV-SRM-30C",
      titleFa: "حجم ۳۰ میلی‌لیتر",
      titleEn: "30 ml",
      priceMinor: 3_950_000,
      currency: "IRR",
      isDefault: true,
      status: "ACTIVE",
      availableToSell: 25,
    },
  ],
};

describe("ProductListQuerySchema", () => {
  it("accepts defaults and coerces strings", () => {
    const q = ProductListQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.limit).toBe(12);
    expect(ProductListQuerySchema.parse({ page: "3", limit: "24" }).limit).toBe(24);
  });

  it("rejects out-of-range limits", () => {
    expect(ProductListQuerySchema.safeParse({ limit: 999 }).success).toBe(false);
    expect(ProductListQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });
});

describe("ProductSchema", () => {
  it("accepts the canonical product wire shape", () => {
    expect(ProductSchema.parse(validProduct).isSample).toBe(true);
  });

  it("rejects unknown status and negative prices", () => {
    expect(ProductSchema.safeParse({ ...validProduct, status: "WEIRD" }).success).toBe(false);
    expect(
      ProductSchema.safeParse({
        ...validProduct,
        variants: [{ ...validProduct.variants[0], priceMinor: -1 }],
      }).success,
    ).toBe(false);
  });
});

describe("ProductListResponseSchema", () => {
  it("accepts a well-formed page", () => {
    const res = ProductListResponseSchema.parse({
      items: [validProduct],
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
    });
    expect(res.totalPages).toBe(1);
  });
});

describe("CartSchema / AddCartItemSchema", () => {
  it("accepts a canonical cart", () => {
    const cart = CartSchema.parse({
      id: "c1",
      status: "ACTIVE",
      items: [validVariant],
      itemCount: 2,
      lineCount: 1,
      subtotalMinor: 7_900_000,
      currency: "IRR",
    });
    expect(cart.items[0]?.lineTotalMinor).toBe(7_900_000);
  });

  it("enforces quantity bounds and required variantId", () => {
    expect(AddCartItemSchema.safeParse({ variantId: "v1", quantity: 100 }).success).toBe(false);
    expect(AddCartItemSchema.safeParse({ variantId: "v1", quantity: 0 }).success).toBe(false);
    expect(AddCartItemSchema.safeParse({ quantity: 1 }).success).toBe(false);
    expect(AddCartItemSchema.parse({ variantId: "v1", quantity: "3" }).quantity).toBe(3);
  });
});

describe("CheckoutRequestSchema", () => {
  const base = {
    cartId: "c1",
    address: {
      fullName: "آرزو کریمی",
      phone: "09123456789",
      province: "تهران",
      city: "تهران",
      postalCode: "1234567890",
      addressLine: "خیابان ولیعصر، پلاک ۱۲، واحد ۳",
    },
  };

  it("accepts a canonical checkout request", () => {
    expect(CheckoutRequestSchema.parse(base).address.phone).toBe("09123456789");
  });

  it("normalizes Persian digits in phone and postal code", () => {
    const parsed = CheckoutRequestSchema.parse({
      ...base,
      address: { ...base.address, phone: "۰۹۱۲۳۴۵۶۷۸۹", postalCode: "۱۲۳۴۵۶۷۸۹۰" },
    });
    expect(parsed.address.phone).toBe("09123456789");
    expect(parsed.address.postalCode).toBe("1234567890");
  });

  it("rejects wrong phone prefix and short postal code", () => {
    expect(
      CheckoutRequestSchema.safeParse({ ...base, address: { ...base.address, phone: "08123456789" } })
        .success,
    ).toBe(false);
    expect(
      CheckoutRequestSchema.safeParse({ ...base, address: { ...base.address, postalCode: "123456789" } })
        .success,
    ).toBe(false);
  });
});

describe("OrderSchema", () => {
  it("accepts a draft order snapshot", () => {
    const order = OrderSchema.parse({
      id: "o1",
      status: "DRAFT",
      currency: "IRR",
      itemCount: 2,
      subtotalMinor: 7_900_000,
      address: {
        fullName: "آرزو کریمی",
        phone: "09123456789",
        province: "تهران",
        city: "تهران",
        postalCode: "1234567890",
        addressLine: "خیابان ولیعصر، پلاک ۱۲، واحد ۳",
      },
      lines: [validVariant],
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    expect(order.status).toBe("DRAFT");
  });

  it("rejects payment-era statuses not yet in scope", () => {
    expect(
      OrderSchema.safeParse({
        id: "o1",
        status: "PAID",
        currency: "IRR",
        itemCount: 1,
        subtotalMinor: 1,
        address: {},
        lines: [],
        createdAt: "x",
      }).success,
    ).toBe(false);
  });
});

describe("HealthResponseSchema / ApiErrorSchema", () => {
  it("accepts health shapes in both DB states", () => {
    expect(HealthResponseSchema.parse({ status: "ok", uptime: 1.5, database: "up" }).database).toBe("up");
    expect(HealthResponseSchema.parse({ status: "degraded", uptime: 0, database: "down" }).status).toBe(
      "degraded",
    );
  });

  it("accepts string and array error messages", () => {
    expect(ApiErrorSchema.parse({ statusCode: 400, message: "bad" }).message).toBe("bad");
    expect(ApiErrorSchema.parse({ statusCode: 400, message: ["a", "b"] }).message).toHaveLength(2);
  });
});
