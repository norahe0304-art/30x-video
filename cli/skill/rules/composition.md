<!--
[INPUT]: 被枪毙首稿的帧证据 (黑底真空+居中小物件), ART-DIRECTION v2 四铁律, hyperframes-caylent 标杆做法, brand-report.json 证据分
[OUTPUT]: Bespoke Composition Law — 五条构图铁律 + 构图级 SLOP BLACKLIST + 素材薄站 playbook; scaffold Atmosphere 原语的使用契约
[POS]: rules/ 的构图层核心; 与 taste.md (元素级反 slop) 互补 — taste 审判"放了什么", composition 审判"怎么占据画面"; 被 SKILL.md Step 4 与 qc-gates.md Gate 2 引用
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Bespoke Composition Law

Why this file exists: a first cut got killed with the verdict **"写死了，每次都是那几个动态"** — every video was the same spring logo + shimmer, card grid, CountUp row, small objects floating dead-center in a pure-black void. The elements passed taste.md; the *compositions* were template reflexes. This file makes composition itself a gated discipline.

The test that governs everything below: **would you send this frame to the person who called your last cut ugly?** If you hesitate, the frame is not done.

---

## Law 1 — Zero Vacuum (零真空法)

**Every frame must sit on an atmosphere base. A bare flat `#000` (or any flat solid) behind floating content = automatic FAIL.**

The atmosphere base is layered depth, not decoration:

- **Volumetric light**: multi-layer radial gradients in `theme.color.primary`, breathing slowly — light has a SOURCE and a direction, not a uniform glow.
- **Grid horizon**: a perspective wireframe floor receding to a horizon line — gives the frame a *ground* and a *world*.
- **Drifting particles**: sparse, slow, deterministic — air, not confetti.
- **Visible grain**: 2-4% film grain kills the sterile digital flatness.

The scaffold ships this as `src/components/Atmosphere.tsx` (`<Atmosphere primary={...} accent={...} />`), wired at MainVideo root by default. **Tune it per act (shift the light source, raise/lower the horizon, thin the particles) — never delete it back to a naked solid.** Minimum bar per frame: at least TWO of {light/fog, texture/grain, horizon/perspective, parallax layers} visibly present.

H.264 warning: keep gradient layers ≥2 stops and add grain — smooth dark gradients on black band badly in compression.

## Law 2 — Full-Bleed Moment (全屏时刻法)

**Every act needs at least one composition that touches the frame edges.** An image, a word, a chart, a world — something must go top-to-bottom or edge-to-edge. The default posture is **overflow the frame**, not shrink to center.

- Box test: draw the bounding box around all foreground content in the act's key frame. Box < 60% of frame area with dead margins on all four sides = the "centered small object black hole" — redesign.
- Overflow is allowed and encouraged: hero images crop at edges, type bleeds off-frame, a terminal rises from the bottom edge and occupies 60% of the canvas, a chart's axis runs out of frame.
- Scale reads as confidence. Small-and-centered reads as a slide deck apologizing for itself.

## Law 3 — Editorial Typography (编辑部字排法)

**Key words earn 200-320px.** Take the brand site's H1 presence and multiply it ×3 — a 72px web headline becomes a 200px+ video moment, because video frames are billboards, not browser viewports.

- One giant word/phrase + one tiny annotation line = the whole composition. The size GAP is the design.
- Bleed is legal: type may crop at the frame edge as long as the word stays readable.
- Weight stays 300-500 (typography.md still rules) — scale delivers the impact, not boldness.
- `theme.fontSize.hero` (default 80) is the floor for act headlines, **not the ceiling**. For the act's ONE editorial moment, go 200-320px and let it own the frame.
- Benchmark: the hyperframes-caylent cut carried whole beats with 118px+ stats and size-driven hierarchy — no beat leaned on a card to feel finished.

## Law 4 — Real Assets First (真资产优先法)

**Brand graphic assets outrank code-drawn abstractions.** A 3D logo render, hero art, illustration system, or product shot beats any hand-built diagram of the same idea.

- If `public/brand/` holds a rendered logo (3D, neon, isometric), typing the same letter in a font is a FAIL — use the asset.
- If the brand ships a visual language (wireframe, isometric, gradient world), **grow the video's world out of it** instead of ignoring it (see Thin-Evidence Playbook below).
- Code mockups (Terminal/Kanban/Dashboard) are for *product UI moments* — they never substitute for a brand's own art when that art exists in the asset pool. Gate 1's asset-audit USE verdicts must be honored here.

## Law 5 — Composition Diversity (构图多样性法)

**The archetype must drive a different composition SYSTEM, not just different colors on the same skeleton.**

- Within one video: no two acts share the same compositional skeleton (`padding + eyebrow + headline + centered box` repeated five times = one composition wearing five costumes).
- Across videos: no scaffold component may be the hero visual of two consecutive productions. If the last video's Act 3 heroed `KanbanBoard`, this one finds another lead. The scaffold is a vocabulary, not a fill-in-the-blanks form.
- Composition systems to actually vary between (pick per act, per archetype):
  - full-bleed image + edge scrim + small type
  - oversized-type stack (Law 3) with annotation
  - horizon-anchored world (object ON the grid floor, not floating)
  - asymmetric offset hero (subject at 1/3, atmosphere fills the rest)
  - split composition with a hard diagonal or vertical seam
  - bottom-rising surface (terminal/panel entering from frame edge, occupying 50-70%)
  - sequenced full-screen singles (one subject per beat, cut between them)

---

## SLOP BLACKLIST — compositional edition

taste.md blacklists elements; this list blacklists whole compositions. Each entry names its replacement — banning without an alternative just breeds the next cliché.

| BANNED | Why it's slop | Use instead |
|---|---|---|
| **Hub-and-spoke pill diagram** (center logo, pill labels around it, thin connector lines) | The textbook AI-generated "integrations" frame; zero depth, zero brand | A **convergence world**: names as large typographic streams / light beams flowing INTO the real logo asset placed off-center in a grid-horizon world with perspective. The logo is a machine doing something, not a sticker with strings |
| **Hollow-card triptych** (three near-empty cards side by side, one icon + two lines each) | Three ways to say nothing; interiors are void; the frame becomes furniture | **Three sequenced full-screen moments** — each metric/claim gets its own beat and fills half the frame or more (a 99.9% at 300px, a failover drawn edge-to-edge, a routing arc as a world map). One subject per beat |
| **Centered small object in a void** (content <35% of frame floating in flat dark) | The "black hole" frame — reads as unfinished placeholder | Law 1 + Law 2: atmosphere base underneath, then scale the subject until it touches an edge, or offset it and let typography/world fill the rest |
| **Eternal spring-logo + shimmer opening** | The same open on every video is a watermark saying "template" | `LogoEntrance` has 7 variants — rotate them (shimmer sweep openers are already banned there). Better: cold-open inside the brand world (hero art full-bleed, logo arrives as an inhabitant with volumetric backlight, not a sticker on black) |
| **CountUp row as the entire proof act** | Numbers ticking in a row = spreadsheet, not evidence | One number per beat, full-screen, treated as architecture (Law 2 + 3); or one real chart drawn edge-to-edge with the number as its peak annotation |

**The composition test** (extends taste.md's slop test): show one FRAME with all text blurred. Could it be any SaaS brand's template? If yes, the composition failed even if every element passed.

---

## Claim→World Mapping — 卖点渲染成它领域的原生 artifact

每个 proof 卖点不画"关于它的图表"，而是把观众**放进那个卖点为真的世界**。推导链：卖点 → 它属于哪个领域 → 那个领域的从业者每天看什么 → 把那个东西做成全屏电影级。

Worked example（happy-model, 2026-07-04 — **这是推导方法的示范，不是可复制的答案**）：

| 卖点 | 领域 | 从业者看什么 | 渲染成 |
|---|---|---|---|
| 99.9% uptime | 可靠性 | status page | 多区域 90 天心跳条带墙 + 巨数字 count-up（绿海里两粒琥珀瑕疵反衬真实） |
| smart failover | **产品自己的语义**（模型商切换，不是地理） | 请求流向 | 光束射向 provider 官方 mark → 熄灭 flicker+× → 瞬间改射另一家 + `rerouted · 183 ms` 戳 |
| global routing | 地理 | 骨干网 | dotted-map 真地图 + 短跳级联逐城点亮 + `ms` 延迟戳（航线法向侧弓弧） |

**自适应铁律（用户原话："我不是要每次都是这样！我是要自适应不同的网站风格"）：**

- 上表的三个 artifact 是**这一个品牌**的推导结果。下一个品牌的卖点属于不同领域 → 推导出不同的 artifact（电商的"秒发货"→ 物流轨迹世界；协作工具的"实时同步"→ 多光标文档世界；安全产品的"威胁拦截"→ SOC 告警流世界）。照抄 status 墙/骨干网地图给另一个品牌 = 模板化，直接违反 Law 5 跨视频条款。
- 颜色、字体、光的性格全部来自该品牌的 brand-report（designTruth），不继承任何往期项目。
- failover 一行是关键教训：卖点的领域要按**这个产品的真实语义**判断，别被词面带偏（"failover"听着像地理，实际是 provider 层）。
- 相邻 beat 必须换世界（status page 世界 → 请求流世界 → 地理世界），两个 beat 共用一套视觉公式（如连续两张"地图+弧线"）已被用户点名毙掉。
- **换构图不换世界观（Laper 事故 2026-07-05）**：换世界指的是构图系统与 artifact 换，不是色系与字系换。一部片只有一套底色谱系、一套字体声部、一套光的语言；某一幕突然跳成芥末金或深绿海报 = 世界观断裂，用户判词"不统一、不高级、没有品牌味"。多样性活在构图与 artifact 层，统一性锁死在 theme 层——beat 再怎么换，观众要能从任何一帧认出这是同一部片。

**跨视频测试：** 拿本 skill 产的两个不同品牌的视频各抽一帧并排——如果互换品牌 logo 后毫无违和，自适应失败。

### 数量决定构图（Nora 原话："三个有三个的排版，四个有四个的排版"，2026-07-04）

- 统计/要点的**个数**是构图的输入，不是塞进同一模板的填充量：3 个 = 三分屏或阶梯；4 个 = 一行四列细线分隔（无卡片盒）或 2×2；2 个 = 对比构图（长短条/左右对峙）。个数变了，排版必须重新设计。
- 奇数落单是死罪：2+1 换行的孤儿卡片 = 不高级。宁可加一个真实指标凑满一行，或换构图。
- 无框统计行 > 卡片盒：mono 小标签 + 编辑部大数字 + mint 趋势行，细线分隔——比圆角卡片高一档。
- 对比类卖点（−40% MTTR 这种"少即是好"）用**对比条**：基线长条(暗) vs 现状短条(亮)，差距本身就是画面；禁孤立下坠弧线/仪表针这类"指代型"图形。
- 动效要"有物"：纯 SplitText + 空底 = 不高级。每个快拍配一个领域原生 artifact（GenAI → token 流光标 + 漂浮配置碎片；Ops → 终端日志逐行上屏）。

The failure this kills: a thin site (logo + palette + one headline, no product shots) degrades into empty cards and centered logos — the void frames above. Thin evidence does NOT mean thin visuals; it means the video must **grow a brand world from the assets that do exist**.

1. **Interrogate the logo geometry.** Wireframe? Isometric? Letterform? Orbit? That geometry is the world seed. Field example: an isometric wireframe "M" logo → a *relay-station world* — isometric grid horizon, data beams from off-frame converging through the 3D logo, terminals rising from the floor. One logo carried five acts.
2. **Build the world once, evolve it per act.** Atmosphere base tinted by brand primary + ONE spatial motif derived from the logo (grid / orbit / circuit / weave / lattice). Acts move THROUGH the world (light shifts, camera reframes, density grows) instead of resetting to a fresh void each cut.
3. **Typography becomes co-lead.** With no product screenshots, Law 3 editorial moments (200-320px key words) carry the acts that would otherwise beg for a mockup.
4. **Cards are forbidden as filler.** Cards need real content; thin evidence has none. Type + world + real assets only.
5. **Never fake product UI** the evidence can't support (workflow.md mode rule) — and disclose the editorial mode in Gate 4 (what was synthesized from brand geometry vs. what was harvested).

---

## Gate wiring

- **Step 4 (build):** read this file BEFORE composing any act. Each act's design states which composition system (Law 5 menu) it uses.
- **Gate 2 (per-act frame evidence):** the evidence block includes a four-law self-check line (vacuum? full-bleed moment? type scale? real asset?) — judged on the rendered still, with the send-it-to-your-harshest-critic bar.
- **Finish gate:** "same composition skeleton as my last video" is a reflex default to name and reject.
