<!--
[INPUT]: zi-ui design tokens (~/.claude/skills/zi-ui/assets/tokens.css)
[OUTPUT]: 30x-video 默认视觉签名 — 所有 creator-default 视频长这个样
[POS]: notebooks/ 第 6 篇; 视觉品牌定位 — 让 30x-video 一眼能认出来
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 06 — Zi-UI as 30x-video Signature Style

> 不是 "用户能选 zi-ui 风格"，是 **"30x-video 没指定品牌时默认就这个味道"**。

## Zi-UI 核心特征 (适合视频化的部分)

| 维度 | Zi-UI 规定 | 30x-video 适配 |
|---|---|---|
| 字体 | Geist (300-500 weight) | ✅ 默认用 Geist (Google Fonts) |
| 色板 | 中性灰 + 低饱和 + 一点 accent | ✅ 默认 dark mode 全套 |
| 圆角 | 0.5rem 基础单位 | ✅ 用 zi-ui 的 --radius-* |
| 字重 | 上限 500 (no bold 700+) | ✅ 严格遵守 |
| 间距 | 4px grid | ✅ 严格遵守 |
| Accent 色 | 默认 blue (#5e6ad2 类) | ✅ 同 |
| 动效 | "无 gradient / glow / playful motion" | ⚠️ **打破** — 视频允许 motion |

## 跟 zi-ui 的 "do not activate" 冲突解决

zi-ui SKILL.md 写: `Do NOT activate for: marketing landing pages, ... heavily branded consumer apps, or anything needing gradients, glows, or playful motion.`

30x-video 是 marketing video — 表面上跟它冲突。但我们**只采用它的 token 系统 + 视觉律**，不照搬"无动效"原则。视频天然要动，但我们的动效用 zi-ui 的克制感:
- ✅ 简单 fade / slide (不复杂)
- ✅ 易缓动 (cubic-bezier, 不弹簧)
- ❌ 跳动 / 弹跳 / 旋转 / 缩放 > 1.1x
- ❌ 多色粒子 / 光斑 / 渐变背景

这跟 zi-ui 的精神是一致的。

## 30x-video 默认 DesignProfile (zi-ui 化)

```typescript
const ZI_UI_DEFAULT_PROFILE: DesignProfile = {
  source: "creator-default-zi",
  fonts: { 
    heading: "Geist",       // zi-ui 主字体
    body: "Geist",
    mono: "Geist Mono",     // (zi-ui 用 GeistMono 当 mono)
  },
  density: "balanced",
  motionMood: "precise",     // zi-ui 是精准而非夸张
  archetype: "Editorial Minimalism",
  
  // dark mode (视频 cinematic 默认)
  primaryColor: "#5e6ad2",   // zi-ui --palette-blue-500 等价
  accentColor: "#ffffff",    // 高对比 highlight
  backgroundColor: "#0a0a0a", // zi-ui --palette-gray-950
  textColor: "#fafafa",       // zi-ui --palette-gray-50
  
  visualReferences: [],
  notes: ["zi-ui signature style — calm editorial dark mode"],
};
```

## CSS Token 移植 (compose.ts 默认引入)

把 zi-ui 的 tokens 直接 import 到生成的 hyperframes index.html:

```html
<style>
  /* zi-ui Layer 1: primitive palette */
  :root {
    --palette-gray-50:  oklch(0.9702 0 0);
    --palette-gray-950: oklch(12% 0.005 285.823);
    --palette-blue-500: oklch(0.6204 0.195 253.83);
  }
  
  /* zi-ui Layer 2: semantic */
  :root {
    --color-bg: var(--palette-gray-950);
    --color-text: var(--palette-gray-50);
    --color-accent: var(--palette-blue-500);
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-4: 1rem;
    --space-8: 2rem;
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  body { 
    background: var(--color-bg); 
    color: var(--color-text);
    font-family: 'Geist', sans-serif;
  }
  .heading {
    font-family: 'Geist', sans-serif;
    font-weight: 500;          /* zi-ui 上限 */
    letter-spacing: -0.02em;
  }
</style>
```

## 4 个独特的 30x-video × zi-ui 视觉规则

### 1. 字重纪律
- 标题最多 500
- 强调用 size 不用 weight (从 64px 到 96px 比 500 → 700 更克制)
- mono 标签用 400 (Geist Mono regular)

### 2. 颜色克制
- 一帧只能有 1 个 accent 颜色出现
- 75% 区域必须是 bg + text 的灰阶
- accent 用法:
  - 标题第一个关键词 (e.g. "Make **a video**." 中 "a video" 是 accent)
  - 关键数字 ("$10K MRR" 数字是 accent)
  - 永远不用 accent 当大背景

### 3. 节奏温和
- 转场不超过 0.4s (zi-ui 精神)
- 每场景 hold ≥ 2s (避免 anxious)
- 永远 `ease-out` 不用 `ease-in-out` (后者有 "弹回" 感)

### 4. 留白奢侈
- padding 至少 80px (16:9) / 120px (9:16)
- 标题 max-width 不超过画布 60% (强制留白)
- 没有任何 "fill the canvas" 的诱惑

## Anti-pattern (zi-ui 视角的 AI slop)

zi-ui 加视频后，新增禁止项:
- ❌ "Bouncy" spring animation (zi-ui = 精准)
- ❌ Drop shadow > 2px (zi-ui = 平面但有 hierarchy)
- ❌ 字体描边 / outline / stroke
- ❌ 全大写连续 > 8 个字 (zi-ui 是 sentence-case)
- ❌ Emoji 当装饰 (zi-ui 严格 no-emoji)
- ❌ 多色文本一句话内 > 2 色

把这些加进 `references/anti-slop.md`。

## 行动清单

1. **`compose.ts` 引入 zi-ui token block** — 默认所有视频带这套 CSS variables
2. **`types.ts` 新增 `ZI_UI_DEFAULT_PROFILE` 常量** export，所有 creator-default 用它
3. **`anti-slop.md` 加 zi-ui 6 条新规则**
4. **`finish-gate.ts` 加 zi-ui audit**:
   - heading font-weight ≤ 500
   - 单帧 accent 数量 ≤ 1
   - 转场 duration ≤ 0.4s
5. **下载 Geist 字体** (Google Fonts: Geist + Geist Mono)，确保 `<link>` 工作

## 一句话定位

```
30x-video 默认风格 = zi-ui (calm editorial) + cinematic motion + 视频专属 anti-slop
```

让一个用户看到 30x-video 出的视频，不需要我们说，他能感觉到「这个 skill 有审美」。
