import {
  EventMetadataSchema,
  OrderPlacedEventSchema,
  PaymentCapturedEventSchema,
  InventoryReservationCreatedEventSchema,
  RfqSubmittedEventSchema,
  SampleRequestedEventSchema,
} from "./events";

describe("Domain Events Schema Invariants (AsyncAPI 3.1)", () => {
  const baseMetadata = {
    eventId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: "commerce-orders",
    aggregate: {
      type: "Order",
      id: "ord_1001",
      version: 1,
    },
    correlationId: "e2c0e86b-568b-4b92-8067-16744883fbb2",
    causationId: null,
    organizationId: null,
    marketId: "IR",
    traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  };

  it("validates base EventMetadataSchema envelope", () => {
    const parsed = EventMetadataSchema.parse({
      ...baseMetadata,
      eventType: "GenericEnvelope",
    });
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.producer).toBe("commerce-orders");
  });

  it("validates OrderPlaced canonical payload", () => {
    const event = {
      ...baseMetadata,
      eventType: "OrderPlaced",
      orderId: "e8b6bca5-b3e6-425c-897f-94ad691c28f3",
      orderNumber: "ORD-2026-001",
      marketId: "IR",
      customerPhone: "09121112233",
      totalAmountMinor: 15000000,
      currency: "IRR",
      itemsCount: 2,
    };
    const parsed = OrderPlacedEventSchema.parse(event);
    expect(parsed.eventType).toBe("OrderPlaced");
    expect(parsed.totalAmountMinor).toBe(15000000);
    expect(parsed.currency).toBe("IRR");
  });

  it("rejects non-integer minor currency in OrderPlaced", () => {
    const invalid = {
      ...baseMetadata,
      eventType: "OrderPlaced",
      orderId: "e8b6bca5-b3e6-425c-897f-94ad691c28f3",
      orderNumber: "ORD-2026-001",
      marketId: "IR",
      customerPhone: "09121112233",
      totalAmountMinor: 15000000.5, // float rejected
      currency: "IRR",
      itemsCount: 2,
    };
    expect(() => OrderPlacedEventSchema.parse(invalid)).toThrow();
  });

  it("validates PaymentCaptured event with verified provider", () => {
    const event = {
      ...baseMetadata,
      eventType: "PaymentCaptured",
      producer: "commerce-payments",
      aggregate: { type: "Payment", id: "pay_500", version: 1 },
      paymentIntentId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "e8b6bca5-b3e6-425c-897f-94ad691c28f3",
      amountMinor: 25000000,
      currency: "IRR",
      providerReference: "ZP_AUTH_99887766",
      method: "ZARINPAL",
    };
    const parsed = PaymentCapturedEventSchema.parse(event);
    expect(parsed.method).toBe("ZARINPAL");
    expect(parsed.amountMinor).toBe(25000000);
  });

  it("validates InventoryReservationCreated event", () => {
    const event = {
      ...baseMetadata,
      eventType: "InventoryReservationCreated",
      producer: "commerce-inventory",
      aggregate: { type: "Inventory", id: "inv_res_12", version: 1 },
      reservationId: "123e4567-e89b-12d3-a456-426614174001",
      orderId: "e8b6bca5-b3e6-425c-897f-94ad691c28f3",
      variantId: "123e4567-e89b-12d3-a456-426614174002",
      quantity: 5,
      expiresAt: new Date(Date.now() + 1800000).toISOString(),
    };
    const parsed = InventoryReservationCreatedEventSchema.parse(event);
    expect(parsed.quantity).toBe(5);
  });

  it("validates RfqSubmitted event", () => {
    const event = {
      ...baseMetadata,
      eventType: "RfqSubmitted",
      producer: "commerce-b2b",
      aggregate: { type: "Rfq", id: "rfq_09", version: 1 },
      rfqId: "123e4567-e89b-12d3-a456-426614174003",
      companyName: "کلینیک تخصصی درماتولوژی رازی",
      nationalId: "10103456789",
      targetQuantity: 50,
      status: "PENDING",
    };
    const parsed = RfqSubmittedEventSchema.parse(event);
    expect(parsed.companyName).toContain("رازی");
    expect(parsed.status).toBe("PENDING");
  });

  it("validates SampleRequested event", () => {
    const event = {
      ...baseMetadata,
      eventType: "SampleRequested",
      producer: "commerce-storefront",
      aggregate: { type: "SampleRequest", id: "smp_88", version: 1 },
      sampleRequestId: "123e4567-e89b-12d3-a456-426614174004",
      productId: "123e4567-e89b-12d3-a456-426614174005",
      customerPhone: "09129998877",
      sampleQuotaRemaining: 2,
    };
    const parsed = SampleRequestedEventSchema.parse(event);
    expect(parsed.sampleQuotaRemaining).toBe(2);
  });
});
