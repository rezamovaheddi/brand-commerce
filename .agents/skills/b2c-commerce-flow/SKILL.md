---
name: b2c-commerce-flow
description: Catalog/cart/checkout/order/returns و تست end-to-end. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# پیاده‌سازی جریان B2C

## Mission
Deliver a traceable, evidence-based result for the پیاده‌سازی جریان B2C domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for consumer product discovery, cart, checkout, orders, returns or repeat purchase.
## Required workflow
Cover anonymous and signed-in states, market/currency, availability, promotions, shipping, taxes, payment authorization/capture, duplicate click/retry, abandoned checkout, cancel, return and refund. Keep final price and stock reservation server-authoritative. Snapshot item names, SKU, price, tax and terms on order line.
## Output
State machine, endpoints/events, UX states, idempotency policy and B2C E2E tests.
## Guardrails
Do not trust browser totals or client-provided price/discount/stock.

## Repository context to read first
- `README_FA.md` and the relevant `docs/` specifications.
- Relevant ADR and ownership boundaries.
- Current implementation, tests and lockfile; code is the current implementation truth.
- Never assume planned documents reflect what has already shipped.

## Handoff format
- Objective and scope.
- Files/modules changed or inspected.
- Decisions and assumptions.
- Tests/checks run with exact result.
- Unverified items, risks and follow-up.
