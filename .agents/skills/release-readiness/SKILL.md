---
name: release-readiness
description: CI, migrations, backups, feature flags, rollback, smoke tests and go/no-go. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# آمادگی انتشار

## Mission
Deliver a traceable, evidence-based result for the آمادگی انتشار domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use before staging/production deployments or data migrations.
## Required workflow
Verify code freeze/commit, CI, dependency/license/security reports, migration safety, backups, rollback/forward-fix, feature flags, secrets, monitoring, support/runbook, smoke tests and approver list. Use go/no-go decision with evidence.
## Output
Release checklist, deployment sequence, rollback plan, smoke results and known limitations.
## Guardrails
Never deploy, push or alter production without explicit permission; no completion claim without verified deployment result.

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
