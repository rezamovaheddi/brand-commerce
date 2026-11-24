---
name: b2b-commerce-rfq
description: Organization membership، approval، price lists، MOQ، quote revisions و order conversion. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# پیاده‌سازی B2B و RFQ

## Mission
Deliver a traceable, evidence-based result for the پیاده‌سازی B2B و RFQ domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for distributor/clinic/business registration, wholesale price, credit, MOQ, RFQ or quote.
## Required workflow
1. Model organization, membership, role, verification status and buyer contact.
2. Add approval and document review with audit trail.
3. Resolve price list/contract by customer, channel, region, currency, quantity and effective date.
4. Enforce MOQ, pack size, quantity tiers, tax and credit hold server-side.
5. Version RFQ/Quote; accepted quote converts atomically/idempotently to an order.
6. Add internal sales queue, clarification and SLA tracking.
## Output
Workflow, data model, permissions matrix, API schema and integration tests.
## Guardrails
No wholesale eligibility by client-side flag; no quote edit after acceptance; no AI authority over credit or price exceptions.

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
