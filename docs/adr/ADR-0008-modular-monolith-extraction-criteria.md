# ADR-0008: Quantitative Criteria for Microservice Extraction from the Modular Monolith
**Document ID:** ADR-0008  
**Canonical Tracking:** `TASK-143` / `S-062` (`AR-08` / `P8 Scale & Governance`)  
**Status:** ACCEPTED  
**Date:** 2026-11-24  
**Author:** Architecture Owner & Platform Engineering Team  

---

## 1. Context & Problem Statement

The Brand Commerce Platform is designed as a clean, hexagonal Modular Monolith (`apps/api`, `apps/storefront`, `packages/domain`, `packages/contracts`). Premature decomposition into microservices introduces severe distributed systems overhead: distributed transactions (2PC/sagas), network serialization latency, partial failures, telemetry cardinality explosion, and team operational cognitive load.

However, as business scales, specific bounded contexts (e.g. high-throughput payment settlement, AI consultation generation, or asynchronous media transcoding) may require independent deployment or hardware isolation.

**Question:** What are the exact, objective, quantitative criteria that MUST be satisfied before any module can be extracted into an independent microservice?

---

## 2. Decision: Strict 4-Pillar Extraction Thresholds

No module may be extracted into an independent microservice unless it simultaneously satisfies all 4 quantitative criteria, supported by real production telemetry and incident records.

### Pillar 1: Resource Footprint & Scaling Asymmetry ($\ge 5\times$)
- **Requirement:** The candidate module exhibits CPU, memory, or GPU saturation that diverges from the core monolith by at least $5.0\times$ under peak traffic.
- **Example:** High-concurrency image rendering or AI embedding generation requiring GPU instances, whereas core NestJS API requires only general-purpose compute.

### Pillar 2: Deployment Cadence & Squad Autonomy ($\ge 10\text{ deploys/day}$)
- **Requirement:** A dedicated, cross-functional team ($> 4$ full-time engineers) maintains the candidate module and deploys at least $10\text{ times/day}$, where monolith deployment serialization creates an unacceptable bottleneck.

### Pillar 3: SLA & Blast Radius Divergence
- **Requirement:** The module possesses a strictly divergent availability requirement (e.g., $99.99\%$ critical path payment verification vs. $99.0\%$ batch PDF invoice generation) where decoupling isolates catastrophic failure domains.

### Pillar 4: Network Latency & Data Consistency Budget
- **Requirement:** 
  1. The domain must NOT require synchronous ACID multi-table transactions with the core database.
  2. The network round-trip overhead ($> 5\text{ ms}$) must fit within the end-to-end journey latency budget.
  3. Shared database writes are strictly forbidden (`docs/governance/POLYGLOT_GOVERNANCE.md`).

---

## 3. Disallowed Justifications (Anti-Patterns)

The Architecture Review Board will categorically REJECT extraction proposals based on:
1. *Code organization or aesthetics* (modular boundaries within TypeScript packages already provide 100% boundary isolation).
2. *Hypothetical or projected scale* without empirical load test data (`scripts/run-k6-load-tests.mjs`).
3. *Language preference alone* unless governed under approved Polyglot specifications (`TASK-153`).

---

## 4. Extraction Process Lifecycle

```
[Candidate Module in Monolith]
       │
       ▼ (Passes 4 Quantitative Pillars)
[Strangler Fig Simulator Validation] (scripts/simulate-strangler-extraction.mjs)
       │ (100% parity across 50,000 shadow requests)
       ▼
[Canary Rollout 5% -> 25% -> 100%]
       │
       ▼ (Zero Rollback Triggers)
[Independent Microservice Operational]
```
