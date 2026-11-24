# Enterprise RBAC & Security Permission Specification (Canonical)

**Source Reference:** `03-architecture/rbac-permission-matrix-fa.csv`
**Architectural Decisions:** ADR-002 (Identity & Access), ADR-014 (Audit Logging & Immutability)
**Version:** 2.2.0

---

## 1. Architectural Architecture & Principles

The Brand Commerce Platform implements a multi-tier authorization pipeline operating on the following core principles:

1. **Default-Deny by Default:** No access is granted implicitly. A missing rule, empty role list, or unrecognized permission results in an immediate 403 Forbidden.
2. **Context-Aware Scoping:** Permissions carry explicit scope suffixes:
   - `:self`: Target resource must belong to the calling actor (`actorId === resource.ownerId`).
   - `:assigned`: Target resource organization or warehouse must be present in the actor's assignment claims.
   - `:entity`: Target legal entity must match the actor's assigned fiscal entity.
   - `:market`: Target regulatory market must match the officer's jurisdiction.
3. **Maker-Checker / Separation of Duties:** Actions involving monetary value adjustments, journal postings, quote discounts, and regulatory clearance enforce dual-control.
4. **Step-Up Authentication (MFA):** High-impact financial and period-close operations require fresh MFA verification within the session window.

---

## 2. Canonical Enterprise Roles (18 Roles)

### `CUSTOMER` (مشتری خرده)
- **Scope:** Own customer identity/orders only
- **Guards:** Actor must own the resource; step-up for sensitive profile changes
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (10):**
  - `profile.read:self`
  - `profile.update:self`
  - `address.manage:self`
  - `cart.manage:self`
  - `checkout.create:self`
  - `order.read:self`
  - `return.request:self`
  - `loyalty.read:self`
  - `referral.read:self`
  - `consent.manage:self`

### `ORG_OWNER` (مالک سازمان)
- **Scope:** Assigned organization(s) only
- **Guards:** Active membership + owner role; accept quote only within policy and validity
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (13):**
  - `org.read:assigned`
  - `org.profile.update:assigned`
  - `membership.invite:assigned`
  - `membership.revoke:assigned`
  - `org.document.upload:assigned`
  - `price_list.read:assigned`
  - `quote.read:assigned`
  - `quote.accept:assigned`
  - `order.create:assigned`
  - `order.read:assigned`
  - `statement.read:assigned`
  - `credit.read:assigned`
  - `ticket.create:assigned`

### `ORG_BUYER` (خریدار سازمانی)
- **Scope:** Assigned organization(s) only
- **Guards:** Order amount and category limits; no credit-limit change
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (10):**
  - `org.read:assigned`
  - `catalog.read:b2b`
  - `price_list.read:assigned`
  - `cart.manage:assigned`
  - `quick_order.create:assigned`
  - `rfq.create:assigned`
  - `quote.read:assigned`
  - `order.create:assigned`
  - `order.read:assigned`
  - `ticket.create:assigned`

### `ORG_FINANCE` (مالی سازمان)
- **Scope:** Assigned organization(s) only
- **Guards:** No order price override; no internal journal access
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `org.read:assigned`
  - `invoice.read:assigned`
  - `statement.read:assigned`
  - `credit.read:assigned`
  - `payment.initiate:assigned`
  - `payment_receipt.upload:assigned`

### `SALES_AGENT` (کارشناس فروش)
- **Scope:** Assigned leads/accounts only
- **Guards:** Cannot approve own exceptional discount or credit request
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (9):**
  - `lead.read:assigned`
  - `lead.update:assigned`
  - `org.application.read:assigned`
  - `rfq.read:assigned`
  - `quote.create:assigned`
  - `quote.revise:assigned`
  - `quote.submit_for_approval:assigned`
  - `order.read:assigned`
  - `ticket.read:assigned`

### `SALES_MANAGER` (مدیر فروش)
- **Scope:** Assigned region/team
- **Guards:** Approval threshold and separation of duties; own quote approval blocked
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (5):**
  - `lead.read:team`
  - `quote.approve:policy`
  - `discount.approve:threshold`
  - `org.application.recommend:team`
  - `sales_report.read:team`

### `SUPPORT_AGENT` (پشتیبانی)
- **Scope:** Assigned customer/order tickets
- **Guards:** PII masked by default; no refund execution or finance write
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (5):**
  - `ticket.read:assigned`
  - `ticket.update:assigned`
  - `customer.timeline.read:limited`
  - `order.read:limited`
  - `return.request.create:customer`

### `WAREHOUSE_OPERATOR` (اپراتور انبار)
- **Scope:** Assigned warehouse/location
- **Guards:** No manual stock increase; movements require source document and scan/audit
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `inventory.read:assigned`
  - `receipt.scan:assigned`
  - `pick.confirm:assigned`
  - `pack.confirm:assigned`
  - `shipment.dispatch:assigned`
  - `lot.quarantine.request:assigned`

### `WAREHOUSE_MANAGER` (مدیر انبار)
- **Scope:** Assigned warehouse(s)
- **Guards:** Second approval for material adjustment; recalled lot never releasable without compliance clearance
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (7):**
  - `inventory.read:assigned`
  - `stock_count.create:assigned`
  - `stock_adjustment.request:assigned`
  - `lot.quarantine:assigned`
  - `lot.release:assigned`
  - `recall.execute:assigned`
  - `reservation.override:threshold`

### `PROCUREMENT_AGENT` (کارشناس تدارکات)
- **Scope:** Assigned suppliers/categories
- **Guards:** PO approval separated from creator; no supplier bank detail changes without verification
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `supplier.read:assigned`
  - `purchase_request.create:assigned`
  - `purchase_order.create:assigned`
  - `purchase_order.submit:assigned`
  - `goods_receipt.read:assigned`
  - `supplier_document.upload:assigned`

### `FINANCE_CLERK` (کارشناس مالی)
- **Scope:** Assigned legal entity
- **Guards:** Cannot post or approve own journal/refund/credit adjustment
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `invoice.read:entity`
  - `payment.reconcile:entity`
  - `journal.draft:entity`
  - `refund.request:entity`
  - `credit.adjustment.request:entity`
  - `ar_ap.read:entity`

### `FINANCE_CONTROLLER` (مدیر/کنترلر مالی)
- **Scope:** Assigned legal entity
- **Guards:** MFA step-up; maker-checker; immutable journal and reason required
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (7):**
  - `journal.approve:entity`
  - `journal.post:entity`
  - `journal.reverse:entity`
  - `refund.approve:threshold`
  - `credit_limit.approve:threshold`
  - `accounting_period.close:entity`
  - `finance_report.read:entity`

### `CONTENT_EDITOR` (ویرایشگر محتوا)
- **Scope:** Assigned locales/sections
- **Guards:** Cannot publish claims-restricted content or write commerce data
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (5):**
  - `cms.page.draft:assigned`
  - `cms.page.edit:assigned`
  - `cms.article.draft:assigned`
  - `cms.asset.upload:assigned`
  - `cms.translation.edit:assigned`

### `CLAIMS_REVIEWER` (بازبین ادعا)
- **Scope:** Assigned products/markets
- **Guards:** No self-approval; evidence must be attached and versioned
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (3):**
  - `claim.evidence.read:assigned`
  - `claim.submit_review:assigned`
  - `claim.comment:assigned`

### `REGULATORY_OFFICER` (مسئول رگولاتوری/ایمنی)
- **Scope:** Assigned markets/products
- **Guards:** Named human owner; market scope; legal escalation and audit
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `claim.approve:market`
  - `claim.withdraw:market`
  - `product.market_release.approve:market`
  - `adverse_event.read:restricted`
  - `recall.approve:market`
  - `recall.close:market`

### `SYSTEM_ADMIN` (مدیر سامانه)
- **Scope:** Technical configuration only
- **Guards:** Cannot modify journal, order totals, stock ledger, claim approval or customer data without separate business role
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (5):**
  - `user.admin.manage`
  - `role.permission.manage`
  - `integration.secret.rotate`
  - `system.config.manage`
  - `audit.read:security`

### `AUDITOR` (حسابرس)
- **Scope:** Read-only assigned legal entity/scope
- **Guards:** Read-only; exports time-limited, logged and approved
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (6):**
  - `audit.read:assigned`
  - `finance.read:assigned`
  - `order.read:assigned`
  - `inventory.read:assigned`
  - `claims.read:assigned`
  - `export.request:assigned`

### `INTEGRATION_SERVICE` (حساب سرویس یکپارچه‌سازی)
- **Scope:** Named provider + narrow endpoints
- **Guards:** Machine identity, mTLS/signature, provider allowlist, no interactive login
- **Notes:** Default-deny applies to all permissions not explicitly granted.
- **Permissions (4):**
  - `payment.webhook.ingest:provider`
  - `carrier.event.ingest:provider`
  - `tax.invoice.status.ingest:provider`
  - `accounting.export.read:approved`


---

## 3. Granular Permission Catalog (105 Permissions)

- `accounting.export.read:approved`
- `accounting_period.close:entity`
- `address.manage:self`
- `adverse_event.read:restricted`
- `ar_ap.read:entity`
- `audit.read:assigned`
- `audit.read:security`
- `carrier.event.ingest:provider`
- `cart.manage:assigned`
- `cart.manage:self`
- `catalog.read:b2b`
- `checkout.create:self`
- `claim.approve:market`
- `claim.comment:assigned`
- `claim.evidence.read:assigned`
- `claim.submit_review:assigned`
- `claim.withdraw:market`
- `claims.read:assigned`
- `cms.article.draft:assigned`
- `cms.asset.upload:assigned`
- `cms.page.draft:assigned`
- `cms.page.edit:assigned`
- `cms.translation.edit:assigned`
- `consent.manage:self`
- `credit.adjustment.request:entity`
- `credit.read:assigned`
- `credit_limit.approve:threshold`
- `customer.timeline.read:limited`
- `discount.approve:threshold`
- `export.request:assigned`
- `finance.read:assigned`
- `finance_report.read:entity`
- `goods_receipt.read:assigned`
- `integration.secret.rotate`
- `inventory.read:assigned`
- `invoice.read:assigned`
- `invoice.read:entity`
- `journal.approve:entity`
- `journal.draft:entity`
- `journal.post:entity`
- `journal.reverse:entity`
- `lead.read:assigned`
- `lead.read:team`
- `lead.update:assigned`
- `lot.quarantine.request:assigned`
- `lot.quarantine:assigned`
- `lot.release:assigned`
- `loyalty.read:self`
- `membership.invite:assigned`
- `membership.revoke:assigned`
- `order.create:assigned`
- `order.read:assigned`
- `order.read:limited`
- `order.read:self`
- `org.application.read:assigned`
- `org.application.recommend:team`
- `org.document.upload:assigned`
- `org.profile.update:assigned`
- `org.read:assigned`
- `pack.confirm:assigned`
- `payment.initiate:assigned`
- `payment.reconcile:entity`
- `payment.webhook.ingest:provider`
- `payment_receipt.upload:assigned`
- `pick.confirm:assigned`
- `price_list.read:assigned`
- `product.market_release.approve:market`
- `profile.read:self`
- `profile.update:self`
- `purchase_order.create:assigned`
- `purchase_order.submit:assigned`
- `purchase_request.create:assigned`
- `quick_order.create:assigned`
- `quote.accept:assigned`
- `quote.approve:policy`
- `quote.create:assigned`
- `quote.read:assigned`
- `quote.revise:assigned`
- `quote.submit_for_approval:assigned`
- `recall.approve:market`
- `recall.close:market`
- `recall.execute:assigned`
- `receipt.scan:assigned`
- `referral.read:self`
- `refund.approve:threshold`
- `refund.request:entity`
- `reservation.override:threshold`
- `return.request.create:customer`
- `return.request:self`
- `rfq.create:assigned`
- `rfq.read:assigned`
- `role.permission.manage`
- `sales_report.read:team`
- `shipment.dispatch:assigned`
- `statement.read:assigned`
- `stock_adjustment.request:assigned`
- `stock_count.create:assigned`
- `supplier.read:assigned`
- `supplier_document.upload:assigned`
- `system.config.manage`
- `tax.invoice.status.ingest:provider`
- `ticket.create:assigned`
- `ticket.read:assigned`
- `ticket.update:assigned`
- `user.admin.manage`
