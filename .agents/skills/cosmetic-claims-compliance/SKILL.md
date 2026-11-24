---
name: cosmetic-claims-compliance
description: Gate cosmetic claims using traceable evidence, market/channel scope, approver, expiry and withdrawal. Do not give medical advice or fabricate efficacy claims.
---

# cosmetic-claims-compliance

## Use this skill when
When drafting, editing, publishing or reviewing any product efficacy, clinical, ingredient or safety claim.

## Mandatory rules
- Read the relevant Master Blueprint section and ADR before changing code or specifications.
- Do not invent business, legal, product, medical, provider or repository facts. Mark unknowns and request evidence through the project owner.
- Keep the single source of truth and domain ownership intact. Do not write to another module's tables.
- Add or update tests for every invariant and failure state.
- Include evidence: commit/PR, test output, docs, migration and owner approval.
- Never put secrets, personal data or confidential formula details into logs, prompts or generated reports.

## Required output
1. Scope and assumptions.
2. Proposed changes and impacted domains.
3. Threats/risks and migration concerns.
4. Tests and acceptance criteria.
5. Evidence and remaining decisions.
