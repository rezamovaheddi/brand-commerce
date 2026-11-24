---
name: payment-webhook-security
description: Signature, raw body, idempotency, replay defense, reconciliation و refund controls. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# امنیت پرداخت و Webhook

## Mission
Deliver a traceable, evidence-based result for the امنیت پرداخت و Webhook domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for PSP adapter, payment, refund, settlement, webhook or wallet interaction.
## Required workflow
Use hosted/tokenized payment to avoid storing card data. Verify raw body signature, timestamp/replay policy, provider event ID uniqueness, idempotency key and provider-side status. Model states separately from order state. Add timeout/retry/backoff, reconciliation and manual review states. Test duplicate, out-of-order, delayed, invalid-signature and ambiguous callbacks.
## Output
Provider adapter contract, state machine, test vectors, audit fields, reconciliation runbook.
## Guardrails
Never log secrets/card data; never mark paid based solely on redirect or browser success; never issue duplicate capture/refund.

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
