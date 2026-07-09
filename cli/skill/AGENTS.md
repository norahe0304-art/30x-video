# 30x-web-to-video/
> L2 | 独立发布仓库内的 skill 包，无外部父级 AGENTS.md

Claude Code 原生 skill。主链保持 `SKILL.md -> rules -> scaffold -> scripts`，V2 额外加入 `benchmarks/` 作为稳定评测面。外部设计资料只允许增强判断，不允许取代真实品牌证据或现有生产经验。

## 成员清单

- `SKILL.md`: 主入口；定义触发条件、总流程、门禁、引用地图。
- `README.md`: 对外安装与使用说明；解释 skill 的定位与能力边界。
- `FUSION-REPORT.md`: 融合决策记录 — 对 hyperframes/claude-shorts/super-video-maker/video-editing-skill 各候选核心的 ADOPT/ADAPT/REJECT 判断与发布差异点；差异化说明书底稿。
- `rules/`: 设计法则与工作流主脑；包含抓取、叙事、taste、archetype、finish gate、证据型 qc-gates。
- `references/`: 可复制的 Remotion 模式与组件参考；只做证据库，不主导流程。
- `remotion-best-practices/`: Bundled Remotion API knowledge；低层实现参考。
- `scaffold/`: Ready-to-run Remotion project template；承接 scene constitution 与 generated project data，不承接风格决策。
- `scripts/`: Music-map analyzer (analyze-audiomap.py，librosa 自装 preflight + aubiotrack 降级)、beat sync (legacy 脉冲常量)、timing audit、visual audit、benchmark suite、URL intake orchestrator、scene constitution generator、project blueprint writer。
- `benchmarks/`: URL-to-video V2 benchmark suite；定义 canonical URL 集与评测产物契约。

## 依赖关系

```text
SKILL.md -> rules/ -> scaffold/
SKILL.md -> scripts/ -> scaffold/
SKILL.md -> benchmarks/
SKILL.md -> references/ + remotion-best-practices/
rules/workflow.md -> rules/archetypes.md -> rules/taste.md + rules/finish-gate.md
SKILL.md step 4 -> rules/composition.md -> scaffold Atmosphere.tsx + rules/qc-gates.md Gate 2
rules/motion.md -> ~/.claude/skills/remotion-motion/ (organic AE vocabulary, 按需深读)
SKILL.md steps 2.5/4/7.5/8 -> rules/qc-gates.md -> scripts/iterate.ts + scripts/render-qa.ts
SKILL.md step 4 (narrated only) -> rules/narration-sync.md -> rules/qc-gates.md Gate 4
SKILL.md step 4 (bgm) -> scripts/analyze-audiomap.py -> audiomap.json -> rules/beat-sync.md
scripts/url-to-video.ts -> evidence-model.ts + scene-constitution.ts + project-blueprint.ts
scripts/benchmark-suite.ts -> benchmarks/manifest.json + scripts/url-to-video.ts
scripts/ -> scaffold/ output verification
benchmarks/manifest.json -> orchestrator regression coverage
```

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
