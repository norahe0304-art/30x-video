<!--
[INPUT]: hyperframes media-use skill 的 resolve 台账模式 (2026-07-04 happy-model 实战移植), brand-report.json, 项目 public/brand/
[OUTPUT]: 素材接入五级瀑布 + .media/manifest.jsonl 台账契约 + 程序化素材优先原则 (地图/品牌 mark/AI 模型 logo)
[POS]: rules/ 的素材解析层; 被 workflow.md (素材下载) 与 qc-gates Gate 1 (素材审计) 引用
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Media Resolve — 一个动词, 冻结文件, 台账记录

素材接入只有一个动作：**resolve** — 把"我需要 X"变成"冻结的本地文件 + 一行台账"。
搜索过程的噪音（候选、评分、来源）全部留在磁盘上，不进上下文。

## 五级瀑布（按序，命中即停）

1. **项目台账** — `.media/manifest.jsonl` 里同 intent 的记录直接复用。
2. **收编现有资产** — `public/brand/` 下已有的未登记文件匹配 intent 就地登记（ffprobe 取时长/尺寸）。
3. **程序化生成（首选新增路径）** — 见下方"程序化素材优先"。矢量、确定性、可染色、零版权风险。
4. **目录检索** — HeyGen catalog（凭据在时）/ LobeHub icons / 官方 brand kit 下载。
5. **网络兜底** — yt-dlp / Pixabay 等，按 workflow.md 的来源链。

**任何一级命中后必须做两件事：冻结 + 登记。** 渲染时禁止一切网络请求 — 热链 = 死罪（FATAL 级，视频渲染不可复现）。

## 台账契约

`.media/manifest.jsonl` — 一行一条 JSON，machine SSOT：

```jsonc
{"id":"icon_openai","type":"icon","path":"public/brand/logos/openai.svg","intent":"openai official AI model mark","source":"@lobehub/icons-static-svg","frozen":"2026-07-04"}
```

- `type`: `bgm | sfx | image | icon | map | vo`
- 换素材 = 追加新行，不删旧行（历史可审计）
- Gate 1 素材审计读这个文件核对"报告用了什么" vs "盘上有什么"

## 程序化素材优先（Programmatic-First）

能用代码生成的素材，永远优先于位图下载。矢量在 1080p/4K 下无损、可动画、可染品牌色。

| 需求 | 方案 | 用法要点 |
|------|------|---------|
| **世界地图 / global 场景** | `dotted-map` (npm) | **build-time 预计算**到 `src/generated/world-map.ts`（点数组 + `getPin(lat/lng)` 城市坐标），组件只消费常量 — 不在渲染时计算。路由弧线用二次贝塞尔连真实城市 pin。 |
| **通用品牌 mark**（GitHub/Slack/…） | `simple-icons` (npm) | `si<Name>.path` + `.hex`，24×24 viewBox，`fill` 随意染。 |
| **AI 模型 logo**（OpenAI/Claude/Gemini/DeepSeek/Qwen/Grok/Kimi/…） | `@lobehub/icons-static-svg` | **simple-icons 缺 OpenAI/Grok/Cohere（商标下架）— 别在那里找。** `curl unpkg.com/@lobehub/icons-static-svg@latest/icons/<name>.svg` 冻结到 `public/brand/logos/`，再生成内联组件（SVG 本身 `fill="currentColor"`，提取 viewBox+body 进 `src/generated/provider-logos.tsx`）— 可染色、无运行时请求。 |

**地图实战参数**（happy-model 验证）：`new DottedMap({ height: 60, grid: 'diagonal' })` ≈ 3065 点，坐标系 ~119×59；1920 全出血 `S = 1920/119`，点 `r=2.5, fill rgba(248,250,252,0.19)`。路由弧线左→右级联、**每城最多两条**（否则打结），弧高 `lift = min(250, dist*0.26)`。

## 裁切资产清洗铁律

从大图（hero/homepage）裁出的 logo/字标**必须亮度阈值洗成真透明 PNG**（PIL: lum<110 → alpha 0, 110-160 渐变），把烘焙的底纹/点阵/背景一并剥离——然后正常渲染，**不许用 mixBlendMode/maskImage 补丁糊弄**（blend 会被 transform/filter 杀、mask 会咬字尾，且底纹依然可见 — caylent 字标点点事故）。

## 关掉的路

- ❌ 渲染时 fetch 任何 URL（含 unpkg/CDN icon）— 全部先冻结。
- ❌ 用 emoji / unicode 符号冒充品牌 logo。
- ❌ 手画"抽象大陆"点阵冒充世界地图 — dotted-map 就在那里，真轮廓不比假的贵。
- ❌ 位图 logo 截图（模糊 + 不可染色）当官方 mark 用。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
