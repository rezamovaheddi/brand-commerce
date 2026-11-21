# فهرست شواهد تست (TEST_EVIDENCE_INDEX) — 2026-11-21

مالک پر کردن: Orchestrator (بعد از اجرای Verification).
قواعد: ورود STATUS=VERIFIED فقط با خروجی واقعی؛ بلاکرها با BLOCKED_BY_TECHNICAL_DEPENDENCY ثبت می‌شوند، نه skip پنهان.

| TEST_ID | محدوده | فرمان مرجع | نتیجه مورد انتظار | نتیجه واقعی | وضعیت | مسیر شواهد | تاریخ |
|---|---|---|---|---|---|---|---|
| T-001 | نصب وابستگی‌ها | npm install | exit 0 | اجرای اول FAILED (ERESOLVE: @nestjs/swagger@8 peer فقط 9/10) → پین swagger@^11.4.8 → اجرای دوم exit 0 با 645 پکیج روی Node v22.23.3 | VERIFIED | install.log در ریشه مخزن | 2026-11-21 |
| T-002 | build apps/api | npm run build -w @bc/api | exit 0 | nest build exit 0 (دو بار: قبل و بعد از اصلاح resilient boot) | VERIFIED | خروجی ترمینال، API_BUILD_EXIT=0 | 2026-11-21 |
| T-003 | build apps/storefront | npm run build -w @bc/storefront | exit 0 | next build exit 0؛ در prerender، fetch ناموفق API بدون کرش مدیریت شد (مسیر خطای طراحی‌شده) | VERIFIED | خروجی ترمینال، WEB_BUILD_EXIT=0 | 2026-11-21 |
| T-004 | تست packages/contracts | npm test -w @bc/contracts | pass | `jest --passWithNoTests` → No tests found, exit 0 — suite هنوز نوشته نشده (فقط ساختار) | PARTIALLY_IMPLEMENTED | خروجی npm run test | 2026-11-21 |
| T-005 | lint ریشه | npm run lint | pass | اجرا نشد — پیکربندی lint هنوز وجود ندارد | NOT_STARTED | — | 2026-11-21 |
| T-006 | smoke health + اعتبارسنجی + Swagger | curl /api/v1/health … | 200 + shape قرارداد | `{"status":"degraded","uptime":…,"database":"down"}` HTTP=200 (بدون DB)؛ products بدون DB → 500 تمیز با شکل ApiError؛ limit=999 → 400 `["limit: Number must be less than or equal to 50"]`؛ /docs → 200 | VERIFIED | خروجی curl در گزارش چرخه؛ سرور روی پورت 3001 اجرا شد | 2026-11-21 |
| T-007 | prisma migrate dev | npm run prisma:migrate | migration applied | بلاک: بدون DB runtime (Docker نصب نیست، PostgreSQL محلی هم نیست) | BLOCKED_BY_TECHNICAL_DEPENDENCY | GAP-001 | 2026-11-21 |
| T-008 | اجرای seed روی DB واقعی | npm run prisma:seed | 8 محصول + 4 دسته با isSample=true | بلاک: بدون DB runtime | BLOCKED_BY_TECHNICAL_DEPENDENCY | GAP-001 | 2026-11-21 |
| T-009 | contract tests | npm test (contract suite) | pass | (در انتظار ایجاد suite) | NOT_STARTED | — | 2026-11-21 |
| T-010 | e2e مرورگر (Playwright) | npm run e2e | pass روی stack اجرا‌شده | (در انتظار ایجاد suite) | NOT_STARTED | — | 2026-11-21 |
| T-011 | تست‌های unit API | npm run test -w @bc/api | pass | Test Suites: 2 passed — Tests: **14 passed** (mapper + service) | VERIFIED | خروجی jest، TEST_EXIT=0 | 2026-11-21 |
| T-012 | تست‌های e2e API (بدون DB) | npm run test:e2e -w @bc/api | pass | Test Suites: 2 passed — Tests: **8 passed** (health/validations/404/category) | VERIFIED | خروجی jest، E2E_EXIT=0 | 2026-11-21 |
| T-013 | integration واقعی با DB (API+Prisma+Postgres) | test/db-products.e2e-spec.ts | pass روی DB واقعی | صادقانه skip شد: `[SKIP] DATABASE unreachable — integration test pending infrastructure (Docker unavailable on this machine)` | BLOCKED_BY_TECHNICAL_DEPENDENCY | خروجی jest e2e | 2026-11-21 |
| T-014 | Runtime Storefront (حالت degraded) | npx next start -p 3000 | 200 + RTL/fa + حالت صادقانه | Home: HTTP=200، `dir="rtl"` و `lang="fa"` تأیید شد، متن هیرو و برند موجود؛ PLP: 200 با پیام صادقانه «سرویس محصولات در دسترس نیست»؛ مسیر ناموجود PDP → صفحه خطای صادقانه (API پایین است، تمایز 404 واقعی نیازمند DB) | VERIFIED | docs/evidence/storefront-home.png + خروجی curl | 2026-11-21 |

یادداشت: جمع شواهد فعلی — 22 تست پاس (14 unit + 8 e2e)، دو build موفق، دو سرور اجرا و با curl/اسکرین‌شات تأیید شدند. جریان کامل Database→API→UI تا رفع GAP-001 (نصب Docker یا فراهم‌کردن PostgreSQL) قابل اجرای کامل نیست و به‌صورت صادقانه بلاک ثبت شده است.
