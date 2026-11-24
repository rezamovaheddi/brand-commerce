# Product Analytics & Roadmap Decision-Making Framework
**Document ID:** GOV-PROD-002  
**Canonical Tracking:** `TASK-142` / `S-062` (`Product / Data / P8 Scale & Governance`)  
**Status:** APPROVED & ADOPTED  
**Version:** 1.0.0  

---

## 1. Executive Summary & Purpose

This framework establishes the mathematical metrics, cohort retention models, B2B conversion funnels, and prioritization algorithms governing roadmap decisions for the Brand Commerce Platform. It mandates that no new epic or architectural migration is scheduled without direct traceability to quantifiable business and clinical KPIs.

---

## 2. Core Commerce KPIs & Mathematical Formulations

### 2.1 Cohort Retention Rate ($R_t$)
For any user cohort defined by registration or first purchase in month $t_0$, the retention rate at month $t$ is:
$$R_t = \frac{|U_{\text{active}, t} \cap U_{\text{cohort}, t_0}|}{|U_{\text{cohort}, t_0}|} \times 100\%$$
- **Target 30-Day B2C Retention:** $\ge 28\%$
- **Target 90-Day Clinic/B2B Retention:** $\ge 72\%$ (routine wholesale replenishments)

### 2.2 Repeat Purchase Rate ($RPR$)
$$RPR = \frac{\text{Total Customers with } \ge 2 \text{ Completed Orders}}{\text{Total Unique Customers with } \ge 1 \text{ Completed Order}} \times 100\%$$
- **Target Annual RPR:** $\ge 42\%$ for skincare formulations (due to 4-to-6 week consumable cycles).

### 2.3 B2B RFQ-to-Contract Conversion Funnel ($CVR_{\text{RFQ}}$)
$$CVR_{\text{RFQ}} = \frac{\text{Accepted B2B Quotes / Executed Orders}}{\text{Total Qualified RFQs Submitted}} \times 100\%$$
- **Target Conversion Rate:** $\ge 35\%$ for OEM/White-label inquiries.
- **Funnel Stages:**
  $$\text{RFQ Submitted} \xrightarrow{85\%} \text{Sample Kit Dispatched} \xrightarrow{60\%} \text{Formal Quote Issued} \xrightarrow{70\%} \text{Contract Executed}$$

### 2.4 Gross Margin ($GM$) & Unit Economics
$$GM = \frac{\text{Revenue} - \text{COGS}}{\text{Revenue}} \times 100\%$$
- Minor unit integer arithmetic guarantees zero rounding leakage.
- Target B2C GM: $\ge 68\%$. Target B2B wholesale GM: $\ge 44\%$.

---

## 3. RICE Prioritization Model for Roadmap Backlog

Every proposed feature is evaluated using the canonical RICE formula:
$$\text{Score}_{\text{RICE}} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

| Factor | Description | Scoring Scale |
| :--- | :--- | :--- |
| **Reach** | Number of unique users/clinics impacted per quarter | Direct count (e.g. 5,000 users) |
| **Impact** | Projected lift on conversion, GM, or retention | $0.25$ (Minimal), $0.5$ (Low), $1.0$ (Medium), $2.0$ (High), $3.0$ (Massive) |
| **Confidence**| Empirical evidence backing the hypothesis | $50\%$ (Low/Intuition), $80\%$ (Medium/Survey), $100\%$ (High/A-B Test Data) |
| **Effort** | Person-weeks required across engineering & QA | Integer weeks (e.g. 2, 4, 8) |

---

## 4. Empirical Decision Log & Governance Rules

1. **Evidence Precondition:** Backlog items scoring $< 500$ RICE points cannot bypass architectural or stability debt tasks.
2. **Post-Launch Impact Audits:** 60 days following any feature launch, an automated data review checks measured KPI lift against projected impact. If actual lift is $< 30\%$ of projection, feature is scheduled for review, redesign, or deprecation.
