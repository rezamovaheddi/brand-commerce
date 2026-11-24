# سنجه‌های کیفیت مهندسی و ارزیابی عامل (Agent Quality & Engineering Metrics) — TASK-198

تاریخ به‌روزرسانی: **2026-11-24**  
شاخه فعال: \`main\`  
محیط CI: **GitHub Actions Workflow (\`rezamovaheddi/brand-commerce\`)**  

---

## ۱. پیشرفت سنجه‌های آزمون خودکار (Automated Test Growth)

| مرحله اجرایی | تعداد تست‌ها | سوئیت‌ها | نرخ موفقیت | نرخ رگرسیون |
|---|---:|---:|---:|---:|
| **Baseline (P0/P1)** | ۱۴ | ۱ | ۱۰۰٪ | ۰٪ |
| **Foundation & Pure Domain** | ۳۸ | ۲ | ۱۰۰٪ | ۰٪ |
| **API Core & Unit Tests** | ۲۰ | ۲ | ۱۰۰٪ | ۰٪ |
| **Database Integration & E2E (P2..P6)** | ۱۲۳ | ۱۲ | ۱۰۰٪ | ۰٪ |
| **Customer Portal & Observability** | ۱۹۵ | ۱۷ | ۱۰۰٪ | ۰٪ |
| **Features, OpenFeature & A11y Gate (v2.2)** | **۲۰۴** | **۱۸** | **۱۰۰٪** | **۰٪** |

---

## ۲. گیت‌های کیفی هشت‌گانه خط لوله یکپارچه (\`npm run verify\`)

کلیه گیت‌های زیر پیش از هر کامیت و در محیط GitHub Actions اجرا و تایید می‌شوند:

1. **Code Quality & Linting (\`npm run lint\`):** صفر خطای ESLint در سراسر مونوریپو.
2. **DTCG Design Tokens (\`npm run tokens:validate\`):** اعتبارسنجی ۱۰۶ توکن دیزاین سیستم کانونیکال بر اساس استاندارد DTCG 2025.10.
3. **WCAG 2.1 Contrast Gate (\`npm run contrast:check\`):** ۱۷/۱۷ آزمون کنتراست رنگ AA و AAA پاس شده.
4. **Automated Accessibility Audit (\`npm run a11y:audit\`):** اسکن کامل ۴۲ کامپوننت فرانت‌اند برای جهت‌گیری راست‌به‌چپ، برچسب‌های فیلدها و ابعاد لمسی ۴۴ پیکسلی.
5. **ASVS 5.0 Security Audit (\`npm run security:audit\`):** اسکن ۱۱۹ فایل کد؛ صفر نشت رمز یا کلید، صفر تزریق SQL، رعایت سخت‌گیرانه مقادیر صحیح ارزی بدون اعشار.
6. **Supply Chain License Audit (\`npm run license:audit\`):** ارزیابی ۲۱۶ وابستگی زمان اجرای پروداکشن و تضمین عدم وجود لایسنس‌های کپی‌لفت ویروسی (GPL/AGPL).
7. **Monorepo Build (\`npm run build\`):** کامپایل تمیز و بدون خطای تایپ‌اسکریپت در هر ۴ فضای کاری (\`contracts\`، \`domain\`، \`api\`، \`storefront\`).
8. **Automated Test Suite (\`npm run test\`):** اجرای بدون نقص تمامی ۲۰۴ آزمون واحد، قرارداد، دامین و E2E یکپارچه با پایگاه داده.

---

## ۳. سنجه‌های کارایی و پایداری بار (Performance & Load SLA)

طبق گزارش \`docs/evidence/LOAD_TEST_REPORT.md\`:
- **Throughput:** ~۱۴۰ درخواست در ثانیه روی سخت‌افزار استاندارد.
- **p95 Latency:** کمتر از ۸۰ میلی‌ثانیه (آستانه مجاز SLA: ۲۵۰ میلی‌ثانیه).
- **Error Rate:** ۰.۰۰٪ تحت بار هم‌زمان ۲۰ کاربر هم‌زمان.
