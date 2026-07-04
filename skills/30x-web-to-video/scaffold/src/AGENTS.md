# src/
> L2 | 父级: scaffold/AGENTS.md

成员清单
MainVideo.tsx: 由 generated project data 驱动的主编排器，消费 scene constitution、品牌证据与 fallback blueprint。
Root.tsx: Remotion Composition 注册点，时长跟随 generated scene constitution。
index.ts: Remotion bootstrap 入口，负责样式和字体预加载后注册 root。
index.css: Tailwind 基础样式与全局字体栈。
theme.ts: 默认设计 token，供所有场景与原语消费。
components/: 动画、背景、mockup、视觉特效的原语层。
generated/: URL intake 产物占位与生成数据接缝。
lib/: mode blueprint、字体加载、样式工具等共享逻辑。

法则: 这个目录只承载可组合的渲染语义，不承载品牌级业务流程。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
