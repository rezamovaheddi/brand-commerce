# Agent Quality & Engineering Metrics Governance (TASK-198)

Last Updated: 2026-11-24  
Status: CANONICAL  
Target Phase: P8 Scale & Governance (ENG-06, ENG-12)  
Applicability: All Autonomous Agents, Skills, Subagents, and CI Automated Workflows

---

## 1. Principles of Agent Quality
1. **Quality Over Velocity:** Output speed alone is never a metric of engineering quality. High token generation rates with regressions or unverified assumptions violate engineering standards.
2. **Explicit Denominators:** Every KPI must be computed with a rigorous, measurable denominator, sample size, and observation period.
3. **Evidence-Based Acceptance:** A task is only considered accepted when passing the multi-gate verification suite (`npm run verify`), verified by human review, and confirmed green in CI.
4. **Zero Float Financial Invariant:** No autonomous agent or skill is permitted to generate or merge floating-point currency calculations.

---

## 2. Core Engineering KPI Framework

| KPI ID | Metric Name | Target SLA | Minimum Acceptable | Measurement Method & Denominator |
|---|---|---|---|---|
| **KPI-01** | **PR / Task Acceptance Rate** | \(\ge 98\%\) | \(95\%\) | Accepted tasks / Total tasks submitted to verification |
| **KPI-02** | **Regression & Rollback Rate** | \(0.00\%\) | \(\le 1.0\%\) | Rolled-back commits / Total merged commits |
| **KPI-03** | **CI First-Pass Rate** | \(\ge 95\%\) | \(90\%\) | Successful CI workflow runs / Total CI workflow runs |
| **KPI-04** | **Architecture Fitness Score** | \(100\%\) | \(100\%\) | Passing architectural rules / Total rules (5 rules) |
| **KPI-05** | **Test Pass Rate & Regressions** | \(100\%\) | \(100\%\) | Passing automated test cases / Total test cases |
| **KPI-06** | **Supply Chain Security & License** | \(0\) violations | \(0\) violations | Viral copyleft packages / Total scanned dependencies (216 deps) |
| **KPI-07** | **A11Y & Contrast Compliance** | \(100\%\) | \(100\%\) | WCAG 2.1 AA/AAA passing checks / Total checks (17 checks) |
| **KPI-08** | **Release Artifact Provenance** | \(100\%\) | \(100\%\) | Verified SHA-256 digests / Total release artifacts (5 artifacts) |

---

## 3. Human Review & Quality Gates
- **Gate 1: Pre-Commit Automated Verification:**
  - ESLint (`npm run lint`)
  - DTCG Token Parity (`npm run tokens:validate`)
  - WCAG Contrast Check (`npm run contrast:check`)
  - Accessibility Audit (`npm run a11y:audit`)
  - Architecture Fitness (`npm run arch:fitness`)
  - Security Secret Scanner (`npm run security:audit`)
  - License Compliance (`npm run license:audit`)
  - AsyncAPI Contract Validation (`npm run asyncapi:validate`)
  - OpenAPI Spectral Linter (`npm run openapi:lint`)
  - Visual Regression Audit (`npm run visual:audit`)
  - Multi-Workspace Build (`npm run build`)
  - Automated Tests (`npm run test`)
  - Provenance Verification (`npm run provenance:verify`)
- **Gate 2: Remote CI GitHub Actions:**
  - Clean containerized Linux execution against live PostgreSQL container.
  - Smoke tests on API endpoints (`GET /api/v1/health`, `GET /api/v1/products`).
- **Gate 3: Visual & Human QA Signoff:**
  - Browser subagent visual inspection with screenshot artifacts.
  - Review of Persian typography kerning and mobile responsive touch targets.

---

## 4. Cost and Efficiency Tracking
- **Token Efficiency:** Context window compaction protocol (`/compact`) triggered when history exceeds 40 turns.
- **Cache Hit Ratio:** Workspace dependency cache and Next.js compiler cache monitored to minimize remote runner build times (\(< 90\,\text{s}\) target).
