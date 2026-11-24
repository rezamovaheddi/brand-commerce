---
name: e2e-quality-gates
description: Test matrix، fixtures، state setup، accessibility، screenshots و flaky-test controls. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# دروازه کیفیت E2E

## Mission
Deliver a traceable, evidence-based result for the دروازه کیفیت E2E domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use when validating critical end-user/business flows and release readiness.
## Required workflow
Build role/market/device matrix. Cover B2C purchase, B2B approval/quote/order, custom RFQ, CMS publish, payment webhook, inventory reservation, refund/loyalty reversal and admin permission denial. Use deterministic fixtures, stable selectors, network isolation, trace artifacts and visual checks. Track flakiness separately.
## Output
Test matrix, Playwright suites, failure reproduction, artifacts and CI thresholds.
## Guardrails
Do not use production customer accounts or real payment methods in CI.

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
