# Storybook & Component Workshop Inventory (TASK-187)

Generated at: 2026-11-24  
Workshop Endpoint: \`/design-system/workshop\`  
Design Tokens Reference: DTCG 2025.10 (\`tokens/brand.tokens.json\`)  
Typography: Persian Vazirmatn (\`letter-spacing: 0\`)  
Touch Target Standard: WCAG 2.1 Success Criterion 2.5.5 / 2.5.8 (\(\ge 44 \times 44\,\text{px}\))

---

## 1. Executive Summary
The Dermavia Component Workshop provides an isolated sandbox environment for inspecting component variants, interactive states (default, hover, active, loading, disabled), RTL/LTR directionality, and responsive viewports without affecting product runtime.

---

## 2. Component Story Registry (18 Stories)

| Story ID | Component | Variant | Interactive States | RTL / LTR | Accessibility Checks |
|---|---|---|---|---|---|
| **STORY-01** | \`Button\` | Primary Gold (CTA) | Default, Hover, Loading, Disabled | RTL / LTR | 44px touch target, explicit aria-label |
| **STORY-02** | \`Button\` | Cosmic Deep (Hero) | Default, Hover, Active, Disabled | RTL / LTR | 44px touch target, high-contrast text |
| **STORY-03** | \`Button\` | Outline Parchment | Default, Hover, Focus-visible | RTL / LTR | 16.79:1 contrast ratio |
| **STORY-04** | \`Button\` | Destructive Danger | Default, Hover, Disabled | RTL / LTR | Color + text indicator for errors |
| **STORY-05** | \`SampleBadge\` | Medical Sample | Static | RTL / LTR | High contrast amber badge, aria-hidden icon |
| **STORY-06** | \`SampleBadge\` | Full Retail Size | Static | RTL / LTR | Emerald contrast, clear Persian text |
| **STORY-07** | \`StatusBadge\` | Clinical Approved | Static | RTL / LTR | Color indicator with semantic label |
| **STORY-08** | \`StatusBadge\` | Pending Payment | Static | RTL / LTR | Warning contrast against light canvas |
| **STORY-09** | \`StatusBadge\` | Cold Chain 2-8°C | Static | RTL / LTR | Special storage requirement badge |
| **STORY-10** | \`StatusBadge\` | Lot Batch Expiry | Static | RTL / LTR | Monospace expiry date display |
| **STORY-11** | \`PriceTag\` | Standard Retail | Static | RTL / LTR | Integer minor currency (\`IRR\`), zero float |
| **STORY-12** | \`PriceTag\` | B2B Discount Tier | Static | RTL / LTR | Strikethrough original + discount percent |
| **STORY-13** | \`OrderTimeline\`| Draft Created | State Machine | RTL / LTR | Step 1 of 5 completed |
| **STORY-14** | \`OrderTimeline\`| Payment Confirmed | State Machine | RTL / LTR | Step 2 of 5 completed with provider ID |
| **STORY-15** | \`OrderTimeline\`| Cleanroom Processing| State Machine | RTL / LTR | Step 3 of 5 active with pulsing indicator |
| **STORY-16** | \`OrderTimeline\`| Pharma Shipped | State Machine | RTL / LTR | Step 4 of 5 tracking link enabled |
| **STORY-17** | \`ProductCard\` | Clinical Serum Card | Hover, Click | RTL / LTR | Dynamic sample badge, 44px quick-buy |
| **STORY-18** | \`ProductCard\` | B2B Bulk Tier Card | Hover, Click | RTL / LTR | Tier pricing, minimum order quantity |

---

## 3. Responsive Breakpoint Matrix

| Viewport Mode | Width | Primary Use Case | Overflow Guard |
|---|---|---|---|
| **Mobile** | \`390px\` | iPhone / Android handheld devices | \`overflow-x: hidden\`, stacked columns |
| **Tablet** | \`768px\` | iPad portrait, folding screens | 2-column grid, expanded padding |
| **Desktop** | \`1200px\` | Standard laptop and desktop monitors | Multi-column, full navigation layout |

---

## 4. Architectural Isolation Invariant
As required by **TASK-187 / ENG-09**, the Storybook and Component Workshop assets are strictly isolated:
- No test or story utilities leak into core API or Domain bundles.
- All styles consume CSS custom properties derived from canonical DTCG tokens.
- Interactive controls use native React state without non-standard runtime dependencies.
