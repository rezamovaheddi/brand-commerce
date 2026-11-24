---
name: repository-deep-audit
description: Run evidence-based technical audits of an existing repository before reuse, migration or refactor. Use when repository state, code quality, tests, CI, schema or deployment must be established.
---

# Repository Deep Audit

## Rules
- Record exact remote, branch, commit SHA and worktree status.
- Separate verified code evidence, user-provided historical context, web discovery and assumptions.
- Inventory actual routes, packages, services, schema, migrations, tests and CI.
- Read the current implementation; roadmap documents are not evidence of shipped code.
- Run tests only in a safe local environment and record exact command/output/commit.
- Never read or expose .env values, tokens, credentials, PII or production dumps.
- Every finding must cite path + line + commit + impact + remediation + retest.
- Do not change production, push commits or rewrite history.

## Required output
1. Scope and commit.
2. Architecture and dependency inventory.
3. Baseline command matrix.
4. Data/auth/payment/inventory findings.
5. License and supply-chain review.
6. Reuse/refactor/rewrite/reject matrix.
7. Risks, confidence and next gate.

## Stop conditions
Stop and report a blocker if the repo cannot be fetched, working tree is dirty in a way that risks data loss, tests need production credentials, or the relevant legal/license terms are unclear.
