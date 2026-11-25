export interface CatalogProduct {
  id: string;
  slug: string;
  sku: string;
  brand: string;
  brandKey: string;
  title: string;
  price: number;
  oldPrice?: number;
  currency: string;
  category: "face" | "sunscreen" | "serums" | "cleansers";
  categoryFa: string;
  skinTypes: ("oily" | "dry" | "combination" | "sensitive")[];
  specialFeatures: ("organic" | "vegan" | "cruelty_free")[];
  badge?: {
    text: string;
    type: "new" | "discount";
  };
  image: string;
  hasWishlist?: boolean;
  hasShare?: boolean;
  isNew?: boolean;
  popularity: number;
}

export const CATALOG_CATEGORIES = [
  { id: "face", nameFa: "مراقبت صورت", count: 124 },
  { id: "sunscreen", nameFa: "ضد آفتاب", count: 48 },
  { id: "serums", nameFa: "سرم و لایه‌بردار", count: 86 },
  { id: "cleansers", nameFa: "پاک‌کننده آرایش", count: 32 },
] as const;

export const CATALOG_BRANDS = [
  { id: "laroche", nameFa: "لاروش پوزای" },
  { id: "vichy", nameFa: "ویشی" },
  { id: "bioderma", nameFa: "بایودرما" },
  { id: "ordinary", nameFa: "اوردینری" },
  { id: "cerave", nameFa: "سراوی" },
  { id: "isdin", nameFa: "ایزدین" },
] as const;

export const SKIN_TYPES = [
  { id: "oily", nameFa: "پوست چرب" },
  { id: "dry", nameFa: "پوست خشک" },
  { id: "combination", nameFa: "پوست مختلط" },
  { id: "sensitive", nameFa: "پوست حساس" },
] as const;

export const SPECIAL_FEATURES = [
  { id: "organic", nameFa: "کاملاً ارگانیک" },
  { id: "vegan", nameFa: "وگان (گیاهی)" },
  { id: "cruelty_free", nameFa: "بدون تست حیوانی" },
] as const;

export const SORT_OPTIONS = [
  { id: "newest", label: "جدیدترین" },
  { id: "popular", label: "محبوب‌ترین" },
  { id: "cheapest", label: "ارزان‌ترین" },
  { id: "expensive", label: "گران‌ترین" },
] as const;

/**
 * 6 primary products directly from the Figma design screenshots + additional items
 * to simulate the 48-item catalog across multiple pages.
 */
export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "p-1",
    slug: "laroche-posay-anthelios-oil-control",
    sku: "LRP-ANT-50",
    brand: "برند لاروش پوزای",
    brandKey: "laroche",
    title: "کرم ضد آفتاب آنتلیوس کنترل چربی",
    price: 1850000,
    currency: "تومان",
    category: "sunscreen",
    categoryFa: "ضد آفتاب",
    skinTypes: ["oily", "combination"],
    specialFeatures: ["vegan", "cruelty_free"],
    badge: { text: "جدید", type: "new" },
    image: "/images/catalog/laroche_anthelios.jpeg",
    hasWishlist: true,
    hasShare: true,
    isNew: true,
    popularity: 98,
  },
  {
    id: "p-2",
    slug: "bioderma-sensibio-micellar-water",
    sku: "BIO-SEN-500",
    brand: "برند بایودرما",
    brandKey: "bioderma",
    title: "میسلارواتر پوست حساس مدل...",
    price: 940000,
    currency: "تومان",
    category: "cleansers",
    categoryFa: "پاک‌کننده آرایش",
    skinTypes: ["sensitive", "dry"],
    specialFeatures: ["organic", "cruelty_free"],
    image: "/images/catalog/bioderma_sensibio.jpeg",
    hasWishlist: true,
    popularity: 92,
  },
  {
    id: "p-3",
    slug: "vichy-mineral-89-serum",
    sku: "VIC-M89-50",
    brand: "برند ویشی",
    brandKey: "vichy",
    title: "سرم تقویت‌کننده و آبرسان ۸۹",
    price: 1080000,
    oldPrice: 1200000,
    currency: "تومان",
    category: "serums",
    categoryFa: "سرم و لایه‌بردار",
    skinTypes: ["dry", "combination", "sensitive"],
    specialFeatures: ["vegan", "cruelty_free"],
    badge: { text: "تخفیف ویژه", type: "discount" },
    image: "/images/catalog/vichy_placeholder.svg",
    popularity: 96,
  },
  {
    id: "p-4",
    slug: "ordinary-niacinamide-zinc",
    sku: "ORD-NIA-30",
    brand: "برند اوردینری",
    brandKey: "ordinary",
    title: "سرم نیاسینامید ۱۰٪ + روی ۱٪",
    price: 680000,
    currency: "تومان",
    category: "serums",
    categoryFa: "سرم و لایه‌بردار",
    skinTypes: ["oily", "combination"],
    specialFeatures: ["vegan", "cruelty_free"],
    image: "/images/catalog/ordinary_niacinamide.jpeg",
    popularity: 99,
  },
  {
    id: "p-5",
    slug: "cerave-pm-facial-lotion",
    sku: "CER-PM-52",
    brand: "برند سراوی",
    brandKey: "cerave",
    title: "لوسیون مرطوب‌کننده صورت PM",
    price: 1260000,
    currency: "تومان",
    category: "face",
    categoryFa: "مراقبت صورت",
    skinTypes: ["oily", "combination", "sensitive"],
    specialFeatures: ["cruelty_free"],
    image: "/images/catalog/cerave_pm_lotion.jpeg",
    popularity: 91,
  },
  {
    id: "p-6",
    slug: "isdin-fusion-water-spf50",
    sku: "ISD-FUS-50",
    brand: "برند ایزدین",
    brandKey: "isdin",
    title: "ضد آفتاب فیوژن واتر SPF 50",
    price: 1490000,
    currency: "تومان",
    category: "sunscreen",
    categoryFa: "ضد آفتاب",
    skinTypes: ["oily", "sensitive"],
    specialFeatures: ["organic", "vegan", "cruelty_free"],
    image: "/images/catalog/isdin_fusion_water.jpeg",
    popularity: 94,
  },
  // Additional products for pagination & full catalog richness (48 total)
  {
    id: "p-7",
    slug: "laroche-effaclar-purifying-gel",
    sku: "LRP-EFF-200",
    brand: "برند لاروش پوزای",
    brandKey: "laroche",
    title: "ژل شستشوی صورت افکلار تصفیه‌کننده",
    price: 1150000,
    currency: "تومان",
    category: "cleansers",
    categoryFa: "پاک‌کننده آرایش",
    skinTypes: ["oily"],
    specialFeatures: ["cruelty_free"],
    image: "/images/catalog/laroche_anthelios.jpeg",
    popularity: 88,
  },
  {
    id: "p-8",
    slug: "vichy-normaderm-phytosolution",
    sku: "VIC-NOR-50",
    brand: "برند ویشی",
    brandKey: "vichy",
    title: "کرم مرطوب‌کننده ضد جوش نورمادرم",
    price: 1380000,
    currency: "تومان",
    category: "face",
    categoryFa: "مراقبت صورت",
    skinTypes: ["oily", "combination"],
    specialFeatures: ["vegan"],
    image: "/images/catalog/cerave_pm_lotion.jpeg",
    popularity: 85,
  },
  {
    id: "p-9",
    slug: "bioderma-photoderm-max-spf50",
    sku: "BIO-PHO-40",
    brand: "برند بایودرما",
    brandKey: "bioderma",
    title: "کرم ضد آفتاب فتودرم مکس رنگی",
    price: 890000,
    oldPrice: 1050000,
    currency: "تومان",
    category: "sunscreen",
    categoryFa: "ضد آفتاب",
    skinTypes: ["dry", "sensitive"],
    specialFeatures: ["cruelty_free"],
    badge: { text: "تخفیف ویژه", type: "discount" },
    image: "/images/catalog/isdin_fusion_water.jpeg",
    popularity: 90,
  },
  {
    id: "p-10",
    slug: "ordinary-hyaluronic-acid-b5",
    sku: "ORD-HYA-30",
    brand: "برند اوردینری",
    brandKey: "ordinary",
    title: "سرم آبرسان هیالورونیک اسید ۲٪ + B5",
    price: 740000,
    currency: "تومان",
    category: "serums",
    categoryFa: "سرم و لایه‌بردار",
    skinTypes: ["dry", "sensitive", "combination"],
    specialFeatures: ["vegan", "cruelty_free", "organic"],
    badge: { text: "جدید", type: "new" },
    image: "/images/catalog/ordinary_niacinamide.jpeg",
    isNew: true,
    popularity: 97,
  },
  {
    id: "p-11",
    slug: "cerave-hydrating-cleanser",
    sku: "CER-HYD-236",
    brand: "برند سراوی",
    brandKey: "cerave",
    title: "پاک‌کننده ملایم آبرسان سراوی با ۳ سرامید",
    price: 980000,
    currency: "تومان",
    category: "cleansers",
    categoryFa: "پاک‌کننده آرایش",
    skinTypes: ["dry", "sensitive"],
    specialFeatures: ["cruelty_free"],
    image: "/images/catalog/bioderma_sensibio.jpeg",
    popularity: 89,
  },
  {
    id: "p-12",
    slug: "isdin-isdinceutics-flavo-c",
    sku: "ISD-FLV-30",
    brand: "برند ایزدین",
    brandKey: "isdin",
    title: "سرم ضد چروک فلاوو-سی با ویتامین C خالص",
    price: 2450000,
    currency: "تومان",
    category: "serums",
    categoryFa: "سرم و لایه‌بردار",
    skinTypes: ["dry", "combination"],
    specialFeatures: ["organic", "vegan"],
    image: "/images/catalog/ordinary_niacinamide.jpeg",
    popularity: 84,
  },
];
