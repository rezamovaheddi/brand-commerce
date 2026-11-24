---
name: project-planning
description: تبدیل خواسته به scope، acceptance criteria، dependency graph و plan قابل اجرا. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# تحلیل نیازمندی و برنامه‌ریزی

## Mission
Deliver a traceable, evidence-based result for the تحلیل نیازمندی و برنامه‌ریزی domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use when a product request, epic, or ambiguous requirement must become a traceable plan. Do not use for a trivial one-line edit.
## Required workflow
1. Restate business outcome, users, in-scope and out-of-scope behavior.
2. Identify assumptions and unresolved decisions; never hide them.
3. Write journeys, acceptance criteria, negative cases, permissions and observability needs.
4. Build dependency graph and slice work vertically into independently verifiable milestones.
5. Each task includes owner role, files/domain, dependency, estimate class, risk, test evidence and Definition of Done.
6. Mark externally dependent items and decision gates.
## Output
Product brief, acceptance criteria, phased backlog, risk list and open-decision log.
## Guardrails
Do not claim time estimates as commitments; do not invent compliance or payment behavior.

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
