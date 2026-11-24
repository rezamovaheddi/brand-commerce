---
name: nestjs-domain-module
description: تولید module/use case/policy/repository/API با مرزبندی و تست. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# ساخت ماژول دامنه NestJS

## Mission
Deliver a traceable, evidence-based result for the ساخت ماژول دامنه NestJS domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use when adding a backend bounded context or use case in NestJS.
## Required workflow
1. Confirm domain boundary and owning module.
2. Define command/query, DTO/schema, policy and domain invariant.
3. Keep controller thin; use application service/use case.
4. Use repository abstraction and database transaction for multi-aggregate consistency.
5. Emit domain/integration event through transactional outbox when side effects cross boundaries.
6. Add authorization and tenant checks in backend, not only UI guards.
7. Add unit/integration/API contract tests and OpenAPI update.
## Output
Module structure, API contract, tests, migration and event docs.
## Guardrails
Do not call PSP/SMTP/shipping synchronously inside DB transaction; do not place business rules in controller.

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
