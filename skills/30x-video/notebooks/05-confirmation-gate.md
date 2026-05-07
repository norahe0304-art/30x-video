<!--
[INPUT]: 计划 + 推断决策 + 歧义点
[OUTPUT]: 用户视角的 Plan UI + 等 'go' 信号
[POS]: notebooks/ 第 5 篇; 渲染前不可绕过的人机对齐节点
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 05 — Confirmation Gate

> 不是技术模块，是产品哲学落地。每次违反这条 = 用户失望一次。

## 现状审计

`scripts/confirmation-gate.ts`:
- ✅ 列计划清单 (table format)
- ✅ 检测歧义 + 提建议默认
- ✅ Reply 'go' 锁定决策
- ⚠️ Plan 显示太干 (每行就一个 label + value)
- ⚠️ 没显示参考视频的 thumbnail (只显示文字)
- ⚠️ 没显示估算渲染时长 / 成本 (用户不知道要等多久)
- ❌ 没"草图预览" — 用户没法看到 video 大概长什么样就要 'go'
- ❌ 用户调整后不重新跑 confirmation (只在第一次 surface)

## 业界参考

| 工具 | confirmation 模式 |
|---|---|
| Runway Gen-3 | 在 4 个 still preview thumbnail 之后才 generate |
| OpenAI ChatGPT 图像 | 描述完直接出，没有中间确认 (经常错) |
| Cursor IDE | 大改动前列文件 diff，等用户 approve |
| Vercel Deploy | preview URL → 用户测 → promote to prod |
| Google Docs Suggesting Mode | 改完用户审，逐条 accept/reject |

## 优化提案

### P0 — 显示估算渲染时长

**问题**: 用户 'go' 之后不知道要等多久。15s 视频 30 秒能渲完，40s 视频可能 3 分钟。

**做法**: 
```
Plan 末尾加:
  Estimated render: ~45s (15s × ~3x realtime)
  + BGM fetch: ~30s if not cached
  + VO synth: ~10s × 7 lines = 70s
  Total: ~2-3 minutes
```

### P0 — Visual mock (草图预览)

**问题**: 用户只看到 5 维参数，看不到长什么样。

**做法**: Confirmation Gate 时跑 hyperframes snapshot → 拿 3 帧低质量 PNG (开场/中段/closing) 显示给用户:
```
Plan + sample frames (low-res, no audio):
  [thumbnail 0:01]   [thumbnail 0:08]   [thumbnail 0:15]
```

用户看到大致样子才 'go'，比看 5 维参数靠谱 100x。

但这要求**先生成一版临时 HTML**才能 snapshot — 有鸡生蛋问题。妥协方案:

- 用 5 维 + 1 个**预生成模板**给 placeholder 渲染 (5s 内完成)
- 用户 'go' 后再走完整 LLM HTML 生成 + 真渲染

### P1 — Inline editing

**问题**: 用户想改某行只能整段重发 brief。

**做法**: 接受单字段调整:
```
User: "change format to 16:9"
agent: 只改 format，其他不动 → 重新 surface plan
```

而不是:
```
User: "change format to 16:9"
agent: 重头跑一遍 content analyzer + style hunter
```

### P1 — 显示参考视频缩略图 (来自 INDEX.json)

**问题**: 现在显示 "Apple — Privacy. That's iPhone." 用户不知道是哪条。

**做法**: 拿 video INDEX.json 的 youtube_search 跑一次 yt-dlp 抓 thumbnail (1 帧静态图)，缓存。Plan 里显示:

```
References:
  [thumb] Apple — Privacy. That's iPhone. (60s, 16:9)
  [thumb] Alex Hormozi — $100M Offers (90s, 9:16)
  [thumb] Sahil Bloom — Curiosity Compounds (60s, 9:16)
```

### P2 — Cost-aware (大文件操作前提示)

**问题**: 用户不知道 BGM fetch + VO synth + render 加起来多少钱 / 多少 CPU。

**做法**: 估算 + 显示:
```
Cost estimate (this run):
  - Refero MCP calls: ~5 (Pro plan: 4995/5000 monthly remaining)
  - Anthropic API tokens: ~12k input + 3k output ($0.012)
  - GPU/CPU: ~2 minutes of single-machine render
```

### P2 — 'go' shortcuts

**问题**: 每次都要打 'go'。常用模式应该有快捷:
- "go fast" → quick-hook + 9:16 + minimum quality
- "go pretty" → slow-luxury + cinematic + max quality
- "go silent" → vo: none

### P3 — 历史回顾

**问题**: 用户上周做过相似的，没法 reuse。

**做法**: `~/.cache/30x-video/history.json` 存所有 ConfirmedPlan + 输出路径。下次类似 brief 来:
```
"You made something similar 5 days ago: 'Make a 15s social about productivity'.
 Same 5-dim picks? Or new direction?"
```

## 行动清单

1. 加估算渲染时长到 Plan UI (P0)
2. 实现 Visual mock 草图预览 (P0) — 需要 placeholder render 流程
3. 接受 inline edit (P1) — 只改改的字段，不重跑全 pipeline
