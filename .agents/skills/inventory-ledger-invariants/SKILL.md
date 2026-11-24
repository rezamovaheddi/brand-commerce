---
name: inventory-ledger-invariants
description: Append-only movements، reservations، lot/expiry، valuation، reconciliation. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# قواعد موجودی و دفترکل

## Mission
Deliver a traceable, evidence-based result for the قواعد موجودی و دفترکل domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for SKU inventory, reservations, returns, goods receipt, transfer, lot/expiry or stock adjustments.
## Required workflow
Keep append-only movement entries. Separate available/reserved/quarantine/damaged/in-transit buckets. Use transactional reserve/release/consume operations with locking/version checks. Reference source documents and idempotency keys. Support lot/expiry and recall traceability where product requires. Build balance projections and reconciliation.
## Output
Movement taxonomy, stock invariants, transactional write path, projection rebuild and race tests.
## Guardrails
Never directly overwrite stock quantity without an audited adjustment; never allow stale cart to oversell silently.

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
