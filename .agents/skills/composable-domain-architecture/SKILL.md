---
name: composable-domain-architecture
description: Design and review bounded contexts, domain ownership, modular monolith boundaries, dependency rules, and evidence-based microservice extraction.
---

# Composable Domain Architecture Skill

Before changing architecture:
1. Read the Master Specification, target architecture v2.1, ADR register, and domain ownership map.
2. Identify bounded context, owner, data authority, public contract, upstream/downstream, and transactional invariants.
3. Never create a microservice from a table, controller, or folder alone.
4. Prefer internal module boundary + public API until a documented extraction trigger exists.
5. For any cross-domain change, use command/query/event contract; never import another domain's private implementation.
6. Add architecture fitness tests for forbidden imports and circular dependencies.
7. If extracting a service, document ownership, database, contract, migration, shadow comparison, single-writer cutover, rollback, SLO, runbook, and cost.

Output: context map, ADR proposal, dependency changes, tests, migration risk, and evidence. Do not mark an ADR Accepted without owner approval.
