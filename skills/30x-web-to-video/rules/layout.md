# Layout & Spacing

Grid system, safe zones, spacing scale, border-radius hierarchy, and overlap prevention.

## Full-Bleed UI Frames

UI mockups fill 80-95% of the frame — like your screen IS the product. Add thin borders, rounded corners (16-24px), and box-shadow for depth.

## Layout Grid System

Every scene uses a fixed grid:

```
┌─────────────────────────────────────────┐
│ Header: 44-52px, border-bottom          │
│ ┌──────────┬────────────────────────────┤
│ │ Sidebar  │ Main content               │
│ │ 200-260px│ flex: 1, overflow: hidden   │
│ │ flexShrink:0│                         │
│ ├──────────┴────────────────────────────┤
│ │ Bottom bar: 36-44px, border-top       │
└─────────────────────────────────────────┘
```

- Grid gaps: 12-16px between cards, 16-24px padding on main area
- Cards: `flex: 1` inside grids to fill available space
- NEVER set fixed heights that leave empty space below

## 4px Spacing Scale

| Context | Size |
|---------|------|
| Icon to text | 6-8px |
| Badge padding | 2-4px V, 6-10px H |
| Card interior | 16-20px |
| Card gap | 12-16px |
| Section padding | 24-32px H, 16-24px V |
| Header/footer | 36-52px (fixed, flexShrink: 0) |

## Safe Zones (1920×1080)

- **Action safe:** 64px inset from all edges
- **Title safe:** 96px inset — ALL headlines, CTAs, key UI inside this
- **Content zone:** 1728 × 888px
- **Optical center:** place primary content at ~45% from top (slightly above math center)
- **Bottom 15%** (below 918px): overlays/captions only, never primary content
- Full-bleed UI CAN touch edges, but key text within respects safe zones

## Border-Radius Hierarchy

NOT the same radius on everything:

| Element | Radius |
|---------|--------|
| Inputs / badges | 4-6px |
| Cards / panels | 12-16px |
| Modals / large containers | 20-24px |
| Pills / tags | 100px |

**Inner radius = outer radius - gap.** If outer card is 16px with 12px padding, inner element is 4px (16-12=4).

## Anti-Blank-Space Rules

Empty space = amateur:
- Chat UIs: messages start from TOP (justify: flex-start), add 2-3 faded previous messages
- Card grids: `flex-direction: column; justify-content: space-between` inside each card
- Video previews: gradient bg + filmstrip + resolution badge + progress indicator
- Sidebars: fill top-to-bottom — title → active → history → bottom selector. No gaps

## No Layout Overlap

- Every container: `overflow: "hidden"`
- Fixed elements: `flexShrink: 0`
- Absolute overlays: `pointerEvents: "none"`, stay within safe zones
- Sidebar: fixed width + `flexShrink: 0`, main: `flex: 1` + `overflow: hidden`
- Card grids: use `gap` not `margin`
- **Orbiting elements:** Calculate total center bounding box. Orbit must clear by ≥80px every side
- **Test at fully-animated frame**, not just frame 0

## Text Nowrap for Metrics & Labels

In ProofScene / data-driven scenes, ALL metric labels, stat titles, and badge text MUST have `whiteSpace: "nowrap"`. At 1920×1080, card widths can squeeze multi-word labels onto two lines — this looks broken, not "responsive."

```tsx
// ✅ CORRECT — forced single line
<span style={{ fontSize: 30, whiteSpace: "nowrap" }}>
  {metric.label}
</span>

// ❌ WRONG — label wraps at card boundary
<span style={{ fontSize: 30 }}>
  {metric.label}
</span>
```

Apply `whiteSpace: "nowrap"` to:
- CountUp number containers
- Metric label / sublabel text
- Badge / pill text
- Any single-line heading inside a constrained-width card

## Metric Card Minimum Padding

When text is `nowrap`, the card MUST have enough interior padding so text doesn't visually slam into the border. Cramped text inside a card = amateur.

| Card Style | Min Width | Min Horizontal Padding |
|------------|-----------|----------------------|
| Metric card (number + label) | 400px | 48px per side |
| Proof card with icon | 420px | 48px per side |
| Simple stat column (no card bg) | no min | 0 (gap handles spacing) |

```tsx
// ✅ CORRECT — generous breathing room
<div style={{
  width: 420,
  padding: "48px 48px",   // 48px horizontal = text breathes
  gap: 20,                // 20px between number and label
}}>

// ❌ WRONG — text crashes into card edges
<div style={{
  width: 340,
  padding: 32,            // only 32px = cramped with large text
  gap: 12,                // too tight
}}>
```

**Rule:** `card_content_width = width - (2 × horizontal_padding)` must be ≥ 300px for metric cards. If the longest label at its font-size exceeds this, widen the card.

## SplitText in Flex-Column Parents

**CRITICAL BUG:** SplitText MUST use `display: "flex"` (block-level), NOT `display: "inline-flex"`. In a flex-column parent (`flexDirection: "column"`), `inline-flex` elements collapse to minimum intrinsic width. With `flexWrap: "wrap"`, each character wraps to its own line — producing vertical text.

```tsx
// ✅ CORRECT — block-level flex, takes full parent width
<span style={{ display: "flex", flexWrap: "wrap", ...style }}>

// ❌ FATAL — collapses in flex-column parents, every char stacks vertically
<span style={{ display: "inline-flex", flexWrap: "wrap", ...style }}>
```

When SplitText is centered in a column layout, pass `justifyContent: "center"` via the style prop.

## Progress Lines Through Icons (Timeline UI)

For step/progress indicators (e.g., order tracking: Placed → Packed → Shipped → Delivered):

1. **Line zIndex must equal or exceed icon container zIndex** so the line visually passes through icons
2. **Line endpoints must reach first/last icon centers** — calculate from item widths, not arbitrary padding
3. **Icon backgrounds should be semi-transparent** (`color + "15"` not opaque) so the connecting line shows through
4. **Progress line animates** with `interpolate` from 0% to 100% width, following icon activation timing


## 浮动徽章 × 裱装框防撞 (2026-07-04 parker step2 事故)

浮动 chip/badge 与"裱装框"类资产 (带圆角边框的截图/浏览器框) 同屏时, **禁止骑在框的边缘/角上** — 全出血 footage 上浮徽章没问题 (有 scrim), 但框有明确边界, 压边 = 排版事故。解法优先级: ①偏置构图 — 框让位出血一侧, 徽章独占另一侧的干净底 ②框缩小让出徽章带 ③徽章挪到框内的真实留白区。渲帧确认, 眯眼看边界。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
