# آمادگی انتشار — وضعیت گیت P0 — 2026-11-21

جمع‌بندی: **NOT READY**. عبور از گیت P0 نیازمند رفع بلاکرهای فنی زیر است.

## عبورکرده (passes)

| آیتم | شواهد |
|---|---|
| ریپو git | commit 1948c73 |
| مونوریپو workspaces | npm install موفق روی Node v22.23.3 |
| قالب env | .env.example موجود در workspace |
| قرارداد سلامت | اسکیمای health در packages/contracts (as code) |

## بلاکرها

| آیتم | GAP | توضیح |
|---|---|---|
| DB runtime | GAP-001 | Docker نصب نیست؛ PostgreSQL بومی هم نیست |
| migration | GAP-002 | prisma migrate اجرا نشده |
| CI | GAP-003 | فایل workflow وجود ندارد |
| شواهد build/test | T-002..T-006 | در انتظار اجرای Orchestrator (TEST_EVIDENCE_INDEX.md) |
| پذیرش لایسنس | DEPENDENCY_MAP.md | گیت P0 طبق سیاست سورس A — pending |

## چک‌لیست معیار عبور گیت P0

- [x] ریپو baseline + workspaces
- [x] قالب env
- [ ] DB runtime + migration + seed واقعی
- [ ] CI سبز
- [ ] شواهد build/test ثبت‌شده در TEST_EVIDENCE_INDEX.md
- [ ] پذیرش لایسنس‌ها ثبت‌شده

گیت P1 (قراردادها / سلامت سرویس) فقط پس از عبور P0 ارزیابی می‌شود.
