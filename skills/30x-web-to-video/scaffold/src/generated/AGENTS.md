# generated/
> L2 | 父级: ../AGENTS.md

成员清单
project-data.ts: URL intake V2 的生成数据接缝，占位时保证 scaffold 可独立 build，生成后被 orchestrator 覆盖。
beat-map.ts: aubiotrack 节拍常量 (bpm, firstBeatFrame, measureFrames)，被 MainVideo 直接 import。由 scripts/beat-sync.ts 覆盖写入，禁止手工编辑。

法则: 这里只存可覆盖的生成产物契约，不存任何手写品牌逻辑。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
