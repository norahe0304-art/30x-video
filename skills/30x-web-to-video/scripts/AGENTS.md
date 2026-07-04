# scripts/
> L2 | 父级: [../AGENTS.md](../AGENTS.md)

成员清单
beat-sync.ts: BGM 节拍检测与默认切点建议，输出 `beat-map.json`，给 TransitionSeries 对齐节奏。
timing-audit.ts: 扫描场景时长与动画完成时机，输出逐场 timing audit 表，阻断过短场景。
visual-audit.ts: 聚合字体、safe-zone、真实素材、可读性与视觉规则，作为 render 前阻断审计。
benchmark-suite.ts: 读取 canonical benchmark manifest，批量执行 URL intake，并输出 per-benchmark 结果 JSON 与 suite summary。
evidence-model.ts: URL intake V2 的共享证据模型、评分类型与 mode 判定辅助。
scene-constitution.ts: 从 BrandReport 推 archetype、story intent 和双引擎 scene constitution。
project-blueprint.ts: 复制 scaffold 并写入 `brand-report.json`、`scene-constitution.json`、`asset-manifest.json`、`story.md`、`review.md` 与生成数据文件。
url-to-video.ts: One-URL orchestrator；完成 preflight（ffmpeg/yt-dlp/aubiotrack/playwright 交互式安装）、evidence harvest（playwright 优先，agent-browser 兜底）、评分、mode selection、scene constitution、工程输出，并自动跑 beat-sync + visual-audit 写回 review.md。CLI: `--out` `--force` `--offline` `--yes/-y` `--no-install`。
critique-scenes.ts: 品味回路第一环。渲每一幕代表帧 → 喂 `claude -p --json-schema` vision critic → 写 `.iterate/round-N/critique.json`，含 5 维打分和最弱场景的可执行指令。
regenerate-scene.ts: 品味回路第二环。读 critique.json，备份 MainVideo.tsx/theme.ts，起 `claude -p` 只改最弱 Act 组件，跑 `tsc --noEmit`，失败自动回滚。
iterate.ts: 品味回路编排器。循环 critique → regenerate → 下一轮渲帧，终止于 rounds 用尽或 `overallScore >= threshold`，结果落在 `.iterate/round-N/` 与 `.iterate/history.json`。CLI: `iterate <project-dir> [--rounds 3] [--threshold 8]`。
render-qa.ts: 渲染后机器质检（Step 8 阻断门）。ffprobe 流/尺寸/时长 + blackdetect/freezedetect/silencedetect/volumedetect，pass/warn/fail 报告，warn 窗口交给人眼 Read 判定。CLI: `render-qa.ts <mp4> [--expect-duration S] [--json out.json]`。移植自 maxazure/video-editing-skill 的 render_qa.py，阈值按本 skill 重调。

法则: 脚本先验真相·输出必须可阻断·审计语言要具体

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
