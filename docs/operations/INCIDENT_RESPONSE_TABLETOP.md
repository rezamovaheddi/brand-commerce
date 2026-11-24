# Incident Response Tabletop Drill & Crisis Containment Specification
**Document ID:** SEC-SIM-002  
**Canonical Tracking:** `TASK-138` / `S-064` (`Security / Platform / P7 Pilot & Launch`)  
**Standard:** NIST SP 800-61 Rev. 2 & ISO/IEC 27035  
**Status:** APPROVED & TESTED  
**Version:** 1.0.0  

---

## 1. Executive Summary & Objective

This document defines the simulation methodology and automated execution of crisis response drills for four critical threat models:
1. **Scenario 1:** Payment Settlement Partition & Double-Spend Hazard
2. **Scenario 2:** Compromised Administrative Key & Insider Misuse
3. **Scenario 3:** Class-I Pharmaceutical & Cleanroom Product Batch Recall
4. **Scenario 4:** Malicious WAF-Bypass & SQL Injection Penetration Attempt

Every scenario is codified into an automated verification harness (`scripts/simulate-incident-tabletop.mjs`) ensuring containment times, tamper-resistance, and alert dispatch comply with regulatory SLAs.

---

## 2. Tabletop Scenario Specifications

### Scenario 1: Payment Settlement Partition
- **Threat Vector:** Network partition causes drop of Shaparak payment verification webhook after cardholder has been charged.
- **Containment Protocol:**
  - Idempotency key prevents customer from initiating duplicate charges.
  - Periodic reconciliation cron sweeps unconfirmed orders in `PENDING_PAYMENT` older than 10 minutes.
  - Outbox event `PaymentDiscrepancyDetected` emitted for financial review.
- **Containment SLA:** $< 5\text{ minutes}$.

### Scenario 2: Compromised Admin Key & Insider Misuse
- **Threat Vector:** An administrative API key (`x-admin-key`) is leaked or used from an unauthorized IP range.
- **Containment Protocol:**
  - Invalidate active API key in Redis cache within $< 500\text{ms}$.
  - Terminate all active administrative sessions.
  - Verify audit trail tamper-resistance: each `AuditLog` row contains an immutable SHA-256 hash digest.
  - Export forensic snapshot to cold storage.
- **Containment SLA:** $< 60\text{ seconds}$.

### Scenario 3: Class-I Pharmaceutical Product Recall
- **Threat Vector:** Contamination or temperature excursion during cold-chain transport for clinical peptide formula (`LOT-2026-01B`).
- **Containment Protocol:**
  - Immediate state transition of all inventory items under the lot to `RECALLED_LOCKED`.
  - Storefront catalog API rejects queries for the affected lot.
  - Automated SMS/Email dispatched to all clinics and customers who purchased from the affected lot within the past 90 days.
- **Containment SLA:** $< 2\text{ minutes}$ from alert to catalog freeze.

### Scenario 4: SQL Injection & Exploitation Attempt
- **Threat Vector:** Malicious user attempts SQL injection via search or filter parameters (e.g. `' OR 1=1 --`).
- **Containment Protocol:**
  - Strict Prisma ORM parameterized queries guarantee zero SQL injection.
  - Input validation via Zod schemas rejects malformed characters.
  - Security event logged in `SecurityAudit` table with origin IP and user-agent.
- **Containment SLA:** Instantaneous ($0\text{ms}$ delay, blocked at HTTP filter layer).
