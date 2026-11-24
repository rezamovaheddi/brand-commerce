---
name: postgres-data-integrity
description: RLS، tenant scoping، transaction، lock، idempotency و ledger invariants. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# یکپارچگی داده PostgreSQL

## Mission
Deliver a traceable, evidence-based result for the یکپارچگی داده PostgreSQL domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for PostgreSQL transaction, RLS, ledger, concurrency or multi-tenant data changes.
## Required workflow
1. Define tenant scope and policy for service role, admin role and background worker.
2. Check RLS bypass settings and connection pool context leakage.
3. Define isolation/locking strategy for stock, credit, wallet and referral consumption.
4. Add unique idempotency keys and immutable entries for ledgers.
5. Test race conditions with parallel requests and separate DB connections.
6. Add reconciliation query for projections and ledger source.
## Output
Policy SQL, transaction design, concurrency tests and recovery instructions.
## Guardrails
RLS is defense-in-depth, not a replacement for authorization; avoid long locks and tenant context bleed.

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
