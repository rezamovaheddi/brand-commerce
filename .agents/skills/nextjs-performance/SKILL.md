---
name: nextjs-performance
description: Server Components, cache, streaming, image, font, bundle و Core Web Vitals. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# بهینه‌سازی Next.js

## Mission
Deliver a traceable, evidence-based result for the بهینه‌سازی Next.js domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use when building or reviewing Next.js/React App Router pages or performance regressions.
## Required workflow
1. Prefer Server Components by default; client boundaries only for interaction.
2. Fetch data close to server rendering and use explicit caching/revalidation policy.
3. Avoid sequential waterfalls; parallelize independent reads and stream secondary sections.
4. Audit bundle size, dynamic imports, images, fonts, metadata, hydration and client JS.
5. Check route cache, personalization leakage, cache tags and revalidation invalidation.
6. Measure Core Web Vitals and route-level performance before/after.
## Output
Findings sorted by impact, code patch, test/build and measured evidence.
## Guardrails
Never cache private/customer-specific data publicly; verify current Next.js APIs before use.

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
