# AsyncAPI 3.1.0 Contract & Schema Validation Report (TASK-181)

Generated at: 2026-11-24T09:42:38.514Z  
Specification Source: `docs/governance/asyncapi.yaml`  
Parser Engine: Native AsyncAPI 3.1.0 Strict Structure Validator  

## Summary
- **Overall Status:** PASSED (100% Green)
- **Rules Evaluated:** 5
- **Channels Cataloged:** 5
- **Operations Bound:** 5
- **Domain Messages:** 7

## Detailed Validation Gates
| Gate ID | Specification Invariant | Result | Evidence / Detail |
|---|---|---|---|
| ASYNC-01 | AsyncAPI Version 3.1.0 specification | **PASS** | `asyncapi: 3.1.0` |
| ASYNC-02 | All 5 core channels configured | **PASS** | `orderPlaced, paymentCaptured, inventoryReservationCreated, rfqSubmitted, sampleRequested` |
| ASYNC-03 | Consumer operations mapped | **PASS** | `receiveOrderPlaced, receivePaymentCaptured, receiveInventoryReservationCreated, receiveRfqSubmitted, receiveSampleRequested` |
| ASYNC-04 | Domain messages defined in components | **PASS** | `OrderPlaced, PaymentCaptured, InventoryReservationCreated, RfqSubmitted, SampleRequested` |
| ASYNC-05 | Event envelope and integer minor currency (IRR) enforced | **PASS** | `EventMetadata schema + zero-float minor units` |

## Cataloged Domain Events
| Event Name | Channel Address | Producer | Schema Version | Invariants |
|---|---|---|---|---|
| `OrderPlaced` | `commerce.order.placed` | Orders | 1.0.0 | `totalAmountMinor` (IRR integer), `customerPhone` |
| `PaymentCaptured` | `commerce.payment.captured` | Payments | 1.0.0 | `amountMinor` (IRR integer), verified `providerReference` |
| `InventoryReservationCreated` | `commerce.inventory.reserved` | Inventory | 1.0.0 | atomic `reservationId`, `expiresAt` timestamp |
| `RfqSubmitted` | `commerce.b2b.rfq-submitted` | B2B Portal | 1.0.0 | `nationalId`, `targetQuantity`, wholesale tier |
| `SampleRequested` | `commerce.sample.requested` | Storefront | 1.0.0 | `sampleQuotaRemaining`, sample-eligible verification |

## Architectural Invariants
1. **Zero Floats:** All monetary attributes in message schemas are strictly defined as integer minor units (`IRR`).
2. **Standard Envelope:** Every domain message extends `EventMetadata` guaranteeing `eventId` (UUID v4), `occurredAt` (UTC ISO-8601), `correlationId`, and `schemaVersion`.
3. **AsyncAPI 3.1 Compliance:** Conforms strictly to official AsyncAPI 3.1.0 channel and operation decoupling syntax.
