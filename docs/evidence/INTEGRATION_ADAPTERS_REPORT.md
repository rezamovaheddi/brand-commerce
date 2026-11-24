# گزارش ممیزی قراردادها و آداپتورهای یکپارچه‌سازی (Integration Adapters Report)

- تاریخ ممیزی: **2026-11-24T09:07:54.993Z**
- استاندارد مرجع: **05-integrations/provider-capability-contracts-fa.md & provider-matrix.csv (TASK-185)**
- وضعیت کلی: **100% CERTIFIED (تأیید کامل تمامی ۷ آداپتور یکپارچه‌سازی)**
- تعداد کل آداپتورها: **۷ آداپتور کلیدی**

---

## ۱. جدول وضعیت آداپتورهای کانونیکال

| نام آداپتور | نوع قابلیت (Capability) | اینواریانت‌های اثبات‌شده | وضعیت | شواهد و نتایج آزمون |
|---|---|---|:---:|---|
| **PaymentAdapter** | `PAYMENT_GATEWAY` | Strict integer minor units (IRR), timing-safe HMAC verification, and zero client-directed status | **PASSED** | Intent created: int_ord_901, Authority: AUTH_1795511274991, HMAC verification: true |
| **ShippingAdapter** | `SHIPPING_CARRIER` | Cold-chain biological serum quarantine (+2°C to +8°C) and SLA quote calculation | **PASSED** | Cold-chain certified: true, Fee: 1127500 IRR, Temp compliant: true |
| **MessagingAdapter** | `MESSAGING_SMS` | Iranian mobile format verification (09xxxxxxxxx), rate limiting, and log PII masking | **PASSED** | Message ID: msg_1795511274992, Delivered: true, Logged phone: 0912***6789 |
| **TaxInvoiceAdapter** | `TAX_INVOICE` | Iranian National Tax Administration (سامانه مؤدیان) 22-character unique tax ID format and 10% VAT | **PASSED** | Tax Memory ID: A12B34C56D78E90F123456 (22 chars: true), Status: ACCEPTED, Total: 11000000 IRR |
| **AccountingExportAdapter** | `ACCOUNTING_EXPORT` | Zero-variance double-entry general ledger journal export (Debit == Credit) | **PASSED** | Balanced journal lines: true, Sum Debit: 2.5M IRR, Sum Credit: 2.5M IRR |
| **MediaSecurityAdapter** | `MEDIA_SECURITY` | Magic bytes MIME inspection, malware quarantine, and private signed URL storage isolation | **PASSED** | Valid PDF scan: CLEAN, Executable scan: QUARANTINED (application/x-dosexec) |
| **IdentityKycAdapter** | `IDENTITY_KYC` | Iranian national ID Modulo-11 checksum formula and Shahkar mobile ownership compliance | **PASSED** | Valid checksum accepted: true, Tampered checksum rejected: true |

---

## ۲. اصول مهندسی و الزامات یکپارچه‌سازی
1. **جداسازی دامنه از تامین‌کنندگان:** دامین اصلی هیچ وابستگی به SDK یا کدهای خطای اختصاصی تامین‌کنندگان ندارد و تمام ارتباطات از طریق قراردادهای انتزاعی کنترل می‌شوند.
2. **محاسبات مالی غیر اعشاری:** کلیه ارقام مالی در درگاه پرداخت، مالیات، فاکتور و لجرها منحصراً با واحدهای ریال عدد صحیح (minor units) مبادله می‌شوند.
3. **لجستیک زنجیره سرد:** پشتیبانی از نظارت دمایی محصولات بیولوژیک و پپتیدی در محدوده ۲ تا ۸ درجه سانتی‌گراد.
4. **انطباق رگولاتوری ایران:** فرمت ۲۲ رقمی شناسه یکتای حافظه مالیاتی (سامانه مؤدیان) و الگوریتم رسمی چک‌سام ماژول ۱۱ کدملی.
5. **امنیت چندرسانه‌ای و فایل:** بررسی بایت‌های جادویی هدر فایل‌ها جهت پیشگیری از حملات بارگذاری بدافزار و ایزولاسیون در باکت قرنطینه.

---

> [!NOTE]
> این گزارش به‌صورت خودکار توسط `scripts/verify-integration-adapters.mjs` در خط لوله کیفیت (`npm run verify`) و گیت‌هاب اکشنز اجرا و اعتبارسنجی می‌شود.
