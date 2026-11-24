---
name: architecture-review
description: بررسی مرزبندی دامنه، coupling، persistence، integration، failure mode و ADR. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# بازبینی معماری

## Mission
Deliver a traceable, evidence-based result for the بازبینی معماری domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for architecture proposals, major dependency changes, module boundaries or system redesign.
## Required workflow
1. Map bounded contexts and data ownership.
2. Check whether proposed modules create multiple sources of truth.
3. Evaluate sync/async boundaries, transactional consistency, failure modes and retry semantics.
4. Review tenant boundaries, permissions, PII, threat model and auditability.
5. Compare at least two viable options with operational cost, licensing, team skill and migration risk.
6. Record decision, consequences, rollback path and PoC acceptance criteria in ADR.
## Output
Context/container diagrams, module map, ADR, trade-off matrix and PoC list.
## Guardrails
Prefer modular monolith until scale/team boundaries justify microservices; do not adopt technology for trendiness.

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
