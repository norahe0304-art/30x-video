#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * [INPUT]: 一个生成好的视频项目目录 (含 scene-constitution.json、src/index.ts、src/MainVideo.tsx)，
 *          依赖 critique-scenes.ts 与 regenerate-scene.ts 两个姐妹模块。
 * [OUTPUT]: 对外提供 iterate(projectDir, options)，跑 render-still → critique → regenerate 的
 *          闭环，每轮结果落在 `.iterate/round-N/`，终止于 rounds 用尽或 overallScore >= threshold。
 * [POS]: scripts/ 的"品味回路"终编排器，把单次渲染的首稿进化成多轮打磨的成稿。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { critiqueScenes } from "./critique-scenes.ts";
import { regenerateWeakest } from "./regenerate-scene.ts";

// ================================================================
// 参数 — rounds 上限与停止阈值
// ================================================================
type IterateOptions = {
  rounds?: number;
  threshold?: number;
};

// ================================================================
// 闭环主流程
// ================================================================
export async function iterate(projectDir: string, options: IterateOptions = {}): Promise<void> {
  const absProject = resolve(projectDir);
  const rounds = options.rounds ?? 3;
  const threshold = options.threshold ?? 8;

  const history: Array<{ round: number; overallScore: number; weakest: string; directive: string }> = [];

  for (let round = 1; round <= rounds; round += 1) {
    const roundDir = join(absProject, ".iterate", `round-${round}`);
    mkdirSync(roundDir, { recursive: true });
    console.log(`\n======== round ${round}/${rounds} ========`);

    // 1. critique (包含渲帧)
    await critiqueScenes(absProject, roundDir);

    const critique = JSON.parse(
      readFileSync(join(roundDir, "critique.json"), "utf8"),
    ) as { overallScore: number; weakest: { actId: string; directive: string }; summary: string };

    console.log(`[iterate] round ${round} overallScore = ${critique.overallScore}`);
    console.log(`[iterate] summary: ${critique.summary}`);

    history.push({
      round,
      overallScore: critique.overallScore,
      weakest: critique.weakest.actId,
      directive: critique.weakest.directive,
    });

    // 2. 够好就停
    if (critique.overallScore >= threshold) {
      console.log(`[iterate] threshold ${threshold} reached, stopping.`);
      break;
    }

    // 3. 没到阈值且还有下一轮 → 重生最弱场景
    if (round < rounds) {
      await regenerateWeakest(absProject, roundDir);
    } else {
      console.log(`[iterate] rounds budget exhausted, final score ${critique.overallScore}`);
    }
  }

  // history 落盘, 方便排查
  writeFileSync(
    join(absProject, ".iterate", "history.json"),
    JSON.stringify(history, null, 2),
  );
  console.log(`\n[iterate] done. history written to .iterate/history.json`);
}

// ================================================================
// CLI — iterate <project-dir> [--rounds N] [--threshold X]
// ================================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const projectDir = args.find((a) => !a.startsWith("--")) ?? process.cwd();
  const roundsIdx = args.indexOf("--rounds");
  const thresholdIdx = args.indexOf("--threshold");
  const rounds = roundsIdx >= 0 ? Number(args[roundsIdx + 1]) : 3;
  const threshold = thresholdIdx >= 0 ? Number(args[thresholdIdx + 1]) : 8;

  if (!existsSync(join(projectDir, "scene-constitution.json"))) {
    console.error(`[iterate] ${projectDir} does not look like a generated video project (no scene-constitution.json)`);
    process.exit(1);
  }

  iterate(projectDir, { rounds, threshold }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
