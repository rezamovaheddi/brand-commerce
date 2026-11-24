---
name: identity-session-security
description: Design and review authentication, session lifecycle, OTP, MFA, passkeys, OIDC integration, revocation, and authorization boundaries across Next.js, NestJS, and B2B organizations.
---

# Identity and Session Security

- Read ADR-009 and `08-research/identity-and-session-options-fa.md` before changing authentication.
- Keep Identity ownership separate from Organization business membership and authorization policy.
- Never trust user, role, market, or organization IDs supplied only by browser headers/body.
- OTP challenges must be hashed, short-lived, single-use, attempt-limited, rate-limited, replay-resistant, and redacted from logs.
- Staff/admin MFA or passkey and step-up authentication are required for finance, refund, role, credit, export and recall operations.
- Session creation, rotation, expiry, revoke-one, revoke-all and membership-revoke behavior need tests.
- Verify issuer, audience, signature, expiry, nonce/state and key rotation where OIDC/JWT is used.
- Record security events with correlation IDs but without token/OTP/PII values.
- Run cross-app, cross-organization, session revocation, role tampering and account recovery tests.
- Do not claim a library selection is secure merely because it is popular; attach PoC evidence and a human security review.
