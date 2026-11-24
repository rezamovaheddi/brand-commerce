# Periodic Claim Evidence Expiry & Market Rule Compliance Report
**Canonical Tracking:** `TASK-144` / `S-060` (`Regulatory / Content / P8 Scale & Governance`)  
**Audit Timestamp:** 2026-11-24T10:20:59.739Z  
**System Status:** ALL VERIFIED GREEN  
**Auditor:** Automated Regulatory Compliance Guard (`scripts/enforce-claim-expiry.mjs`)  

---

## 1. Clinical Claims Expiry & Auto-Unpublish Audit

| Claim ID | Title / Formulation | Batch Ref | Expiry Date | Prior Status | Evaluated Action | Renewal Owner Notified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CLM-001** | کاهش ۴۳ درصدی لک‌های تیره و تنظیم س... | `LOT-2025-08A` | `2026-02-15` | `PUBLISHED` | **SUSPENDED_UNPUBLISHED** (AUTO_UNPUBLISHED_AND_HOLD) | `regulatory-lead@brandcommerce.local` |
| **CLM-002** | تحریک کلاژن‌سازی فیبروبلاست‌ها و تر... | `LOT-2024-11C` | `2025-11-01` | `PUBLISHED` | **SUSPENDED_UNPUBLISHED** (AUTO_UNPUBLISHED_AND_HOLD) | `qa-officer@brandcommerce.local` |
| **CLM-003** | آبرسانی عمقی ۷۲ ساعته با ۳ وزن مولک... | `LOT-2026-01B` | `2027-01-10` | `PUBLISHED` | **PUBLISHED** (NONE_ACTIVE) | `rnd-lead@brandcommerce.local` |
| **CLM-004** | محافظت سلولی در برابر آسیب رادیکال‌... | `LOT-2024-06D` | `2025-06-01` | `APPROVED` | **SUSPENDED_UNPUBLISHED** (AUTO_UNPUBLISHED_AND_HOLD) | `regulatory-lead@brandcommerce.local` |

---

## 2. Automated Renewal Alerts Dispatched

Total Renewal Alerts Dispatched: **3**

- **ALERT-1795515659740-CLM-001** -> Sent to `regulatory-lead@brandcommerce.local` for Claim `CLM-001` (Expired on: `2026-02-15`)
  - *Message:* "هشدار انقضای شواهد بالینی: ادعای CLM-001 به علت انقضای تاریخ اعتبار گواهی (2026-02-15) به صورت خودکار از دید عموم خارج و تعلیق گردید. لطفاً جهت تمدید با آزمایشگاه آکرودیته هماهنگ نمایید."

- **ALERT-1795515659740-CLM-002** -> Sent to `qa-officer@brandcommerce.local` for Claim `CLM-002` (Expired on: `2025-11-01`)
  - *Message:* "هشدار انقضای شواهد بالینی: ادعای CLM-002 به علت انقضای تاریخ اعتبار گواهی (2025-11-01) به صورت خودکار از دید عموم خارج و تعلیق گردید. لطفاً جهت تمدید با آزمایشگاه آکرودیته هماهنگ نمایید."

- **ALERT-1795515659740-CLM-004** -> Sent to `regulatory-lead@brandcommerce.local` for Claim `CLM-004` (Expired on: `2025-06-01`)
  - *Message:* "هشدار انقضای شواهد بالینی: ادعای CLM-004 به علت انقضای تاریخ اعتبار گواهی (2025-06-01) به صورت خودکار از دید عموم خارج و تعلیق گردید. لطفاً جهت تمدید با آزمایشگاه آکرودیته هماهنگ نمایید."

---

## 3. Storefront Public Gating Invariant Check

- **Total Claims Audited:** 4
- **Active Valid Claims Published:** 1
- **Expired / Suspended Claims Hidden:** 3
- **Leakage of Unverified Claims:** **STRICTLY ZERO (0) - PASSED**

---

## 4. Regulatory Market Rules & Circular Compliance

| Rule Circular ID | Effective Date | Regulatory Mandate | System Compliance Verification |
| :--- | :--- | :--- | :--- |
| **IFDA-CIRCULAR-2026-04** | `2026-03-01` | الزام برچسب‌گذاری و افشای اختصاصی لیمونن بالای ۰.۰۰۱٪ در فرمولاسیون‌های موضعی | **VERIFIED_COMPLIANT** |
| **MOH-COLD-CHAIN-2026-02** | `2026-01-15` | دستورالعمل کنترل و پایش دیجیتال زنجیره سرد دارو و فرآورده‌های بیولوژیک (۲ تا ۸ درجه) | **VERIFIED_COMPLIANT** |
