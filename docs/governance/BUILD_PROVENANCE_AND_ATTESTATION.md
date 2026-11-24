# اصالت ساخت و گواهی یکپارچگی آرتیفکت‌ها (Build Provenance & Artifact Attestation) — TASK-192

مالک سند: **DevSecOps / Security**  
مرجع انطباق: **SLSA (Supply-chain Levels for Software Artifacts) Level 2 & OpenSSF Attestations**  
تاریخ اعتبارسنجی: **2026-11-24**  

---

## ۱. هدف و فلسفه اصالت ساخت (Provenance Objectives)

اصالت ساخت (Build Provenance) تضمین می‌کند که هر آرتیفکت منتشره در چرخه انتشار پلتفرم Brand Commerce:
1. منحصراً از کد منبع تاییدشده و هش معتبر گیت (`HEAD Commit SHA`) تولید شده است.
2. توسط خط لوله CI کنترل‌شده و محیط کانتینری ایزوله کامپایل و امضا شده است.
3. در طول فرآیند جابجایی یا استقرار دستکاری، آلوده یا دچار رگرسیون نشده است.

---

## ۲. آرتیفکت‌های حیاتی تحت پوشش مانیفست

هش‌های رمزنگاری‌شده SHA-256 در فایل استاندارد [`docs/governance/PROVENANCE_MANIFEST.sha256`](file:///c:/Users/talas/OneDrive/Desktop/new_dragon_shop/brand-commerce/docs/governance/PROVENANCE_MANIFEST.sha256) ذخیره می‌شوند:

| نام آرتیفکت | مسیر فایل | نقش در سیستم | الگوریتم صحت |
|---|---|---|:---:|
| **OpenAPI 3.0 Document** | `apps/api/openapi.json` | مشخصات رسمی قراردادهای وب‌سرویس REST | SHA-256 |
| **CycloneDX SBOM** | `docs/governance/SBOM.cdx.json` | شناسنامه کامل ۶۹۶ قطعه نرم‌افزاری و وابستگی‌ها | SHA-256 |
| **Architecture Graph Data** | `graphify-out/graph.json` | توپولوژی و وابستگی‌های ۴۱۳ گره سیستم | SHA-256 |
| **Database Schema** | `packages/database/prisma/schema.prisma` | قرارداد تغییرناپذیر مدل‌های داده‌ای هسته | SHA-256 |
| **Design Tokens** | `tokens/brand.tokens.json` | ۱۰۶ توکن دیزاین سیستم Warm Clinical Luxury | SHA-256 |

---

## ۳. دستورات اجرایی و تایید صحت

- **تولید مانیفست جدید:**
  ```bash
  node scripts/verify-provenance.mjs
  ```
- **بررسی صحت مانیفست در استقرار یا بیلد پروداکشن:**
  ```bash
  node scripts/verify-provenance.mjs --check
  ```
- **معیار پذیرش (Acceptance Criteria):** هرگونه تغییر در بایت‌های فایل‌های فوق بدون به‌روزرسانی معتبر مانیفست و کامیت گیت، بلافاصله منجر به Fail شدن خط لوله (`Exit 1`) می‌گردد.
