#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * [INPUT]: 生成项目的 `scene-constitution.json` 与 Remotion Composition `LaunchVideo`，
 *          依赖系统 `npx remotion still` 与 `claude -p --output-format json` 做视觉评审。
 * [OUTPUT]: 对外提供 critiqueScenes(projectDir, roundDir)，渲染每一幕代表帧，调用
 *          vision LLM 返回严格 JSON critique，写入 `.iterate/round-N/critique.json`。
 * [POS]: scripts/ 内的"品味回路"第一环，为 regenerate-scene.ts 与 iterate.ts 提供评分与指令。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ================================================================
// 代表帧位置 — 每一幕各取一帧 (开场 + 中段) 看首印象和持续力
// ================================================================
const ACT_BEATS: Array<{
  id: "authority" | "reveal" | "showcase" | "proof" | "close";
  label: string;
  // offset into the act as a fraction
  samples: Array<{ name: string; at: number }>;
}> = [
  { id: "authority", label: "Act 1 · Authority", samples: [{ name: "open", at: 0.35 }] },
  { id: "reveal", label: "Act 2 · Reveal", samples: [{ name: "peak", at: 0.55 }] },
  { id: "showcase", label: "Act 3 · Showcase", samples: [{ name: "mid", at: 0.5 }] },
  { id: "proof", label: "Act 4 · Proof", samples: [{ name: "climax", at: 0.5 }] },
  { id: "close", label: "Act 5 · Close", samples: [{ name: "cta", at: 0.6 }] },
];

const DEFAULT_ACT_SECONDS: Record<string, number> = {
  authority: 5,
  reveal: 6,
  showcase: 14,
  proof: 8,
  close: 7,
};

// ================================================================
// 帧位置计算 — 把 act-local offset 换成 global frame (fps=30)
// ================================================================
function resolveFrames(projectDir: string) {
  const constitutionPath = join(projectDir, "scene-constitution.json");
  const constitution = JSON.parse(readFileSync(constitutionPath, "utf8")) as {
    pacingProfile?: { durationSeconds?: number; targetActs?: Record<string, number> };
    sceneList?: Array<{ id: string; purpose?: string; copyPayload?: string[] }>;
  };
  const targetActs = constitution.pacingProfile?.targetActs ?? DEFAULT_ACT_SECONDS;
  const fps = 30;

  let cursor = 0;
  const frames: Array<{ actId: string; label: string; sampleName: string; frame: number; purpose: string; copy: string[] }> = [];
  for (const beat of ACT_BEATS) {
    const actSeconds = targetActs[beat.id] ?? DEFAULT_ACT_SECONDS[beat.id] ?? 5;
    const actFrames = Math.round(actSeconds * fps);
    const scene = constitution.sceneList?.find((s) => s.id === beat.id);
    for (const sample of beat.samples) {
      const offsetFrames = Math.round(actFrames * sample.at);
      frames.push({
        actId: beat.id,
        label: beat.label,
        sampleName: sample.name,
        frame: cursor + offsetFrames,
        purpose: scene?.purpose ?? "",
        copy: scene?.copyPayload ?? [],
      });
    }
    cursor += actFrames;
  }
  return frames;
}

// ================================================================
// remotion still — 生成单帧 PNG，缺 remotion 或失败立即抛错
// ================================================================
function renderStill(projectDir: string, frame: number, outPath: string): void {
  const args = [
    "remotion",
    "still",
    "src/index.ts",
    "LaunchVideo",
    outPath,
    `--frame=${frame}`,
    "--image-format=png",
    "--log=error",
  ];
  const res = spawnSync("npx", args, {
    cwd: projectDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    throw new Error(`remotion still failed for frame ${frame}`);
  }
}

// ================================================================
// critique schema — 强约束的 JSON，5 维评分 + 最弱场景 + 具体指令
// ================================================================
const CRITIQUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scenes", "weakest", "overallScore", "summary"],
  properties: {
    overallScore: { type: "number", minimum: 0, maximum: 10 },
    summary: { type: "string" },
    weakest: {
      type: "object",
      additionalProperties: false,
      required: ["actId", "why", "directive"],
      properties: {
        actId: { type: "string", enum: ["authority", "reveal", "showcase", "proof", "close"] },
        why: { type: "string" },
        directive: { type: "string" },
      },
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["actId", "scores", "issues", "wins"],
        properties: {
          actId: { type: "string", enum: ["authority", "reveal", "showcase", "proof", "close"] },
          scores: {
            type: "object",
            additionalProperties: false,
            required: ["hook", "clarity", "focus", "readability", "composition"],
            properties: {
              hook: { type: "number", minimum: 0, maximum: 10 },
              clarity: { type: "number", minimum: 0, maximum: 10 },
              focus: { type: "number", minimum: 0, maximum: 10 },
              readability: { type: "number", minimum: 0, maximum: 10 },
              composition: { type: "number", minimum: 0, maximum: 10 },
            },
          },
          issues: { type: "array", items: { type: "string" } },
          wins: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

// ================================================================
// vision 调用 — claude -p --output-format json --json-schema
// ================================================================
function invokeCritic(framesDir: string, frames: ReturnType<typeof resolveFrames>, brandName: string): unknown {
  const header = [
    `你是一个 $50k 代理商级别的 motion director，正在对一个 40s brand launch 首稿做 critique。`,
    `品牌: ${brandName}`,
    ``,
    `评分维度 (0-10):`,
    `- hook: 3 秒内是否建立悬念或权威`,
    `- clarity: 一眼能否看懂这幕在讲什么`,
    `- focus: 视觉焦点是否单一、是否有无关装饰干扰`,
    `- readability: 文字是否够大 (≥28px)、对比是否够、是否压字在复杂背景`,
    `- composition: 画面平衡、留白、安全区是否合格`,
    ``,
    `对每一幕，读取对应 PNG 文件 (路径见下)，打分、列 issues/wins，`,
    `最后指出 weakest 场景和一条"可执行"指令。指令必须是单一的、可直接编辑的代码改动，`,
    `例如: "把 headline fontSize 从 72 提到 112"、"移除 subtitle 那行 rgba(255,255,255,0.5) 文字"、`,
    `"Act3 用 TerminalWindow 替换当前的文字 panel"。禁止写"优化一下布局"之类的空话。`,
    ``,
    `帧清单:`,
    ...frames.map((f, i) => `${i + 1}. ${f.label} (${f.sampleName}) — purpose: ${f.purpose} — copy: ${JSON.stringify(f.copy)} — file: ${join(framesDir, `${f.actId}-${f.sampleName}.png`)}`),
    ``,
    `严格输出 JSON，匹配提供的 schema。`,
  ].join("\n");

  const args = [
    "-p",
    "--model", "sonnet",
    "--output-format", "json",
    "--json-schema", JSON.stringify(CRITIQUE_SCHEMA),
    "--add-dir", framesDir,
    "--allowedTools", "Read",
    "--max-turns", "12",
    header,
  ];

  const res = spawnSync("claude", args, {
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 16 * 1024 * 1024,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(`claude critique invocation failed (exit ${res.status})`);
  }
  // claude -p --output-format json wraps result under { result, ... }
  const parsed = JSON.parse(res.stdout) as { result?: string; subtype?: string };
  if (!parsed.result) {
    throw new Error("claude critique returned no result field");
  }
  // result may itself be a JSON string or a fenced block
  const inner = parsed.result.trim().replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
  return JSON.parse(inner);
}

// ================================================================
// 主流程 — 渲帧、喂 critic、写 critique.json
// ================================================================
export async function critiqueScenes(projectDir: string, roundDir: string): Promise<void> {
  const absProject = resolve(projectDir);
  const absRound = resolve(roundDir);
  const framesDir = join(absRound, "frames");
  mkdirSync(framesDir, { recursive: true });

  const frames = resolveFrames(absProject);
  console.log(`[critique] rendering ${frames.length} representative frames...`);
  for (const f of frames) {
    const out = join(framesDir, `${f.actId}-${f.sampleName}.png`);
    if (!existsSync(out)) {
      renderStill(absProject, f.frame, out);
    }
    console.log(`  ✓ ${f.label} frame ${f.frame} → ${out}`);
  }

  const brandReport = JSON.parse(
    readFileSync(join(absProject, "brand-report.json"), "utf8"),
  ) as { brand?: { name?: string } };
  const brandName = brandReport.brand?.name ?? "Unknown";

  console.log(`[critique] invoking vision critic for ${brandName}...`);
  const critique = invokeCritic(framesDir, frames, brandName);
  const critiquePath = join(absRound, "critique.json");
  writeFileSync(critiquePath, JSON.stringify(critique, null, 2));
  console.log(`[critique] wrote ${critiquePath}`);
}

// ================================================================
// CLI — critique-scenes <project-dir> [--round N]
// ================================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const projectDir = args.find((a) => !a.startsWith("--")) ?? process.cwd();
  const roundIdx = args.indexOf("--round");
  const round = roundIdx >= 0 ? Number(args[roundIdx + 1]) : 1;
  const roundDir = join(projectDir, ".iterate", `round-${round}`);
  critiqueScenes(projectDir, roundDir).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// silence unused import warning in strip-types mode
void execFileSync;
