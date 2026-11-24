# Operational Runbook & Tiered On-Call Escalation Matrix
**Document ID:** RUN-OPS-001  
**Canonical Tracking:** `TASK-105` / `S-063` (`Platform / SRE / P7 Pilot & Launch`)  
**Status:** APPROVED & OPERATIONAL  
**Version:** 1.0.0  

---

## 1. On-Call Escalation Tiers & Response SLAs

| Severity | Definition | Response SLA | Target MTTR | Notification Channel | Incident Commander |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Core checkout down, payment gateway outage, data corruption, security breach | $< 15\text{ mins}$ | $< 60\text{ mins}$ | PagerDuty + Voice Call + SMS | Tech Lead / SRE Lead |
| **P1 (Major)** | B2B Portal inaccessible, search failure, BullMQ queue lag $> 10,000$ jobs | $< 30\text{ mins}$ | $< 120\text{ mins}$ | PagerDuty + Slack `#ops-critical` | Lead Backend Engineer |
| **P2 (Moderate)** | Non-blocking admin dashboard degradation, slow report generation | $< 2\text{ hours}$ | $< 8\text{ hours}$ | Slack `#ops-alerts` | On-Call SRE Engineer |
| **P3 (Minor)** | Minor UI cosmetic glitch, non-critical telemetry metric drop | $< 8\text{ hours}$ | Next Sprint | Jira Backlog | Component Owner |

---

## 2. On-Call Contact Roster & Escalation Hierarchy

```
[Tier 1: NOC / SRE On-Call] (Response: < 15m)
        │ (Unresolved after 20m or P0 Severity)
        ▼
[Tier 2: Platform & Backend Tech Lead] (Response: < 30m)
        │ (Critical Infrastructure or Security Escalation)
        ▼
[Tier 3: Executive Incident Command]
  ├─ CTO / Head of Engineering
  ├─ Chief Information Security Officer (CISO)
  └─ Head of Regulatory & Quality Assurance (Dermavia IFDA Officer)
```

- **SRE Primary On-Call:** `sre-primary@brandcommerce.local` (`+98-912-000-1122`)
- **Backend Architecture Lead:** `backend-lead@brandcommerce.local` (`+98-912-000-3344`)
- **Database DBA On-Call:** `dba-primary@brandcommerce.local` (`+98-912-000-5566`)
- **Security Incident Commander:** `security-lead@brandcommerce.local` (`+98-912-000-7788`)
- **Regulatory / IFDA Officer:** `regulatory-lead@brandcommerce.local` (`+98-912-000-9900`)

---

## 3. Standard Operating Playbooks (SOPs)

### Playbook A: Payment Gateway Outage & Automatic PSP Swap
1. **Detection:** Shaparak / Asan Pardakht webhook error rate $> 2.0\%$ for 3 consecutive minutes, or payment initiation timeout $> 5,000\text{ms}$.
2. **Containment:**
   - Execute zero-downtime PSP failover switch via configuration flag:
     ```bash
     curl -X POST http://localhost:3001/api/v1/admin/psp/failover \
       -H "x-admin-key: $ADMIN_KEY" \
       -d '{"activePsp": "PASARGAD_SECONDARY", "reason": "Shaparak 504 Gateway Timeout"}'
     ```
   - Verify fallback gateway health endpoint returns `HTTP 200 OK`.
3. **Reconciliation:** Trigger BullMQ transactional reconciliation job to query pending Shaparak transaction status tokens (`VERIFY_PENDING_TX`).

### Playbook B: PostgreSQL 16 Primary Failure & Standby Promotion
1. **Detection:** Database health check fails for 3 consecutive probes ($15\text{s}$ total).
2. **Containment:**
   - Patroni / Sentinel cluster triggers automatic primary election.
   - If manual failover required, promote standby replica:
     ```bash
     pg_ctl promote -D /var/lib/postgresql/16/standby
     ```
   - Repoint PgBouncer connection pooler endpoint to new primary IP.
   - Run verification script: `node scripts/run-real-service-integration.mjs`.

### Playbook C: High-Contention Inventory Lock Deadlocks (`PG 40P01`)
1. **Detection:** Postgres log contains `deadlock detected (SQLSTATE 40P01)` on `InventoryItem` table during flash sales.
2. **Containment:**
   - Verify pessimistic lock order: all transactions MUST acquire locks ordered by `variantId ASC`.
   - BullMQ worker captures deadlock error and applies exponential backoff with random jitter ($50\text{ms} \dots 250\text{ms}$).
   - Zero overselling invariant is strictly preserved by the database constraint `onHand - reserved >= 0`.

### Playbook D: Redis Sentinel Failover & Stalled BullMQ Jobs
1. **Detection:** Queue worker emits `Missing lock for job` or Redis master ping timeout $> 3,000\text{ms}$.
2. **Containment:**
   - Sentinel elects standby Redis instance; connection re-established automatically.
   - Clean up zombie stalled jobs and route poison pills to Dead Letter Queue (`bc-commerce-dlq`).
   - Run verification: `node scripts/verify-workflow-platform.mjs`.

### Playbook E: Emergency Pharmaceutical Batch Recall
1. **Detection:** Regulatory circular received from IFDA or laboratory stability breach reported.
2. **Containment:**
   - Execute emergency batch freeze via Admin Console or API:
     ```bash
     curl -X POST http://localhost:3001/api/v1/admin/governance/batch-recall \
       -H "x-admin-key: $ADMIN_KEY" \
       -d '{"batchNumber": "LOT-2026-01B", "severity": "CLASS_I", "reason": "Active ingredient degradation"}'
     ```
   - Verify public storefront immediately hides the batch ($< 500\text{ms}$).
   - Automated notification dispatches to all affected clinics and retail buyers.
