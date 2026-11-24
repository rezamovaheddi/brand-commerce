import { z } from "zod";

/**
 * Standard Brand Commerce Event Metadata Envelope (AsyncAPI 3.1)
 */
export const EventMetadataSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  schemaVersion: z.number().int().min(1),
  occurredAt: z.string().datetime(),
  producer: z.string().min(1),
  aggregate: z.object({
    type: z.string().min(1),
    id: z.string().min(1),
    version: z.number().int().min(1),
  }),
  correlationId: z.string().uuid(),
  causationId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  marketId: z.string().nullable().optional(),
  traceparent: z.string().nullable().optional(),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;

/**
 * OrderPlaced Domain Event
 */
export const OrderPlacedEventSchema = EventMetadataSchema.extend({
  eventType: z.literal("OrderPlaced"),
  orderId: z.string().uuid(),
  orderNumber: z.string().min(1),
  marketId: z.string().min(1),
  customerPhone: z.string().min(10),
  totalAmountMinor: z.number().int().nonnegative(),
  currency: z.literal("IRR"),
  itemsCount: z.number().int().positive(),
});

export type OrderPlacedEvent = z.infer<typeof OrderPlacedEventSchema>;

/**
 * PaymentCaptured Domain Event
 */
export const PaymentCapturedEventSchema = EventMetadataSchema.extend({
  eventType: z.literal("PaymentCaptured"),
  paymentIntentId: z.string().uuid(),
  orderId: z.string().uuid(),
  amountMinor: z.number().int().nonnegative(),
  currency: z.literal("IRR"),
  providerReference: z.string().min(1),
  method: z.enum(["ZARINPAL", "MELLAT", "SAMAN", "WALLET", "CORPORATE_CREDIT"]),
});

export type PaymentCapturedEvent = z.infer<typeof PaymentCapturedEventSchema>;

/**
 * InventoryReservationCreated Domain Event
 */
export const InventoryReservationCreatedEventSchema = EventMetadataSchema.extend({
  eventType: z.literal("InventoryReservationCreated"),
  reservationId: z.string().uuid(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  lotId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

export type InventoryReservationCreatedEvent = z.infer<typeof InventoryReservationCreatedEventSchema>;

/**
 * RfqSubmitted Domain Event
 */
export const RfqSubmittedEventSchema = EventMetadataSchema.extend({
  eventType: z.literal("RfqSubmitted"),
  rfqId: z.string().uuid(),
  companyName: z.string().min(1),
  nationalId: z.string().min(1),
  targetQuantity: z.number().int().positive(),
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
});

export type RfqSubmittedEvent = z.infer<typeof RfqSubmittedEventSchema>;

/**
 * SampleRequested Domain Event
 */
export const SampleRequestedEventSchema = EventMetadataSchema.extend({
  eventType: z.literal("SampleRequested"),
  sampleRequestId: z.string().uuid(),
  productId: z.string().uuid(),
  customerPhone: z.string().min(10),
  sampleQuotaRemaining: z.number().int().nonnegative(),
});

export type SampleRequestedEvent = z.infer<typeof SampleRequestedEventSchema>;
