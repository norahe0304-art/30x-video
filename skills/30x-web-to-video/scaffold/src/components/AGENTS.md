# components/
> L2 | 父级: scaffold/src/AGENTS.md

成员清单
Animations.tsx: FadeIn、ScaleIn、SplitText、Typewriter、CountUp 等动画原语。
Background.tsx: GradientMesh、FilmGrain、Vignette、ColorGrade、GridOverlay 等背景氛围层。
Atmosphere.tsx: 零真空法默认实现 (rules/composition.md Law 1) — Atmosphere 合成底座 + VolumetricLight 多层体积光 / GridHorizon 等距网格地平线 / DriftParticles 确定性漂浮粒子；MainVideo 根级常驻，各 act 调参换气质，禁止删回裸色底。
UI.tsx: GlassPanel、BrandIcon、GradientText、GradientBar 等静态 UI 原语。
MockupTemplates.tsx: DataTable、KanbanBoard、TerminalWindow、AnalyticsDashboard、BrowserFrame 等场景级 mockup。
VisualEffects.tsx: ConfettiBurst、MorphTransition、PathDraw、ShimmerSweep、PulseGlow、ParticleField、StaggerReveal 等高级特效。
LogoEntrance.tsx: Act1 开场动效库, 7 种变体 (impact-flash / iris-open / particle-assembly / z-depth-punch / split-reveal / prism-refraction / light-curtain), 每个项目必须换 variant, 绝对禁止 shimmer sweep 开场。

依赖关系
theme.ts ← UI.tsx, MockupTemplates.tsx, LogoEntrance.tsx
remotion ← Animations.tsx, Background.tsx, Atmosphere.tsx, MockupTemplates.tsx, VisualEffects.tsx, LogoEntrance.tsx
@remotion/noise / @remotion/paths ← VisualEffects.tsx

法则: 原语只做可复用的视觉动作，不直接写品牌叙事。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
