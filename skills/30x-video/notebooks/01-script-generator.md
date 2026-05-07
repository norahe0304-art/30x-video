<!--
[INPUT]: brief / DesignProfile / 5-dim composition
[OUTPUT]: scene-by-scene shotlist + on-screen text + VO lines
[POS]: notebooks/ 第 1 篇; storyboard 是视觉内容驱动的源头
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 01 — Script Generator (Storyboard)

> 灵魂模块第一件: 把一句 brief 变成 N 个 scene 的 HTML + VO 文字。

## 现状审计

`scripts/script-generator.ts`:
- ✅ 每帧都填 onScreenText (修复了黑屏)
- ✅ 按 pacing 算 scene 数 (slow-luxury=8 / quick-hook=7 等)
- ⚠️ **致命弱点**: 占位词池 (`"Here's the thing." / "Most people miss it."`) — 所有视频长一样
- ⚠️ 不接 brief 内容 — 只用 `intent.subject` 第一帧，其他都是通用填充
- ❌ 没生成 HTML 片段，只生成字符串 (compose.ts 硬塞 `.heading` div)
- ❌ VO line 是 `(VO line N — to be replaced)` 占位，没真内容
- ❌ 没意识到自己是 LLM 角色 — 现在是 heuristic 字符串拼接

## 业界参考 (高质量短视频脚本结构)

| 来源 | 核心结构 |
|---|---|
| Apple Vision Pro launch | 1) 痛点 hook 2) 概念揭示 3) 演示 ×3 4) Tagline |
| Linear product film | 1) 痛点 2) 简短主张 3) 演示帧 ×3 4) Closing manifesto |
| MrBeast retention model | 0-3s strongest hook → 隔 1-2s 投递 micro-payoff → 重复 |
| Hormozi shorts | Hook → 3 个 micro-claim → CTA |
| TikTok 病毒结构 | Pattern interrupt → tension → resolution (within 7-15s) |

## 优化提案 (按 ROI 排序)

### P0 — 让 LLM 真在写 (而不是 heuristic 占位)

**问题**: 现在 `generateScriptHeuristic` 用占位词池。LLM 应该接管。

**做法**:
- SKILL.md 里写清: agent 在 [4] 必须**手写**每个 scene 的 onScreenText + voLine
- heuristic 只在 CLI 测试时用，永远不应该出现在用户成片里
- 加一个 `generateScriptLLM()` 接口契约 (TypeScript only — agent fills it)

**signal**: 占位词出现在最终视频 = 严重 bug (Finish Gate 应该挡这个)

### P1 — Hook 压缩 (前 3 秒决定生死)

**问题**: 现在的 Hook 是 `subject + "."` (e.g. "Morning routines.") — 太弱。

**做法**: 加一个 hook archetype 选项:
- `pattern-interrupt`: "你 99% 时间都在浪费早上 30 分钟"
- `direct-claim`: "晨间习惯能让你多活 7 年" (有 evidence 时)
- `question`: "如果第一小时决定你今天的 90%?"
- `concrete-image`: "我每天 6:30 起。窗帘没拉。" (visual hook)

LLM prompt 里给 4 种 hook 模板 + 让它选最贴的一种。

### P1 — Scene 数自适应 brief 内容点

**问题**: 现在按 pacing 写死 scene 数 (e.g. medium-narrative=10)。如果 brief 只有 2 个核心点，10 个 scene 就有 8 个填充。

**做法**:
1. LLM 先抽 brief 的核心信息点数 (`coreClaimCount: 1-5`)
2. scene 数 = max(coreClaimCount + 2, pacing-min)  // +2 是开场 + 收尾
3. 短视频 (<15s) 信息点 ≤ 3，长视频 (>30s) 信息点 ≤ 7

### P2 — 对应 visual style 写不同的 HTML 片段

**问题**: 不管什么 visual style，HTML 都是 `<div class="heading">{text}</div>`。这违反 content-driven 原则。

**做法**: LLM 根据 5 维 + brief 自由写 HTML，例:
- `typography-statement`: 大字 + 渐入 + 一行
- `product-ui-mockup`: div 拼 fake dashboard
- `data-viz-driven`: SVG 数字 count up
- `lifestyle-shot`: CSS 滤镜 + 纯色背景模拟氛围
- `comparison-split`: 50/50 left/right 分屏

`compose.ts` 不该硬编码 `.heading` — 应只负责 wrapper (`<div class="clip" data-start ...>{LLM 写的 body}</div>`)。

### P2 — VO 写作律 (而不是字符串)

VO 文案需要的不是普通文字，是**朗读优化**的:
- 单句 ≤ 8 词 (140 wpm 易读)
- 避免一连串子音 ("Stripe's strict streamlined system" 难读)
- 句末 0.3-0.5s 停顿 (写成 `. ` 让 TTS 自然停)
- 避免 hyphenated words (TTS 朗读不一致)
- 数字写成单词 ("ten times" 不是 "10x")

加一个 `voReadabilityCheck()` 函数在 Finish Gate 阶段验证。

### P3 — 节拍同步 (storyboard 跟 BGM 卡点对齐)

**问题**: 现在每 scene 等长。BGM 有 BPM 后，scene 切换该卡在 beat / bar 上。

**做法**:
1. BGM fetch 后拿到 `bpm` + `firstBeatSec`
2. script-generator 重排 scene 时长，让每个 scene 的边界落在 bar (4 beats) 或 phrase (8 beats) 上
3. Hook 卡 bar 1 第一拍，主体 scene 卡 phrase 边界，closing 卡 final downbeat

这会让视频 "有节奏" 而不是 "随便切"。

### P4 — Brand voice 一致性

LLM 写 VO + on-screen text 应该:
- 字数 / 句长统一 (头帧 4 词 = 后帧也 3-5 词)
- 标点统一 (要么都 `.` 要么都没标点)
- Tone 统一 (educational 全程不要 inspirational)

加一个 `brandVoiceCheck()` 在 Finish Gate。

## 优先级 + 工时

| 项 | 工时 | 优先 |
|---|---|---|
| P0 LLM 真在写 (SKILL.md 强制 + 移除占位 fallback) | 1 hr | 现在做 |
| P1 Hook archetype 4 种 | 2 hr | 本周 |
| P1 自适应 scene 数 | 1.5 hr | 本周 |
| P2 LLM 写 HTML body | 3 hr | 本周 |
| P2 VO 朗读律 + check | 2 hr | 下迭代 |
| P3 BGM 节拍同步 | 4 hr | 下迭代 |
| P4 Brand voice 一致性 check | 1 hr | 下迭代 |

## 行动清单 (本次先做的)

1. `script-generator.ts`: 把 `generateScriptHeuristic` 改名 `generateScriptHeuristicFallback` — 强调它是兜底
2. 加 `generateScriptLLM(plan): Promise<VideoScript>` 接口骨架 (LLM 在 agent 里调用)
3. `SCRIPT_GENERATOR_PROMPT` 改写: 强制要求 LLM 输出 `htmlBody` per scene + 包含 4 种 hook archetype 选项
4. `types.ts` 给 `SceneSpec` 加可选 `htmlBody?: string`
5. `compose.ts` 改: 如果 scene 有 `htmlBody`，直接用；否则 fallback 到 `.heading` div
