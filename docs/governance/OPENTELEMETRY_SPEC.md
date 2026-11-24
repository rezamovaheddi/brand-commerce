# OpenTelemetry Semantic Conventions & Observability Policy (TASK-158)

Status: CANONICAL  
Target Phase: P1 Foundation (ENG-05, ENG-06)  
Specification Base: OpenTelemetry v1.28.0  
Last Audited: 2026-11-24  

---

## 1. Principles of Observability
1. **End-to-End Distributed Tracing:** Every HTTP request or AsyncAPI event MUST carry W3C Trace Context headers (`traceparent`, `tracestate`).
2. **Tenant-Safe Context:** Multi-tenant operations MUST include `org.id` and `market.code` to permit isolated tenant performance troubleshooting.
3. **Strict PII Redaction:** No Personally Identifiable Information (phone numbers, national IDs, postal addresses, passwords, tokens) is ever permitted in span attributes, event names, or structured logs.

---

## 2. Standard Semantic Attributes Registry

| Attribute Key | Type | Description | Example Value |
|---|---|---|---|
| \`service.name\` | String | Application or worker identifier | \`bc-api\`, \`bc-storefront\` |
| \`service.version\` | String | Monorepo semantic version | \`0.1.0\` |
| \`deployment.environment\` | String | Environment tier | \`production\`, \`staging\`, \`development\` |
| \`traceparent\` | String | W3C distributed trace header | \`00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\` |
| \`tenant.id\` | String (UUID) | Multi-tenant organization UUID | \`e2c0e86b-568b-4b92-8067-16744883fbb2\` |
| \`market.code\` | String (ISO) | Regional commercial market | \`IR\` |
| \`commerce.order.id\` | String (UUID) | Canonical order UUID | \`e8b6bca5-b3e6-425c-897f-94ad691c28f3\` |
| \`commerce.amount.minor\`| Integer | Integer minor currency units | \`18500000\` (IRR) |
| \`commerce.currency\` | String (Enum) | Currency code | \`IRR\` |

---

## 3. Forbidden Span Attributes (PII Blacklist)
The automated telemetry auditor rejects spans containing any of the following:
- \`customer.phone\` / \`phone\` (MUST be redacted as \`0912***1234\`)
- \`customer.national_id\` / \`national_id\` (MUST be redacted as \`1010***6789\`)
- \`payment.card_number\` / \`card_token\`
- \`auth.password\` / \`auth.token\` / \`api_key\`
