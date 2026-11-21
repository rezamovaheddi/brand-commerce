# ADR-0003 — استراتژی انتقال توکن طراحی

وضعیت: ACCEPTED | تاریخ: 2026-11-21 | مالک: Agent 03/12
مرجع سورس: سورس B (_sources/dermavia/) — heritage-v5.css، catalog-pages.css، docs/blueprint/dermavia-v6.tokens.json

## Context

- سه سیستم توکن واگرا در سورس B:
  1) heritage-v5.css — cosmic navy (#0c132b…#253463) + ramp طلایی #855e1c (میراث برند).
  2) catalog-pages.css — پالت تجاری --dv-*: ink #231a15، navy #172343، gold #6f4a14، cream #f6f1e8، paper #fffdf8.
  3) docs/blueprint/dermavia-v6.tokens.json — DTCG canonical: #1E2B4D، #DFC286، success #146C43، error #B42318.
- فایل DTCG 106 توکن دارد در برابر 71 متغیر CSS — parity تأیید نشده.

## Decision

- پایه v0 storefront: پالت --dv-* (تجاری و متصل به صفحات کاتالوگ واقعی پروتوتایپ).
- هدف نهایی: DTCG canonical؛ تسک parity خودکار در P2 (GAP-006).
- heritage-v5 به‌عنوان مرجع برندینگ نگه‌داری می‌شود، وارد storefront نمی‌شود.

## Alternatives considered

- مهاجرت فوری به DTCG: رد شد — big-bang بدون ابزار parity و بدون تأیید بصری.
- پذیرش heritage-v5: رد شد — پالت میراثی نه تجاری؛ واگرا با صفحات کاتالوگ.

## Consequences

- نگاشت موقت دوگانه (--dv-* ↔ DTCG) تا تکمیل parity (DEC-003).
- ریسک drift بصری تا بسته شدن GAP-006؛ checker باید در CI باشد.
