<!--
[INPUT]: happy-model-launch-video + caylent-launch-video 双片实战验收的 bespoke 场景组件, scaffold 组件库, remotion-motion 运动词汇
[OUTPUT]: Artifact 家族目录 (领域→家族→实例指针) + 跨片主角轮换台账机制 — 多样性的系统保障
[POS]: rules/ 的视觉词汇库; 被 composition.md Law 5 与 Claim→World Mapping 消费; 每片出新 artifact 必须回登此册
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Artifact Catalog — 视觉词汇库与主角轮换

**用法：设计每一幕之前先翻这本册子。** 同一 claim 领域至少有两个家族可选；上一部片用过的家族本片降权（轮换台账见文末）。目录会长大——每片写出的新 artifact 必须回登。

## 选型优先级（用户终审判决 2026-07-04 V1/V2 对照实验："加了很多不代表非要用，自适应是最合适的用"）

轮换永远排在最后，**禁止把最合适的家族换成次优的新家族**：

1. **Claim→World 语义契合** — 哪个家族最贴这个卖点的真实语义（agentic=决策 → 决策图 > 时间轴；这是 V2 唯一赢 V1 的一幕，赢在语义不在新）
2. **真资产 > 代码抽象**（Law 4）— 有 brand-authored 实拍/官方图就别用代码画的顶（V2 动能字排输给 V1 帆船实拍：真实像素的质感密度码不出来）
3. **品牌专属 > 通用美** — 过"换 logo 测试"：V1 三横条几何生长讲的是 Caylent 自己的故事；V2 流体浮现虽美但任何品牌都成立 → 输
4. **质感层 ≠ 主角** — shader/氛围类家族是底料，可以垫在任何主角下面，但不能顶替一个语义契合的主角
5. **轮换**（台账）— 以上四条打平时才由它裁决

新词汇（转场/shader/caption）的正确用法：**给最合适的方案加质感**，不是为了秀库存换方案。

## 实战验收的 bespoke 家族（源码指针 = 抄作业起点，品牌 token 全部换掉）

| # | 家族 | Claim 领域 | 实例源码 | 一句话 |
|---|------|-----------|---------|--------|
| 1 | 点阵世界地图 + 短跳级联 | 地理/全球/延迟 | caylent…/Act4 BeatRouting, happy-model…/Act4 | dotted-map 真轮廓, 骨干网逐跳点亮 + ms 戳, 弧线航线法向侧弓 |
| 2 | status 心跳条带墙 | 可靠性/uptime | happy-model…/Act4 BeatUptime | 多区域 90 天条带逐列涌入, 绿海琥珀瑕疵 |
| 3 | 光束改道 (provider failover) | 故障切换/路由语义 | happy-model…/Act4 BeatFailover | 光束射向官方 logo → flicker 熄灭× → 改射备选 + ms 戳 |
| 4 | 巨型终端 (底升) | dev/CLI/ops 命令流 | happy-model…/Act3 BigTerminal + ui-mockups.md 规格 | 逐行打字讲完整故事弧, 几何规格已入册 |
| 5 | 事故时间轴 rail | ops 流程/时序 | caylent…/Act3 OpsTimeline | 横向 rail 光头扫过逐节点点亮, 时间戳+事件+已用时计数 |
| 6 | token 流打字 + 漂浮配置碎片 | GenAI/LLM | caylent…/Act3 GenAIMoment | 块状光标逐字上屏, 三层视差 mono 真配置词漂浮 |
| 7 | 无框统计行 (N 格细线分隔) | 多指标 | caylent…/Act3 DataDash | 数量决定构图: 4 个一行/3 个三分屏, 无卡片盒 |
| 8 | 对比条 | 前后对比/降幅 | caylent…/Act4 StatMttr | 基线长条(暗) vs 现状短条(亮), 差距即画面 |
| 9 | 真客户 logo 墙 | 社会证明 | caylent…/Act4 Customers | homepage 原样裁切, screen 混合浮于世界 (勿加 transform) |
| 10 | 数据束汇聚入 logo | 聚合/集成/多合一 | happy-model…/Act3 RelayWorld | 名字+官方 mark 做流光束汇入 3D 品牌核心 |
| 11 | 碎片风暴 + 引力收束 | 痛点/混乱→有序 | happy-model…/Act2 | 透视纵深碎片漂移 → 被光点吸入 (冲击 = glow 脉冲, 禁圆环) |
| 12 | 品牌几何生长 logo 入场 | 开场/identity | happy-model…/Act1, caylent…/Act1 | 从品牌 mark 的几何元素 draw-on 生长成完整字标；字母动效用 **tracking-in 凝聚**（切单字母精灵→向 mark 原点无旋转收拢+微呼吸）——逐字滚落/旋转已被否（"很丑"，杂技≠高级） |
| 13 | 巨数字建筑化 count-up | 单指标 hero | happy-model…/Act4, caylent…/Act4 StatSeventy | 300px+ tabular-nums + 同尺度语境行, 无小字副句 |
| 14 | 实拍全屏出血 + scrim + 编辑部字排 | hook/情绪 | caylent…/Act2 | brand-authored 视频慢推, 暗部渐变压字区 |
| 15 | tagline 逐字瀑布 + CTA lockup | 收尾 | happy-model…/Act5, caylent…/Act5 | 字标 screen 混合 + 罗列收束, 末帧不黑场 |

（**源码已 vendor 进本 skill 的 `examples/`** — happy-model… = `examples/happy-model/scenes`；caylent… = `examples/caylent/scenes`；全索引见 `examples/INDEX.md`）

## scaffold 组件（中等质量，可用但常需按 taste 重写）

- MockupTemplates: TerminalWindow / KanbanBoard / DataTable / AnalyticsDashboard / BrowserFrame（注意: 默认字号偏小, 禁 scale hack, 见 ui-mockups.md）
- LogoEntrance: 7 变体（shimmer 系已禁）
- Atmosphere: VolumetricLight / GridHorizon / DriftParticles（零真空的底座）
- Animations: FadeIn / ScaleIn / SplitText / Typewriter / CountUp
- @remotion 官方: transitions / light-leaks / noise / effects (gradient 等) / lottie 接入

## 运动质感层（与 artifact 正交，叠加使用）

`remotion-motion` skill：wiggle / inertia bounce / overshoot / idle float / lookAt / eased approach —— artifact 定"画什么"，motion 词汇定"怎么动"。动画僵硬时去那边找解药。

## 外部矿脉 — 可移植的成品库（按含金量排序，2026-07-04 实勘）

词汇荒了先来这里挖，**移植规则：** HTML/GSAP 源全部重写为 Remotion 确定性代码（`useCurrentFrame` 驱动，无 `Math.random()`/`Date.now()`，见 remotion-motion 的 Determinism rules），品牌 token 换成 brand-report 推导值。

| 矿脉 | 规模 | 位置 | 挖法 |
|------|------|------|------|
| **hyperframes registry/blocks** | **109 个成品场景** | [github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) `registry/blocks/` | HTML+GSAP 子合成。高含金分区：`code-*` 家族 ~25 个（diff/morph/3d-extrude/particle-assemble/shader-dissolve + 24 种终端/编辑器主题）、`us-map / world-map / us-map-flow / us-map-hex / spain-map`（地理家族）、`flowchart / data-chart`、`transitions-*` 12 类（3d/blur/destruction/dissolve/distortion/mechanical…）、`vfx-*`（liquid-glass/magnetic/portal/shatter/text-cursor）、`lt-*` lower-third 家族 ~10 个、`liquid-glass 4 件套`、`glitch / gravitational-lens / swirl-vortex / thermal-distortion / sdf-iris / ripple-waves`、社媒卡（x-post/reddit/spotify/instagram/tiktok）、`news-ticker / macos-notification / cinematic-zoom / whip-pan / logo-outro` |
| **hyperframes registry/components** | 25 个效果件 | 同仓 `registry/components/` | 16 种 caption 风格（kinetic-slam/matrix-decode/neon-glow/particle-burst/weight-shift…）+ morph-text / parallax-zoom / grain / shimmer-sweep |
| **music-to-video motion-primitive-catalog** | **26 个节拍原语**（带锚点+时长规格） | 同仓 `skills/music-to-video/references/motion-primitive-catalog.md` | hypercut-whip / braam-punch / binary-decrypt / dolly-zoom / slot-machine-reveal / counting-punch / gooey-metaball / bg-flow-field… 每个标了该踩什么拍（drop/downbeat/roll）和有效时长窗 — 直接当动效谱面用 |
| **remotion-motion skill** | 8 个 AE 表达式族 + 挖矿指南 | sibling skill `remotion-motion`（可选，未装则跳过） | **已是 Remotion 确定性代码**，零移植成本：wiggle / inertia bounce / loopOut / stagger / idle float / posterizeTime / lookAt / exponential approach |
| **Lottie** | 海量免费动画 | `@remotion/lottie` 已在 scaffold deps + references/lottie.md | LottieFiles 检索→冻结 JSON 到 public/（media-resolve 台账）→ 染品牌色。适合 icon 级点缀，不适合当主角 |

（weekly-orbit 组件已剔除 — 节目格式专用零件，不算 launch video 通用词汇；需要时它们住在 caylent-weekly-orbit skill。）

**账面合计：15 bespoke + 9 scaffold + 109 blocks + 25 components + 26 节拍原语 + 8 AE 族 ≈ 192 个可选起点。** 词汇量不再是重复自己的借口。

## 对标金矿 — 诚实战力表（2026-07-04）

**我们赢的（金矿没有的）：** 品牌自适应（他们的 block 是定死风格，我们从 brand-report 推导一切）；叙事级 artifact（Claim→World——画面在论证产品，不是装饰）；taste 硬门（用户判决全部编码）；证据型管线（渲帧验收）；VO/拍点一体（切点吸附语音短语）。**单点的"对味"，我们高一档。**

**三笔债 2026-07-04 已还（scaffold/src/components/ 三件套，渲帧验收）：**
1. ✅ **转场家族** — `Transitions.tsx`：whipPan / maskWipe / push / zoomPunch / blurDissolve / flashThrough / glitchCut，7 家族 + fade = 8 选。与 `fade()` 同位替换，选型指南在文件头。验收帧：caylent evidence/vocab-whip-mid2 (甩动模糊) + vocab-wipe-mid2 (干净掀缝)。**新片再全程 fade = 违规。**
2. ✅ **shader 质感** — `ShaderFX.tsx`：@remotion/three ShaderPlane，uTime=frame/fps 确定性。`liquidWarp`（品牌色域扭曲流体）**出片级**，验收帧 vocab-shader-liquid；`silkNoise` / `lensFlow` 能渲但对比度弱，标 WIP 待调。**渲染必须带 `--gl=angle`**（headless Chrome 默认无 WebGL，scaffold render script 已内置）。
3. ✅ **caption 体系** — `Captions.tsx`：词级时间戳驱动（ElevenLabs/whisper JSON 原样喂入），6 风格：karaoke（渐变填充推进）/ scalePop / weightShift / neonGlow / kineticSlam / editorial。验收帧 vocab-captions（三风格同屏）。社媒竖版解锁。

**升级路线：每部新片除了轮换主角，从 WIP 清单（silk/lens 调优、更多 caption 风格、粒子/物理系）再还一笔 — 库只进不出。**

## 主角轮换台账（多样性的硬保障）

**机制：** 每片收尾时把各幕主角家族登记到 `~/.media/hero-ledger.jsonl`（一行一幕）：

```jsonc
{"project":"caylent-launch-video","act":3,"family":"incident-timeline-rail","date":"2026-07-04"}
```

**规则：**
1. 设计新片前 `cat ~/.media/hero-ledger.jsonl` 读上一部片的家族清单——**上一部用过的家族本片一律降权**，同领域优先换家族（终端↔时间轴↔agent 决策图；地图↔status 墙↔对比条）。
2. 同一片内五幕家族互不重复（composition.md Law 5 片内条款）。
3. 目录不够用 = 造新家族的信号，不是重复旧家族的许可。新家族验收（用户点头）后回登本目录。

**用户判决（2026-07-04，两片连用终端被抓）：** "每一个视频都有 terminal view，我要的是多样性！！自适应 多样性的高级感！！"——轮换不是建议，是门。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
