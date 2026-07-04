# scenes/
> L2 | 父级: src/AGENTS.md

成员清单
copy.ts: 站点真实文案常量 (HOST / TAGLINE / CLOSE_LINE / PRIMARY_CTA)，各幕唯一文案源。
Act1.tsx: 品牌几何生长入场 — 等距线框脚手架 draw-on → M 自底灌注 → bloom 稳定 (cut @f151 SURGE)。警告: logo 容器不许加 transform/filter (stacking context 会杀 mix-blend-mode)。
Act2.tsx: 痛点碎片风暴 (20 片透视纵深, Atmosphere 自扛底) + 185px 双行字排 → 绿光收束: 碎片拉向画面深处消失 (@f251 downbeat), 收束点即 Act3 中继核心席位。
Act3.tsx: "relay station" 世界 — 八家模型 官方logo+大字 数据束汇入 3D logo.png (screen 混合), Atmosphere+代码流光自扛底 → 200px "One base URL." + 巨型终端从底部升起 (v5: 总长 335f, 终端 162f 打字提速)。
Act4.tsx: v6 三 beat 三种画面 (357f): 330px 99.9% count-up + 三区域 90 天 status 墙 → provider 级 failover (光束射 OpenAI 熄灭× 改道 Claude, 复用 provider-logos) → dotted-map 全球路由弧线; 内切 local 150/250。
Act5.tsx: 代码世界收尾 — Atmosphere 网格地平线 + 右侧远景线框 M (Act1 同语言) + 左半 lockup (210px tagline 瀑布 roll + 副句 + Get Key CTA), 末帧不黑场。

依赖关系
theme.ts / components/Atmosphere / components/Animations ← 所有幕
public/brand/logo.png ← Act1/3/5 (品牌 logo 本体; 照片类底板 v3 全退场, 磁盘保留不引用)

法则: 一幕一文件; 9 个 audiomap 锚定帧 (见 MainVideo 头部) 永不挪动; 每幕必过 ART-DIRECTION v2 四条铁律; section tag (绿横线+全大写小字) 全片禁用。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
