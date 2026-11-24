# Comprehensive Design & Developer Handoff Specification (TASK-173)

Status: CANONICAL  
Target Audience: Frontend Engineers, QA Engineers, Product Designers  
Last Audited: 2026-11-24  
Design System Alignment: Warm Clinical Luxury (DTCG 2025.10)  

---

## 1. Route Map & Rendering Expectations (21 Routes)

| Route URI | Purpose & View Description | Rendering Strategy | Key Components |
|---|---|---|---|
| \`/\` | Hero showcase, luxury catalog canopy, floating audio dock | Static prerender (ISR 60s) | \`HomeHero\`, \`CreamCanopy\`, \`FloatingDock\` |
| \`/products\` | Filterable dermaceutical catalog with sample badges | Dynamic Server-rendered | \`ProductCard\`, \`PriceTag\`, \`SampleBadge\` |
| \`/products/[slug]\` | Product details, clinical claims, lot batch info | Dynamic Server-rendered | \`SkinConsultationModal\`, \`PriceTag\` |
| \`/cart\` | Anonymous & authenticated shopping bag | Client Interactive | \`CartDrawer\`, \`PriceTag\` |
| \`/checkout\` | Form validation, address, IRR order snapshot | Client Interactive | \`CheckoutForm\`, \`OrderSummary\` |
| \`/orders\` | Customer orders list | Client Protected | \`OrderListItem\`, \`StatusBadge\` |
| \`/orders/[id]\` | 5-step order tracking timeline & delivery info | Dynamic Server-rendered | \`OrderTimeline\`, \`InvoiceCard\` |
| \`/b2b/apply\` | B2B Wholesale application with document upload | Client Interactive | \`FileUpload\`, \`ApplicationForm\` |
| \`/b2b/portal\` | Wholesale portal, credit limit, bulk inventory | Client Protected | \`OrgSummary\`, \`RfqTable\` |
| \`/b2b/rfq\` | Custom formulation & bulk quote request | Client Interactive | \`RfqForm\`, \`SpecificationUpload\` |
| \`/admin\` | Operations console, customer 360, orders | Client Protected | \`AdminStats\`, \`OrdersTable\` |
| \`/admin/governance\`| Claims lifecycle (6 states), cold-chain & recall | Client Protected | \`ClaimsStepper\`, \`RecallTrigger\` |
| \`/design-system\` | DTCG design token visualizer & contrast tester | Static prerender | \`TokenGrid\`, \`ContrastMatrix\` |
| \`/design-system/workshop\`| Component workshop, RTL toggle, 44px overlay | Client Interactive | \`ButtonStory\`, \`BadgeStory\` |
| \`/loyalty\` | Loyalty points, sample tiers, rewards | Static prerender | \`TierProgress\`, \`RewardsList\` |
| \`/magazine\` | Dermatological science editorial articles | Static prerender | \`ArticleCard\`, \`AuthorBadge\` |
| \`/about\` | Brand philosophy, green chemistry, certifications | Static prerender | \`BrandStory\`, \`Certifications\` |
| \`/contact\` | Customer contact form & clinic address | Static prerender | \`ContactForm\`, \`MapCard\` |
| \`/support\` | 3-tab CRM-lite support hub (lead, ticket, FAQ) | Client Interactive | \`TicketForm\`, \`FaqAccordion\` |
| \`/account\` | User profile, saved addresses, skin type | Client Protected | \`ProfileCard\`, \`SkinProfile\` |
| \`/_not-found\` | Branded 404 error page | Static prerender | \`NotFoundIllustration\` |

---

## 2. Interaction & State Design Rules
1. **Touch Target Sizing:** All buttons, inputs, and clickable elements MUST satisfy minimum \(\ge 44 \times 44\,\text{px}\) bounding box (WCAG 2.1 Criterion 2.5.5 / 2.5.8).
2. **Accessible Labels:** Every form input MUST carry an explicit \`aria-label\` or \`<label htmlFor="...">\`.
3. **Typography Standard:** Persian text uses \`font-family: 'Vazirmatn', sans-serif\` with \`letter-spacing: 0\`. No tracking classes (\`tracking-wider\`, \`tracking-tight\`) on Persian scripts.
4. **Logical CSS Properties:** Layout alignment uses bidirectional logical rules:
   - Margins: \`ms-*\` (margin-inline-start), \`me-*\` (margin-inline-end)
   - Paddings: \`ps-*\` (padding-inline-start), \`pe-*\` (padding-inline-end)
   - Positioning: \`start-*\`, \`end-*\` instead of \`left-*\`, \`right-*\`

---

## 3. Financial Invariant Contract (Zero Float)
- **Currency Code:** Strictly \`IRR\` (Iranian Rial).
- **Amount Storage:** Minor integer units ONLY (\`priceMinor\`, \`amountMinor\`, \`totalAmountMinor\`).
- **Formatting:** Handled by \`formatPrice(minor, currency)\` in \`apps/storefront/lib/format.ts\` rendering Persian localized numerals without decimal floats.

---

## 4. Design Token Reference (DTCG 2025.10)
All components consume variables from \`apps/storefront/styles/generated-tokens.css\`:
- Primary Canvas: \`var(--dtcg-color-primitives-canvas, #F7F0E9)\`
- Primary Ink: \`var(--dtcg-color-primitives-ink, #492E22)\`
- Brand Accent: \`var(--dtcg-color-primitives-brandrose, #C38AA3)\`
- Action Primary: \`var(--dtcg-color-primitives-action, #7A4B60)\`
- Card Paper: \`var(--dtcg-color-primitives-paper, #FAF7F3)\`
- Border Base: \`var(--dtcg-color-primitives-borderbase, #E9DCD3)\`
