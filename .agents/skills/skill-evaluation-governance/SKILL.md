---
name: skill-evaluation-governance
description: Version, validate and evaluate agent skills using scenario fixtures, rubrics and regression baselines. Trigger only for this domain; follow project AGENTS.md, approved ADRs and evidence gates.
---

# مهارت حاکمیت و ارزیابی Skillهای ایجنت

## Mission
Version, validate and evaluate agent skills using scenario fixtures, rubrics and regression baselines.

## Required inputs
- Task ID, requirement IDs and acceptance criteria.
- Current repository state, relevant ADRs and module ownership.
- Explicitly approved tools, environments and data classification.

## Workflow
1. Confirm scope, owner, source-of-truth files and assumptions.
2. Inspect current implementation before proposing changes.
3. Create a minimal plan with risks, test strategy and rollback where relevant.
4. Work only in the assigned branch/worktree and approved files.
5. Run the required checks; record exact commands and outcomes.
6. Produce evidence, unresolved questions and handoff summary.

## Guardrails
- Never invent successful tests, approvals, production actions or repository findings.
- Never expose secrets, customer PII or production data.
- Do not override architecture, security, market or legal gates.
- Do not change protected source-of-truth files without a linked PR/ADR.

## Output contract
Objective; scope; files inspected/changed; decisions; tests and evidence; risks/unverified items; next owner.

## Evaluation
See `evals/README.md` and the central evaluation registry at `09-agent-workforce/skill-evaluation/skill-eval-cases.json`.
