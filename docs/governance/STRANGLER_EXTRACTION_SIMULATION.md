# Microservice Evolution & Strangler Fig Pattern Simulation (TASK-152)

Status: CANONICAL  
Target Phase: P1 Foundation (ENG-01, ENG-05)  
Last Audited: 2026-11-24  
Extraction Candidate: **Notification & SMS Dispatcher Service** (Risk Tier: Low)  

---

## 1. Candidate Selection & Microservice Extraction Scorecard
Evaluated against `microservice-extraction-scorecard-fa.csv`:

| Criterion | Evaluation for Notification Service | Score | Decision Weight |
|---|---|---|---|
| **Independent Ownership** | Owned by Communications & Notification Operations team | High | PASS |
| **Independent Deployment** | SMS provider templates change without core commerce releases | High | PASS |
| **Distinct Scaling Profile** | High-volume traffic spikes during flash sales and campaigns | High | PASS |
| **Availability / SLO Boundary** | Asynchronous delivery; transient downtime tolerated with retries | High | PASS |
| **Data Ownership** | Independent log store; zero foreign key constraints on Core DB | Critical | PASS (Zero Core Write) |
| **Consistency Strategy** | Eventual consistency; idempotent delivery | Critical | PASS |
| **Overall Scorecard Result** | **QUALIFIED FOR STRANGLER EXTRACTION** | **100%** | Approved by Architecture |

---

## 2. Four-Phase Strangler Fig Pattern Protocol

### Phase 1: Contract-First Specification
The service boundary is strictly defined in OpenAPI (`/api/v1/notifications`) and AsyncAPI (`commerce.notification.dispatch`). The Monolith and Extracted Service implement identical interfaces.

### Phase 2: Shadow Comparison (Dark Launch)
Core API dispatches to both internal implementation and extracted candidate service concurrently. Results, delivery logs, and latencies are compared in shadow mode. Divergences trigger telemetry alerts.

### Phase 3: Controlled Canary Cutover
Traffic is dynamically shifted using OpenFeature flag `FEATURE_EXTRACTED_NOTIFICATION_SERVICE`:
- Canary Tier 1: 5% of requests
- Canary Tier 2: 25% of requests
- Canary Tier 3: 50% of requests
- Full Cutover: 100% of requests

### Phase 4: Instant Rollback Drill
If downstream provider error rate exceeds 1% or latency exceeds 500ms, the circuit breaker trips instantly, redirecting 100% of traffic back to the Monolith in $< 1\,\text{ms}$ with zero downtime.
