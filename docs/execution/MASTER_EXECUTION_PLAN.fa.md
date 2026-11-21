# برنامه اجرایی جامع (Master Execution Plan) — 2026-11-21

مرجع گیت‌ها: سورس A → _sources/brand-platform/07-roadmap/roadmap-and-phase-gates-fa.md و _sources/brand-platform/07-roadmap/01-execution-backlog.csv (198 تسک + 9 گیت، همگی «Planned»).

## 1. نگاشت فازها به گیت‌های سورس A

| فاز | گیت مرجع | محدوده | وضعیت فعلی |
|---|---|---|---|
| P0 | GATE-P0 | baseline ریپو، پذیرش لایسنس، محیط | IN_PROGRESS |
| P1 | GATE-P1 | قراردادها، مدل داده، سلامت سرویس | IN_PROGRESS |
| P2 | GATE-P2 | storefront v0، توکن parity، cart/checkout UI | NOT_STARTED |
| P3 | GATE-P3 | payment sandbox adapter، حمل‌ونقل، scaffolding claims | NOT_STARTED |
| P4 | GATE-P4 | B2B | NOT_STARTED |
| P5 | GATE-P5 | ERP-lite | NOT_STARTED |
| P6 | GATE-P6 | CRM/Loyalty | NOT_STARTED |
| P7 | GATE-P7 | Safety/Claims کامل | NOT_STARTED |
| P8 | GATE-P8 | عملیات، انتشار، runbook | NOT_STARTED |

## 2. چرخه اول در برابر معیارهای گیت P0/P1

| معیار گیت | وضعیت | شواهد |
|---|---|---|
| ریپو و مونوریپو workspaces | تامین شده (VERIFIED) | commit 1948c73؛ npm install موفق روی Node v22.23.3 |
| قالب env | تامین شده | .env.example در workspace |
| قرارداد سلامت (health contract) | تامین شده (as code) | packages/contracts + کنترلر سلامت |
| اجرای build/test همه پکیج‌ها | در انتظار | Orchestrator بعد از این سند؛ ثبت در TEST_EVIDENCE_INDEX.md |
| پذیرش رسمی لایسنس‌ها | pending | گیت P0 طبق سیاست سورس A؛ فهرست اولیه در DEPENDENCY_MAP.md |
| DB runtime + migration | بلاک | Docker نصب نیست (GAP-001/GAP-002) |
| CI | بلاک | GAP-003 |

## 3. سه اسپرینت بعدی

| اسپرینت | تمرکز | تسک‌های مرجع |
|---|---|---|
| اسپرینت ۱ — شکستن بلاکرهای فنی | Docker/DB، مایگریشن، اجرای build/test، ثبت شواهد | S-009، S-010، S-005..S-007 |
| اسپرینت ۲ — کیفیت و اتوماسیون | CI، OpenAPI، contract tests، logging، secrets | S-011..S-013، S-017، S-018 |
| اسپرینت ۳ — محصول v0 | cart/checkout UI با sample-marking، صفحه توکن‌ها، parity checker، e2e مرورگر | S-014..S-016 |

## 4. قواعد اجرا

- هیچ تسکی بدون شواهد DONE نمی‌شود؛ وضعیت‌ها صادقانه ثبت می‌شوند.
- بلاکرهای بیزینسی به docs/governance/PENDING_BUSINESS_DECISIONS.fa.md ارجاع می‌شوند.
- گیت‌ها فقط با معیارهای سورس A باز می‌شوند؛ وضعیت گیت‌ها در این سند به‌روزرسانی می‌شود.
