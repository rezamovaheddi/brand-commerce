# ممیزی پایه (Baseline Audit) — چرخه اول

تاریخ: 2026-11-21 | نگارنده: Agent 03/12 (Documentation & Governance) | وضعیت: نسخه پایه پیش از اجرای Verification توسط Orchestrator

## 1. خلاصه مدیریتی

| محور | وضعیت |
|---|---|
| زیرساخت کد | مونوریپو npm workspaces ساخته شد؛ npm install موفق روی Node v22.23.3؛ commit 1948c73 |
| اجرای build/test | در انتظار Orchestrator (بعد از این سند) — همه اقلام کد = IMPLEMENTED_NOT_VERIFIED |
| بلاکر اصلی فنی | Docker نصب نیست و PostgreSQL بومی هم نیست ⇒ compose فقط اعلام‌شده؛ مایگریشن/تست انتگراسیون متوقف |
| بلاکر اصلی بیزینسی | 18 تصمیم OPEN در سورس A (بازار، برند D-02، پرداخت D-08، ارز، مالیات D-09 و…) |
| کیفیت سورس‌ها | سورس A بسته حاکمیتی است نه نرم‌افزار؛ سورس B پروتوتایپ استاتیک با تناقض‌های مستند |
| قاعده طلایی | هیچ ادعای VERIFIED بدون شواهد ثبت‌شده؛ هیچ مقدار نمونه‌ای به‌عنوان واقعی نمایش داده نمی‌شود |

## 2. وضعیت منابع

| منبع | مسیر استخراج | نوع | یافته کلیدی |
|---|---|---|---|
| A | _sources/brand-platform/ | بسته حاکمیتی (governance package)، نه نرم‌افزار | 162 نیازمندی؛ 198 تسک + 9 گیت GATE-P0..P8 همگی «Planned»؛ 35 ADR (فقط 4 Accepted: ADR-001، 005، 006، 008)؛ 42 تصمیم D-01..D-42 با 18 OPEN؛ 46 skill + 60 کیس ارزیابی سینتتیک بدون اجرای واقعی |
| B | _sources/dermavia/ | پروتوتایپ استاتیک ۹ صفحه‌ای (HTML/CSS/JS) | RTL-first fa؛ فونت Vazirmatn؛ ۳ سیستم توکن واگرا؛ داده محصول ۲× hardcoded؛ پرداخت قفل (paymentLocked)؛ ۱۱ اسکریپت تست Python |
| C | workspace فعلی brand-commerce (این ریپو) | کد چرخه اول | مونوریپو (2 اپ + 3 پکیج)، seed نمونه، docker-compose اعلام‌شده، commit 1948c73 |

## 3. جدول وضعیت قابلیت‌ها

واژگان مجاز: VERIFIED / IMPLEMENTED_NOT_VERIFIED / PARTIALLY_IMPLEMENTED / DOCUMENTED_ONLY / MISSING / CONFLICTING / BLOCKED_BY_BUSINESS / BLOCKED_BY_TECHNICAL_DEPENDENCY / DEPRECATED

| قابلیت | وضعیت | شواهد / منبع |
|---|---|---|
| سکوی مونوریپو و نصب وابستگی‌ها | VERIFIED | npm install موفق روی Node v22.23.3؛ commit 1948c73 |
| قراردادهای zod (packages/contracts) | VERIFIED | کد موجود و قابل import (as code) |
| RTL-first فارسی | VERIFIED | الگوی dir=rtl + logical properties منتقل از سورس B (as code) |
| API NestJS (apps/api) | IMPLEMENTED_NOT_VERIFIED | کد موجود؛ build در انتظار Orchestrator |
| Health endpoint | IMPLEMENTED_NOT_VERIFIED | کد موجود |
| ماژول Products | IMPLEMENTED_NOT_VERIFIED | کد موجود |
| Storefront (Next.js 15) | IMPLEMENTED_NOT_VERIFIED | کد موجود |
| اسکیمای Prisma | PARTIALLY_IMPLEMENTED | کد موجود؛ مایگریشن اجرا نشده (بدون DB) |
| توکن‌های طراحی | PARTIALLY_IMPLEMENTED | زیرمجموعه پالت --dv-* منتقل شده؛ parity کامل نیست |
| داده Seed | DOCUMENTED_ONLY | 8 محصول + 4 دسته با isSample=true؛ IRR minor units |
| docker-compose.yml | DOCUMENTED_ONLY | اعلام‌شده؛ هرگز اجرا نشده |
| تست‌های انتگراسیون DB | BLOCKED_BY_TECHNICAL_DEPENDENCY | بدون DB runtime (GAP-001/GAP-002) |
| CI | MISSING | فایل workflow وجود ندارد |
| Payment | MISSING | P3؛ هم‌راستا با الگوی paymentLocked سورس B |
| B2B | MISSING | P4 |
| ERP-lite | MISSING | P5 |
| CRM/Loyalty | MISSING | P6 |
| Safety/Claims | MISSING | P7 |
| ارزیابی Agent skills سورس A | DOCUMENTED_ONLY | 60 کیس سینتتیک؛ بدون اجرای واقعی |
| نام برند در نیازمندی‌های A1/A4 سورس A | CONFLICTING | ReeSkin/ReeMed در برابر D-02 «Dermavia» |
| پین‌های نسخه starter kit سورس A | DEPRECATED | Node>=26.13.1 / TS ~6.0.3 / postgres:18.7 — غیرواقعی برای این محیط |
| تصمیمات بیزینسی باز | BLOCKED_BY_BUSINESS | D-01، D-02، D-08..D-13، D-18، D-20 + ارز/فاکتور (سند governance) |

## 4. تناقضات مستند

| # | تناقض | منبع |
|---|---|---|
| 1 | فایل open-decisions فقط D-01..D-20 را فهرست می‌کند؛ CSV تصمیمات تا D-42 دارد (۱۸ OPEN) — stale | سورس A |
| 2 | نیازمندی‌های A1/A4 خطوط ReeSkin/ReeMed را hardcode کرده‌اند؛ D-02 عنوان کاری «Dermavia» را نیمه‌تصویب کرده | سورس A |
| 3 | سه سیستم توکن واگرا در یک پروتوتایپ: heritage-v5.css (cosmic navy #0c132b…#253463 + gold #855e1c)؛ catalog-pages.css (--dv-*: ink #231a15، navy #172343، gold #6f4a14، cream #f6f1e8، paper #fffdf8)؛ docs/blueprint/dermavia-v6.tokens.json (DTCG: #1E2B4D، #DFC286، success #146C43، error #B42318) | سورس B |
| 4 | فایل DTCG 106 توکن دارد در برابر 71 متغیر CSS — parity تأیید نشده | سورس B |
| 5 | داده محصول دو بار hardcoded: js/app.js و js/catalog-data.js | سورس B |
| 6 | ادعای مستندات «33/33 smoke» در برابر تست‌هایی که هرگز HTML واقعی را load نمی‌کنند | سورس B |

## 5. مغایرت‌های نسخه starter kit

| پین starter kit | مقدار | واقعیت محیط / اقدام چرخه اول |
|---|---|---|
| Node | >=26.13.1 (speculative) | Node v22.23.3 — پین‌ها نادیده گرفته شد (DEC-002 / ADR-0002) |
| TypeScript | ~6.0.3 (speculative) | نسخه پایدار سازگار با Node 22 |
| PostgreSQL | postgres:18.7 (تصویر docker) | postgres:16-alpine در compose ما |

نتیجه: starter kit سورس A از نظر نسخه‌ها DEPRECATED تلقی می‌شود؛ مبنای ما نسخه‌های پایدار موجود در محیط است.

## 6. وضعیت تست‌های DERMAVIA (سورس B)

- ۱۱ اسکریپت Python: تست‌های ساختاری استاتیک + E2E آفلاین Playwright با harness تزریقی.
- پوشش رفتاری واقعی دارد اما هرگز HTML واقعی را load نمی‌کند ⇒ نتایج آن شواهد E2E واقعی نیست.
- ادعای «33/33 smoke» در مستندات سورس B صرفاً DOCUMENTED_ONLY ثبت می‌شود، نه VERIFIED.
- پیامد: تست E2E واقعی مرورگر در backlog است (GAP-008)؛ تست‌های سورس B منبع ایده هستند، نه شواهد.

## 7. فهرست شواهد موجود تا این لحظه

1. npm install موفق روی Node v22.23.3 (شواهد چرخه اول، Orchestrator).
2. ریپو git با commit 1948c73.
3. ساختار مونوریپو: apps/api، apps/storefront، packages/contracts، packages/database، packages/config.
4. docker-compose.yml (postgres:16-alpine، redis:7-alpine) — فقط اعلام‌شده.
5. اسکیمای Prisma: Category/Product/ProductVariant.
6. Seed: 8 محصول نمونه + 4 دسته، isSample=true، IRR minor units.
7. فایل‌های سورس A/B با مسیرهای بخش ۲.
8. سند حاضر + GAP_REGISTER.csv + IMPLEMENTATION_STATUS.csv + DEPENDENCY_MAP.md (خروجی همین چرخه).
