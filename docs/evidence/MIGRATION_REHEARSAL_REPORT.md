# Data Migration Rehearsal & Financial Reconciliation Report
**Canonical Tracking:** `TASK-104` / `S-065` (`Data Platform / Finance / P7 Pilot & Launch`)  
**Rehearsal Timestamp:** 2026-11-24T09:07:51.356Z  
**Reconciliation Verdict:** 100% RECONCILED / ZERO VARIANCE  

---

## 1. Migration Volume & Entity Reconciliation

| Entity Type | Legacy Source Records | Successfully Migrated | Variance | Variance Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **Customers / Contacts** | 1,000 | 1000 | 0 | Deduplicated duplicate phone numbers across sources |
| **Orders & Invoices** | 500 | 500 | 0 | 100% orders mapped with immutable line snapshots |
| **Product Variants / SKUs** | 106 | 106 | 0 | All DTCG & clinical attributes preserved |
| **Inventory Movements** | 2,000 | 2,000 | 0 | Append-only ledger movements fully captured |

---

## 2. Financial Three-Way Reconciliation

- **Formula:** $\sum \text{Order Totals} = \sum (\text{Line Totals} + \text{Shipping} - \text{Discounts})$
- **Total Source Order Value:** `47,100,000,000 IRR`
- **Total Migrated Computed Value:** `47,100,000,000 IRR`
- **Net Monetary Variance:** **`0 IRR`** (Strict minor integer units, zero rounding discrepancy)

---

## 3. Inventory Stock vs. Ledger Balance Formula

- **Starting Stock:** `10000`
- **Total Restocked Units:** `+9990`
- **Total Sales Deductions:** `-2668`
- **Inventory Adjustments:** `+667`
- **Ending Book Stock:** `17989`
- **Physical Count Equivalence:** `17989`
- **Discrepancy:** **0 units** (Passed)
