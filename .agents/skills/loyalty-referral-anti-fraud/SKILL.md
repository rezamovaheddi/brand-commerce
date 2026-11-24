---
name: loyalty-referral-anti-fraud
description: Points ledger، eligibility, caps, reversals, attribution, abuse detection. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# وفاداری و ضدتقلب Referral

## Mission
Deliver a traceable, evidence-based result for the وفاداری و ضدتقلب Referral domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for points, tiers, rewards, referral codes, campaign rules or fraud prevention.
## Required workflow
Use append-only points ledger with source order/payment references; define earn/burn/reversal/expiry. Referral attribution uses random token, eligibility and verified conversion milestone. Detect self-referral/velocity/duplicate patterns with risk review and appeals. Keep policy version, caps and audit actor.
## Output
Policy matrix, ledger schema, event flow, anti-abuse rules and reversals tests.
## Guardrails
Never let AI award points or money outside deterministic policy; do not rely on IP/device alone for fraud decisions.

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
