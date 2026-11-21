# خط پایه لینت (Lint Baseline) — 2026-11-21

این سند وضعیت ابزار لینت مونوریپو Brand Commerce را ثبت می‌کند تا اجرای `npm run lint` (که بعد از این چرخه توسط Orchestrator اجرا می‌شود) قابل تفسیر باشد.

## 1. چه چیزی اضافه شد

- فایل `eslint.config.mjs` در ریشهٔ مونوریپو ایجاد شد — پیکربندی Flat Config مخصوص ESLint 9 به‌صورت ESM.
- پکیج‌های مورد نیاز از قبل در ریشه نصب بودند: `eslint@^9` ، `@eslint/js@^9` ، `typescript-eslint@^8` (نسخهٔ نصب‌شدهٔ فعلی: eslint 9.39.5 و typescript-eslint 8.73.0).
- اسکریپت ریشه از قبل وجود داشت: `lint = eslint .` (بدون تغییر در package.json).

## 2. قواعد فعال (Rules)

| لایه | محدوده | محتوا |
|---|---|---|
| پایه | همهٔ فایل‌ها | `@eslint/js` recommended + گلوبال‌های inline (Node: `process`، `console` / مرورگر: `window`، `document`، `localStorage`، `navigator`) |
| تایپ‌اسکریپت | `**/*.ts` ، `**/*.tsx` | typescript-eslint recommended — بدون type-aware (بدون projectService؛ برای سرعت لینت؛ بررسی تایپ با کامپایلر TS و تست‌ها پوشش داده می‌شود) |
| سخت‌گیری | `**/*.ts` ، `**/*.tsx` | `@typescript-eslint/no-explicit-any: error` (استفاده از `any` ممنوع) و `@typescript-eslint/no-unused-vars: error` با الگوی صرف‌نظر `^_` برای آرگومان‌ها و متغیرهای عمداً بلااستفاده (مثل پارامتر متادیتای pipe در NestJS) |
| فرانت | `apps/storefront/**` | فعال‌سازی `ecmaFeatures.jsx` برای پارس TSX در App Router فهرست فروشگاه |

نکته: پلاگین React نصب نشده و typescript-eslint قاعدهٔ `react/react-in-jsx-scope` را منتشر نمی‌کند؛ بنابراین هیچ غیرفعال‌سازی React لازم نبود. قاعدهٔ `no-empty-pattern` هم دست‌نخورده روی حالت پیش‌فرض ماند.

## 3. مسیرهای صرف‌نظرشده (Ignores)

`node_modules` ، `dist` ، `.next` ، `build` ، `coverage` ، `*.config.js` ، `jest.config.js` ، `packages/database/prisma/**` (فایل seed عمداً از `console.log` استفاده می‌کند) ، `packages/config/**` (فقط JSON) ، `.mimosa` ، `install.log` و `**/next-env.d.ts`.

دلیل استثنای `next-env.d.ts`: این فایل توسط Next.js تولید می‌شود و دستور `/// <reference path=...>` دارد که قاعدهٔ `@typescript-eslint/triple-slash-reference` (پیش‌فرض `path: never`) آن را خطا می‌گیرد؛ چون فایل تولیدی است و نباید ویرایش شود، از لینت کنار گذاشته شد.

## 4. هشدارهای پذیرفته‌شده (Known Accepted Warnings)

- **هشدار deprecation برای eslint@9.39.5**: npm نسخه‌های 9.x را به دلیل وجود ESLint 10 «deprecated/unsupported» گزارش می‌کند. ارتقا به ESLint 10 در این چرخه به‌عیند انداخته شد تا تمرکز روی گیت‌های P0/P1 بماند. ارجاع: **GAP-035** (ثبت آن در GAP_REGISTER.csv با Orchestrator است؛ این سند فقط ارجاع می‌دهد).
- **فقدان قواعد type-aware**: قواعدی مثل `no-floating-promises` فعال نیستند (به دلیل حذف projectService برای سرعت). جبران این حفره با `npm run build` (tsc strict) و تست‌ها انجام می‌شود.
- **`console.error` در storefront** عمداً نگه داشته شده (`lib/api.ts` و صفحات خطا) — لاگ صادقانهٔ خطاها؛ قاعدهٔ `no-console` فعال نیست.

## 5. نحوهٔ اجرا

- فقط لینت: `npm run lint` (از ریشهٔ مونوریپو).
- چرخهٔ کامل اعتبارسنجی: `npm run verify` = `lint` سپس `build` سپس `test`.

هدف این چرخه: صفر خطا / صفر هشدار از خود ESLint در تمام مسیرهای لینت‌شده.
