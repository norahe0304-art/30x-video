/**
 * [INPUT]: Hyperframes project directory + VideoScript + StyleComposition
 * [OUTPUT]: FinishGateResult (passed/failed + notes + per-rule findings)
 * [POS]: scripts/ pipeline 第 [8] 步; render 后的强制审查门
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Finish Gate
//
//  Wraps hyperframes' built-in tools (lint, inspect, snapshot) plus
//  our own taste.md reading-time validator. Returns a structured
//  result the orchestrator uses to decide whether to iterate.
//
//  Three layers:
//    1. hyperframes lint  — engine-level correctness (timeline, clips)
//    2. hyperframes inspect — text/container overflow
//    3. taste.md timing audit — reading-time per element-type table
//    4. (future) snapshot + LLM critique — vision-based taste check
//
//  Pass conditions:
//    - lint: 0 errors
//    - inspect: 0 overflow issues
//    - taste timing: all clips meet minimum hold-time table
// ================================================================

import { spawnSync } from "child_process";
import type { StyleComposition, VideoScript } from "./types.ts";

export interface FinishGateInput {
  projectDir: string;
  script: VideoScript;
  composition: StyleComposition;
}

export interface FinishGateResult {
  passed: boolean;
  iterations: number;
  notes: string[];
  lint: { passed: boolean; errors: number; warnings: number };
  inspect: { passed: boolean; overflowCount: number };
  timingAudit: { passed: boolean; violations: TimingViolation[] };
}

export interface TimingViolation {
  sceneIndex: number;
  type: string;
  current: number;
  minimum: number;
  rule: string;
}

// ----------------------------------------------------------------
//  Reading-time table (from design-rules/taste.md)
// ----------------------------------------------------------------

const MIN_HOLD_SECONDS: Record<string, number> = {
  logo: 3,
  headline: 2,         // 3-5 words
  subtitle: 3,         // 8-15 words
  uiMockupDense: 4,
  productScreenshot: 3,
  dataDashboard: 4,
  ctaClose: 3,
};

// ----------------------------------------------------------------
//  Main entry
// ----------------------------------------------------------------

export async function runFinishGate(
  input: FinishGateInput,
  iteration = 1
): Promise<FinishGateResult> {
  const notes: string[] = [];

  // 1. Hyperframes lint
  const lint = await runLint(input.projectDir);
  if (!lint.passed) notes.push(`Lint: ${lint.errors} errors, ${lint.warnings} warnings`);

  // 2. Hyperframes inspect (text/container overflow)
  const inspect = await runInspect(input.projectDir);
  if (!inspect.passed) notes.push(`Inspect: ${inspect.overflowCount} overflow issues`);

  // 3. Taste.md reading-time audit
  const timingAudit = auditTiming(input.script, input.composition);
  if (!timingAudit.passed) {
    for (const v of timingAudit.violations) {
      notes.push(
        `Timing: scene ${v.sceneIndex} ${v.type} held ${v.current}s, min ${v.minimum}s (rule: ${v.rule})`
      );
    }
  }

  const passed = lint.passed && inspect.passed && timingAudit.passed;

  return {
    passed,
    iterations: iteration,
    notes,
    lint,
    inspect,
    timingAudit,
  };
}

// ----------------------------------------------------------------
//  Hyperframes lint wrapper (--json)
// ----------------------------------------------------------------

interface LintFinding {
  severity?: "error" | "warning" | "info";
  rule?: string;
  message?: string;
}

async function runLint(projectDir: string): Promise<{
  passed: boolean;
  errors: number;
  warnings: number;
}> {
  const result = spawnSync("npx", ["hyperframes", "lint", projectDir, "--json"], {
    encoding: "utf-8",
  });
  // Lint with --json prints structured output to stdout
  let errors = 0;
  let warnings = 0;
  try {
    const json = JSON.parse(result.stdout || "[]");
    const findings: LintFinding[] = Array.isArray(json) ? json : (json.findings ?? []);
    for (const f of findings) {
      if (f.severity === "error") errors++;
      else if (f.severity === "warning") warnings++;
    }
  } catch {
    // Fallback: parse text output for error/warning counts
    const text = (result.stdout ?? "") + (result.stderr ?? "");
    const errMatch = text.match(/(\d+)\s+error/);
    const warnMatch = text.match(/(\d+)\s+warning/);
    errors = errMatch ? parseInt(errMatch[1], 10) : 0;
    warnings = warnMatch ? parseInt(warnMatch[1], 10) : 0;
  }
  return { passed: errors === 0, errors, warnings };
}

// ----------------------------------------------------------------
//  Hyperframes inspect wrapper (--json)
// ----------------------------------------------------------------

async function runInspect(projectDir: string): Promise<{
  passed: boolean;
  overflowCount: number;
}> {
  const result = spawnSync(
    "npx",
    ["hyperframes", "inspect", projectDir, "--json", "--samples", "9"],
    { encoding: "utf-8" }
  );
  let overflowCount = 0;
  try {
    const json = JSON.parse(result.stdout || "{}");
    const issues = Array.isArray(json) ? json : (json.issues ?? json.findings ?? []);
    overflowCount = issues.length;
  } catch {
    // Fallback: parse text for overflow mentions
    const text = (result.stdout ?? "") + (result.stderr ?? "");
    overflowCount = (text.match(/overflow/gi) ?? []).length;
  }
  return { passed: overflowCount === 0, overflowCount };
}

// ----------------------------------------------------------------
//  Taste.md reading-time audit
// ----------------------------------------------------------------

function auditTiming(
  script: VideoScript,
  composition: StyleComposition
): { passed: boolean; violations: TimingViolation[] } {
  const violations: TimingViolation[] = [];

  for (const scene of script.scenes) {
    const text = scene.onScreenText ?? "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount === 0) continue; // no text → no reading constraint

    // Determine which rule applies
    let type: string;
    let minHold: number;
    if (wordCount <= 5) {
      type = "headline";
      minHold = MIN_HOLD_SECONDS.headline;
    } else if (wordCount <= 15) {
      type = "subtitle";
      minHold = MIN_HOLD_SECONDS.subtitle;
    } else {
      // long text — use word-count formula: words × 0.33s × 1.5 buffer
      type = "long-text";
      minHold = wordCount * 0.33 * 1.5;
    }

    // Special case: tiktok-flash pacing relaxes constraints
    if (composition.pacing === "tiktok-flash") {
      minHold = minHold * 0.6;
    }

    if (scene.durationSeconds < minHold) {
      violations.push({
        sceneIndex: scene.index,
        type,
        current: scene.durationSeconds,
        minimum: parseFloat(minHold.toFixed(2)),
        rule: `taste.md min-hold for ${type} (${wordCount} words)`,
      });
    }

    // Anti-slop: text > 12 words per scene
    if (wordCount > 12) {
      violations.push({
        sceneIndex: scene.index,
        type: "text-density",
        current: wordCount,
        minimum: 12,
        rule: "anti-slop.md max 12 words per scene",
      });
    }
  }

  return { passed: violations.length === 0, violations };
}

// ----------------------------------------------------------------
//  CLI entry — quick test (requires existing project dir)
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const projectDir = process.argv[2];
  if (!projectDir) {
    console.error("Usage: tsx finish-gate.ts <project-dir>");
    process.exit(1);
  }
  const stubScript: VideoScript = {
    scenes: [
      { index: 1, durationSeconds: 3, visual: "open", onScreenText: "Mornings make us." },
      { index: 2, durationSeconds: 4, visual: "body", onScreenText: "Most days, I get up at 6:30." },
    ],
    totalVoSeconds: 0,
    totalBgmSeconds: 7,
  };
  const stubComp: StyleComposition = {
    visual: "typography-statement",
    pacing: "medium-narrative",
    bgm: "minimalist-ambient",
    vo: "none",
    format: "9:16",
    durationSeconds: 7,
    rationale: ["CLI"],
  };
  runFinishGate({ projectDir, script: stubScript, composition: stubComp })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("Finish Gate failed:", err.message);
      process.exit(2);
    });
}
