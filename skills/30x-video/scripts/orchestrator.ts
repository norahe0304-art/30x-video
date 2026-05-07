/**
 * [INPUT]: User brief (and optional jobspec)
 * [OUTPUT]: Final MP4 + manifest.json
 * [POS]: scripts/ pipeline 主入口; 串起 [1]-[9]
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Orchestrator — main entry point for 30x-video
//
//  Pipeline:
//    [1] Content Analyzer
//    [2] Style Hunter (Refero MCP)
//    [3] 5-dim Style Composer
//    [🚪] Confirmation Gate ← MUST WAIT FOR USER
//    [4] Script Generator
//    [5] Asset Producer (VO + BGM in parallel)
//    [6] Composer (HTML + GSAP)
//    [7] Render (hyperframes)
//    [8] Finish Gate (auto critique)
//    [9] Iterate (≤ 2 times)
//
//  Two run modes:
//    - "plan": run [1]-[3], render Confirmation Gate, return plan
//    - "execute": given a confirmed plan, run [4]-[9], return manifest
// ================================================================

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { analyzeContentHeuristic } from "./content-analyzer.ts";
import { styleHunt } from "./style-hunter.ts";
import { composeStyle } from "./style-composer.ts";
import { findDiverseReferenceVideos } from "./video-search.ts";
import { renderPlan, lockPlan } from "./confirmation-gate.ts";
import { generateScriptHeuristic } from "./script-generator.ts";
import { synthesizeVoiceOver } from "./vo-synth.ts";
import { fetchBgm, shouldFetchBgm } from "./bgm-fetch.ts";
import { buildHyperframesProject } from "./compose.ts";
import { renderVideo } from "./render.ts";
import type {
  ConfirmedPlan,
  ContentIntent,
  DeliveryManifest,
} from "./types.ts";

// ----------------------------------------------------------------
//  Plan Phase: brief → ConfirmedPlan (pending user approval)
// ----------------------------------------------------------------

export interface PlanPhaseResult {
  display: string;
  pendingPlan: ConfirmedPlan;
  questions: string[];
  defaults: string[];
}

export async function planPhase(brief: string, intentOverride?: Partial<ContentIntent>): Promise<PlanPhaseResult> {
  // [1] Content Analyzer
  const intent = { ...analyzeContentHeuristic(brief), ...intentOverride };

  // [2] Style Hunter
  const huntResult = await styleHunt(intent);

  // [3] 5-dim Style Composer
  const composition = composeStyle(intent, huntResult.profile);

  // Look up reference videos in local INDEX.json
  const references = findDiverseReferenceVideos(composition, 3);

  // Render plan for user
  const planRender = renderPlan({
    intent,
    designProfile: huntResult.profile,
    composition,
    references,
  });

  const pendingPlan = lockPlan(
    {
      intent,
      designProfile: huntResult.profile,
      composition,
      references,
    },
    planRender.questions,
    planRender.defaults
  );

  return {
    display: planRender.display,
    pendingPlan,
    questions: planRender.questions,
    defaults: planRender.defaults,
  };
}

// ----------------------------------------------------------------
//  Execute Phase: ConfirmedPlan → MP4 + manifest
// ----------------------------------------------------------------

export interface ExecuteOptions {
  plan: ConfirmedPlan;
  brief: string;
  outputDir: string;
}

export async function executePhase(opts: ExecuteOptions): Promise<DeliveryManifest> {
  const { plan, brief, outputDir } = opts;
  mkdirSync(outputDir, { recursive: true });

  const jobId = `job-${Date.now()}`;
  const startedAt = new Date().toISOString();

  // [4] Script Generator
  const script = generateScriptHeuristic(plan);

  // [5] Asset Producer (parallel VO + BGM)
  const [voAsset, bgmAsset] = await Promise.all([
    plan.composition.vo === "none"
      ? Promise.resolve(undefined)
      : synthesizeVoiceOver({
          script,
          archetype: plan.composition.vo,
          outputPath: join(outputDir, "vo.wav"),
        }),
    shouldFetchBgm(plan.composition.bgm)
      ? fetchBgm({
          archetype: plan.composition.bgm,
          durationSeconds: plan.composition.durationSeconds,
          outputPath: join(outputDir, "bgm.mp3"),
        })
      : Promise.resolve(undefined),
  ]);

  // [6] Composer — build a Hyperframes project directory
  const projectDir = join(outputDir, "hyperframes-project");
  buildHyperframesProject({
    script,
    designProfile: plan.designProfile,
    composition: plan.composition,
    voAsset,
    bgmAsset,
    projectDir,
    projectName: jobId,
  });

  // [7] Render — invoke Hyperframes CLI on the project directory
  const videoPath = join(outputDir, "video.mp4");
  await renderVideo({
    projectDir,
    outputMp4Path: videoPath,
  });

  // [8] Finish Gate — auto-critique via hyperframes lint + inspect + taste timing
  const { runFinishGate } = await import("./finish-gate.ts");
  const finishGateResult = await runFinishGate({
    projectDir,
    script,
    composition: plan.composition,
  });

  // [9] Iterate (max 2 retries) — TBD when LLM critique loop integrated
  // For now: surface failure to user with explicit reasoning per SKILL.md
  if (!finishGateResult.passed) {
    console.error("Finish Gate FAILED. Notes:");
    for (const note of finishGateResult.notes) console.error(`  - ${note}`);
    console.error("Manual review required. Iterate by adjusting the plan and re-running.");
  }

  // [9] Manifest
  const manifest: DeliveryManifest = {
    jobId,
    startedAt,
    completedAt: new Date().toISOString(),
    brief,
    plan,
    assets: {
      video: videoPath,
      vo: voAsset,
      bgm: bgmAsset!,
    },
    finishGateResult: {
      passed: finishGateResult.passed,
      iterations: finishGateResult.iterations,
      notes: finishGateResult.notes,
    },
  };

  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}

// ----------------------------------------------------------------
//  CLI entry — split into plan / execute commands
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const brief = process.argv.slice(3).join(" ");

  if (!command || (command !== "plan" && command !== "execute")) {
    console.error("Usage:");
    console.error("  tsx orchestrator.ts plan <brief>");
    console.error("  tsx orchestrator.ts execute <plan.json> <output-dir> <brief>");
    process.exit(1);
  }

  if (command === "plan") {
    if (!brief) {
      console.error("brief required");
      process.exit(1);
    }
    planPhase(brief)
      .then((result) => {
        console.log(result.display);
        console.log("\n--- pendingPlan (save to file for execute) ---");
        console.log(JSON.stringify(result.pendingPlan, null, 2));
      })
      .catch((err) => {
        console.error("plan phase failed:", err.message);
        process.exit(1);
      });
  }

  if (command === "execute") {
    console.error("execute mode: load confirmed plan from JSON, run [4]-[9]");
    console.error("(integration with hyperframes / TTS providers required)");
    process.exit(0);
  }
}
