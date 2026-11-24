---
name: language-toolchain-governance
description: Apply the approved language policy, runtime compatibility, toolchain locks, and cross-language contracts.
---

# Language & Toolchain Governance

1. TypeScript is the default language for product UI, API, workers, and app contracts.
2. SQL owns data constraints, transaction correctness, precision, migration, and query performance.
3. Python is allowed for isolated AI/OCR/media/ETL/analytics workers behind versioned contracts; it must not directly write Core transactional tables.
4. Go/Rust require reproducible profiling, benchmark, team owner, CI/security policy, and ADR.
5. Pin supported runtime and dependency versions in project manifests/lockfiles/container digests; never use `latest` in production config.
6. Maintain TypeScript 6 compatibility baseline while TypeScript 7 is evaluated side-by-side until stable programmatic API and full toolchain matrix are green.
7. Require OpenAPI/event schema validation and cross-language contract tests.
8. Do not serialize money as floating-point JSON numbers; use safe integer strings or decimal strings with currency metadata.

Report: language boundary, version source, compatibility matrix, security/license status, tests, and upgrade/rollback plan.
