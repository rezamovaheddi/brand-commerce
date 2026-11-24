---
name: database-schema-review
description: مدل‌سازی relational، constraints، indexes، NUMERIC، concurrency و migration safety. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# بازبینی Schema و Migration

## Mission
Deliver a traceable, evidence-based result for the بازبینی Schema و Migration domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for schema design, migration, query and ORM changes.
## Required workflow
Review normalization, ownership, tenant key, FK/delete policy, unique constraints, numeric precision, timestamps, status transitions, indexes, query plans and data retention. Migrations must be safe for large tables and old/new app overlap. Test from empty and previous schema.
## Output
ERD notes, migration risk, index rationale, sample SQL/query plan and rollback/forward-fix.
## Guardrails
Never use floating point for money; never rewrite an applied migration; do not rely on application validation alone for critical invariants.

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
