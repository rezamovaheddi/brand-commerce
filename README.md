# Brand Commerce Platform — DERMAVIA

اکوسیستم تجاری برند DERMAVIA: فروشگاه B2C، API ماژولار، PIM اولیه و حاکمیت داده نمونه.
این مخزن **اولین تحویل عمودی (First Delivery)** است: یک جریان واقعی از Database → API → UI.

## معماری (خلاصه)

- **Modular Monolith** (ADR-0001، هم‌راستا با ADR-001 منبع): NestJS API + Next.js Storefront
- **npm workspaces** روی ویندوز/OneDrive (ADR-0002 — رد pnpm+turbo به‌دلیل symlink و پین‌های حدسی starter kit)
- **PostgreSQL + Prisma** — مالکیت اسکیما: `packages/database`
- **Contracts**: zod schemas مشترک (`packages/contracts`) — قرارداد API ⇄ Storefront
- Design tokens از DERMAVIA ETHEREAL V6 (پالت تجاری `--dv-*`) — ADR-0003

## ساختار

```
apps/api          NestJS 11 — /api/v1 (health, products, categories) + Swagger /docs
apps/storefront   Next.js 15 — fa / RTL، Home، PLP، PDP
packages/contracts   zod schemas + types مشترک
packages/database    Prisma schema + migration + seed (داده نمونه isSample=true)
packages/config      tsconfig مشترک
docs/                audit / execution / governance / adr (فارسی)
```

## اجرا (Local)

پیش‌نیاز: Node ≥ 20. برای دیتابیس: Docker Desktop (یا PostgreSQL محلی روی 5432).

```bash
npm install
npm run prisma:generate
docker compose up -d                 # postgres + redis
npm run prisma:migrate -w @bc/database   # یا: npx prisma migrate dev
npm run prisma:seed
npm run api:dev      # ترمینال ۱ → http://localhost:3001/api/v1/health
npm run web:dev      # ترمینال ۲ → http://localhost:3000
npm run verify       # build + tests
```

## داده نمونه و مرزهای صداقت

- تمام محصولات seed با `isSample=true` هستند و در UI با نشان «داده نمونه» نمایش داده می‌شوند (ADR-0004).
- پرداخت، سبد خرید و لویالتی **عمداً غیرفعال** هستند (فازهای P2/P3) — هیچ جریان خرید شبیه‌سازی‌شده‌ای «موفق» جلوه داده نمی‌شود.
- تصمیمات تجاری باز (ارز، قیمت‌گذاری، درگاه پرداخت، بازار) در `docs/governance/PENDING_BUSINESS_DECISIONS.fa.md` ثبت‌اند.

## مستندات

- [ممیزی پایه](docs/audit/BASELINE_AUDIT.fa.md) · [Gap Register](docs/audit/GAP_REGISTER.csv)
- [تصمیمات باز تجاری](docs/governance/PENDING_BUSINESS_DECISIONS.fa.md)
- [نقشه اجرا P0..P8](docs/execution/MASTER_EXECUTION_PLAN.fa.md) · [Log تصمیمات](docs/execution/DECISION_LOG.md)
