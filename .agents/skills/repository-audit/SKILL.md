---
name: repository-audit
description: بررسی ساختار واقعی، نسخه‌ها، تست‌ها، CI، امنیت، بدهی فنی و شواهد؛ بدون ادعای بررسی فایل ندیده. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# ممیزی ریپازیتوری

## Mission
Deliver a traceable, evidence-based result for the ممیزی ریپازیتوری domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use before modifying an unfamiliar or consequential repository. Do not claim an audit when only README/search snippets were seen.
## Required workflow
1. Record remote, branch, commit SHA, worktree status and current runtime.
2. Inventory apps/packages/routes/schema/migrations/tests/CI/deployment/secrets references.
3. Run baseline install, lint, typecheck, unit, integration, build where safe; record exact commands and results.
4. Inspect authz boundaries, tenant scoping, webhook handling, transaction/idempotency, RLS and PII logs.
5. Trace representative journeys from UI to persistence and integrations.
6. Identify dead code, duplicate domain logic, stale dependencies and license obligations.
7. Produce evidence-linked findings with severity, impact and remediation.
## Output
Audit summary, inventory, baseline table, security findings, reuse/adapt/rewrite matrix and next actions.
## Guardrails
Never expose secrets; do not modify production or push commits unless explicitly authorized.

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
