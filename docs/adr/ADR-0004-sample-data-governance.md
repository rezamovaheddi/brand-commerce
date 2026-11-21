# ADR-0004 — حکمرانی داده نمونه (Sample Data Governance)

وضعیت: ACCEPTED | تاریخ: 2026-11-21 | مالک: Agent 03/12
مرجع سورس: سورس B (_sources/dermavia/) — fixtureهای «sample, awaiting approval»؛ فهرست NEEDS_APPROVAL در IMPLEMENTATION-NOTES

## Context

- هیچ قیمت/SKU/ادعای بالینی تأییدشده‌ای وجود ندارد.
- قاعده چرخه اول: «هیچ مقدار نمونه‌ای به‌عنوان واقعی نمایش داده نمی‌شود».

## Decision

- فلگ isSample در لایه داده (seed فعلی: 8 محصول + 4 دسته، isSample=true).
- کامپوننت SampleBadge در UI برای هر رکورد sample.
- گارد seed تولیدی: اجرای seed تولیدی بدون override صریح (env) باید fail کند.
- قیمت‌ها در IRR minor units ذخیره می‌شوند؛ نمایش وابسته به DEC-005 / CUR-01.

## Alternatives considered

- بدون فلگ: رد شد — نقض مستقیم قاعده صداقت.
- فقط gating با env در بک‌اند: رد شد — UI هم باید صادق باشد؛ کاربر نباید داده نمونه را واقعی ببیند.

## Consequences

- داده نمونه قابل مشاهده اما برچسب‌خورده است.
- گارد باید پس از دسترسی به DB تست شود (GAP-002).
- هر آیتم NEEDS_APPROVAL سورس B به docs/governance/PENDING_BUSINESS_DECISIONS.fa.md نگاشت شد (DEC-004).
