# ADR-0001 — معماری Modular Monolith

وضعیت: ACCEPTED | تاریخ: 2026-11-21 | مالک: Agent 03/12
مرجع سورس: _sources/brand-platform/adr/ — سند ADR-001 (Accepted-for-MVP)

## Context

- سورس A معماری modular monolith را برای MVP تصویب کرده است؛ ماژول‌های دامنه‌ای مطابق 162 نیازمندی ثبت‌شده.
- تیم کوچک، یک هدف استقرار، بدون شواهد نیاز به مقیاس‌پذیری مستقل سرویس‌ها.
- الگوهای مرجع سورس A: ADR-005 (Outbox)، ADR-006 (Money/ledgers) — سازگار با مونولیت ماژولار.

## Decision

- معماری modular monolith داخل مونوریپو npm workspaces؛ مرز ماژول‌ها با NestJS modules و قراردادهای zod اعمال می‌شود.
- packages/contracts تنها کانال اشتراک تایپ بین apps/api و apps/storefront.

## Alternatives considered

- Microservices: رد شد — بدون شواهد نیاز؛ هزینه عملیاتی و توزیع‌شدگی بی‌دلیل در فاز MVP.
- Serverless per-function: رد شد — cold start و vendor lock با نیازهای ledger/پرداخت ناسازگار است.

## Consequences

- واحد استقرار واحد؛ سرعت توسعه بالا.
- انضباط مرز ماژول‌ها باید با lint/تست حفظ شود.
- مسیر مهاجرت به سرویس‌ها در آینده باز می‌ماند (ADR-005 سورس A الگوی Outbox مرجع).
