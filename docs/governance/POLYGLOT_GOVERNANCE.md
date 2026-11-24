# Polyglot Toolchain Governance Policy (TASK-153)

Status: CANONICAL  
Target Phase: P1 Foundation (ENG-01, ENG-05)  
Last Audited: 2026-11-24  
Applicability: All Microservices, External Workers, Scripts, and CI Pipelines  

---

## 1. General Principles
1. **Limited & Justified Polyglot:** Adding languages beyond TypeScript is strictly justified by domain specialty (e.g. AI/ML, data science in Python), never by trend or preference.
2. **Zero Shared Database Writes:** All persistence into Core PostgreSQL tables (`orders`, `products`, `users`, `carts`, `inventory_ledgers`, `audit_logs`) belongs EXCLUSIVELY to the NestJS API application (`apps/api`). No auxiliary worker (Python, Go, Rust) may write directly to Core database tables.
3. **Contract-Mediated Communication:** Inter-service boundaries are mediated strictly through:
   - AsyncAPI 3.1 Domain Events (e.g. `commerce.order.placed`, `commerce.payment.captured`)
   - OpenAPI 3.0 REST Endpoints (`/api/v1/...`)
4. **Strict PII Redaction:** Auxiliary workers processing events must redact customer phone numbers, national IDs, and financial tokens before persisting telemetry or analytics.

---

## 2. Permitted Language Matrix

| Language / Toolchain | Monorepo Role | Execution Scope | Database Access Policy | CI Verification Gate |
|---|---|---|---|---|
| **TypeScript (v5.8+)** | Core System | Frontend, API, Contracts, Domain, E2E | Exclusive read/write access via Prisma | Strict type checking, ESLint |
| **SQL (PostgreSQL 16)** | Relational Persistence | Schema, indexes, ACID transactions | Owned by `@bc/database` migrations | Prisma migrate status |
| **Python (v3.11+)** | Specialized AI & Analytics | Event consumers, token validators, ML | **READ-ONLY / ZERO WRITE to Core DB** | `npm run polyglot:verify` |
| **Go** | Low-latency Networking | Deferred from MVP | **PROHIBITED in MVP** | Boundary audit |
| **Rust** | Compute-heavy WASM | Deferred from MVP | **PROHIBITED in MVP** | Boundary audit |
| **Node.js (mjs/cjs)** | Automation & Tooling | Audits, verification gates, CLI scripts | Read-only verification checks | ESLint |

---

## 3. Python Service Boundary Specification (TASK-157)
Auxiliary Python workers (such as `services/analytics-worker/`) adhere to:
1. **Schema Validation:** Inbound event JSON is validated against AsyncAPI 3.1 `EventMetadata` and domain schemas.
2. **Timeout & Retries:** Bounded execution with exponential backoff; no indefinite thread blocking.
3. **Log Sanitization:** Sensitive identifiers (phone numbers, national IDs) are masked with asterisks before logging.
4. **Autonomous Isolation:** Emits analytics telemetry to independent storage or stdout; completely disconnected from Core database credentials.
