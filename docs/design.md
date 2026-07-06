
---
name: Lumina Digital
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#424754'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#00685d'
  on-tertiary: '#ffffff'
  tertiary-container: '#008376'
  on-tertiary-container: '#f4fffb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
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
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---
## Brand & Style

The design system is centered on a "Lite & Premium" aesthetic, specifically tailored for the sale of intellectual property—ebooks and digital courses. The brand personality is professional yet approachable, aiming to evoke a sense of clarity, intelligence, and immediate value.

The design style leverages **Modern Minimalism** with a focus on high-clarity information architecture. By utilizing expansive whitespace and a refined sans-serif typeface, the UI recedes to let the educational content take center stage. Key characteristics include:

- **Spaciousness:** Large internal padding and margins to prevent cognitive overload.
- **Precision:** Fine lines and subtle tonal shifts instead of heavy borders.
- **Conversion-Centric:** A clear visual hierarchy where "Digital Blue" acts as a beacon for user progression.

## Colors

This design system employs a palette that balances trust with modern digital energy.

- **Primary (Digital Blue):** Used for primary call-to-action buttons, active states, and critical navigation links. It represents reliability and technical proficiency.
- **Secondary (Violet):** Used for premium badges, course categories, or "Level Up" features.
- **Tertiary (Teal):** Reserved for success states, "In Stock" indicators, or subtle highlights in marketing copy.
- **Surface:** The foundation is pure white (#FFFFFF) for cards and containers, set against a very light grey (#F9FAFB) background to create soft contrast without the harshness of pure black-on-white.
- **Text (Slate):** A deep slate (#0F172A) provides superior readability for long-form educational content compared to true black.

## Typography

The system uses **Inter** exclusively to maintain a systematic, utilitarian, and highly readable interface across all digital touchpoints.

The type scale is generous. Large display sizes use tighter letter spacing and heavier weights to create a "Premium Editorial" feel for product titles. Body text is set with ample line height (1.5x - 1.6x) to ensure that descriptions of complex course curriculum remain legible and inviting. Semantic labels use a medium weight to differentiate them from standard body copy at smaller sizes.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile devices.

- **Desktop:** 12-column grid with a maximum container width of 1280px. Gutters are fixed at 24px to maintain breathability between product cards.
- **Mobile:** Single column with 16px side margins.
- **Spacing Rhythm:** Based on a 4px baseline, but primarily using 8px increments. "Generous Whitespace" is achieved by using the `lg` (40px) and `xl` (64px) units for vertical section separation, ensuring the user's focus is never pulled in too many directions at once.

## Elevation & Depth

Depth is communicated through **Ambient Shadows** and **Tonal Layering**.

The background layer is `#F9FAFB`. Secondary containers (like product cards) sit on the primary surface in pure white. To create a sense of "lift," a soft, diffused shadow is applied:

- **Default Card State:** `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`.
- **Hover/Active State:** A slightly more pronounced shadow with a hint of the Primary color in the blur `0 10px 15px -3px rgba(59, 130, 246, 0.1)`.

Avoid heavy borders; use subtle 1px strokes in `#E5E7EB` only when necessary to define boundaries on white backgrounds.

## Shapes

The shape language is defined by **Softness and Modernity**.

A standard border radius of **12px** (0.75rem) is used for buttons and input fields to feel approachable. Larger components, such as product thumbnails, course cards, and modal windows, use a **16px** (1rem) radius to emphasize the "Lite" and friendly nature of the brand. This consistent rounding removes "sharpness" from the UI, aligning with the premium digital product market.

## Components

- **Buttons:** Primary buttons are solid "Digital Blue" with white text. High-contrast is mandatory. Hover states involve a subtle darken (10%). Secondary buttons use a subtle "Digital Blue" tint background with primary-colored text.
- **Cards:** Product cards must include a high-quality thumbnail with 16px rounding. Content within the card follows the 24px padding rule.
- **Input Fields:** Use the `#F9FAFB` surface color for the field background to distinguish it from the white card surface. Focus states must use a 2px "Digital Blue" ring.
- **Chips/Badges:** Small labels for "Bestseller," "Ebook," or "Video Course." Use the tertiary (Teal) or secondary (Violet) colors with 10% opacity backgrounds and full-saturation text.
- **Course Progress Bars:** Thin 8px tracks with a Primary color fill and a 4px rounded cap to show student progression.
