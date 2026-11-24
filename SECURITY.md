# Security Policy & Coordinated Vulnerability Disclosure

DERMAVIA Brand Commerce Platform takes the security of our modular monolith commerce infrastructure, partner integrations, and customer data seriously.

---

## 1. Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported | Security Maintenance Status |
|:---:|:---:|---|
| **v2.2.x** | :white_check_mark: | Current active release branch (`main`). Immediate patch release for any High/Critical CVE. |
| **v2.1.x** | :white_check_mark: | Critical security patches only. |
| **< v2.0.0** | :x: | End of Life (EOL). Migration to current active baseline is recommended. |

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability within this repository, **please DO NOT open a public GitHub issue**.

### Reporting Channels:
1. **GitHub Private Vulnerability Reporting:** Submit directly via the repository's **Security** tab -> **Report a vulnerability**.
2. **Security Contact:** Email us at `security@dermavia.local` (or reach out to the Repository Owner: `@rezamovaheddi`).

### What to Include:
- A clear summary of the potential vulnerability.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- An assessment of the potential impact (e.g. data leak, privilege escalation, bypass of financial invariants).
- Affected files, endpoints, or components.

---

## 3. Coordinated Vulnerability Disclosure (CVD) SLA

- **Acknowledgment:** We will acknowledge receipt of your report within **24 hours**.
- **Initial Assessment:** An initial triage and severity rating (CVSS v3.1) will be shared within **48 hours**.
- **Remediation & Patching:**
  - **Critical (CVSS 9.0–10.0):** Patch developed, verified, and deployed within **24 hours**.
  - **High (CVSS 7.0–8.9):** Patch deployed within **7 calendar days**.
  - **Medium/Low:** Scheduled into the next release cycle.
- **Public Disclosure:** Coordinated release and disclosure notes will be published only after the fix is safely deployed.

---

## 4. Fundamental Security Invariants

All code contributions must adhere to the following automated security invariants:

1. **Zero Plaintext Secrets:** No passwords, access tokens, webhook secrets, or private keys committed to tracked files.
2. **Financial Integrity:** All currency values must be strictly stored and calculated as integer minor units (`IRR`). Floating-point currency operations are strictly blocked by CI gates.
3. **Atomic Inventory Control:** All inventory reservations and ledger mutations must utilize atomic raw-SQL conditional updates (`onHand - reserved >= qty`) to prevent overselling.
4. **State Machine Transitions:** Orders and support tickets follow immutable, pure domain state machines; direct illegal status jumps are rejected.
5. **Cryptographic Validation:** Sandbox payments and webhooks enforce constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`).
