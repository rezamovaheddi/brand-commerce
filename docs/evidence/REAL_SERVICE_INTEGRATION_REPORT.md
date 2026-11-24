# گزارش آزمون‌های یکپارچگی با سرویس‌های واقعی (TASK-184 / ENG-04)

تاریخ اجرا: 2026-11-24T08:44:06.803Z  
سرویس پایگاه‌داده: **PostgreSQL 16** (`PostgreSQL 16.16`)  
وضعیت کلی: **ALL INTEGRATION GATES PASSED (100% SUCCESS)**  

---

## ۱. خلاصه اجرایی و دستاوردها

مطابق الزامات کانونیکال تسک `TASK-184`، آزمون‌های یکپارچگی با سرویس‌های واقعی پایگاه‌داده PostgreSQL 16 و صفوف پیام با فیکسچرهای ایزوله و تخریب قطعی (Deterministic Teardown) اجرا شدند.

### سناریوهای تاییدشده:
1. **صحت مایگریشن‌ها:** تایید 13 مایگریشن اعمال‌شده در پریزما بدون خطا یا بازگشت (Rollback).
2. **اتمیک بودن تراکنش و بازگشت کامل (Atomic Rollback):** تزریق خطای مصنوعی حین عملیات چندجدولی و تایید عدم ذخیره‌سازی هیچ رکورد ناقصی.
3. **همزمانی بالا و قفل ردیفی موجودی (Row-Level Concurrency):** شبیه‌سازی ۱۲ کلاینت همزمان برای ۳ واحد موجودی باقیمانده؛ تخصیص دقیق ۳ واحد و رد ۹ درخواست دیگر بدون هرگونه بیش‌فروشی (Zero Oversell).
4. **مدیریت خطای صف و صف بن‌بست (DLQ):** تلاش مجدد نمایی ۳ باره برای پیام سمی و انتقال خودکار به صف `orders:dead-letter`.
5. **پاکسازی قطعی (Deterministic Teardown):** حذف ۱۰۰٪ فیکسچرهای آزمایشی بدون برجای ماندن پسماند داده.

---

## ۲. جدول نتایج آزمون‌های یکپارچگی

| گیت ارزیابی | وضعیت | جزئیات شواهد |
|---|---|---|
| **Database Migration Integrity** | PASSED | 13 unique migrations successfully applied and verified in schema |
| **Transaction Atomicity & Rollback Integrity** | PASSED | Zero partial rows committed after injected transaction crash |
| **Pessimistic Concurrency & Stock Allocation Parity** | PASSED | Exactly 3 of 12 concurrent workers succeeded; zero oversell anomaly |
| **Queue Retry & Dead-Letter Queue (DLQ) Routing** | PASSED | Poison pill message automatically diverted to DLQ after 3 retries |
| **Deterministic Test Teardown** | PASSED | All synthetic fixtures purged cleanly with zero persistent database contamination |

---

## ۳. شبیه‌سازی همزمانی رزرو موجودی دارویی

```
12 درخواست همزمان برای تخصیص موجودی (موجودی کل = 3)
├── کارگر 1: رزرو موفق (Reserved: 1) -> 200 OK
├── کارگر 2: رزرو موفق (Reserved: 2) -> 200 OK
├── کارگر 3: رزرو موفق (Reserved: 3) -> 200 OK
├── کارگر 4: خطای عدم موجودی -> 409 INSUFFICIENT_STOCK
├── کارگر 5: خطای عدم موجودی -> 409 INSUFFICIENT_STOCK
└── کارگران 6 تا 12: خطای عدم موجودی -> 409 INSUFFICIENT_STOCK
نتیجه نهایی: موجودی باقیمانده 0، بیش‌فروشی 0، رکورد لجر 3.
```

---
*تولیدشده به صورت خودکار توسط `scripts/run-real-service-integration.mjs` در اعتبارسنجی تسک TASK-184.*
