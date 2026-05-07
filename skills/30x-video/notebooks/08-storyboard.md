<!--
[INPUT]: User brief (raw), 50-video reference library, this notebook
[OUTPUT]: Professional storyboard methodology — beat structures, hook
          archetypes, VO mechanics, visual-narrative pairing, self-grading
[POS]: notebooks/ 第 8 篇; Story Architect 的全部专业知识源
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 08 — Storyboard Methodology

> 这是 Story Architect 的专业写作知识。
>
> **故事源永远是用户的 brief**。这本笔记不提供故事内容，提供
> **如何把用户的故事写好**的技艺：beat 结构、hook 写法、节奏律、
> visual-narrative pairing、自评 rubric。
>
> 50-video INDEX.json 是**实例参考池**——展示真实视频用过哪些结构。
> 不抄文案，抄骨架。

---

## §1 写 storyboard 之前必须做的事：Stakes 提取

**永远不要直接动笔**。先从用户 brief 抠 7 个东西。
缺哪个都先追问，否则 storyboard 必沦为"feature dump"。

### 7 个必填字段

| 字段 | 含义 | 示例 |
|---|---|---|
| **subject** | 一句话讲清要讲什么 | "30x-seo 是为 AI 搜索重建的 SEO 工具" |
| **audience** | 谁看这个视频 | "做内容营销的 SaaS 团队" |
| **stakes** | 不解决会失去什么 | "ChatGPT 在偷他们的搜索流量" |
| **antagonist** | 故事的"反派" | "老 Google-only SEO 工具栈" |
| **key claim** | 1 个最强卖点 | "24 个 AI-native 技能 + 一键安装" |
| **memorable line** | 看完观众应该记住的 1 句 | "Tell it what you want." 类（不是这句） |
| **proof** | 至少 1 个具体数字/事实 | "230+ audit rules / 9 categories / 24 skills" |

### 当 brief 不够时的 5 个追问模板

1. "如果观众只看完前 3 秒，他们应该感受到什么? (痛 / 好奇 / 震惊)"
2. "你最讨厌竞争对手哪 1 件事? (这往往是 antagonist)"
3. "用 1 句话向投资人讲清这个 → (这是 key claim 候选)"
4. "什么数字 / 客户名 / 实证你最骄傲? (proof)"
5. "观众下班后跟同事讲这个时，会怎么开口? (memorable line 草稿)"

**禁止**: 在没追问完前写第一帧。即兴发挥的 storyboard 必丑。

---

## §2 长度自适应的故事弧

视频时长决定 beat 数。**不要在 10 秒里塞 4 beats**。

### 长度 → beat 数 → 每 beat 时长

| 总时长 | beats | 每 beat | 适用场景 |
|---|---|---|---|
| **7-10s** | 2 (Hook + Payoff) | 3-5s | TikTok hook / 单点 social |
| **15-20s** | 3 (Hook + Pivot + Payoff) | 5-7s | Instagram Reels / quick-launch |
| **22-30s** | 4 (Hook + Tension + Pivot + Payoff) | 5-7s | 标准 launch / 标准 ad |
| **35-45s** | 5 (Hook + Tension + Discovery + Reveal + Payoff) | 6-9s | premium hardware launch / brand film |
| **60s+** | 6+ (manifesto 结构) | 灵活 | brand anthem / Cannes 级 |

**铁律**: 每 beat ≥ 5 秒（除 tiktok-flash 外）。读完 1 行 VO + 看清主体 + 留白吸收 = 至少 5 秒。

### 4-beat 时间分配（22s 标准）

```
0-5s    Hook       1.5 秒入场 + 2 秒 hold + 1.5 秒 micro-event
5-11s   Tension    2 秒入场 + 3 秒 hold + 1 秒 transition
11-17s  Pivot      1.5 秒入场 + 4 秒 hold (核心 reveal) + 0.5 秒
17-22s  Payoff     1 秒入场 + 3 秒 hold + 1 秒 fade
```

每 beat 必须有 ≥ 2.5 秒的 HOLD 时间（什么都不动）。这是 Apple 的 hold-then-snap 律。

---

## §3 Hook archetypes（6 种 + 选用决策树）

Hook 是前 3-5 秒。**不抓住观众，整个视频白做**。

### 6 种 archetype

| # | 名字 | 触发情绪 | 写法 |
|---|---|---|---|
| **A** | stat-shock | 震惊 / 警觉 | 一个让人坐直的数字 (e.g. "X% of Y now Z") |
| **B** | question-bait | 好奇 | 反问 / 假设 ("如果 X，那 Y 怎么办?") |
| **C** | pattern-interrupt | 困惑 | 反直觉 / 反期待 (说"不要做" 而不是"做") |
| **D** | concrete-image | 直觉 | 具体可视画面 (e.g. "An empty gym at 5am.") |
| **E** | contrarian-claim | 抵触 → 注意 | 跟主流相反的判断 ("X is dead.") |
| **F** | naming-the-pain | 共鸣 | 直接说出观众正经历的痛 |

### 选用决策树

```
brief.audience 是技术受众 (developer / analyst)?
  → 优先 A (stat-shock) 或 E (contrarian-claim)
brief.tone 是 inspirational / educational?
  → 优先 D (concrete-image) 或 B (question-bait)
brief.stakes 涉及"老办法失效"?
  → 优先 E (contrarian-claim) 或 F (naming-the-pain)
brief.audience 是大众消费者?
  → 优先 D (concrete-image) 或 F (naming-the-pain)
不确定?
  → 默认 A (stat-shock) — 数字最不容易出错
```

### Hook 的 4 项纪律

- **≤ 8 个词** (前 3 秒能读完)
- **没形容词堆叠** (不是 "amazing innovative game-changing X"，是 "X")
- **绝不解释**（解释延后到 Tension）
- **专有名词必须立刻具体** (不说 "AI tools"，说 "ChatGPT")

---

## §4 Tension construction（4 模式）

Tension 是放大痛点的关键节点。**没 Tension 的视频感觉像 PPT**。

### 4 种 Tension 模式

| 模式 | 怎么写 | 适用 |
|---|---|---|
| **old-method-broken** | "你的 X 是为 Y 设计的。但现在是 Z。" | 工具替换故事 |
| **time-pressure** | "X 月之内，Y 将……" | urgency-driven |
| **comparison-pain** | A 列表 vs B 列表，A 显然落后 | competitor framing |
| **data-of-decline** | 数字下降 / 用户流失 | data-driven 警示 |

### Tension 写作铁律

- **必须直接戳痛 audience** (不是抽象，是他们的具体场景)
- 用 audience 的"我们用 [X 工具]" 当锚点
- 长度 5-8s，不能拖（拖了像抱怨）
- VO 用 "你 / 你们" 不是 "用户们"

---

## §5 Pivot construction（3 模式）

Pivot 是转折，把 tension 解开的瞬间。**没 surprise 的 pivot 等于不存在**。

### 3 种 Pivot 模式

| 模式 | 怎么写 | 节奏 |
|---|---|---|
| **sudden-reveal** | tension 之后突然画面切，新东西出现 | 0.3s 黑屏 → 新 hero 入场 |
| **inversion** | "不是 X，而是 Y" 句式 | VO 节奏切换 |
| **specific-fact-burst** | tension 后甩一组具体数字/能力 | 数字 stagger 入场 |

### Pivot 必备元素

- **具体性突变**: tension 是抽象痛，pivot 是具体药
- **节奏对比**: tension 慢、压抑 → pivot 快、明亮
- **视觉对比**: tension 暗调 / 单一 → pivot 亮 / 多元
- **绝不直接卖**: pivot 是 "看，这是新世界"，不是 "买它"

---

## §6 Payoff construction（4 模式）

Payoff 是收尾。**观众记不住 payoff = 视频白做**。

### 4 种 Payoff 模式

| 模式 | 怎么写 | 留下什么 |
|---|---|---|
| **CTA-direct** | 具体动作 + 极短句 (`npx ...` / `joinX.com`) | 立即可执行 |
| **manifesto-line** | 观点宣言 (1 句话总结世界观) | 可被复述 |
| **brand-promise** | 品牌承诺 (短到能贴墙上) | 可被记住 |
| **question-back** | 反问观众下一步 | 余韵 |

### Payoff 必备纪律

- **memorable-line**: 1 句话 ≤ 10 词 (别 2 句、别长句)
- **brand mark**: 品牌名一定要出现
- **action**: 必须告诉观众下一步去哪
- **HOLD ≥ 3 秒**: 收尾画面静止够久让观众吸收

---

## §7 VO 写作机械律

VO 不是 brief 文案，是**朗读优化**的脚本。

### 数字律

| 项 | 值 |
|---|---|
| 语速 | 140-165 wpm (warm narrator) |
| 上限 | 175 wpm (再快显焦虑) |
| 单句长度 | ≤ 8 个词 |
| 句末停顿 | 0.4-0.8s |
| 双子音连续 | 避免 ("Stripe's strict streamlined" 难读) |
| 数字写法 | "ten times" 不是 "10x" (TTS 朗读不一致) |

### 词数 → 时长公式

```
单 beat VO 时长 (秒) ≈ word_count × 60 / 150 + (sentences - 1) × 0.6
```

### VO 与画面同步律

- VO 句末 0.3-0.5s **早于** scene 切（不是同时切）
- 关键词 (产品名 / 数字) 出现时画面应有视觉强调
- 静默 1-2 秒**比塞满 VO 强**（Apple 招牌律）

---

## §8 Visual-narrative pairing（视觉与叙事配对）

不同 beat 角色 → 不同视觉风格。**乱配 = 视频感觉散**。

| Beat | 推荐 visual | 为什么 |
|---|---|---|
| Hook | typography-statement / cinematic-luxury | 大字 / 单镜头建立 stake |
| Tension | data-viz-driven / comparison-split | 数字下降 / A vs B 直观 |
| Pivot | product-ui-mockup / cinematic-luxury | 产品现身 / 大转场 |
| Payoff | typography-statement / lifestyle-shot | 标语 / 余韵 |

### 跨 beat 视觉一致律

- **字体**: 全片同一套（≤ 2 family，e.g. heading + mono）
- **色板**: 全片同一套（1 accent，全片只 1-2 处使用）
- **节奏**: tension 可以慢，pivot 必须快、明亮、信息密集
- **景别变化**: hook 大景别 → tension 中景 → pivot 大特写 → payoff 拉回大景别 (camera "呼吸")

---

## §9 50-video beat skeleton index（结构骨架，不抄文案）

读 INDEX.json 的 50 视频，每个用 4-beat 抽象结构填空。
**只记结构，不记原文**。下面是 12 个最高频范例。

| ID | Hook archetype | Tension | Pivot | Payoff |
|---|---|---|---|---|
| `apple-vision-pro-launch` | concrete-image (人 + 设备) | (无 — 直接 wonder) | sudden-reveal (UI 出现) | brand-promise + tagline |
| `apple-think-different` | concrete-image (历史人物组照) | naming-the-pain (隐含: 主流不接受异类) | inversion (异类 = 改变世界的人) | manifesto-line + 品牌 |
| `apple-privacy-iphone` | pattern-interrupt (强烈否定句) | (无 — 直接 pivot) | specific-fact-burst (隐私机制) | brand-promise |
| `aesop-eau-de-parfum` | concrete-image (静物镜头) | sensory hold (慢) | inversion (产品现身) | brand-mark + url |
| `nike-dream-crazy` | naming-the-pain (运动员困境) | comparison-pain (社会预期 vs 个人选择) | inversion ("just do it" 重述) | manifesto + swoosh |
| `linear-launch-film` | stat-shock 或 concrete-image (UI 慢镜) | old-method-broken (慢工具) | sudden-reveal (Linear 速度) | CTA 或 brand |
| `tesla-cybertruck-reveal` | concrete-image (帘后剪影) | time-pressure (倒计时) | sudden-reveal (车出现) | brand-promise |
| `stripe-sessions-2024` | stat-shock (经济规模) | (无 — 直接) | specific-fact-burst (新功能) | CTA |
| `notion-calendar-reveal` | naming-the-pain (日历碎片) | comparison-pain (Notion 之外) | sudden-reveal (集成) | CTA-direct (try) |
| `vercel-composable-commerce` | stat-shock 或 contrarian-claim | old-method-broken (旧 stack) | sudden-reveal (Vercel) | CTA |
| `bloomberg-how-world-spends` | stat-shock (全球数据规模) | data-of-decline (时间分配) | inversion (重新分类) | manifesto |
| `kurzgesagt-optimistic-nihilism` | question-bait (哲学发问) | naming-the-pain (虚无感) | inversion (转角度) | manifesto-line |

agent 写新 storyboard 时:
1. 找到跟 brief 最接近的 2-3 行
2. 看它们的结构（不是文案）
3. 用 brief 的内容填同样的结构

---

## §10 Self-grading rubric（10 项自检）

storyboard 出炉后，agent 必须自己过这 10 条。任何 ❌ 就回炉。

```
1. ❒ 主角清晰  ─ 观众一眼能看出谁是主角 (产品/品牌/痛点)?
2. ❒ Stakes 真实  ─ 不解决会失去什么? 1 句话能讲清?
3. ❒ Hook 抓眼  ─ 前 3 秒有 1 个具体的 stake / image / stat?
4. ❒ Tension 戳痛  ─ 触到 audience 的真实场景，不是抽象?
5. ❒ Pivot 有 surprise  ─ tension 跟 pivot 之间不能直接推?
6. ❒ Payoff 可记忆  ─ 1 句话 ≤ 10 词，能复述?
7. ❒ VO 长度对  ─ 每 beat 词数 × 60/150 + 0.6×(句数-1) ≤ beat 时长?
8. ❒ Hold 充足  ─ 每 beat ≥ 2.5 秒静止时间?
9. ❒ 视觉一致  ─ 全片字体 ≤ 2 family，accent ≤ 1?
10. ❒ 没占位词  ─ 任何 "your sentence" / "design tokens" 立刻 fail
```

---

## §11 常见失败模式（带名字 + 诊断 + 修法）

| 失败模式 | 症状 | 诊断 | 修法 |
|---|---|---|---|
| `feature-dump` | 4 帧列 4 个能力 | 没 Tension / Pivot | 强制写完 7 个 stakes 字段才能动笔 |
| `info-fog` | 每帧塞太多 | 一帧 ≥ 2 主体 | 每帧只允许 1 主体 |
| `template-trap` | 看完跟其他 SaaS 视频一样 | 没用 brief 的具体性 | 强制每 beat 至少 1 个 brief 专属事实 |
| `weak-hook` | 前 3 秒说"hello" | hook 是寒暄 | 用 6 archetype 之一替代 |
| `tension-as-feature` | tension 帧讲产品好 | 把 pivot 提前了 | tension 只讲痛，产品在 pivot 才出现 |
| `pivot-explanation` | pivot 帧解释产品 | 把 payoff 提前了 | pivot 是 reveal，不是说明书 |
| `payoff-no-action` | 收尾就是 logo | 没 CTA / manifesto-line | 必加 1 句行动或 1 句宣言 |
| `vo-too-fast` | VO 175+ wpm | 词数超 beat 容量 | 减词 / 增 beat 时长 |
| `vo-too-flat` | VO 无停顿 | 句末没 . 或 — | 显式标点强制停顿 |
| `accent-spam` | 5 帧每帧都有 accent | 没 single-accent 律 | 全片只 1-2 处 accent |

---

## §12 工作流（agent 用这 8 步写 storyboard）

```
1. 读用户 brief
2. 提取 / 追问 7 个 stakes 字段（§1）
3. 决定时长 → beat 数（§2）
4. 选 Hook archetype（§3）
5. 选 Tension 模式（§4）
6. 选 Pivot 模式（§5）
7. 选 Payoff 模式（§6）
8. 写每 beat 的:
   - 视觉描述（用 §8 配对）
   - VO 文案（用 §7 机械律）
   - 时长 (含 hold)
   - 关键画面元素
9. 找 INDEX.json 2-3 个最贴 reference (§9)
10. 跑 §10 rubric 自检 → 任何 ❌ 回 step 8
11. 输出 Storyboard 给 Confirmation Gate
```

---

## §13 Storyboard 数据结构

```typescript
interface Storyboard {
  brief: ContentIntent;        // 用户的故事源
  stakes: {
    subject: string;
    audience: string;
    stakes: string;
    antagonist: string;
    keyClaim: string;
    memorableLine: string;
    proof: string;
  };
  totalDuration: number;
  beats: Beat[];               // 2-6 个
  archetypeMix: {
    hook: HookArchetype;       // §3 的 6 个之一
    tension?: TensionPattern;  // §4 的 4 个之一 (短视频可省)
    pivot?: PivotPattern;      // §5 的 3 个之一
    payoff: PayoffPattern;     // §6 的 4 个之一
  };
  references: VideoLibraryEntry[];  // §9 的 2-3 个
  selfGrade: { passed: boolean; failed: string[] };  // §10
}

interface Beat {
  index: number;
  role: "hook" | "tension" | "pivot" | "payoff" | "discovery" | "reveal";
  durationSeconds: number;
  visualStyle: VisualStyle;
  visualDescription: string;   // 自然语言描述要看到什么
  voLine: string;              // 朗读优化的 VO
  onScreenText?: string;       // 屏上文字 (短)
  bgmMoment?: "build" | "drop" | "hold" | "fade";
  holdSeconds: number;         // ≥ 2.5
}
```

---

## §14 一句话总结

> **故事来自用户。技艺来自这本笔记。参考来自 50 视频。
> 写之前先追问，写完先自检。任何占位词 = 重写。**
