---
name: design-system-governance
description: استفاده از توکن‌ها و کامپوننت‌های canonical؛ جلوگیری از drift و کدهای UI یک‌بارمصرف. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# حاکمیت Design System

## Mission
Deliver a traceable, evidence-based result for the حاکمیت Design System domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use when adding or changing visual components/tokens or when auditing inconsistent UI.
## Required workflow
1. Read canonical brand tokens and component inventory.
2. Reuse existing components; add a new primitive only when justified.
3. Enforce semantic tokens for color, typography, radius, spacing, elevation, motion and z-index.
4. Add variants with explicit names, not ad-hoc boolean combinations.
5. Document usage, anatomy, states, responsive behavior and accessibility.
6. Add visual regression and lint rules for forbidden raw colors/spacing where practical.
## Output
Token/component changes, story/example, docs and test evidence.
## Guardrails
Do not create one-off visual styles to solve a single screenshot unless that pattern is promoted to the system.

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


## Current brand reference
Use `02-brand-ux/brand-identity-and-design-direction-fa.md` and `02-brand-ux/design-tokens.css`. The Mood Board v2 supersedes the earlier mint/purple Bubble palette. Dusty Rose is decorative; CTA uses accessible dark mauve.
