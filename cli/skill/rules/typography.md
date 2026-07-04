# Typography

Font selection, weight hierarchy, sizes, and text safety for 1920×1080 video.

## Weight Hierarchy (MAX 600)

Never use `bold` / `700` / `800` / `900`. Premium typography uses 300-600:

| Weight | Role | Example |
|--------|------|---------|
| 300 light | Muted meta, timestamps | Sidebar labels |
| 400 regular | Body text | Descriptions, paragraphs |
| 500 medium | Labels, sections | Card titles, nav items |
| 600 semi-bold | Heroes, headlines | Scene titles, hero metrics |

Heavy bold looks cheap. The Stripe/Linear look comes from SIZE contrast + letter-spacing, not weight.

## Font Count: Maximum 2 Families

Often ONE family in multiple weights creates cleaner hierarchy than two competing typefaces. Weight contrast > font variety.

Good choices: Outfit, Instrument Sans, Plus Jakarta Sans, Onest, Figtree, DM Sans.
Premium/editorial: Fraunces, Newsreader, Lora.

## Size Hierarchy (1920×1080) — Context-Scoped, NOT a Flat Floor

The old rule "everything ≥28px" was wrong. It made every video look like a Fisher-Price menu. Real premium video uses **sharp size contrast**: huge hero text against tiny native UI chrome. Use the semantic tokens in `theme.fontSize` — pick by **role**, not by gut-check pixels.

### Narrative context (text the viewer reads as content)

| Token | Size | Element |
|-------|------|---------|
| `metric` | 96 | Proof act number — biggest on screen |
| `hero` | 80 | Act 1/2/5 headline, 1 line |
| `sub` | 36 | Supporting line under hero |
| `body` | 28 | Paragraphs, descriptions, labels |
| `sectionTag` / `metricLabel` | 22 | Uppercase eyebrow, caption under metric |
| `caption` | 20 | Bottom-of-frame attribution, host name |

**Narrative minimum: 20px.** Anything narrative below 20px is unreadable at 1-3m.

### Mockup chrome (text inside a UI mockup, phone, terminal, table)

| Token | Size | Element |
|-------|------|---------|
| `mockupTitle` | 22 | Title bar text inside a mockup window |
| `mockupRow` | 18 | Row label / cell content in table or list |
| `mockupLabel` | 14 | Tiny field label / metadata |

**Mockup chrome can go as low as 12-14px** — that's how real software looks. Forcing 28px on a Slack message list or Linear ticket destroys the "real product UI" illusion that's the whole point of this skill. The visual-audit script exempts subtrees inside `<TerminalWindow>`, `<KanbanBoard>`, `<DataTable>`, `<AnalyticsDashboard>`, and `<PhoneFrame>` from the 20px floor.

**Never hardcode sizes — always reference `theme.fontSize.X`.**

## Text Safety

ALL text elements in constrained containers:
```tsx
{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
```

Unless explicitly multi-line. Max text width: headlines 70%, body within card bounds.

## Spacing

- `letterSpacing: -0.5` to `-3` on headlines (larger = more negative)
- `letterSpacing: 0` on body text
- `letterSpacing: 1-2` on uppercase labels only
- `lineHeight: 1` on large numbers
- `lineHeight: 1.3` on labels/headings
- `lineHeight: 1.5` on body text
- Dark backgrounds: increase lineHeight by 0.05-0.1 (lighter perceived weight needs more room)

## Never Pair Similar Fonts

Two geometric sans-serifs create tension without hierarchy. If pairing, contrast on multiple axes: serif+sans, geometric+humanist, condensed+wide.

## 小字预算法则 (2026-07-04, 用户原话"这种很多很多小字我不要啊 太乱了")

**一屏 mono/小注释 ≤ 1 处（一个聚落）。** 给每个节点/元素挂时间戳+说明小字 = 满屏碎片，直接违规。

- 信息分工：**大字承载事件，旁白承载细节，小字只做一个机器凭证**（一个计数器、一个 ms 戳、一个状态行——选一个）
- 有旁白的视频里，凡是旁白说了的内容，画面小字一律删
- 判据：眯眼看渲染帧，如果画面里可辨认的"文字块"超过 3 个（headline 算 1），砍到 3 以内

## 烘焙内容避让法则 (2026-07-04 perplexity 事故)

官方营销图/截图哪怕分类为 demo（可叠字），**图内自带的 UI/文案占区就是禁区**——叠加字幕必须住进图自己的留白区（通常是虚化背景的上部/角部），渲帧确认零碰撞。"可叠字"≠"哪里都能叠"。
