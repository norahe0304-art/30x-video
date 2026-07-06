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


## 品牌字体的两条硬判例 (DIOR 之夜 2026-07-05)

1. **变量字体必须设实例轴**。variable font 加载后用默认轴渲染 ≠ 品牌字形(DIOR 的 Atacama VAR 默认 CNTR=0 渲成无衬线,官方实例 CNTR=70 才是真 Didone)。拿到 VF 后先查它的命名实例(named instances)或官网 computed `font-variation-settings`,在 CSS/fonts.ts 里显式设置;渲一帧对比字形验收,serif/对比度不对就是轴没设。
2. **用户存档页是字体金矿**。浏览器"保存页面"的单文件 html 里 @font-face 常以 base64 data URI 内嵌品牌真字体——正则提取、解码落盘 `public/fonts/`、本地加载,即获 1:1 品牌字。比找"最像的 Google 字体"高一个量级。


## 侦探手册 — 素材找不到时去哪儿看 (全部真实战例)

采收失败的九成不是"没有素材", 是没看对地方。按序排查:

1. **页面 JSON 血包**: DOM 里 src 被剥/懒加载没触发时, 看 `__NEXT_DATA__` / `window.__NUXT__` / ld+json —— 里面常埋着完整媒体 ID 清单 (DIOR 案: 单文件快照 src 全空, `__NEXT_DATA__` 里躺着 103 个官方 CDN 媒体 ID, 直连全 200)。
2. **壳站穿透**: 输入 URL 是平台托管页 (预览站/护照页/目录站) 时, 先判定真主体。铁证 = **资产命名空间分家**: 品牌内容在用户上传桶 (如 s3 用户目录), 平台 UI 资产在平台自己的路径 —— 两个域名/路径系统一分, 主体立现 (Cofounder 案: mobbin 壳; Dusty 案: idensia 护照)。平台元素一律隔离, 不入片。
3. **文件名都在撒谎**: `logo.png` 可能是 32px 的 .ico, `product-ui.png` 可能是 1×1 追踪像素或字标副本, `hero.png` 可能是带烘焙标语的 og 图。**逐个读字节和像素**再定用途, 文件名只是线索不是结论。
4. **懒加载要真滚动**: playwright 长图中段大片空白 = lazy-load 未触发 → 换真浏览器 (chrome-devtools/claude-in-chrome) 滚动到位再采 (Orchid 案: 官网中段 4 屏全空, 真滚后全是金矿)。
5. **模糊素材先想"重采"**: 库存截图 1280 宽放大必糊 → playwright `--viewport-size=1920,1080` + `deviceScaleFactor: 2` 重截, 一次到位 (Laper/Parker 案)。
6. **用户存档页是宝库**: 浏览器"保存页面"的 html 内嵌 @font-face base64 真字体、verbatim 文案、结构化数据 —— 用户丢给你的快照永远先解剖一遍。
7. **官方 demo 片逐帧摸底**: 全片抽帧做 contact sheet, 标出字卡区间与干净窗口的**精确秒数** (像素级验边界), 字卡段禁全屏; 它的美术方向本身就是品牌真理, 可以学气质不搬画面。
8. **变量字体查实例轴**: VF 默认轴 ≠ 品牌字形, 找 named instances 或官网 computed `font-variation-settings` (DIOR 案: CNTR 0→70 才从 grotesque 变回 Didone)。
9. **403 只是第一道门**: orchestrator 被拦 → headless Chromium 被拦 → **用户的真 Chrome** (claude-in-chrome) 几乎总能进; 进去后优先直连 CDN 而不是截屏。

纪律: 每条侦探所得依然过 Gate 1 逐张 Read + 台账溯源; 侦探不豁免审计。
