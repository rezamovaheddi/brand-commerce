# Polyglot Governance & Python Service Boundary Report (TASK-153 / TASK-157)

Generated at: 2026-11-24T09:22:50.061Z  
Governance Standard: `docs/governance/POLYGLOT_GOVERNANCE.md`  
Python Analytics Service: `services/analytics-worker/worker.py`  
Audited Polyglot Files: 3 files  

---

## 1. Executive Summary
- **Verification Status:** PASSED (100% Compliant)
- **Core Write Isolation:** 100% verified (Zero direct writes to PostgreSQL Core from Python)
- **PII Redaction:** Active (Customer phone numbers and national IDs automatically masked)
- **Language Boundaries:** TypeScript Core + Python Specialized Worker only (Go and Rust prohibited)

---

## 2. Policy Verification Matrix
| Policy ID | Invariant Description | Scope | Status | Evidence & Details |
|---|---|---|---|---|
| **POLY-01** | Go & Rust MVP Scope Restriction | Monorepo | **PASS** | `Zero unauthorized Go/Rust code; monorepo strictly scoped to TypeScript, SQL, and Python` |
| **POLY-02** | Zero Shared Database Writes Standard | Monorepo | **PASS** | `Zero direct SQL write operations to Core DB tables detected across all Python scripts` |
| **POLY-03** | Python Worker AsyncAPI Validation & PII Redaction | Monorepo | **PASS** | `Clean schema parsing, masked phone (0912***2233), integer minor units (18500000 IRR)` |

---

## 3. Python Service Architecture Boundary

```mermaid
flowchart LR
    A[Core NestJS API] -->|AsyncAPI Event| B[(Kafka / Message Broker)]
    B -->|OrderPlaced| C[services/analytics-worker (Python 3.11)]
    C -->|Validate Schema| D{AsyncAPI Check}
    D -->|Valid & Redact PII| E[(analytics_events.jsonl)]
    D -.->|FORBIDDEN: Direct Write| F[(PostgreSQL Core DB)]
    style F fill:#ffebee,stroke:#c62828,stroke-width:2px;
    style C fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
```

---

## 4. Architectural Invariants Enforced
1. **Single Database Owner:** Only the NestJS API application executes write operations on Core PostgreSQL.
2. **Schema Invariant:** Float amounts in event payloads throw an immediate runtime `ValueError` in Python consumers.
3. **Privacy by Default:** Raw phone numbers and national identifiers are never written to analytics logfiles.
