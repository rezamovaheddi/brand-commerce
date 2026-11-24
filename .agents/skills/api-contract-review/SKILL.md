---
name: api-contract-review
description: OpenAPI, schemas, errors, versioning, authz, pagination and idempotency. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# بازبینی قرارداد API

## Mission
Deliver a traceable, evidence-based result for the بازبینی قرارداد API domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for public/internal API changes and partner integrations.
## Required workflow
Review route/method, versioning, authn/authz, tenant scope, input schema, pagination, rate limits, idempotency, errors, event contract, backward compatibility and OpenAPI. Check whether client can influence server-authoritative amount/status/permissions.
## Output
OpenAPI/contract diff, compatibility notes, test cases and changelog.
## Guardrails
Do not silently change meaning of existing response fields; never expose internal stack traces or secrets.

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
