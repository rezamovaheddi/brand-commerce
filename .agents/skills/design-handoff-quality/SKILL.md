---
name: design-handoff-quality
description: Validate design system consistency, responsive screens, RTL/LTR behavior, accessibility, and implementation handoff quality.
---

# Design Handoff & QA

1. Compare every screen against approved tokens and component definitions.
2. Check all breakpoints and directionality; inspect both Persian and English realistic strings.
3. Verify focus/keyboard, labels, contrast, reduced motion, status semantics, and WCAG 2.2 AA target.
4. Verify every visible control has a defined interaction and resulting state.
5. Check business truth: no false payment success, no unapproved price/claim, no direct-buy for Quote-only SKUs, no cross-organization data exposure.
6. Check tables/forms for sorting, filtering, errors, bulk actions, pagination, and empty state.
7. Record visual regression baselines only after human design approval.
8. Handoff assets with source/license/owner and define exact spacing, state, validation, and data expectations.

Output: issue log with severity, screenshot, route, expected/actual behavior, owner, fix evidence, and final sign-off.
