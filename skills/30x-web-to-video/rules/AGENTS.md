# rules/
> L2 | 父级: ../AGENTS.md

规则层是 skill 的判断中枢。这里不写实现细节，而是定义什么必须成立、什么必须被拒绝、以及品牌现实如何转化成视频决策。

## 成员清单

- `workflow.md`: 品牌抓取、素材下载、资产使用、Preview/Render 前门禁；BGM Variety Mandate（mood 品牌推导 + 全局台账查重 + 生成优先，音乐不许每次同一首）。
- `media-resolve.md`: 素材接入五级瀑布（台账→收编→程序化→目录→网络）+ `.media/manifest.jsonl` 冻结台账 + 程序化素材优先（dotted-map 世界地图 / simple-icons / LobeHub AI 模型 logo 内联组件）；hyperframes media-use 移植。
- `narrative.md`: 5-act 叙事骨架与 scene constitution。
- `narrative-templates.md`: 行业叙事模板；只做起点，不做模板化终点。
- `taste.md`: 反 AI slop（元素级）、审美纪律、阅读性与企业级可信度。
- `composition.md`: Bespoke Composition Law — 零真空/全屏时刻/编辑部字排/真资产优先/构图多样性五铁律 + 构图级 SLOP BLACKLIST + Claim→World Mapping（卖点渲染成其领域原生 artifact，按品牌自适应推导、严禁跨品牌照抄实例）+ 素材薄站 playbook；被 SKILL.md Step 4 与 qc-gates Gate 2 引用。
- `archetypes.md`: 从 `awesome-design-md` 抽象出的企业级设计原型。
- `finish-gate.md`: 吸收 Impeccable 与 taste-skill 的终局审计协议。
- `qc-gates.md`: 四道证据型质检门（素材审计 / 逐 act 帧证据 / critic 回路接线 / 诚实披露）；只认渲染帧 + Read，禁止 grep 型视觉检查。
- `beat-sync.md`: BGM 时机法则 — audiomap.json 是唯一音乐真相源；`rhythmic: true` 转场吸附拍网格，false 按能量段落/静默窗口呼吸；hold-then-snap 落在 energy peak；验证走数值对表 + 渲帧，不走 grep。
- `narration-sync.md`: 配音/字幕视频专用四法则 — beat-lock 锁词级时间戳、字幕品牌词清理不动时间戳、切点吸附句界、连续旁白（一段论证一份音频，段内画面吸附短语 onset，有旁白删副句小字）；纯 BGM 视频跳过。
- `typography.md`: 字体、字重、字号、文本安全线。
- `color.md`: 品牌色、表面、强调与中性色逻辑。
- `layout.md`: 网格、间距、安全边距、圆角层级。
- `motion.md`: 弹簧、缓动、逐字动画、节奏。
- `transitions.md`: 场景切换、light leaks、parallax、过渡氛围。
- `cinematic.md`: Film grain、vignette、grade、质感增强。
- `ui-mockups.md`: 产品 UI 模拟与密度控制；Giant Terminal 底升巨型终端实战规格（几何/内容契约/死法清单，双片验收）。
- `cards.md`: 卡片布局与内容编排。
- `data-viz.md`: 图表、指标、状态展示。
- `artifact-catalog.md`: 视觉词汇库 — 15 个双片验收 bespoke 家族（含源码指针）+ scaffold 组件 + 主角轮换台账 `~/.media/hero-ledger.jsonl`（上片用过的家族本片降权，多样性硬门）。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
