# گزارش ممیزی و سوئیت رگرسیون پرریسک (High-Risk Regression Test Report)

- تاریخ ارزیابی: **2026-11-24T10:08:54.349Z**
- استاندارد مرجع: **06-quality-operations/high-risk-regression-catalog-fa.csv (TASK-189)**
- وضعیت کلی: **100% PASSED (تایید کامل ۴۰ سناریوی حیاتی)**
- تعداد کل سناریوها: **40 سناریو در ۱۵ دامنه عملیاتی**
- سناریوهای موفق: **40 از 40**

---

## ۱. جدول نتایج سناریوهای رگرسیون پرریسک (۴۰ سناریو)

| کد آزمون | دامنه | سناریوی پرریسک | اینواریانت مورد انتظار | وضعیت | شواهد و جزئیات |
|---|---|---|---|:---:|---|
| **PAY-001** | Payments | Duplicate webhook event received out-of-order | Exactly one payment capture/order transition recorded; deduplicated cleanly | **PASSED** | First call: PROCESSED, Second call: IGNORED_DUPLICATE, Total captures: 1 |
| **PAY-002** | Payments | Webhook signature tampering and invalid HMAC rejection | Zero financial state modification; timing-safe rejection and security log triggered | **PASSED** | Valid signature accepted: true, Tampered signature rejected: true |
| **PAY-003** | Payments | Webhook amount or currency discrepancy against intent | Payment transition prevented; flagged for reconciliation exception | **PASSED** | Currency mismatch: RECONCILIATION_EXCEPTION, Amount mismatch: RECONCILIATION_EXCEPTION |
| **PAY-004** | Payments | User visits return URL without asynchronous provider capture confirmation | UI displays pending verification; order state remains strictly un-paid | **PASSED** | Displayed: PENDING_VERIFICATION, Stored Order State: AWAITING_PAYMENT |
| **PAY-005** | Refund | Concurrent refund requests exceeding initial captured amount | Cumulative refund strictly bounded by captured amount; over-refund prohibited | **PASSED** | First refund: true, Second over-refund: REFUND_EXCEEDS_CAPTURED, Total refunded: 2000000 IRR |
| **INV-001** | Inventory | High-concurrency race condition reserving final inventory unit | Single winner reservation; available inventory never drops below zero | **PASSED** | Buyer A: true, Buyer B: false, Final stock: 0, Total reserved: 1 |
| **INV-002** | Inventory | Duplicate execution of expired stock reservation release | Release event executes idempotently; duplicate stock releases prevented | **PASSED** | First release: true, Second release: idempotent=true |
| **INV-003** | Inventory | Attempt to allocate quarantined or recalled lot to order fulfillment | Quarantined/recalled inventory strictly blocked from reservation and checkout | **PASSED** | Active LOT-A allowed: true, Quarantined LOT-B blocked: true |
| **INV-004** | Inventory | Multi-lot stock fulfillment allocation priority | FEFO (First-Expired, First-Out) strictly enforced across batch lots | **PASSED** | Earliest allocated lot: LOT-EXP-2026-EARLY (Expires: 2026-08-01) |
| **INV-005** | Inventory | Maker-checker policy for inventory manual count adjustments | Self-approval prohibited; requires distinct verified supervisor identity | **PASSED** | Self-approval blocked: MAKER_CHECKER_VIOLATION, Peer-approval succeeded: true |
| **FIN-001** | Finance | Unbalanced double-entry journal posting attempt | Post strictly rejected; journal remains in draft until variance is zero | **PASSED** | Posted: false, Variance: 500000 IRR, Error: UNBALANCED_JOURNAL |
| **FIN-002** | Finance | Direct update or deletion of historical posted journal entry | Direct updates forbidden; corrections require atomic offsetting reversal journal | **PASSED** | Update blocked: POSTED_JOURNAL_IMMUTABLE, Journal remains immutable: 10000000 IRR |
| **FIN-003** | Money | Zero floating-point arithmetic enforcement on financial currency fields | Integer minor units only (IRR); floats, strings, and negative values rejected | **PASSED** | Integer 1.5M IRR: true, Float 1950000.5 rejected: true, String rejected: true |
| **FIN-004** | B2B Credit | Simultaneous B2B credit orders exceeding approved ceiling | Atomic limit check prevents over-extension; orders exceeding ceiling blocked | **PASSED** | Within limit: true, Exceeding ceiling: CREDIT_LIMIT_EXCEEDED, Utilized: 47000000 IRR |
| **FIN-005** | Finance | Payment gateway success with transient accounting worker network outage | Outbox pattern guarantees event preservation and zero loss across retry cycles | **PASSED** | Initial transient fail: true, Exponential retry delivery: true |
| **ORG-001** | Authorization | Cross-organization IDOR access attempt to foreign tenant invoice | Strict 404/403 barrier; zero foreign metadata or tenant PII leaked | **PASSED** | Legitimate query: HTTP 200, Cross-org attempt: HTTP 404 |
| **ORG-002** | Authorization | User membership revoked while holding active session token | Revocation list rejects token immediately; active session severed | **PASSED** | Authentication result: false, Error: TOKEN_REVOKED |
| **ORG-003** | Authorization | Privilege escalation via client-supplied role header tampering | Client role overrides ignored; permissions resolved strictly from trusted session | **PASSED** | Client claimed: SUPERADMIN, Effective trusted role: BUYER |
| **ORG-004** | Approval | Quote creator attempts to approve their own exceptional discount | Maker-checker policy blocks self-approval; requires supervisor authorization | **PASSED** | Self-approval blocked: CREATOR_CANNOT_APPROVE_OWN_DISCOUNT, Manager approval: true |
| **RFQ-001** | Quote | Buyer attempts acceptance of expired or obsolete quote revision | Acceptance rejected by domain state machine; quote remains expired | **PASSED** | Accepted: false, Error: QUOTE_EXPIRED |
| **RFQ-002** | Quote | Historical price or specification mutation on accepted RFQ quote | Accepted snapshot strictly immutable; subsequent changes require new revision | **PASSED** | Snapshot immutability verified; original line price preserved at 4500000 IRR |
| **LOY-001** | Loyalty | Duplicate delivery of order completion event to loyalty consumer | Point accrual executes idempotently; customer points accrued exactly once | **PASSED** | First accrual: true, Duplicate ignored: true, Final balance: 500 pts |
| **REF-001** | Referral | Self-referral, matching device fingerprint, or shared card payment ring | Referral bonus quarantined under fraud hold; zero automatic points release | **PASSED** | Referral decision: FRAUD_HOLD, Detection reason: COLLUSION_OR_SELF_REFERRAL |
| **REF-002** | Referral | Customer cancels or returns order that granted referral reward | Reward reversal debited from referrer ledger; debt recovery mechanism verified | **PASSED** | Clawback executed: true, Remaining points: 0, Debt: 0 |
| **CMS-001** | Claims | Editor attempts to publish marketing content with unapproved clinical claim | Claim Gate blocks publication; requires Qualified Person verified evidence | **PASSED** | Published: false, Gate Error: UNAPPROVED_CLINICAL_CLAIM |
| **CMS-002** | Claims | Clinical trial evidence validity reaches expiration timestamp | Automated job removes expired claim from active market release; flags audit | **PASSED** | Active valid claim: SPF 50+ Certified (Active: true), Expired claim revoked: Hypoallergenic 2024 (Active: false) |
| **SAFE-001** | Recall | Emergency product recall initiated for contaminated manufactured lot | Bidirectional genealogy traces all shipped customer orders and inventory bins | **PASSED** | Affected orders traced: 2, Recipients identified for safety notice broadcast |
| **SAFE-002** | Complaint | Customer support view of adverse medical complaint report | Patient PII masked; high severity event auto-escalated to Regulatory Pharmacovigilance | **PASSED** | Masked PII: 0912***7766, Auto-escalated to Regulatory QP: true |
| **SAFE-003** | Claims | Marketing promotional copy containing prohibited curative medical claims | Content filter rejects medical cure phrasing; restricts to cosmetic claims | **PASSED** | Valid cosmetic copy passed: true, Prohibited medical claim blocked: true |
| **PRIV-001** | Privacy | Customer GDPR/DSAR right-to-erasure request with statutory tax records | Marketing and browsing history purged; legal hold tax ledger strictly preserved | **PASSED** | Non-hold records purged; Statutory tax records retained: 1 |
| **PRIV-002** | Privacy | Customer PII present in distributed telemetry traces and collector logs | Automatic collector redaction sanitizes mobile and email before persistence | **PASSED** | Redacted mobile: 0912***6789, Redacted email: cu***@dermavia.com |
| **FILE-001** | Uploads | Spoofed PDF upload concealing executable Windows PE binary payload | Magic bytes inspection quarantines file; prevents public storage release | **PASSED** | Detected: application/x-dosexec, Action: QUARANTINE |
| **FILE-002** | Uploads | Client attempts asset retrieval using expired presigned storage URL | Access strictly denied with HTTP 403; expired token invalidated | **PASSED** | Status: HTTP 403, Error: SIGNATURE_EXPIRED |
| **I18N-001** | Localization | Persian RTL typography, zero letter-spacing, and bidirectional layout | Root layout enforces dir="rtl", lang="fa", and letter-spacing: 0 for Vazirmatn | **PASSED** | Direction: rtl, Language: fa, Letter-spacing: 0 |
| **A11Y-001** | Accessibility | Mouse-free keyboard navigation on critical checkout and B2B portal journeys | Interactive controls meet 44px minimum target and visible focus ring standards | **PASSED** | Touch target: 48x48px (>=44px), Focus ring: true |
| **OPS-001** | Recovery | Point-In-Time-Recovery (PITR) drill executed into isolated test database | Observed RTO < 1s (target < 1h); 100% row count and schema parity achieved | **PASSED** | Observed RTO: 0.576s, Target: < 3600s, Parity: 100% |
| **OPS-002** | Queue | Worker crashes after payment capture but prior to dispatch acknowledgement | Idempotent queue redelivery prevents duplicate shipment and extra customer charge | **PASSED** | Replay duplicate prevented: true, Dispatched again: false |
| **OPS-003** | Deployment | Database schema migration executed during active concurrent application traffic | Expand-contract pattern verified; backward compatibility prevents downtime | **PASSED** | Nullable/Default additions: true, Zero destructive drops: true |
| **OBS-001** | Observability | Distributed request correlation across Storefront, API, and asynchronous Worker | Trace context header propagates end-to-end with PII-redacted operational logs | **PASSED** | Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736, Cross-service propagation: verified |
| **SEC-001** | Security | Monorepo secret hygiene and prevention of credential leakage in version control | Zero plaintext tokens in git config or code; ephemeral credential injection verified | **PASSED** | Hardcoded secrets: 0, Git config sanitized: true |

---

## ۲. حوزه‌های تحت پوشش و اصول تضمین کیفیت
1. **Payments & Money:** حذف کامل اعداد اعشاری در محاسبات مالی، مدیریت وب‌هوک‌های نامعتبر، رد امضاهای دستکاری‌شده، عدم اضافه پرداخت در ریفاند همزمان.
2. **Inventory & ERP:** انبارداری FEFO، تفکیک وظایف ۲ نفره سازگار با ISO 22716، مسدودسازی بچ‌های مشکوک یا فراخوان‌شده، رزرو بدون اورسل.
3. **Finance & Ledgers:** لجر دوبل بدون واریانس، عدم امکان تغییر مستقیم اسناد ثبت‌شده، تطبیق سقف اعتبار سازمانی B2B.
4. **Security & Authorization:** مهار BOLA/IDOR، ابطال آنی نشست‌ها، جلوگیری از دستکاری نقش در هدرها، قاعده دو نفره تخفیفات استثنایی.
5. **Claims & Pharmacovigilance:** گیت ادعاهای علمی CMS، انقضای خودکار تاییدیه‌ها، رد ادعاهای درمانی ممنوعه، تریاژ و ردیابی شجره‌نامه بهداشتی بچ‌ها.
6. **Privacy & Reliability:** پالایش PII در تله‌متری و لاگ‌ها، حق فراموشی با حفظ الزامات قانونی مالیاتی، بازیابی بدون قطعی (PITR) و معماری بدون دان‌تایم.

---

> [!NOTE]
> این سوئیت به‌صورت خودکار در خط لوله ارزیابی کیفیت و CI گیت‌هاب اکشنز اجرا می‌شود و به عنوان گارد تضمین عدم بازگشت باگ در تغییرات آینده عمل می‌کند.
