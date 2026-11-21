# ADR-0002 — npm workspaces روی ویندوز

وضعیت: ACCEPTED | تاریخ: 2026-11-21 | مالک: Agent 03/12
مرجع سورس: پین‌های starter kit در سورس A (_sources/brand-platform/) — Node>=26.13.1، TS ~6.0.3، postgres:18.7 (speculative)

## Context

- محیط واقعی: ویندوز + مسیر پروژه زیر OneDrive؛ Node v22.23.3 (شواهد چرخه اول).
- پین‌های نسخه starter kit سورس A با محیط واقعی ناسازگارند (نسخه‌های آینده‌نگر/غیرواقعی) — در BASELINE_AUDIT.fa.md به‌عنوان DEPRECATED ثبت شده‌اند.

## Decision

- npm workspaces (بدون pnpm/turbo)؛ engines هم‌راستا با Node 22؛ TypeScript نسخه پایدار.

## Alternatives considered

- pnpm + turbo: رد شد — ریسک symlink/junction زیر همگام‌سازی OneDrive؛ وابستگی به پین‌های unverified.
- yarn workspaces: رد شد — مزیت مشخصی نسبت به npm در این مقیاس ندارد.

## Consequences

- نصب کندتر از pnpm اما بدون ریسک symlink.
- node_modules زیر مسیر OneDrive قرار می‌گیرد؛ باید از همگام‌سازی مؤثر خارج تلقی شود (اقلام عملیاتی، بررسی در چرخه بعد).
- هر پین نسخه جدید باید با شواهد محیط تأیید شود؛ پین‌های speculative سورس A منسوخ هستند (DEC-002).
