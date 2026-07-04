#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * [INPUT]: `.iterate/round-N/critique.json`、生成项目的 `src/MainVideo.tsx` 与 `src/theme.ts`，
 *          依赖 `claude -p` (带 Edit/Read 权限) 执行单场景定点重写。
 * [OUTPUT]: 对外提供 regenerateWeakest(projectDir, roundDir)，根据 critique 的 weakest 指令
 *          精准修改 MainVideo.tsx 对应 Act 组件，并跑 tsc 校验；失败自动回滚。
 * [POS]: scripts/ 的"品味回路"第二环，承接 critique-scenes.ts 的评分，产出可 re-render 的下一轮代码。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

// ================================================================
// critique 形状 — 与 critique-scenes.ts 的 schema 对齐
// ================================================================
type Critique = {
  overallScore: number;
  summary: string;
  weakest: { actId: string; why: string; directive: string };
  scenes: Array<{
    actId: string;
    scores: Record<string, number>;
    issues: string[];
    wins: string[];
  }>;
};

// ================================================================
// Act 名称映射 — MainVideo.tsx 里的组件名 (Act1Authority ...)
// ================================================================
const ACT_COMPONENT: Record<string, string> = {
  authority: "Act1Authority",
  reveal: "Act2Reveal",
  showcase: "Act3Showcase",
  proof: "Act4Proof",
  close: "Act5Close",
};

// ================================================================
// 单次 edit — 让 claude 用 Edit 工具只改一个 Act 组件
// ================================================================
function invokeEditor(projectDir: string, critique: Critique): void {
  const weakest = critique.weakest;
  const component = ACT_COMPONENT[weakest.actId];
  if (!component) {
    throw new Error(`unknown actId: ${weakest.actId}`);
  }

  const sceneScores = critique.scenes.find((s) => s.actId === weakest.actId);
  const mainVideoPath = join(projectDir, "src", "MainVideo.tsx");
  const themePath = join(projectDir, "src", "theme.ts");

  const prompt = [
    `你是一个 Remotion senior engineer。上一轮 vision critic 认为 ${component} (Act ${weakest.actId}) 是最弱的场景:`,
    ``,
    `问题: ${weakest.why}`,
    `指令: ${weakest.directive}`,
    ``,
    sceneScores ? `5 维打分: ${JSON.stringify(sceneScores.scores)}` : "",
    sceneScores && sceneScores.issues.length ? `issues:\n- ${sceneScores.issues.join("\n- ")}` : "",
    ``,
    `任务约束:`,
    `1. 只修改 ${mainVideoPath} 中 ${component} 组件的函数体; 禁止动其他 Act`,
    `2. 允许为实现指令微调 theme.ts (${themePath}), 但不得改 primary / bg / text 色值`,
    `3. 不允许新增第三方依赖, 只用项目里已 import 的 components`,
    `4. 保留 [PROTOCOL] header 的同步 — 如果修改了文件头部声明的输入输出，同步更新`,
    `5. 遵守以下硬约束 (会在审计中被 block):`,
    `   - fontSize >= 28px`,
    `   - fontWeight <= 600 (禁止 bold)`,
    `   - Act3 必须包含 TerminalWindow / KanbanBoard / DataTable / AnalyticsDashboard 中至少一个`,
    `   - theme.font.* 不得出现 var(--font-、"inherit"、"sans-serif" 等`,
    `6. 完成后用 Bash 跑 \`npx tsc --noEmit\` 验证类型; 如果失败, 立即回滚你的编辑`,
    ``,
    `只做一件事: 执行上面的 directive。禁止"顺手重构"其他部分。`,
  ].filter(Boolean).join("\n");

  const args = [
    "-p",
    "--model", "sonnet",
    "--add-dir", projectDir,
    "--allowedTools", "Read,Edit,Bash(npx:*),Bash(ls:*),Bash(cat:*),Grep,Glob",
    "--max-turns", "30",
    "--dangerously-skip-permissions",
    prompt,
  ];

  console.log(`[regen] invoking editor for ${component}...`);
  const res = spawnSync("claude", args, {
    cwd: projectDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    throw new Error(`claude regenerate invocation failed (exit ${res.status})`);
  }
}

// ================================================================
// tsc 校验 — 跑完编辑后强制验证
// ================================================================
function typecheck(projectDir: string): boolean {
  const res = spawnSync("npx", ["tsc", "--noEmit"], {
    cwd: projectDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  return res.status === 0;
}

// ================================================================
// 备份 / 回滚 — 单文件级别, 够用
// ================================================================
function backup(projectDir: string, roundDir: string): void {
  const targets = ["src/MainVideo.tsx", "src/theme.ts"];
  for (const rel of targets) {
    const src = join(projectDir, rel);
    if (existsSync(src)) {
      const dst = join(roundDir, "backup", rel);
      const dstDir = dst.slice(0, dst.lastIndexOf("/"));
      spawnSync("mkdir", ["-p", dstDir]);
      copyFileSync(src, dst);
    }
  }
}

function restore(projectDir: string, roundDir: string): void {
  const targets = ["src/MainVideo.tsx", "src/theme.ts"];
  for (const rel of targets) {
    const src = join(roundDir, "backup", rel);
    const dst = join(projectDir, rel);
    if (existsSync(src)) {
      copyFileSync(src, dst);
    }
  }
}

// ================================================================
// 主流程 — backup → edit → typecheck → (rollback on fail)
// ================================================================
export async function regenerateWeakest(projectDir: string, roundDir: string): Promise<void> {
  const absProject = resolve(projectDir);
  const absRound = resolve(roundDir);
  const critiquePath = join(absRound, "critique.json");
  if (!existsSync(critiquePath)) {
    throw new Error(`critique.json not found at ${critiquePath} — run critique-scenes first`);
  }
  const critique = JSON.parse(readFileSync(critiquePath, "utf8")) as Critique;

  console.log(`[regen] weakest = ${critique.weakest.actId} :: ${critique.weakest.directive}`);
  backup(absProject, absRound);

  try {
    invokeEditor(absProject, critique);
  } catch (err) {
    console.error("[regen] editor failed, restoring backup");
    restore(absProject, absRound);
    throw err;
  }

  console.log(`[regen] running tsc --noEmit...`);
  if (!typecheck(absProject)) {
    console.error("[regen] tsc failed, restoring backup");
    restore(absProject, absRound);
    throw new Error("typecheck failed after regenerate");
  }

  writeFileSync(
    join(absRound, "regenerate.log"),
    JSON.stringify({ weakest: critique.weakest, at: new Date().toISOString() }, null, 2),
  );
  console.log(`[regen] ${critique.weakest.actId} rewritten and typechecked`);
}

// ================================================================
// CLI — regenerate-scene <project-dir> [--round N]
// ================================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const projectDir = args.find((a) => !a.startsWith("--")) ?? process.cwd();
  const roundIdx = args.indexOf("--round");
  const round = roundIdx >= 0 ? Number(args[roundIdx + 1]) : 1;
  const roundDir = join(projectDir, ".iterate", `round-${round}`);
  regenerateWeakest(projectDir, roundDir).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
