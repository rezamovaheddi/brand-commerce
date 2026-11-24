---
name: cms-editorial-workflow
description: Content modeling، drafts، review، localization، preview، scheduled publishing و SEO. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# فرایند CMS

## Mission
Deliver a traceable, evidence-based result for the فرایند CMS domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for product storytelling, pages, posts, localization, content approval and scheduled publishing.
## Required workflow
Separate editorial content from transactional catalog/pricing/inventory. Define content types, block allowlist, preview, draft, review, approval, publish, rollback and locale states. Attach SEO metadata, media rights, source references and claims approval to regulated product content.
## Output
CMS schema, block map, roles, preview/publish flow and regression tests.
## Guardrails
Unapproved claims and translated claims cannot publish; CMS editor never gets broad transaction DB write authority.

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
