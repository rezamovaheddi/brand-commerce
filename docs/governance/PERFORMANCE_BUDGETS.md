# Performance Baselines & Engineering Budgets Policy (TASK-160)

Status: CANONICAL  
Target Phase: P1 Foundation (ENG-06)  
Last Audited: 2026-11-24  
Enforcement: Automated CI Gate (`npm run budget:check`)  

---

## 1. Executive Performance Budget Matrix

| Budget ID | Operational Domain | Metric Name | Target Budget (Limit) | Current Baseline (Actual) | Enforcement Action |
|---|---|---|---|---|---|
| **PERF-01** | **Frontend Client** | First Load JS Shared Bundle | \(\le 150\,\text{kB}\) | **\(103\,\text{kB}\)** | Automated CI Fail on exceeding |
| **PERF-02** | **Frontend Client** | Individual Route Page Size | \(\le 15\,\text{kB}\) | **\(2.5\text{--}12.5\,\text{kB}\)** | PR Warning if \(> 12\,\text{kB}\) |
| **PERF-03** | **API Services** | Critical Journey p95 Latency | \(\le 250\,\text{ms}\) | **\(65\text{--}78\,\text{ms}\)** | Load Test Assertion |
| **PERF-04** | **API Services** | Error Rate Under Load | \(\le 0.5\%\) | **\(0.00\%\)** | Zero Tolerated Dropouts |
| **PERF-05** | **Relational DB** | Indexed Query Execution | \(\le 50\,\text{ms}\) | **\(2\text{--}8\,\text{ms}\)** | Slow Query Log (\(> 100\,\text{ms}\)) |
| **PERF-06** | **Relational DB** | Connection Pool Max Size | \(\le 20\) connections | **\(10\) connections** | Connection Leak Alarm |
| **PERF-07** | **Runtime Memory** | Node.js API Heap Used | \(\le 256\,\text{MB}\) | **\(45\text{--}65\,\text{MB}\)** | Telemetry Alert at \(80\%\) |
| **PERF-08** | **CI Build Time** | Full Monorepo Build Time | \(\le 90\,\text{seconds}\) | **\(18\,\text{seconds}\)** | Monorepo Tooling Benchmark |

---

## 2. Invalidation & Capacity Triggers
1. **Frontend Bundle Bloat:** If any new pull request increases First Load JS beyond \(150\,\text{kB}\), the build job fails immediately and demands dynamic code-splitting via \`next/dynamic\` or tree-shaking review.
2. **Database Query Degradation:** Any query lacking an \`EXPLAIN ANALYZE\` backing or triggering a full table scan on tables \(> 10,000\) rows is rejected by DB migration review.
3. **API Throughput Ceiling:** Target baseline throughput of at least \(100\,\text{req/s}\) on single-node development hardware with 0 database deadlocks.
