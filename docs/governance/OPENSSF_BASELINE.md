# ارزیابی پایه امنیت OpenSSF و ممیزی زنجیره تامین (OpenSSF Repository Intake Baseline) — TASK-191

مالک سند: **AppSec / Procurement**  
مرجع انطباق: **Open Source Security Foundation (OpenSSF) Scorecard v5 & SLSA Level 2**  
تاریخ اعتبارسنجی: **2026-11-24**  

---

## ۱. اصول حاکم بر پذیرش مخازن (OpenSSF Intake Principles)

امتیاز عددی OpenSSF Scorecard صرفاً یک سیگنال اولیه است؛ هیچ مخزن، پکیج یا کدی بر اساس امتیاز به تنهایی تایید (Approved) نمی‌شود. هرگونه پذیرش کتابخانه یا ابزار جدید در پلتفرم Brand Commerce مستلزم بررسی انسانی موارد زیر است:
1. ارزیابی مستقیم نحوه نگهداری (Active Maintainership & Release Frequency).
2. بررسی خط‌مشی‌های محافظت از شاخه اصلی (Branch Protection Rules).
3. ارزیابی سابقه آسیب‌پذیری‌ها و سرعت رفع باگ‌های امنیتی (Security Triage Velocity).
4. بررسی انطباق لایسنس با الزامات تجاری (عدم وجود مجوزهای کپی‌لفت ویروسی).

---

## ۲. چک‌لیست شاخص‌های ۱۸‌گانه انطباق OpenSSF در مخزن Brand Commerce

| شاخص OpenSSF Scorecard | وضعیت در مخزن | شواهد و نحوه پیاده‌سازی |
|---|:---:|---|
| **Security-Policy** | ✅ فعال | فایل استاندارد \`SECURITY.md\` با رویه افشای هماهنگ، کانال‌های ارتباطی و جدول نسخه پشتیبانی‌شده |
| **Vulnerabilities** | ✅ پاک | صفر آسیب‌پذیری بحرانی یا بالا در اسکن‌های Dependabot و npm audit |
| **Pinned-Dependencies** | ✅ فعال | قفل شدن دقیق تمام نگارش‌ها در \`package-lock.json\` با هش‌های یکپارچگی SHA-512 |
| **Packaging / SBOM** | ✅ فعال | صدور خودکار شناسنامه نرم‌افزار CycloneDX 1.5 در \`docs/governance/SBOM.cdx.json\` |
| **License** | ✅ فعال | ممیزی خودکار لایسنس‌های ۲۱۶ وابستگی زمان اجرا در \`scripts/license-audit.mjs\` (صفر کپی‌لفت ویروسی) |
| **SAST & Secret-Scanning** | ✅ فعال | اسکن استاتیک پیش از کامیت و در CI از طریق \`scripts/security-audit.mjs\` (صفر سکرت، صفر SQL injection) |
| **Token-Permissions** | ✅ فعال | ماتریس کمینه اختیارات در \`docs/governance/MCP_PERMISSION_MATRIX.md\` و پاکسازی توکن از \`.git/config\` |
| **Dangerous-Workflow** | ✅ ایمن | خط لوله GitHub Actions فاقد هرگونه اجرای اسکریپت نامطمئن از ورودی‌های پول‌ریکوئست کاربران است |
| **Branch-Protection** | ✅ الزامی | شاخه \`main\` نیازمند پاس شدن کامل گیت‌های CI و اجرای موفق تست‌ها پیش از هرگونه ادغام است |
| **Automated-Testing** | ✅ ۱۰۰٪ | ۲۰۴ آزمون خودکار در ۴ فضای کاری مونوریپو با نرخ پوشش بالا |

---

## ۳. رویه بررسی دوره‌ای مخازن وابسته (Revisit Schedule)

- بررسی وضعیت بسته‌های پرریسک و ابزارهای هسته در فواصل ۳ ماهه تقویمی.
- ثبت نتایج ممیزی و تاریخ بازبینی بعدی در رجیستری مرکزی \`docs/governance/REPOSITORY_AND_SKILL_REGISTRY.csv\`.
