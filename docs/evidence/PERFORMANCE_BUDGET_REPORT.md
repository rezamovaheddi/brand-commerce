# Performance Baselines & Budgets Verification Report (TASK-160)

Generated at: 2026-11-24T08:43:02.447Z  
Governance Standard: `docs/governance/PERFORMANCE_BUDGETS.md`  
Load Test Reference: `docs/evidence/LOAD_TEST_REPORT.md`  

---

## 1. Executive Summary
- **Overall Budget Status:** PASSED (100% Within Budget)
- **Frontend Bundle Headroom:** 31.3% headroom below 150 kB limit
- **API Latency Headroom:** 68.8% headroom below 250 ms p95 SLA
- **Concurrency Stability:** 0.00% error rate under multi-worker virtual user load

---

## 2. Performance Budget Compliance Matrix
| Budget ID | Operational Dimension | Target Budget | Actual Measurement | Status | Evidence & Headroom |
|---|---|---|---|---|---|
| **PERF-01** | Frontend First Load Shared JS Bundle | `<= 150 kB` | **103 kB** | **PASS** | Well within 150 kB budget limit (31.3% headroom) |
| **PERF-03** | Critical Journey API Latency (p95) | `<= 250 ms` | **78 ms** | **PASS** | p95 latency comfortably satisfies sub-250ms target SLA |
| **PERF-04** | API Error Rate Under Concurrency | `<= 0.50%` | **0.00%** | **PASS** | Zero error dropouts under load test concurrency |
| **PERF-07** | Process Memory Heap Utilization | `<= 256 MB` | **5 MB** | **PASS** | Process running lean at 5 MB heap |

---

## 3. Capacity & Scaling Safeguards
1. **Automated Bundle Size Gate:** Any pull request pushing First Load JS over 150 kB is blocked by CI.
2. **Database Query Efficiency:** All production tables are protected by unique constraints, indexes on foreign keys, and integer minor currency math.
3. **Memory Safeguards:** Memory limits actively monitored via `GET /api/v1/health/telemetry`.
