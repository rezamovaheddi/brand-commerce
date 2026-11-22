---
name: accessibility-audit
description: ارزیابی keyboard, focus, semantics, contrast, reduced motion و RTL. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# ممیزی دسترس‌پذیری

## Mission
Deliver a traceable, evidence-based result for the ممیزی دسترس‌پذیری domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use for new UI, design-system reviews and release audits.
## Required workflow
Check semantic landmarks, heading order, labels, keyboard access, focus visibility, focus return, dialogs, errors, contrast, zoom/reflow, reduced motion, screen-reader names and touch targets. Test RTL and text expansion. Run automated checks plus manual keyboard pass.
## Output
Findings with WCAG criterion when verified, severity, affected routes, reproduction and fix.
## Guardrails
Automated scans alone do not establish WCAG conformance.

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
