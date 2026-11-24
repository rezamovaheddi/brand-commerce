import { z } from "zod";

/**
 * Shared API contracts — single source of truth for API ⇄ Storefront.
 * All commerce data crossing the HTTP boundary must validate against these.
 */

export const ProductStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  titleFa: z.string(),
  titleEn: z.string(),
  /** Price in minor units (e.g. IRR rial). Currency & pricing rules are a
   *  PENDING BUSINESS DECISION — see docs/governance/PENDING_BUSINESS_DECISIONS.fa.md */
  priceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  isDefault: z.boolean(),
  status: ProductStatusSchema,
  /** onHand - reserved, computed SERVER-SIDE (P5-lite inventory). 0 ⇒ ناموجود. */
  availableToSell: z.number().int().nonnegative(),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const CategoryRefSchema = z.object({
  slug: z.string(),
  nameFa: z.string(),
  nameEn: z.string(),
});
export type CategoryRef = z.infer<typeof CategoryRefSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameFa: z.string(),
  nameEn: z.string(),
  descriptionFa: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  status: ProductStatusSchema,
  /** true ⇒ data is clearly-marked sample/seed data, must be shown as such in UI */
  isSample: z.boolean(),
  category: CategoryRefSchema.nullable(),
  variants: z.array(ProductVariantSchema),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().max(80).optional(),
  q: z.string().max(100).optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ProductListResponseSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

export const CategorySchema = CategoryRefSchema.extend({
  productCount: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;

export const HealthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  database: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const SystemTelemetrySchema = z.object({
  status: z.string(),
  uptime: z.number(),
  database: z.string(),
  nodeVersion: z.string(),
  memory: z.object({
    rssMb: z.number(),
    heapUsedMb: z.number(),
    heapTotalMb: z.number(),
    externalMb: z.number(),
  }),
  environment: z.string(),
  timestamp: z.string(),
});
export type SystemTelemetry = z.infer<typeof SystemTelemetrySchema>;

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Cart contracts (P2 slice — guest carts).
 * Server-authoritative: unit prices and totals are ALWAYS computed server-side
 * from the database; the client never supplies prices.
 */
export const AddCartItemSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(99),
});
export type AddCartItem = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});
export type UpdateCartItem = z.infer<typeof UpdateCartItemSchema>;

export const CartItemSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  /** Parent product display names — cart lines must show WHAT was bought,
   *  not only which variant size (UX rule from the 2026-11-21 visual review). */
  productNameFa: z.string(),
  productNameEn: z.string(),
  titleFa: z.string(),
  titleEn: z.string(),
  quantity: z.number().int().min(1).max(99),
  /** Server-resolved unit price in minor units. */
  unitPriceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  /** unitPriceMinor * quantity, computed server-side. */
  lineTotalMinor: z.number().int().nonnegative(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string(),
  status: z.enum(["ACTIVE", "CONVERTED", "ABANDONED"]),
  items: z.array(CartItemSchema),
  itemCount: z.number().int().nonnegative(),
  lineCount: z.number().int().nonnegative(),
  subtotalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
});
export type Cart = z.infer<typeof CartSchema>;

/**
 * Checkout contracts (P2 — guest order drafts).
 * The server re-resolves every price from the DB at checkout; the client
 * never sends money amounts. Payment fields arrive in P3 — a checkout here
 * NEVER records a payment.
 */
export const IranianPhoneSchema = z
  .string()
  .transform((v) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))
  .pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"));
export type IranianPhone = z.infer<typeof IranianPhoneSchema>;

export const CheckoutAddressSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: IranianPhoneSchema,
  province: z.string().min(2).max(40),
  city: z.string().min(2).max(40),
  postalCode: z
    .string()
    .transform((v) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))
    .pipe(z.string().regex(/^\d{10}$/, "کد پستی باید دقیقاً ۱۰ رقم باشد")),
  addressLine: z.string().min(5).max(200),
});
export type CheckoutAddress = z.infer<typeof CheckoutAddressSchema>;

export const CheckoutRequestSchema = z.object({
  cartId: z.string().min(1).max(64),
  address: CheckoutAddressSchema,
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

// Order statuses widen with the P3 payment slice; DRAFT/CANCELLED shipped in
// P2. The domain state machine (packages/domain) is the authority on
// transitions — this enum only mirrors what the API can emit.
export const OrderStatusSchema = z.enum([
  "DRAFT",
  "CANCELLED",
  "AWAITING_PAYMENT",
  "PAID",
  "REFUNDED",
  "SHIPPED",
  "DELIVERED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderLineSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  productNameFa: z.string(),
  productNameEn: z.string(),
  titleFa: z.string(),
  titleEn: z.string(),
  quantity: z.number().int().min(1).max(99),
  unitPriceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  lineTotalMinor: z.number().int().nonnegative(),
});
export type OrderLine = z.infer<typeof OrderLineSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema,
  currency: z.string().length(3),
  itemCount: z.number().int().nonnegative(),
  subtotalMinor: z.number().int().nonnegative(),
  address: CheckoutAddressSchema,
  lines: z.array(OrderLineSchema),
  createdAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

/**
 * Payment contracts (P3 — SANDBOX adapter).
 * isSandbox is LITERAL true in this slice: every payment record here is test
 * money and the UI must label it SANDBOX. The real PSP adapter will widen this
 * to a provider enum without changing the payment state machine.
 */
export const PaymentStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  status: PaymentStatusSchema,
  provider: z.string(),
  isSandbox: z.literal(true),
  createdAt: z.string(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const PayOrderResponseSchema = z.object({
  order: OrderSchema,
  payment: PaymentSchema,
});
export type PayOrderResponse = z.infer<typeof PayOrderResponseSchema>;

/** Sandbox gateway callback — HMAC-SHA256 signature over `${paymentId}.${result}`. */
export const SandboxCallbackSchema = z.object({
  result: z.enum(["succeeded", "failed"]),
  signature: z.string().min(16).max(128),
});
export type SandboxCallback = z.infer<typeof SandboxCallbackSchema>;

/**
 * Bootstrap backoffice contracts (operator console).
 * SECURITY: these endpoints sit behind a shared admin key until real RBAC
 * (P4) lands — they are operator tooling, never public surface.
 */
export const AdminOrderStatusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "CANCELLED", "AWAITING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "REFUNDED"]).optional(),
});
export type AdminOrderStatusQuery = z.infer<typeof AdminOrderStatusQuerySchema>;

export const AdminOrderListItemSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema,
  itemCount: z.number().int().nonnegative(),
  subtotalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  customerName: z.string(),
  customerPhone: z.string(),
  lineCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type AdminOrderListItem = z.infer<typeof AdminOrderListItemSchema>;

export const AdminOrderListResponseSchema = z.object({
  items: z.array(AdminOrderListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});
export type AdminOrderListResponse = z.infer<typeof AdminOrderListResponseSchema>;

export const AdminInventoryItemSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  productNameFa: z.string(),
  onHand: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  availableToSell: z.number().int().nonnegative(),
});
export type AdminInventoryItem = z.infer<typeof AdminInventoryItemSchema>;

export const AdjustStockSchema = z.object({
  deltaOnHand: z.coerce.number().int().refine((n) => n !== 0, "مقدار تغییر باید غیرصفر باشد"),
  note: z.string().min(3).max(200),
});
export type AdjustStock = z.infer<typeof AdjustStockSchema>;

export const LedgerEntrySchema = z.object({
  id: z.string(),
  variantId: z.string(),
  deltaOnHand: z.number().int(),
  deltaReserved: z.number().int(),
  reason: z.enum(["INITIAL", "RESERVE", "RELEASE", "SALE", "RESTOCK", "ADJUSTMENT"]),
  refType: z.string(),
  refId: z.string(),
  createdAt: z.string(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const AdminLedgerResponseSchema = z.object({
  items: z.array(LedgerEntrySchema),
});
export type AdminLedgerResponse = z.infer<typeof AdminLedgerResponseSchema>;

/**
 * B2B onboarding contracts (P4 scaffold — decision-independent).
 * Approve creates an Organization + OWNER membership; contract pricing/MOQ
 * (D-11) and credit (D-12) remain feature-gated off.
 */
export const CreateB2BApplicationSchema = z.object({
  contactName: z.string().min(2).max(80),
  contactPhone: IranianPhoneSchema,
  orgName: z.string().min(2).max(120),
  economicCode: z
    .string()
    .transform((v) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))
    .pipe(z.string().regex(/^\d{10,12}$/, "کد اقتصادی باید ۱۰ تا ۱۲ رقم باشد"))
    .optional(),
  licenseRef: z.string().max(200).optional(),
});
export type CreateB2BApplication = z.infer<typeof CreateB2BApplicationSchema>;

export const B2BApplicationStatusSchema = z.enum([
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "NEEDS_INFO",
]);
export type B2BApplicationStatus = z.infer<typeof B2BApplicationStatusSchema>;

/**
 * B3 application attachments: license/permit files attached to a distributor
 * application (public upload by application id — same trust level as the
 * tracking endpoint; admin reviews and downloads from the console).
 */
export const ApplicationAttachmentMetaSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  filename: z.string(),
  mime: z.string(),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().length(64),
  createdAt: z.string(),
});
export type ApplicationAttachmentMeta = z.infer<typeof ApplicationAttachmentMetaSchema>;

export const B2BApplicationSchema = z.object({
  id: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  orgName: z.string(),
  economicCode: z.string().nullable(),
  licenseRef: z.string().nullable(),
  status: B2BApplicationStatusSchema,
  reviewNote: z.string().nullable(),
  attachments: z.array(ApplicationAttachmentMetaSchema),
  createdAt: z.string(),
});
export type B2BApplication = z.infer<typeof B2BApplicationSchema>;

export const AdminB2BDecisionSchema = z.object({
  note: z.string().min(3).max(300),
});
export type AdminB2BDecision = z.infer<typeof AdminB2BDecisionSchema>;

/**
 * Organization members + access keys (N16 bootstrap access control).
 * Real credentials stay with the Identity context (P7); until then each
 * member holds an operator-issued high-entropy access key. Only the SHA-256
 * hash is stored — the plaintext key is returned exactly once at issuance.
 */
export const OrgMemberRoleSchema = z.enum(["OWNER", "BUYER", "ACCOUNTANT"]);
export type OrgMemberRole = z.infer<typeof OrgMemberRoleSchema>;

export const CreateOrgMemberSchema = z.object({
  contactName: z.string().min(2).max(80),
  contactPhone: IranianPhoneSchema,
  email: z.string().email("ایمیل نامعتبر است").max(120),
  role: OrgMemberRoleSchema,
});
export type CreateOrgMember = z.infer<typeof CreateOrgMemberSchema>;

export const OrgMemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  email: z.string(),
  role: OrgMemberRoleSchema,
  hasKey: z.boolean(),
  keyLast4: z.string().nullable(),
  keyRevokedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type OrgMember = z.infer<typeof OrgMemberSchema>;

export const CreateOrgMemberResponseSchema = OrgMemberSchema.extend({
  /** Plaintext access key — returned exactly once, never stored. */
  accessKey: z.string().regex(/^dvorg_[0-9a-f]{32}$/, "کلید نامعتبر"),
});
export type CreateOrgMemberResponse = z.infer<typeof CreateOrgMemberResponseSchema>;

export const OrgMeSchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  isSample: z.boolean(),
  memberName: z.string(),
  role: OrgMemberRoleSchema,
});
export type OrgMe = z.infer<typeof OrgMeSchema>;

/**
 * RFQ / Quote contracts (P4 scaffold, N11 immutable revisions).
 * Revision prices are SAMPLE-marked (isSandbox-style honesty): real contract
 * pricing awaits D-11. Accept converts to a real Order with inventory reserve.
 */
/**
 * RFQ item kinds (N10/N12): CATALOG lines reference (optionally) a catalog
 * variant; OEM lines are custom-manufacturing requests — variantId forbidden,
 * a technical specNote is mandatory. Pricing for OEM lines is operator-supplied
 * at quote time (still SAMPLE-marked until D-11).
 */
export const RfqItemKindSchema = z.enum(["CATALOG", "OEM"]);
export type RfqItemKind = z.infer<typeof RfqItemKindSchema>;

export const RfqItemInputSchema = z
  .object({
    variantId: z.string().max(64).optional(),
    productName: z.string().min(2).max(120),
    quantity: z.coerce.number().int().min(1).max(999),
    note: z.string().max(200).optional(),
    itemKind: RfqItemKindSchema.default("CATALOG"),
    specNote: z.string().max(500).optional(),
  })
  .superRefine((item, ctx) => {
    if (item.itemKind === "OEM") {
      if (item.variantId !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "خط OEM نباید محصول کاتالوگ داشته باشد",
          path: ["variantId"],
        });
      }
      if (item.specNote === undefined || item.specNote.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "خط OEM به شرح فنی (حداقل ۱۰ نویسه) نیاز دارد",
          path: ["specNote"],
        });
      }
    }
  });
export type RfqItemInput = z.infer<typeof RfqItemInputSchema>;

export const CreateRfqSchema = z.object({
  contactName: z.string().min(2).max(80),
  contactPhone: IranianPhoneSchema,
  items: z.array(RfqItemInputSchema).min(1).max(20),
  note: z.string().max(500).optional(),
  // N10 custom-order brief: target market, packaging, requested delivery and
  // confidentiality are optional at intake (sales may ask later).
  targetMarket: z.string().max(120).optional(),
  packaging: z.string().max(200).optional(),
  requestedDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ تحویل باید به شکل YYYY-MM-DD باشد")
    .optional(),
  confidentiality: z.boolean().default(false),
});
export type CreateRfq = z.infer<typeof CreateRfqSchema>;

export const RfqStatusSchema = z.enum([
  "SUBMITTED",
  "PRICED",
  "QUOTED",
  "ACCEPTED",
  "REJECTED",
  "CLOSED",
]);
export type RfqStatus = z.infer<typeof RfqStatusSchema>;

export const RfqItemSchema = z.object({
  id: z.string(),
  variantId: z.string().nullable(),
  productName: z.string(),
  quantity: z.number().int().min(1),
  note: z.string().nullable(),
  itemKind: RfqItemKindSchema,
  specNote: z.string().nullable(),
});
export type RfqItem = z.infer<typeof RfqItemSchema>;

export const QuoteRevisionSchema = z.object({
  id: z.string(),
  revisionNo: z.number().int().min(1),
  lines: z.array(
    z.object({
      variantId: z.string().nullable(),
      productName: z.string(),
      quantity: z.number().int().min(1),
      unitPriceMinor: z.number().int().nonnegative(),
      lineTotalMinor: z.number().int().nonnegative(),
      // Older revisions (pre-N10/N12) lack these — optional for compatibility.
      itemKind: RfqItemKindSchema.optional(),
      specNote: z.string().optional(),
    }),
  ),
  subtotalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  leadTimeDays: z.number().int().min(1).nullable(),
  paymentTerms: z.string().nullable(),
  isSample: z.literal(true),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type QuoteRevision = z.infer<typeof QuoteRevisionSchema>;

export const QuoteStatusSchema = z.enum(["SENT", "ACCEPTED", "REJECTED", "EXPIRED"]);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const QuoteSchema = z.object({
  id: z.string(),
  rfqId: z.string(),
  status: QuoteStatusSchema,
  currency: z.string().length(3),
  validUntil: z.string(),
  revisions: z.array(QuoteRevisionSchema),
});
export type Quote = z.infer<typeof QuoteSchema>;

/**
 * RFQ attachments (B3-lite): small files stored as bytes in the database —
 * policy (MIME whitelist, byte budget) lives in @bc/domain. Object storage
 * replaces this when the deployment slice lands.
 */
export const RfqAttachmentInputSchema = z.object({
  filename: z.string().min(1).max(120),
  mime: z.string().min(3).max(60),
  contentBase64: z.string().min(4).max(750_000),
});
export type RfqAttachmentInput = z.infer<typeof RfqAttachmentInputSchema>;

export const RfqAttachmentMetaSchema = z.object({
  id: z.string(),
  rfqId: z.string(),
  filename: z.string(),
  mime: z.string(),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().length(64),
  createdAt: z.string(),
});
export type RfqAttachmentMeta = z.infer<typeof RfqAttachmentMetaSchema>;

export const RfqSchema = z.object({
  id: z.string(),
  status: RfqStatusSchema,
  orgId: z.string().nullable(),
  contactName: z.string(),
  contactPhone: z.string(),
  items: z.array(RfqItemSchema),
  attachments: z.array(RfqAttachmentMetaSchema),
  note: z.string().nullable(),
  // N10 brief fields (nullable until provided).
  targetMarket: z.string().nullable(),
  packaging: z.string().nullable(),
  requestedDeliveryDate: z.string().nullable(),
  confidentiality: z.boolean(),
  quote: QuoteSchema.nullable(),
  createdAt: z.string(),
});
export type Rfq = z.infer<typeof RfqSchema>;

export const IssueQuoteSchema = z.object({
  validityDays: z.coerce.number().int().min(1).max(90),
  leadTimeDays: z.coerce.number().int().min(1).max(180).optional(),
  paymentTerms: z.string().max(200).optional(),
  note: z.string().max(300).optional(),
  /** rfqItemId → operator-supplied unit price for OEM lines (required per OEM line). */
  oemUnitPrices: z
    .record(z.string(), z.coerce.number().int().min(0).max(9_999_999_999))
    .optional(),
});
export type IssueQuote = z.infer<typeof IssueQuoteSchema>;

export const AcceptQuoteSchema = CheckoutAddressSchema;
export type AcceptQuote = z.infer<typeof AcceptQuoteSchema>;

export const QuoteAcceptResponseSchema = z.object({
  order: OrderSchema,
  quote: QuoteSchema,
});
export type QuoteAcceptResponse = z.infer<typeof QuoteAcceptResponseSchema>;

/**
 * CRM-lite (TASK-099 + K3): support tickets with an append-only customer/agent
 * timeline, and CRM leads captured from the contact/demo forms. Identity is a
 * P7 concern — tickets/leads are guest-authored and tracked by id, exactly
 * like applications and public RFQs.
 */

export const TicketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH"]);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketCategorySchema = z.enum(["SUPPORT", "SALES", "COMPLAINT", "ADVERSE_EVENT"]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TicketMessageAuthorSchema = z.enum(["CUSTOMER", "AGENT"]);
export type TicketMessageAuthor = z.infer<typeof TicketMessageAuthorSchema>;

export const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(120),
  body: z.string().min(10).max(1000),
  contactName: z.string().min(2).max(80),
  contactPhone: IranianPhoneSchema,
  category: TicketCategorySchema.default("SUPPORT"),
});
export type CreateTicket = z.infer<typeof CreateTicketSchema>;

export const TicketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  author: TicketMessageAuthorSchema,
  body: z.string(),
  createdAt: z.string(),
});
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  category: TicketCategorySchema,
  contactName: z.string(),
  contactPhone: z.string(),
  messages: z.array(TicketMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const TicketReplySchema = z.object({
  body: z.string().min(2).max(1000),
});
export type TicketReply = z.infer<typeof TicketReplySchema>;

export const AdminTicketUpdateSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
});
export type AdminTicketUpdate = z.infer<typeof AdminTicketUpdateSchema>;

export const LeadSourceSchema = z.enum(["CONTACT_FORM", "DEMO_REQUEST"]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const LeadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "DISCARDED"]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const CreateLeadSchema = z.object({
  contactName: z.string().min(2).max(80),
  contactPhone: IranianPhoneSchema,
  message: z.string().min(5).max(500),
  source: LeadSourceSchema.default("CONTACT_FORM"),
});
export type CreateLead = z.infer<typeof CreateLeadSchema>;

export const LeadSchema = z.object({
  id: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  message: z.string(),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  createdAt: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const AdminLeadUpdateSchema = z.object({
  status: LeadStatusSchema,
});
export type AdminLeadUpdate = z.infer<typeof AdminLeadUpdateSchema>;

/** Contact 360-lite: phone-keyed aggregation across orders/tickets/applications. */
export const CustomerProfileSchema = z.object({
  phone: z.string(),
  ordersCount: z.number().int().nonnegative(),
  paidTotalMinor: z.number().int().nonnegative(),
  lastOrderAt: z.string().nullable(),
  lastOrderStatus: z.string().nullable(),
  ticketsCount: z.number().int().nonnegative(),
  applicationsCount: z.number().int().nonnegative(),
  organizationName: z.string().nullable(),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

// ---- Security Audit Trail (GAP-031 / S-021) --------------------------------
export const AuditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actorId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  detailsJson: z.unknown().nullable(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

export const AuditLogListResponseSchema = z.object({
  items: z.array(AuditLogSchema),
});
export type AuditLogListResponse = z.infer<typeof AuditLogListResponseSchema>;

export * from "./tokens";
export * from "./events";
export * from "./content-governance";
export * from "./feature-flags";
export * from "./integrations";


