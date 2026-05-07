<!--
[INPUT]: Refero screen descriptions, 50-video INDEX.json, Vercel guidelines, web research
[OUTPUT]: Concrete actionable design rules for confident video composition
[POS]: notebooks/ 第 7 篇; 解决"丑"的根因 — 让设计决策有据可依
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 07 — Design Decisions (Distilled)

> 写这本 notebook 是因为五次 dogfood 都丑。问题不是 Refero 不好，不是 Hyperframes
> 不行，是**我做的设计决策本身保守 + 信息密度过高 + 缺乏 confidence**。
> 这本是把外部最好的视觉规则抄成可执行规则。

---

## 1. 为什么之前都丑（自我审判）

| 错误 | 表现 |
|---|---|
| 信息密度过高 | 每帧 4 张卡片 / 4 个 pipeline 节点 / 9 字 wordmark + tagline + URL pill |
| 字号太小 | hero 96-120px（远不够）。Apple 整版能用 200-400px |
| 居中 + 对称 | 所有元素都 center-align — 像 PPT，不像电影 |
| 一切等长 | 所有 fade 都 0.5s, 所有 hold 都 4s — 没节奏对比 |
| accent 用得多 | indigo 出现 10+ 处。Apple "Privacy" 整片就一个红色 |
| 内容用模板 | "your sentence" / "design tokens" 这种通用占位词 |
| 缺乏 hold | 没有 4-6 秒"什么都不动"的镜头 — Aesop 90 秒里有 5 个静态长镜头 |

---

## 2. 来自 Refero 真品牌描述的规则

Refero 给 Linear / Vercel / Apple 设计的 200-400 词描述，反复出现这些模式:

**Linear 风格通用律**:
- 背景纯黑 (#000000) 或近黑 (#0a0a0a)，**不是**带蓝调的 #131413（我之前用的） — 真 Linear 是几乎纯黑
- 高对比白文 (#FFFFFF)，**不是** #F3F8F8 这种灰白
- 左对齐永远优先于居中（除 hero 外）
- 大段 padding（80-120px 边距），文本块之间 60-80px 间距
- 顶部 nav 小写白字 + outlined Sign up 按钮
- 一行主标题，一行副标题，一张产品截图，结束 — 不堆 4 张卡片

**Vercel / Geist 风格规律** (来自 vercel.com/design/guidelines):
- 标题大写 Title Case
- 移动端 input ≥ 16px (避免 iOS 自动 zoom)
- Hit target ≥ 24px 桌面 / 44px 移动
- Tabular numerics on所有数字 (font-variant-numeric: tabular-nums)
- 不用智能引号: " " 不用 " "

**Stripe 风格规律**:
- "mature, trustworthy, optimistic" 三词标准
- 用 motion graphics 解释复杂概念，不用文字堆砌
- 数据用动画 reveal，不用静态 chart

---

## 3. 来自 50 视频库的 confidence pattern

读了 INDEX.json 里 20 个 S 级视频的特征，抽出**单帧只做一件事**这个核心:

| 视频 (id) | 单帧只做一件事示例 |
|---|---|
| `apple-vision-pro-launch` | 0:34 "hand → typography reveal" 整帧只一个手 + 一行字 |
| `apple-think-different` | 全片 60 秒，每帧只一张人脸 + VO，从不堆字 |
| `apple-privacy-iphone` | 单字幕大字占满屏，1 句话 1 帧，永远不重叠 |
| `aesop-eau-de-parfum` | 90 秒，10 帧，每帧 hold 6-9 秒，纯静帧 |
| `nike-dream-crazy` | 标志性"big text 单行 + bg 黑" 镜头反复用 |
| `linear-launch-film` | 一个 UI 动作一帧（光标移动 / 卡片飞入 / 下拉展开） |
| `tesla-cybertruck-reveal` | 慢推近一辆车，整 30 秒只动一台车 |

**核心规律 ONE / FRAME**: 每帧只允许一个主体，hero 必须能用一句话说清。如果说不清，重新设计这帧。

---

## 4. 可执行的具体规则（这次必须用）

### 4.1 字号 (1920×1080)

| 元素 | 字号 | 字重 | 字距 |
|---|---|---|---|
| Hero (单帧主角) | **180-280px** | 500-600 | -0.04em |
| Subhead (副标题) | 64-88px | 400-500 | -0.025em |
| Body (普通段) | 28-36px | 400 | -0.01em |
| Label (上下标) | 22-28px JetBrains Mono | 500 | 0.12em uppercase |
| 数字 (calc/metric) | 200-360px tabular | 400-500 | -0.02em |

**反例**: 我之前 hero 120px = 太小。改 200px+。

### 4.2 留白 (negative space)

- 边距：每边 ≥ 12% canvas 宽度（1920 → ≥ 230px）
- 元素之间：≥ 80px 垂直间距
- Hero 周围：上下各留 ≥ 25% canvas 高度
- **40% 规则**：成片任何一帧 ≥ 40% 像素是 bg 颜色（无内容）。Apple "Privacy" 大约 80%。

### 4.3 Color (single accent moment)

- 75% canvas = neutral (bg + text 灰阶)
- 仅 1 个 accent 颜色（不要 indigo + green + amber 混用）
- accent 仅出现在 hero 的 1 个关键词 / 1 个数字 / 1 个 CTA — 一帧只 1 处
- 反例: 我之前 4 张卡片都用 indigo accent → 视觉散

### 4.4 Motion (Vercel guideline + Apple pattern)

| 规则 | 值 |
|---|---|
| 入场 ease | `cubic-bezier(0.16, 1, 0.3, 1)` (power3.out) |
| 入场时长 | 0.6-0.9s (不能 0.3 — 太快显廉价) |
| 出场时长 | 0.4-0.5s |
| Hold (静止时长) | **2.5-6s** per scene（不是 4s 通杀） |
| GPU 属性 | 仅 `transform` + `opacity` + `filter` |
| 禁用 | `transition: all` / `width` / `height` / `top` / `left` |
| 节奏 | 长 hold → 快切 → 长 hold（呼吸感），不平均 |

### 4.5 单帧 hold-then-snap (Apple 标志律)

每个 scene 的时间结构:
```
0.0 - 0.6s   入场 (hero 浮起 + fade in)
0.6 - 4.0s   HOLD (静止不动 — 让眼睛吸收)
4.0 - 4.4s   微 micro-event (光扫 / 数字爆 / 一个细节出现)
4.4 - 4.8s   出场 (淡出，准备下一帧)
```

我之前的错误：每秒都在动。看疲劳。要敢"停"。

### 4.6 排版构图 (anti-PPT)

**禁止 4 项**:
- ❌ 居中对齐所有内容（hero 可以中心，body 必须左对齐）
- ❌ 同等大小的卡片 2x2 / 4 列 grid
- ❌ "icon + label + value" 三件套卡片
- ❌ 多个 accent 颜色同时出现

**允许 4 项**:
- ✅ Asymmetric layout（hero 偏左 1/3 处）
- ✅ 单 hero + 单 sub + 留白 + 一个 micro detail
- ✅ Full-bleed 背景图 + 反白文字
- ✅ 大字遮挡画面边缘（伸出 frame）

### 4.7 Hierarchy by 2（taste.md 已有但没用）

每个主元素必须比第二元素**至少**赢 2 项: size / weight / contrast / position。

- size 4× ↑（96px vs 24px）
- weight 200 ↑（600 vs 400）
- contrast 4× ↑（fff vs 909398）
- position（屏幕中心 vs 边角）

---

## 5. 应用到 30x-video 的 3 帧版本（重做提案）

不是 4 帧或 7 帧。**3 帧**，每帧 5-8 秒，单焦点。

### Frame 1 (0-7s) — Hook

```
画面: 全黑背景。
一行字， 240px Inter 500，左对齐距左 230px：
   "Make a 15s social
    about morning routines."
其中 "morning routines." 用 indigo accent (整片唯一一处 accent moment)

Motion:
0.0-0.8s: 第一行从下浮起 (translateY 60px → 0)
0.8-1.6s: 第二行从下浮起 (stagger)
1.6-1.9s: shimmer 光带划过 "morning routines"
1.9-6.5s: HOLD — 5 秒一动不动
6.5-7.0s: 整体 fade out
```

### Frame 2 (7-13s) — Number

```
画面: 全黑背景。屏幕中心：
   125,000+
   tabular numerics, Inter 500, 360px

底部小字 (左下，距底距左各 230px):
   real design references / via Refero

Motion:
7.0-7.4s: 数字从 0 count up, 但带 ease: power2.out (终点慢)
9.0s: 数字落定 → 微 scale pop (1.0 → 1.05 → 1.0, 0.4s)
9.4s: 同时 indigo glow ring 从中心扩散 (radial-gradient 0 → 60vw)
9.8-12.0s: HOLD
12.0-13.0s: fade out
```

### Frame 3 (13-22s) — Brand

```
画面: 全黑背景。

阶段 A (13-16s):
  屏幕中心 280px Inter 600 wordmark "30x-video"
  (没 separator，纯字)
  缓慢 scale 1.0 → 1.04 (ken-burns)
  shimmer 光带 14.2-15.6 划过

阶段 B (16-19s):
  wordmark 微缩到 200px (translateY 上移 80px)
  下方出现 64px Inter 400 tagline:
     "Tell it what you want."
     "Get a video."  (accent indigo)
  两行 stagger 0.4s 分别浮起

阶段 C (19-22s):
  HOLD 3 秒
  一切静止
```

总 22 秒。每帧只一件事。每帧都有 ≥ 2 秒 HOLD。Accent 只用在第 1 帧两个词 + 第 3 帧一行。

---

## 6. 自检清单 (rendered 后过这 8 条)

- [ ] 任何一帧能用一句话说清主体？
- [ ] hero 字号 ≥ 200px (1920×1080) ?
- [ ] 单帧 accent 颜色 ≤ 1 处？
- [ ] 每帧有 ≥ 2.5s HOLD（什么都不动）？
- [ ] 整片 ≥ 40% 帧是 bg + 单一 hero ？
- [ ] 没有 4 张卡片 / 4 列 grid 出现？
- [ ] 元素全部用 transform / opacity 而不是 width / height ？
- [ ] 标点用智能引号 " " 而不是 " " ？

---

## 7. 反例 (我之前犯过的)

| Anti-pattern | 之前 dogfood 哪里 | 修法 |
|---|---|---|
| 4 张卡片 2x2 | Scene 2 Refero | 改成单 hero `125,000+` 数字 |
| 4 节点 pipeline | Scene 3 | 删掉，pipeline 没必要在视频里讲 |
| 9 字符 wordmark + URL pill | Scene 4 | 简化为 wordmark + tagline，删 pill |
| Hero 96-120px | Scene 1 | 改 240-280px |
| accent 用了 10 处 | 所有 scenes | 全片只 1 处 accent moment |
| 每帧都在动 | 整体 | 每帧 ≥ 2.5s 完全静止 |
| 居中对齐所有 | Scene 1 / 2 / 3 | hero 左对齐 1/3 处 |

---

## 8. 行动项

1. **现在**: 用本 notebook 第 5 节的 3 帧方案重做 dogfood-launch
2. **之后**: 把第 4 节规则进 finish-gate 当 audit (字号 / accent 数量 / hold 时长)
3. **长期**: 给 5 维 style-composer 加"信息密度档"维度 (sparse / balanced / dense)，sparse 时强制 1 hero/帧
