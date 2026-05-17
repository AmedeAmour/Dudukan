---
name: Zenith Financial
colors:
  surface: '#f9f9ff'
  surface-dim: '#d9d9df'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f9'
  surface-container: '#ededf3'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e8'
  on-surface: '#1a1c20'
  on-surface-variant: '#424750'
  inverse-surface: '#2e3035'
  inverse-on-surface: '#f0f0f6'
  outline: '#737781'
  outline-variant: '#c2c6d1'
  surface-tint: '#2f5f9c'
  primary: '#00386c'
  on-primary: '#ffffff'
  primary-container: '#1a4f8b'
  on-primary-container: '#9bc2ff'
  inverse-primary: '#a6c8ff'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#98f994'
  on-secondary-container: '#0c7521'
  tertiary: '#582c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#793f00'
  on-tertiary-container: '#ffae6b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#0c4783'
  secondary-fixed: '#98f994'
  secondary-fixed-dim: '#7ddc7a'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77e'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f9f9ff'
  on-background: '#1a1c20'
  surface-variant: '#e2e2e8'
  status-alert: '#D32F2F'
  status-warning: '#F57C00'
  status-info: '#0288D1'
  surface-muted: '#F8FAFC'
  data-recurring: '#7E57C2'
  data-complex: '#26A69A'
typography:
  headline-xl:
    fontFamily: manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-display:
    fontFamily: jetbrainsMono
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style

The design system is centered on the concept of the "Premium Personal Assistant." It balances the precision of an algorithmic financial engine with the empathy of a dedicated advisor. The brand personality is **Empathetic & Professional**, focusing on reducing the anxiety often associated with long-term financial planning.

The visual style is **Corporate / Modern** with a high-end, editorial touch. It utilizes a "Utility-First" philosophy where data visualization is treated as a core brand asset rather than an afterthought. The interface should feel spacious, light, and structured, favoring clarity and "glanceability" to help users feel in control of their financial trajectory.

**Design Principles:**
- **Clarity over Clutter:** Every element must serve a functional purpose in the decision-making process.
- **Rhythm & Stability:** Consistent spacing and alignment to create a sense of order and reliability.
- **Progressive Disclosure:** Complex financial data is layered, showing high-level status first and details on demand.

## Colors

This design system uses a palette rooted in **Trust-Inspiring Blues** (Primary) and **Growth Greens** (Secondary). 

- **Primary Blue (#1A4F8B):** Represents stability, institutional strength, and professional guidance. Used for core navigation, primary actions, and branding.
- **Secondary Green (#43A047):** Symbolizes growth, "funded" status, and positive progress. Used for success states and wealth-building indicators.
- **Status Tones:** Red and Orange are reserved strictly for "Under-funding" and "Delay Alerts," ensuring they command immediate attention against the neutral backdrop.
- **Categorization:** Named colors like `data-recurring` and `data-complex` are used to distinguish project types at a glance within the dashboard and algorithm lists.

The default mode is **Light**, utilizing high-value neutrals to maintain a clean, "paper-like" professional feel.

## Typography

The typography strategy separates **narrative** from **data**.

1.  **Manrope (Headlines):** A modern, geometric sans-serif that provides a clean and welcoming "Premium Assistant" tone.
2.  **Inter (Body):** Used for all descriptive text and interface controls for maximum legibility and neutrality.
3.  **JetBrains Mono (Data/Numeric):** Specifically used for financial figures, costs, and delays. The monospaced nature ensures that columns of numbers align perfectly, aiding in financial comparison and feasibility checks.

Use `headline-xl` for dashboard summaries and `data-display` for primary balance or "Monthly Needs" figures.

## Layout & Spacing

The layout utilizes a **Fixed Grid** approach for desktop to maintain an editorial, "concierge" feel, while transitioning to a fluid single-column stack on mobile.

- **Desktop (12 Columns):** Content is centered with a 1280px max-width. Gutters are generous (24px) to provide "breathing room" for dense financial data.
- **Dashboard Modular Grid:** Projects and indicators are housed in cards that span 3, 4, or 6 columns depending on priority. 
- **Rhythm:** A 4px base unit governs all padding and margins. Vertical rhythm should favor larger gaps (32px+) between major sections (e.g., separating "Active Projects" from "Execution History") to prevent cognitive overwhelm.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** to convey hierarchy. 

- **Surface Levels:** The primary background is white. Secondary containers (like the "Feasibility Indicators" or "Project History") use a `surface-muted` (#F8FAFC) fill to create subtle separation.
- **Elevation:** Avoid heavy shadows. Instead, use a single "soft lift" for active cards: a very diffused 15% opacity shadow of the primary blue color. This makes the element feel like it is floating slightly above the page without adding visual weight.
- **Borders:** Use thin (1px) borders in a light gray-blue for all input fields and inactive card states. This reinforces the "organized" and "precise" nature of a financial tool.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) base radius. This softening of the UI helps the application feel "reassuring" and approachable rather than cold and clinical.

- **Buttons & Chips:** Use `rounded-xl` (1.5rem) for high-frequency interactive elements like "Manual Funding" or status chips to give them a friendly, tactile quality.
- **Project Cards:** Stick to the base 8px radius to maintain a structural, reliable appearance.
- **Progress Bars:** Should have fully rounded (pill-shaped) ends to emphasize movement and "flow" toward completion.

## Components

- **Buttons:** Primary buttons use the `primary_color_hex` with white text. Secondary buttons ("Automatic Funding") use an outlined style.
- **Status Chips:** Small, pill-shaped indicators using the Status/Data colors. They should include a small leading icon (e.g., a clock for "Delayed", a check for "Funded").
- **Financial Cards:** The core unit of the dashboard. Each card must include a clear Title, a Category Icon (e.g., a motorcycle for "Simple"), a Progress Bar, and a `data-display` numeric value for the target amount.
- **Input Fields:** Clean, bordered boxes with floating labels. When the algorithm is "Calculating," the input group should show a subtle pulse animation in the `primary_color`.
- **Progress Visualization:** Use a dual-track progress bar. A light gray track shows the total goal, a solid green track shows currently funded amounts, and a semi-transparent green extension shows "projected" funding based on the current algorithm allocation.
- **Feasibility Indicator:** A specialized component (usually a gauge or large percentage) that uses the Status colors to immediately signal if the current plan is viable.