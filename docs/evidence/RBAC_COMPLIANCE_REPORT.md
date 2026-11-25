# Canonical Enterprise RBAC & Policy Verification Report (TASK-033 / GAP-032 / TASK-200)

**Generated:** 2026-11-24T10:48:33.238Z
**Status:** ALL CHECKS PASSED (100% COMPLIANT)
**Reference:** `_sources/brand-platform/Brand-Commerce-Platform-v2.2.0/03-architecture/rbac-permission-matrix-fa.csv`

---

## Executive Summary

The Brand Commerce Platform enforces a strict, defense-in-depth Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) engine. All actions are subject to an uncompromising **Default-Deny** policy, mandatory resource-scoping (`:self`, `:assigned`, `:entity`, `:market`), separation of duties (maker-checker), MFA step-up verification, and strict machine-versus-human identity boundaries.

| Metric | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| **Enterprise Roles** | 18 | 18 | PASS |
| **Distinct Permissions** | 105 | 105 | PASS |
| **Canonical Rule Grants** | 119 | 119 | PASS |
| **Default-Deny Pass Rate** | 100% | 100% | PASS |
| **Resource Scoping Accuracy** | 100% | 100% | PASS |
| **Maker-Checker Guardrails** | 100% | 100% | PASS |
| **Machine Boundary Enforcement** | 100% | 100% | PASS |

---

## Verification Audit Log

| Category | Verification Check | Required Invariant | Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GOVERNANCE** | CSV Integrity | Matrix file contains exactly 119 rule rows and standard 7-column header | Found 119 rows with header [role_code, role_fa, scope, permission_code, grant, approval_or_guard, notes] | PASS |
| **GOVERNANCE** | Canonical Role Count | Matrix specifies exactly 18 enterprise roles and 105 distinct permissions | 18 roles, 105 permissions verified across matrix | PASS |
| **CODE_PARITY** | Matrix-to-Code Parity | All 18 roles and 119 permission assignments in domain implementation match CSV 1:1 | 119/119 permission assignments and assertion helpers verified across 18 roles | PASS |
| **INVARIANT** | Default-Deny Policy | Any role or operation not explicitly granted is denied with DEFAULT_DENY | 6/6 negative access attempts denied | PASS |
| **INVARIANT** | Resource Scoping Rules | Resource scopes (:self, :assigned, :entity, :market) strictly enforced at object level | 10/10 boundary scoping scenarios validated | PASS |
| **INVARIANT** | Separation of Duties | Maker-checker, MFA step-up, and recall clearance prevent privilege abuse | 5/5 guardrail tests validated | PASS |
| **INVARIANT** | Machine vs Human Boundary | Machine identities constrained to integration endpoints; business roles reject machine tokens | 3/3 boundary tests passed | PASS |

---

## Canonical Role Distribution Summary

| Role Code | Persian Title | Canonical Scope | Assigned Permissions | Key Guards & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `CUSTOMER` | مشتری خرده | Own customer identity/orders only | 10 | Actor must own the resource; step-up for sensitive profile changes |
| `ORG_OWNER` | مالک سازمان | Assigned organization(s) only | 13 | Active membership + owner role; accept quote only within policy and validity |
| `ORG_BUYER` | خریدار سازمانی | Assigned organization(s) only | 10 | Order amount and category limits; no credit-limit change |
| `ORG_FINANCE` | مالی سازمان | Assigned organization(s) only | 6 | No order price override; no internal journal access |
| `SALES_AGENT` | کارشناس فروش | Assigned leads/accounts only | 9 | Cannot approve own exceptional discount or credit request |
| `SALES_MANAGER` | مدیر فروش | Assigned region/team | 5 | Approval threshold and separation of duties; own quote approval blocked |
| `SUPPORT_AGENT` | پشتیبانی | Assigned customer/order tickets | 5 | PII masked by default; no refund execution or finance write |
| `WAREHOUSE_OPERATOR` | اپراتور انبار | Assigned warehouse/location | 6 | No manual stock increase; movements require source document and scan/audit |
| `WAREHOUSE_MANAGER` | مدیر انبار | Assigned warehouse(s) | 7 | Second approval for material adjustment; recalled lot never releasable without compliance clearance |
| `PROCUREMENT_AGENT` | کارشناس تدارکات | Assigned suppliers/categories | 6 | PO approval separated from creator; no supplier bank detail changes without verification |
| `FINANCE_CLERK` | کارشناس مالی | Assigned legal entity | 6 | Cannot post or approve own journal/refund/credit adjustment |
| `FINANCE_CONTROLLER` | مدیر/کنترلر مالی | Assigned legal entity | 7 | MFA step-up; maker-checker; immutable journal and reason required |
| `CONTENT_EDITOR` | ویرایشگر محتوا | Assigned locales/sections | 5 | Cannot publish claims-restricted content or write commerce data |
| `CLAIMS_REVIEWER` | بازبین ادعا | Assigned products/markets | 3 | No self-approval; evidence must be attached and versioned |
| `REGULATORY_OFFICER` | مسئول رگولاتوری/ایمنی | Assigned markets/products | 6 | Named human owner; market scope; legal escalation and audit |
| `SYSTEM_ADMIN` | مدیر سامانه | Technical configuration only | 5 | Cannot modify journal, order totals, stock ledger, claim approval or customer data without separate business role |
| `AUDITOR` | حسابرس | Read-only assigned legal entity/scope | 6 | Read-only; exports time-limited, logged and approved |
| `INTEGRATION_SERVICE` | حساب سرویس یکپارچه‌سازی | Named provider + narrow endpoints | 4 | Machine identity, mTLS/signature, provider allowlist, no interactive login |

---

## Security Invariants Certified

1. **Default-Deny Invariant:** Any route, RPC, or domain operation that lacks an explicit, active granting rule evaluates directly to `DENY` with audit code `DEFAULT_DENY`.
2. **Resource Scoping Invariant (`:self`):** End-users and retail customers are strictly limited to resources they own. Cross-tenant access is structurally impossible without affirmative ownership match.
3. **Multi-Tenant Org Scoping (`:assigned`):** B2B buyers and organization officers may only inspect and act upon organizations explicitly present in their active session claims.
4. **Maker-Checker & Separation of Duties:**
   - Sales Managers are structurally prohibited from approving quotes they created.
   - Finance Controllers cannot approve or post journals they drafted, and must present verified MFA step-up credentials.
   - Claims Reviewers cannot review or comment upon self-submitted scientific evidence.
   - Warehouse Managers cannot release quarantined lots under regulatory recall without documented compliance clearance.
5. **Machine vs. Human Identity Segregation:** Integration service accounts are restricted to narrow webhook and ETL endpoints and cannot log in interactively; business roles structurally reject machine-signed tokens.
