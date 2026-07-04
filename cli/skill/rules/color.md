# Color & Theme

Color systems, brand polarity, neutral tinting, and accent management.

## Brand Theme Polarity

Dark brands (Stripe, Linear, Vercel) → dark video. Light brands (Notion, Apple) → light video.

**Edge case:** When marketing site and product UI differ (e.g. OpenAI.com is white but ChatGPT is dark), follow the **PRODUCT UI polarity** — the video builds product mockups, not marketing pages.

## Tint Neutrals Toward Brand Hue

Pure gray (#808080) is dead. Add subtle brand color hint:
- Warm brands → warm neutrals (#2A2825)
- Cool/tech brands → cool neutrals (#1E2028)
- **Never mix warm and cool neutrals** — creates visual tension

## 60-30-10 Rule

- 60% neutral backgrounds/whitespace
- 30% secondary colors (text, borders, inactive)
- 10% accent (CTAs, highlights) — works BECAUSE it's rare

## Accent at 3 Opacity Levels

Every accent color needs three states:
- **Full** — text, icons, active states
- **15-20%** — tinted card backgrounds, hover states
- **5-8%** — subtle background washes, atmospheric tints

## Scene-Specific Color Tinting

Each vignette gets its own accent that tints background (5-10% opacity), card borders, icon containers. Creates variety while maintaining brand cohesion.

## Dark Theme Token System

```
bg:          #080B0A  (near-black, brand-tinted)
panel:       #0F1312  (dark panel)
card:        #161B19  (elevated surface)
surface:     #1C2220  (interactive surface)
text:        #FFFFFF  (primary — hero headlines only)
textBody:    #E2E8E6  (off-white body)
textMuted:   rgba(226,232,230,0.38)
border:      rgba(accent, 0.08)
borderActive: rgba(accent, 0.15)
```

**Never pure black (#000) or pure white (#FFF) for large areas.** Reserve #FFF for hero headlines.

## Light Theme Adaptation

- Background: brand's actual bg (#FFFFFF or near-white)
- Film grain: 1-2% opacity, `mixBlendMode: "multiply"`
- Glass: `rgba(0,0,0,0.03)` surface
- Shadows replace glows: `box-shadow` with black alpha
- Borders: `rgba(0,0,0,0.08)`

## Semantic Colors

Green = positive/success, red = negative/error, amber = warning, blue = info. Never cross these meanings.

## Maximum 1 Vibrant Accent Per Scene

Multiple vibrant colors competing = visual noise. Accent pops because everything else is restrained.
