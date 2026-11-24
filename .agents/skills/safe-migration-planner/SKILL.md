---
name: safe-migration-planner
description: Plan incremental repository and data migrations using domain boundaries, invariants, reconciliation, rollout and rollback evidence.
---

# Safe Migration Planner

- Establish an immutable baseline at a named commit.
- Build a capability map from executable code and tests, not roadmap claims.
- Identify the single source of truth for each aggregate and event.
- Write ADRs before selecting replacement frameworks or databases.
- Prefer strangler migration, feature flags and bounded cohorts over big-bang rewrites.
- Design dry-run, checksums, row-count checks, monetary reconciliation, idempotent replay and rollback.
- Avoid dual-write; dual-read may be used temporarily for comparison.
- Validate authz, tenant isolation, money, inventory, payment and loyalty invariants.
- Every phase ends with explicit Go/No-Go criteria and named approver.
