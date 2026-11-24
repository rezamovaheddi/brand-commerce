import {
  ProductContentModelSchema,
  InciIngredientSchema,
  ProductOriginSchema,
  type ProductContentModel,
} from "./content-governance";

describe("PIM & Regulatory Content Governance Schema (TASK-113)", () => {
  const validModel: ProductContentModel = {
    productId: "prd-ethereal-gold",
    sku: "DMV-GLD-50ML",
    locale: "fa-IR",
    source: "REGULATORY_DOSSIER",
    version: "1.2.0",
    approvalState: "APPROVED",
    approvedBy: "Dr. Maryam Tehrani (Chief Toxicologist)",
    approvedAt: "2026-11-20T10:00:00.000Z",
    ingredients: [
      {
        inciName: "Aqua (Water)",
        persianName: "آب دیونیزه خالص",
        casNumber: "7732-18-5",
        concentrationTier: "BAND_A_OVER_50",
        purposeFa: "حلال پایه دارویی و رطوبت‌رسان",
        ewgRating: 1,
        isAllergen: false,
      },
      {
        inciName: "Niacinamide",
        persianName: "نیاسینامید دارویی",
        casNumber: "98-92-0",
        concentrationTier: "BAND_C_1_TO_10",
        purposeFa: "روشن‌کننده و تقویت‌کننده سد دفاعی پوست",
        ewgRating: 1,
        isAllergen: false,
      },
      {
        inciName: "Colloidal Gold",
        persianName: "نانوذرات طلای کلوئیدی ۲۴ عیار",
        casNumber: "7440-57-5",
        concentrationTier: "BAND_D_UNDER_1",
        purposeFa: "آنتی‌اکسیدان قوی و محرک بازسازی کلاژن",
        ewgRating: 2,
        isAllergen: false,
      },
    ],
    warnings: [
      {
        warningType: "PRECAUTION",
        severity: "MILD",
        textFa: "فقط برای استعمال خارجی. از تماس مستقیم با چشم خودداری فرمایید.",
        textEn: "For external use only. Avoid direct contact with eyes.",
      },
      {
        warningType: "SUN_EXPOSURE",
        severity: "MODERATE",
        textFa: "در طول مصرف روزانه استفاده از ضدآفتاب با SPF حداقل ۳۰ توصیه می‌شود.",
        textEn: "Daily application of SPF 30+ sunscreen is advised during use.",
      },
    ],
    usage: [
      {
        stepNumber: 1,
        instructionFa: "پوست را با شوینده ملایم تمیز و با حوله نرم خشک کنید.",
        instructionEn: "Cleanse skin with gentle cleanser and pat dry.",
        timeOfDay: "BOTH",
        dosageUnits: "۱ پمپ شوینده",
      },
      {
        stepNumber: 2,
        instructionFa: "۲ تا ۳ قطره از سرم را روی صورت و گردن ماساژ دهید.",
        instructionEn: "Massage 2-3 drops of serum gently over face and neck.",
        timeOfDay: "EVENING",
        dosageUnits: "۲ الی ۳ قطره",
      },
    ],
    origin: {
      countryCode: "IR",
      manufacturingFacility: "Dermavia Cleanroom Complex Alpha-1",
      iso22716Certification: "ISO-22716-GMP-2024-9988",
      batchCoaHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  };

  it("validates compliant regulatory product content model", () => {
    const parsed = ProductContentModelSchema.parse(validModel);
    expect(parsed.sku).toBe("DMV-GLD-50ML");
    expect(parsed.approvalState).toBe("APPROVED");
    expect(parsed.ingredients).toHaveLength(3);
    expect(parsed.origin.countryCode).toBe("IR");
  });

  it("rejects invalid CAS registry number format", () => {
    const invalidIngredient = {
      inciName: "Fake Chemical",
      persianName: "ماده ساختگی",
      casNumber: "INVALID-CAS-123",
      concentrationTier: "BAND_D_UNDER_1",
      purposeFa: "تست خطا",
      ewgRating: 5,
      isAllergen: false,
    };
    expect(() => InciIngredientSchema.parse(invalidIngredient)).toThrow(
      /Invalid CAS registry format/
    );
  });

  it("rejects non-semver version strings", () => {
    const invalidVersionModel = {
      ...validModel,
      version: "v1_beta_2",
    };
    expect(() => ProductContentModelSchema.parse(invalidVersionModel)).toThrow(
      /Version must follow SemVer format/
    );
  });

  it("rejects non-SHA256 batch CoA hash", () => {
    const invalidOrigin = {
      countryCode: "IR",
      manufacturingFacility: "Dermavia Facility",
      iso22716Certification: "ISO-22716",
      batchCoaHash: "short-hash-not-64-hex",
    };
    expect(() => ProductOriginSchema.parse(invalidOrigin)).toThrow(
      /Must be a 64-character SHA-256 hex digest/
    );
  });
});
