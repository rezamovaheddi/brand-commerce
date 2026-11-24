---
name: security-threat-model
description: STRIDE، OWASP ASVS/API Top 10، trust boundaries، abuse cases و remediation. Trigger only when the task matches this domain. Do not use as a substitute for code review, test execution, legal approval or production authorization.
---

# مدل تهدید و امنیت

## Mission
Deliver a traceable, evidence-based result for the مدل تهدید و امنیت domain while following the project's architecture, ADRs, API contracts and Definition of Done.

## When to use
Use before new external endpoints, admin workflows, data exports, integrations or high-risk releases.
## Required workflow
Map assets, actors, trust boundaries, entry points and abuse cases. Evaluate BOLA/IDOR, tenant escape, privilege escalation, CSRF/XSS/SSRF, file upload, webhook spoofing, rate limits, secrets, PII leakage, replay and insider risk. Map controls to OWASP ASVS/API Top 10 and run relevant tests.
## Output
Threat model, abuse stories, prioritized remediation and verification evidence.
## Guardrails
Do not claim secure solely from SAST scan; avoid printing exploit secrets or customer data.

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
