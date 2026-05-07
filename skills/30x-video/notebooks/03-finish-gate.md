<!--
[INPUT]: 渲染完成的 hyperframes 项目 + script + composition
[OUTPUT]: pass/fail + per-rule findings + 是否需要迭代
[POS]: notebooks/ 第 3 篇; 质量门是出片前最后一道闸
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 03 — Finish Gate (质量检查)

> 灵魂模块第三件: 在交付给用户前自动审查，不通过不交付。

## 现状审计

`scripts/finish-gate.ts`:
- ✅ Hyperframes lint 集成 (engine 级正确性)
- ✅ Hyperframes inspect 集成 (text/container 溢出)
- ✅ Reading-time audit (taste.md 阅读时间表)
- ✅ tiktok-flash pacing 放宽 40%
- ⚠️ 只验证**静态规则** — 看不到视频实际"长什么样"
- ⚠️ 没接 LLM vision 评审 (无主观品味判断)
- ❌ 没检查 BGM 卡点是否对齐 (现在卡点没做，但应该有这个 check)
- ❌ 没检查 VO 跟视觉是否同步 (开口 vs 文字出现)
- ❌ 没检查反 slop 黑名单 (anti-slop.md 写了规则没用上)
- ❌ 没 iteration 闭环 (失败只 surface，没自动改)

## 业界参考

| 来源 | 评审维度 |
|---|---|
| Cannes Lions / D&AD 评审 | Idea / Execution / Craft / Innovation × 5 评委独立打分 |
| Apple WWDC 视频内审 | Brand fidelity / Pacing / VO clarity / Visual restraint |
| YouTube Studio 算法 | Retention curve (前 3s / 前 30s / 完播率) |
| Adobe Premiere "Auto Reframe" | 检测主体在每帧位置是否被裁切 |
| Stable Diffusion / Sora QA | 多维 LLM 评审 (一致性 / 物理合理性 / 主体清晰度 / 美学) |

## 优化提案 (按 ROI 排序)

### P0 — 反 slop 黑名单真接到 lint 阶段

**问题**: `anti-slop.md` 写了 N 条 (紫粉渐变 / 烂大街 BGM / VO 175 wpm 上限 / "Elevate / Unleash" 文案)，但 Finish Gate 没检查任何一条。

**做法**: 加 4 个 audit 函数:

```typescript
// 1. 文案 slop check (扫描 onScreenText + VO)
auditSlopWords(script): {
  found: ["Elevate", "Unleash", ...],
  scenes: [3, 7]
}

// 2. VO 语速 check (Kokoro 输出 + script 文字 → wpm)
auditVoSpeed(voAsset, script): { wpm: number, exceedsLimit: boolean }

// 3. BGM 频段 check (ffmpeg ebur128 看 BGM RMS 是否压过 VO)
auditBgmDucking(voAsset, bgmAsset): { duckedBy: number, passed: boolean }

// 4. 转场 slop (扫 GSAP timeline，看是否有 "光斑划过" / "fade-to-black 滥用")
auditTransitionVariety(html): { samePatternCount: number }
```

### P0 — Iteration 自闭环

**问题**: Finish Gate 失败只打印 notes，要人手改。

**做法**: 失败时自动调 LLM:
```
LLM input:
  - 失败的 violations
  - current plan
  - failed video manifest

LLM output:
  - 修订的 ContentIntent / StyleComposition / Script
  - reason: "scene 1 太短 → 把 5 个核心点压成 3 个，每个 3s"

回到 [4] script-generator → 重渲。最多 2 次。
```

新模块: `scripts/iterate.ts`

### P1 — LLM vision 主观评审

**问题**: 静态规则抓不住 "这个视频好不好看"。

**做法**: 渲染后用 hyperframes snapshot 抓关键帧 → 喂给 vision LLM:
```
针对每个 keyframe (开场/中段/closing):
  - 这一帧是否有清晰的 hero element?
  - 字号是否够读?
  - 视觉 hierarchy 清晰?
  - 跟 brief 的承诺一致吗?
  - 像 AI slop 还是像 agency-grade?
  
返回: passed: bool, notes: [...]
```

引用现成的 `critique-scenes.ts` 逻辑 (PORT 自 remotion-video) — 但要改成调 hyperframes snapshot 而不是 remotion still。

### P1 — Retention 模拟

**问题**: 我们看不到 "用户会不会看完"。

**做法**: 至少做轻量模拟:
- 前 3 秒: 是否有 hook? 字数 ≥ 5? 是否有视觉变化?
- 前 30 秒: 是否每 3-5 秒有视觉切换? 是否避免长 hold?
- 全程: 是否有重复场景结构 (template trap)?

抽出 `scripts/retention-audit.ts`，给每个时间窗打分。

### P2 — Brand fidelity check (跟 DesignProfile 对齐)

**问题**: DesignProfile 说 fonts: ["Inter"], 但 LLM 写 HTML 可能用了 Helvetica。

**做法**: 扫 HTML body:
- 所有 `font-family` 必须 ⊂ DesignProfile.fonts
- 所有 color 必须 ⊂ DesignProfile.{primary,accent,bg,text}Color (允许 ±5% lightness)
- 没 inline `<img src>` (再次确认不嵌截图)

### P2 — VO/视觉同步精度

**问题**: VO 说 "Stripe makes payments simple"，视觉上 "payments" 那一刻应该有视觉 emphasis。

**做法**: 用 Whisper 做 word-level transcript → 对齐 GSAP timeline
- 关键词 (产品名 / 数字) 时间戳 → 视觉应该 highlight 同时刻
- 不对齐时降级 (整句结束才切场景)

需要 hyperframes-media 的 `npx hyperframes transcribe`.

### P3 — 多视频对比 (regression 测试)

**问题**: 改了一行代码，怎么知道没把第 5 类视频弄坏?

**做法**: 5 个 benchmark video brief 固定 → 每次 push 自动渲染 → 对比 manifest.json + critique.md。回归差异 surface 给开发者。

类似 `tests/snapshot.json` 但是视频版。

## 优先级 + 工时

| 项 | 工时 | 优先 |
|---|---|---|
| P0 反 slop 4 audit (slop words / wpm / ducking / transition) | 4 hr | 现在做 |
| P0 Iteration 自闭环 | 4 hr | 现在做 |
| P1 LLM vision 主观评审 | 5 hr | 本周 |
| P1 Retention 模拟 | 2 hr | 本周 |
| P2 Brand fidelity check | 2 hr | 下迭代 |
| P2 VO/视觉同步精度 (Whisper) | 4 hr | 下迭代 |
| P3 Benchmark regression | 3 hr | 后续 |

## 行动清单 (本次先做的)

1. 在 `finish-gate.ts` 加 4 个 audit 函数 (slop words / wpm / ducking / transitions)
2. 在 `runFinishGate` 里调用它们
3. `FinishGateResult` 结构扩展: 把 lint / inspect / timing / slopWords / voSpeed / bgmDucking / transitionVariety 全列出
4. 写 `scripts/iterate.ts` 骨架 — 失败 → LLM 修订 plan → 重跑 (但 LLM 调用部分由 agent runtime 触发)
