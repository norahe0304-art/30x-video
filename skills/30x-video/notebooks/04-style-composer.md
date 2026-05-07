<!--
[INPUT]: ContentIntent + DesignProfile
[OUTPUT]: 5 维 StyleComposition (visual / pacing / bgm / vo / format)
[POS]: notebooks/ 第 4 篇; 5 维选型决定视频整体气质
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 04 — 5-dim Style Composer

> 内容到风格的翻译器 — 决定视频长什么样的关键节点。

## 现状审计

`scripts/style-composer.ts`:
- ✅ 5 维独立选型 (visual / pacing / bgm / vo / format)
- ✅ 每个维度有规则化推断 (e.g. format-hint → format)
- ✅ 8 个默认组合 (`SaaS launch` / `Hardware reveal` / 等等)
- ✅ Anti-pattern 表 (cinematic-luxury + tiktok-flash 不兼容)
- ⚠️ 推断逻辑是 if/else 链，不是分类器 — 边缘情况不稳定
- ⚠️ 每维独立推断，没考虑维度之间相互制约
- ❌ 没考虑用户偏好 / 历史选择 (没记忆)
- ❌ 没考虑平台规范 (TikTok 比 IG Reels 容忍更高字数)

## 业界参考

| 来源 | 风格选型逻辑 |
|---|---|
| Runway Gen-3 | "Style preset" 单选 + 自然语言修饰 |
| Pika Labs | Mode + Aesthetic + Camera angle 三层独立选 |
| OpenAI Sora system prompt | 让模型先 "imagine the shot list"，再细化每个维度 |
| Adobe Sensei creative auto-tag | 看素材内容自动选 visual style + 给 confidence score |

## 优化提案

### P0 — 5 维联合优化 (而非独立推断)

**问题**: 现在每维独立 if/else。`pacing=tiktok-flash + visual=product-ui-mockup` 触发 anti-pattern 但是怎么解决?

**做法**: 把 5 维当成约束满足问题 (CSP):
- 列出 5 维所有合法组合 (笛卡尔积去 anti-pattern = ~3000 个合法)
- 每个组合给分 (基于 archetype + 内容类型)
- 选最高分

或者简单点: agent 看 brief + DesignProfile 一次性输出全 5 维 (LLM 一次决策，不用规则链)。

### P1 — Confidence score + ambiguity 检测

**问题**: 如果 brief 模糊 ("做个视频")，每维都靠默认。这种情况应该问用户。

**做法**: 推断时附带 confidence (0-1):
- 若任意维度 confidence < 0.6 → Confirmation Gate 上加问题
- 若全部 > 0.8 → 可以 auto-confirm (用户答 "go" 一次就行)

### P1 — 平台规范库

**问题**: format=9:16 没区分 TikTok / Reels / Shorts。

**做法**: 加 `references/platform-specs.json`:
```json
{
  "tiktok": { 
    "format": "9:16", "safeZoneTop": 0.12, "safeZoneBottom": 0.18,
    "maxOnScreenWords": 16, "preferredHook": "pattern-interrupt",
    "captionMandatory": true 
  },
  "reels": { ... },
  "shorts": { ... }
}
```

style-composer 用平台规范覆盖默认。

### P2 — 学习偏好

**问题**: 用户连续 5 次都选 "改成 16:9" — 我们应该默认 16:9 给这个用户。

**做法**: 写 `~/.cache/30x-video/preferences.json`:
- format 用过的频率
- 拒绝过的 archetype
- 同意过的 default

每次推断时把它当 prior。

### P2 — Composition 结果可解释

**问题**: composeStyle 输出 rationale 是 ["Format ${format}: ..."]，太干。

**做法**: 让 rationale 写成完整一段话:
```
"我选了 9:16 quick-hook，因为 brief 提到 'social' (推断 TikTok/Reels) 且 length=10s
(quick-hook 区间)。lo-fi-warm BGM 配合 'morning routines' 的舒缓 tone。无 VO 因为
typography-statement + medium-narrative 组合下文字本身有节奏，VO 反而会拖。"
```

放进 Confirmation Gate 给用户读。

## 行动清单

1. 等 P0 的 LLM 5 维联合输出 (in script-generator notebook 同步推进)
2. 加 confidence score 字段到 StyleComposition
3. 平台规范库 — 优先 TikTok / Reels / Shorts / IG Feed / LinkedIn
