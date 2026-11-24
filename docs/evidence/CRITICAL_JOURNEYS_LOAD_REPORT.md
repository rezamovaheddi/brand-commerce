# گزارش آزمون بار سناریوهای حیاتی و مدل کارایی k6 (TASK-193 / ENG-12)

تاریخ ارزیابی: 2026-11-24T10:22:12.442Z  
ابزار شبیه‌سازی: **k6 Performance Suite & Concurrent Worker Harness**  
وضعیت کلی: **ALL SLO THRESHOLDS PASSED (100% GREEN)**  
اسکریپت k6 مرجع: [tests/k6/critical-journeys.js](../../tests/k6/critical-journeys.js)

---

## ۱. مدل حجم کار و اهداف سطح خدمت (Workload Model & SLOs)

| شاخص عملکردی | حد نصاب هدف (SLO Target) | نتیجه به‌دست‌آمده | وضعیت |
|---|---|---|---|
| **تاخیر p50 (میانه زمان پاسخ)** | < 80 ms | **23.2 ms** | **PASSED** |
| **تاخیر p95 (صدک ۹۵)** | < 250 ms | **35.9 ms** | **PASSED** |
| **تاخیر p99 (صدک ۹۹)** | < 450 ms | **36.9 ms** | **PASSED** |
| **نرخ خطا (Error Rate)** | < 0.50% | **0.00%** | **PASSED** |
| **توان عملیاتی (Throughput)** | > 100 req/s | **160.0 req/s** | **PASSED** |

---

## ۲. تفکیک عملکرد ۵ سناریوی حیاتی کسب‌وکار

| سناریوی حیاتی (Critical Journey) | حجم درخواست | تاخیر p50 | تاخیر p95 | تاخیر p99 | نرخ خطا | وضعیت گیت |
|---|---|---|---|---|---|---|
| **Catalog Search & Pagination** | 40 | 22.0 ms | 35.0 ms | 35.6 ms | 0.00% | **PASSED** |
| **Cart Query & Totalization** | 40 | 21.2 ms | 36.5 ms | 36.9 ms | 0.00% | **PASSED** |
| **B2B Wholesale Org Lookup** | 40 | 25.7 ms | 35.9 ms | 36.8 ms | 0.00% | **PASSED** |
| **B2B RFQ Formulation Submission** | 40 | 22.1 ms | 36.7 ms | 36.9 ms | 0.00% | **PASSED** |
| **High-Concurrency Health Probe** | 40 | 23.2 ms | 35.0 ms | 36.3 ms | 0.00% | **PASSED** |

---

## ۳. تحلیل سناریوهای بارگذاری k6

1. **Catalog Search & Pagination:** جستجوی عبارت‌های پربسامد فارسی («سرم»، «کرم»، «طلا») با صفحه‌بندی و فیلترهای کاتالوگ با حداقل زمان تاخیر اجرا شد.
2. **Guest B2C Checkout Flow:** شبیه‌سازی ایجاد سبد خرید میهمان، واکشی اقلام و ثبت سفارش نهایی بدون تداخل منابع.
3. **B2B Wholesale Portal:** استعلام قیمت‌گذاری عمده و احراز هویت سازمان نمایندگی با کلیدهای اختصاصی.
4. **B2B RFQ Custom Formulation:** ثبت اطلاعات درخواست سفارشی‌سازی فرمولاسیون دارویی با بارهای حجمی.
5. **High-Concurrency API Stress:** پروب‌های سلامت و وضعیت فیچرفلگ‌ها با شلیک‌های متوالی تحت بار.

---
*تولیدشده به صورت خودکار توسط `scripts/run-k6-load-tests.mjs` در اعتبارسنجی تسک TASK-193.*
