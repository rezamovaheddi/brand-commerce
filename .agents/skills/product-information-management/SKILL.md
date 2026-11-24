---
name: product-information-management
description: Own accurate, versioned product information, SKU attributes, market eligibility, INCI, label data, media and document sources. Never invent product facts.
---

# product-information-management

## Use this skill when
When modifying the PIM schema, product workflows, localized product content or product claims source data.

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
