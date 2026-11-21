# نقشه وابستگی‌ها (Dependency Map) — 2026-11-21

مالک: Agent 03/12 | مبنای نسخه‌ها: workspace چرخه اول + قراردادهای اعلان‌شده.
پذیرش رسمی لایسنس (license intake) طبق سیاست سورس A در گیت P0 است — تا این لحظه pending؛ این جدول فقط فهرست اولیه است.

## 1. وابستگی‌های Runtime

| بسته | بازه نسخه | لایسنس | هدف | اپ مالک |
|---|---|---|---|---|
| NestJS (@nestjs/*) | 11 | MIT | چارچوب بک‌اند و DI | apps/api |
| next | 15 | MIT | فریم‌ورک فرانت‌اند | apps/storefront |
| react / react-dom | 19 | MIT | رندر UI | apps/storefront |
| prisma + @prisma/client | 6 | Apache-2.0 | ORM، migration، typed client | packages/database (مصرف: apps/api) |
| zod | stable | MIT | قراردادها و اعتبارسنجی | packages/contracts (مصرف: هر دو اپ) |
| helmet | stable | MIT | هدرهای امنیتی HTTP | apps/api |
| class-validator + class-transformer | stable | MIT | اعتبارسنجی/تبدیل DTO | apps/api |
| Vazirmatn (فونت) | — | OFL | تایپوگرافی فارسی | apps/storefront |

ملاحظه Vazirmatn: در سورس B فونت از طریق Google Fonts CDN بارگذاری می‌شود؛ OFL اجازه self-host می‌دهد — برای انتشار باید self-host شود تا وابستگی شبکه CDN حذف شود.

## 2. وابستگی‌های Dev-only (build/test)

| بسته | لایسنس | هدف |
|---|---|---|
| tsx | MIT | اجرای TS در اسکریپت‌ها/seed |
| jest + ts-jest | MIT | تست واحد |
| supertest | MIT | تست انتگراسیون HTTP |

## 3. نمودار وابستگی workspaces

```
brand-commerce (npm workspaces)
├── apps/api ........................ NestJS 11
│   ├── packages/contracts .......... zod
│   ├── packages/database ........... Prisma 6
│   └── packages/config
├── apps/storefront ................. Next.js 15 + React 19
│   ├── packages/contracts .......... zod
│   └── packages/config
└── packages/config ................. مشترک (بدون وابستگی داخلی)
```

## 4. وابستگی‌های زیرساختی خارج از npm

| سرویس | نسخه | وضعیت |
|---|---|---|
| PostgreSQL | 16-alpine (docker-compose.yml) | اعلام‌شده؛ اجرا نشده — GAP-001 |
| Redis | 7-alpine (docker-compose.yml) | اعلام‌شده؛ اجرا نشده — GAP-001 |

## 5. ملاحظات لایسنس

- هیچ بسته GPL/AGPL در فهرست بالا نیست؛ همه MIT / Apache-2.0 / OFL.
- پذیرش رسمی لایسنس‌ها در گیت P0 طبق سیاست سورس A — pending؛ وضعیت در RELEASE_READINESS.md منعکس شده است.
