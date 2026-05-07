<!--
[INPUT]: BgmArchetype, target duration; downstream: scene cut timestamps
[OUTPUT]: BGM mp3 + BPM + first-beat offset; later: beat-aligned scene timing
[POS]: notebooks/ 第 2 篇; "卡点" 是我们的核心差异化能力
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Notebook 02 — BGM Fetch + Beat Sync

> 灵魂模块第二件: 不只下载音乐，要让视觉转场卡在节拍上。

## 现状审计

`scripts/bgm-fetch.ts`:
- ✅ yt-dlp 真下载 NCS / Lofi Girl
- ✅ aubiotrack BPM 检测 (E2E 跑过 124.1 BPM)
- ✅ ffmpeg trim/loop 到目标时长 + fade out 1.5s
- ✅ 按 archetype 5 套查询
- ⚠️ **没接到 storyboard** — BPM 检测出来后没用，scene 切换还是等长
- ⚠️ 第一帧不卡 first-beat (用户感觉 BGM 跟视觉脱节)
- ⚠️ 没 beat-aligned trim (现在是 ffmpeg `-ss firstBeatSec` 然后切，但可能切在弱拍)
- ❌ 没缓存 — 同一个 archetype 每次都重下 (~30s)
- ❌ 一个 archetype 只用一首，重复跑出同样的 BGM
- ❌ NCS 是好选项但有版权风险 (NCS Free 协议要 credit)

`scripts/beat-sync.ts` (PORT from remotion):
- ✅ aubiotrack 真 BPM 检测
- ❌ Remotion-specific 输出格式 (写到 `src/generated/beat-map.ts`)
- ❌ 没接 hyperframes

## 业界参考

| 工具 / 标准 | 怎么做卡点 |
|---|---|
| Premiere Pro Auto Sync to Beat | aubio onset → 在每个 onset 切 cut |
| TikTok built-in editor | 自动检测 beat → 用户拖音乐时显示节拍线 |
| CapCut | beat marker 跨整个时间轴 → cut 自动 snap |
| Adobe Sensei | ML 模型识别 "downbeat" 不只是 beat (强弱拍区分) |
| Beat sync in viral creator videos | 关键转场卡 bar 边界 (每 4 拍)，micro 转场卡 beat |

## 优化提案 (按 ROI 排序)

### P0 — 把 BPM 真接给 storyboard (节拍卡点)

**问题**: 已经检测到 BPM=124.1，但 scene 时长还是 `total / count`。

**做法**:
```typescript
function snapSceneToBeats(scenes, bpm, firstBeatSec) {
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;       // 一小节 = 4 拍
  const phraseSec = barSec * 2;     // 8 拍 = 一段 phrase
  
  // hook 卡 bar 1 downbeat
  // 主体 scenes 卡 bar 边界 (每 ~2s @ 120bpm)
  // closing 卡 phrase boundary (每 ~4s)
  
  return scenes.map(s => ({
    ...s,
    durationSeconds: snapToNearest(s.durationSeconds, barSec)
  }));
}
```

把这写进 `script-generator.ts` 或新建 `beat-aligner.ts`。

### P0 — 第一帧 onset = 第一个 downbeat

**问题**: ffmpeg `-ss firstBeatSec` 切的是第一个 beat，但可能是弱拍 (off-beat)。

**做法**:
- aubiotrack 输出所有 onset
- 找连续 4 个 beat 间隔最稳定的那段开头 → 那是 downbeat
- 从该 downbeat -100ms 开始裁剪 (留少量 pre-roll)

```python
# aubiotrack -t bpm 输出 BPM
# aubiotrack -O default 输出 onset 时间
# 找 phrase 起点的算法:
# 1. 候选: 所有 onset
# 2. 对每个候选，看后面 8 个间隔的方差
# 3. 方差最小的 → downbeat 候选
```

### P1 — BGM 缓存层

**问题**: 每次跑同 archetype 都重新 yt-dlp 下载 (~30s)。

**做法**: 
- `~/.cache/30x-video/bgm/<archetype>/<hash>.mp3` 
- 第一次下载后缓存
- 7 天过期 (避免一直用同一首)
- LRU 上限 500MB

### P1 — 多候选挑最佳 (现在选第一个能用的)

**问题**: 下 3 个候选只看 BPM 是否最接近，没看其他维度。

**做法**: 给候选打分:
- BPM 距离目标 (40%)
- 时长 ≥ 目标 (20%) — 避免 loop 必要
- 文件大小 / 比特率 (10%) — 避免太小的低质量
- 干净程度 (30%) — 用 ffmpeg silencedetect 看是否有 vocal hook (人声峰值)

### P2 — 替代音乐源 (不只 NCS)

NCS 协议要 attribution，万一用户公开发布要带 credit。

**候选源**:
- Pixabay Music API (CC0，无 attribution，需 API key)
- Mixkit (free commercial, 直接 mp3 链接)
- FreePD (public domain)
- YouTube Audio Library (Google 官方免版权)
- Audiomack royalty-free 库 (MP3 直链)

**推荐**: Pixabay 当 primary (有 API)，NCS 当 fallback。

### P2 — Onset → 视觉节拍标记

**问题**: 现在视觉转场没有任何 "节拍可视化"。

**做法**: 给 GSAP timeline 加 beat 触发的 micro-animation:
- 每个 downbeat 触发 logo 微缩放 / text 微跳动
- 让视觉感觉"在跟着音乐"

### P3 — DJ-style mix-out (不是简单 fade)

**问题**: 视频末尾 ffmpeg `afade=t=out:d=1.5` — 太机械。

**做法**: 
- 检测最后一段 phrase 边界
- fade 起点对齐 phrase 起点
- 留 4 拍尾音 (rolling tail)

## 优先级 + 工时

| 项 | 工时 | 优先 |
|---|---|---|
| P0 BPM → scene 时长卡 bar | 3 hr | 现在做 |
| P0 第一帧 = downbeat (而不是任意 beat) | 2 hr | 现在做 |
| P1 BGM 缓存层 | 1 hr | 本周 |
| P1 多候选打分 | 2 hr | 本周 |
| P2 Pixabay API 接入 | 2 hr | 下迭代 |
| P2 Beat 触发视觉 micro-animation | 2 hr | 下迭代 |
| P3 DJ-style mix-out | 2 hr | 后续 |

## 行动清单 (本次先做的)

1. 写一个新模块 `scripts/beat-aligner.ts`:
   - `alignScenesToBeats(scenes, bgm) → scenes` 按 bar 边界吸附
   - `findFirstDownbeat(audioPath) → seconds` 找 phrase 起点
2. `bgm-fetch.ts` 用 `findFirstDownbeat` 替代当前的 `firstBeatSec`
3. `orchestrator.ts` 在 BGM fetch 后调 `alignScenesToBeats`
4. `compose.ts` 用 aligned scene 时长重新计算 GSAP 时间轴
