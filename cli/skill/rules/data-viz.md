# Data Visualization

SVG charts, animated metrics, progress indicators, and status badges.

## Animated Data Visualizations

Metrics scenes must have SVG charts with animated path drawing, horizontal bar charts, progress rings, and gradient fills. Not just big numbers — show DATA visually like a real dashboard.

## SVG Line Charts with Gradient Fills

```tsx
// Thick stroke (3-4px), round linecap, gradient fill beneath
<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
  <stop offset="100%" stopColor={color} stopOpacity={0} />
</linearGradient>
```

Use `@remotion/paths` for smooth path animation:
```tsx
import { evolvePath } from "@remotion/paths";
const { strokeDasharray, strokeDashoffset } = evolvePath(progress, svgPath);
```

## Animation Patterns

| Chart Type | Animation | Stagger |
|-----------|-----------|---------|
| Horizontal bars | width 0→full, spring damping: 200 | 10 frames per bar |
| Line charts | evolvePath left-to-right | data points pop at line arrival |
| Donut/pie | strokeDasharray clockwise from 12 o'clock | — |
| Bar charts | height 0→target with spring | 5 frames per bar |
| Number counters | `interpolate(spring, [0,1], [0, target])` + `Math.floor()` | — |

## Tabular Nums for Counters

ALL animated numbers MUST use:
```tsx
{ fontVariantNumeric: "tabular-nums" }
```
Prevents layout shift as digits change (all digits same width).

## Colored Status Badges

Numbers need context:
- "+1.8%" in green bg with up-arrow icon
- "-1.7%" in red bg with down-arrow icon
- Use 10% accent tint background with full accent foreground

## Never Hero Metric Template

The centered "big number + small label + gradient accent" layout is AI slop. Break it with:
- Dashboard-style multi-column panels
- SVG donut gauges with data alongside
- Comparative bar charts
- Split layouts with chart on one side, details on other
