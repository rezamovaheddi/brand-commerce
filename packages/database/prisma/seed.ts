/* eslint-disable no-console */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, ProductStatus } from "@prisma/client";

// Minimal .env loader so `npm run seed` works standalone (tsx does not load .env).
// Existing env vars (e.g. from CI) always win.
try {
  for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1] as string]) process.env[m[1] as string] = (m[2] as string).trim();
  }
} catch {
  /* no local .env — rely on provided environment */
}

/**
 * DEVELOPMENT SEED — SAMPLE DATA ONLY.
 * All products below are explicitly marked isSample=true.
 * Production environments MUST NOT run this seed
 * (real catalog data is a pending business decision).
 */

const prisma = new PrismaClient();

const categories = [
  { slug: "cleansers", nameFa: "پاک‌کننده‌ها", nameEn: "Cleansers" },
  { slug: "serums", nameFa: "سرم‌ها", nameEn: "Serums" },
  { slug: "moisturizers", nameFa: "مرطوب‌کننده‌ها", nameEn: "Moisturizers" },
  { slug: "sunscreens", nameFa: "ضدآفتاب‌ها", nameEn: "Sunscreens" },
];

// priceMinor = IRR (rial). Sample prices only — pricing policy pending.
const products: Array<{
  slug: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  category: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  priceMinor: number;
}> = [
  {
    slug: "ethereal-gentle-cleanser",
    nameFa: "ژل شست‌وشوی ملایم اتیریال",
    nameEn: "Ethereal Gentle Cleanser",
    descriptionFa:
      "ژل شست‌وشوی روزانه با pH متعادل، مناسب پوست حساس؛ بدون سولفات و بدون خشک‌کردن پوست. (داده نمونه)",
    descriptionEn:
      "Daily pH-balanced gel cleanser for sensitive skin; sulfate-free and non-drying. (Sample data)",
    category: "cleansers",
    sku: "DMV-CLN-150",
    titleFa: "حجم ۱۵۰ میلی‌لیتر",
    titleEn: "150 ml",
    priceMinor: 1_890_000,
  },
  {
    slug: "ethereal-cream-cleanser",
    nameFa: "شیر پاک‌کننده خامه‌ای اتیریال",
    nameEn: "Ethereal Cream Cleanser",
    descriptionFa:
      "شیر پاک‌کننده غنی برای پوست‌های خشک، با روغن جوجوبا. (داده نمونه)",
    descriptionEn:
      "Rich cream cleanser for dry skin, with jojoba oil. (Sample data)",
    category: "cleansers",
    sku: "DMV-CLN-200",
    titleFa: "حجم ۲۰۰ میلی‌لیتر",
    titleEn: "200 ml",
    priceMinor: 2_250_000,
  },
  {
    slug: "ethereal-vitamin-c-serum",
    nameFa: "سرم ویتامین C اتیریال",
    nameEn: "Ethereal Vitamin C Serum",
    descriptionFa:
      "سرم روشن‌کننده با مشتق پایدار ویتامین C و ویتامین E. (داده نمونه)",
    descriptionEn:
      "Brightening serum with a stable vitamin C derivative and vitamin E. (Sample data)",
    category: "serums",
    sku: "DMV-SRM-30C",
    titleFa: "حجم ۳۰ میلی‌لیتر",
    titleEn: "30 ml",
    priceMinor: 3_950_000,
  },
  {
    slug: "ethereal-hyaluronic-serum",
    nameFa: "سرم هیالورونیک اسید اتیریال",
    nameEn: "Ethereal Hyaluronic Serum",
    descriptionFa:
      "سرم آبرسان با هیالورونیک اسید سه‌وزنی. (داده نمونه)",
    descriptionEn:
      "Hydrating serum with triple-weight hyaluronic acid. (Sample data)",
    category: "serums",
    sku: "DMV-SRM-30H",
    titleFa: "حجم ۳۰ میلی‌لیتر",
    titleEn: "30 ml",
    priceMinor: 3_450_000,
  },
  {
    slug: "ethereal-night-serum",
    nameFa: "سرم شب بازسازنده اتیریال",
    nameEn: "Ethereal Night Serum",
    descriptionFa:
      "سرم شب با پپتید و نیاسینامید برای بازسازی پوست. (داده نمونه)",
    descriptionEn:
      "Night serum with peptides and niacinamide for skin renewal. (Sample data)",
    category: "serums",
    sku: "DMV-SRM-30N",
    titleFa: "حجم ۳۰ میلی‌لیتر",
    titleEn: "30 ml",
    priceMinor: 4_250_000,
  },
  {
    slug: "ethereal-barrier-moisturizer",
    nameFa: "کرم مرطوب‌کننده بازساز سد دفاعی اتیریال",
    nameEn: "Ethereal Barrier Moisturizer",
    descriptionFa:
      "کرم روزانه با سرامید و اسکوالان برای تقویت سد دفاعی پوست. (داده نمونه)",
    descriptionEn:
      "Daily cream with ceramides and squalane to support the skin barrier. (Sample data)",
    category: "moisturizers",
    sku: "DMV-MST-50",
    titleFa: "حجم ۵۰ میلی‌لیتر",
    titleEn: "50 ml",
    priceMinor: 3_150_000,
  },
  {
    slug: "ethereal-gel-moisturizer",
    nameFa: "ژل آبرسان اتیریال",
    nameEn: "Ethereal Gel Moisturizer",
    descriptionFa:
      "ژل سبک فاقد چربی مناسب پوست چرب و مختلط. (داده نمونه)",
    descriptionEn:
      "Lightweight oil-free gel for oily and combination skin. (Sample data)",
    category: "moisturizers",
    sku: "DMV-MST-G50",
    titleFa: "حجم ۵۰ میلی‌لیتر",
    titleEn: "50 ml",
    priceMinor: 2_850_000,
  },
  {
    slug: "ethereal-sunscreen-spf50",
    nameFa: "ضدآفتاب SPF50 اتیریال",
    nameEn: "Ethereal Sunscreen SPF50",
    descriptionFa:
      "ضدآفتاب مات فاقد چربی با SPF50 و فیلترهای پهن‌طیف. (داده نمونه)",
    descriptionEn:
      "Matte oil-free SPF50 sunscreen with broad-spectrum filters. (Sample data)",
    category: "sunscreens",
    sku: "DMV-SUN-50",
    titleFa: "حجم ۵۰ میلی‌لیتر",
    titleEn: "50 ml",
    priceMinor: 3_650_000,
  },
];

async function main() {
  console.log("Seeding SAMPLE data (isSample=true)…");

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameFa: c.nameFa, nameEn: c.nameEn },
      create: c,
    });
  }

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        nameFa: p.nameFa,
        nameEn: p.nameEn,
        descriptionFa: p.descriptionFa,
        descriptionEn: p.descriptionEn,
        status: ProductStatus.ACTIVE,
        isSample: true,
        categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: p.category } })).id,
      },
    });

    await prisma.productVariant.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        productId: product.id,
        titleFa: p.titleFa,
        titleEn: p.titleEn,
        priceMinor: p.priceMinor,
        currency: "IRR",
        isDefault: true,
        status: ProductStatus.ACTIVE,
      },
    });

    // P5-lite: sample stock (25 on hand) + INITIAL ledger row. Idempotent.
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { sku: p.sku } });
    const inventory = await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { variantId: variant.id, onHand: 25, reserved: 0 },
    });
    const initial = await prisma.inventoryLedger.findFirst({
      where: { variantId: variant.id, reason: "INITIAL" },
    });
    if (!initial) {
      await prisma.inventoryLedger.create({
        data: {
          variantId: variant.id,
          deltaOnHand: inventory.onHand,
          deltaReserved: 0,
          reason: "INITIAL",
          refType: "seed",
          refId: "sample-stock",
        },
      });
    }
  }

  console.log(`Seed complete: ${categories.length} categories, ${products.length} sample products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
