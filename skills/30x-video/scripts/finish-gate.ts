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
  voPath?: string;
  bgmPath?: string;
}

export interface FinishGateResult {
  passed: boolean;
  iterations: number;
  notes: string[];
  lint: { passed: boolean; errors: number; warnings: number };
  inspect: { passed: boolean; overflowCount: number };
  timingAudit: { passed: boolean; violations: TimingViolation[] };
  /** notebook 03 P0: anti-slop additional audits */
  slopAudit?: SlopAuditResult;
  bgmDucking?: BgmDuckingResult;
}

export interface SlopAuditResult {
  passed: boolean;
  forbiddenWordsFound: Array<{ word: string; sceneIndex: number; context: string }>;
  voWpmExceeds175: boolean;
  voWpmActual: number;
}

export interface BgmDuckingResult {
  passed: boolean;
  voRmsLufs: number | null;
  bgmRmsLufs: number | null;
  separationDb: number | null;
  reason: string;
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

  // 2. Hyperframes inspect
  const inspect = await runInspect(input.projectDir);
  if (!inspect.passed) notes.push(`Inspect: ${inspect.overflowCount} overflow issues`);

  // 3. Reading-time audit (taste.md)
  const timingAudit = auditTiming(input.script, input.composition);
  if (!timingAudit.passed) {
    for (const v of timingAudit.violations) {
      notes.push(
        `Timing: scene ${v.sceneIndex} ${v.type} held ${v.current}s, min ${v.minimum}s`
      );
    }
  }

  // 4. notebook 03 P0: anti-slop word + VO speed audit
  const slopAudit = auditSlop(input.script);
  if (!slopAudit.passed) {
    for (const f of slopAudit.forbiddenWordsFound) {
      notes.push(`Slop word "${f.word}" in scene ${f.sceneIndex}: "${f.context}"`);
    }
    if (slopAudit.voWpmExceeds175) {
      notes.push(`VO speed ${slopAudit.voWpmActual.toFixed(0)} wpm > 175 (anxious)`);
    }
  }

  // 5. notebook 03 P0: BGM ducking audit (only if both audio paths given)
  let bgmDucking: BgmDuckingResult | undefined;
  if (input.voPath && input.bgmPath) {
    bgmDucking = await auditBgmDucking(input.voPath, input.bgmPath);
    if (!bgmDucking.passed) {
      notes.push(
        `BGM ducking: ${bgmDucking.reason} (separation=${bgmDucking.separationDb?.toFixed(1)}dB)`
      );
    }
  }

  const passed =
    lint.passed &&
    inspect.passed &&
    timingAudit.passed &&
    slopAudit.passed &&
    (bgmDucking?.passed ?? true);

  return {
    passed,
    iterations: iteration,
    notes,
    lint,
    inspect,
    timingAudit,
    slopAudit,
    bgmDucking,
  };
}

// ----------------------------------------------------------------
//  notebook 03 P0: Anti-slop word + VO speed audit
// ----------------------------------------------------------------

const SLOP_WORDS = [
  "elevate", "unleash", "empower", "revolutionize", "transform",
  "game-changer", "disrupt", "reimagine", "next-generation",
  "best-in-class", "cutting-edge", "all-in-one solution",
  "discover the future", "welcome to a new era",
  "what if i told you", "imagine a world where",
];

function auditSlop(script: VideoScript): SlopAuditResult {
  const forbiddenWordsFound: SlopAuditResult["forbiddenWordsFound"] = [];
  let totalWords = 0;
  let totalSeconds = 0;

  for (const scene of script.scenes) {
    const allText = `${scene.onScreenText ?? ""} ${scene.voLine ?? ""}`.toLowerCase();
    for (const slop of SLOP_WORDS) {
      if (allText.includes(slop.toLowerCase())) {
        forbiddenWordsFound.push({
          word: slop,
          sceneIndex: scene.index,
          context: (scene.onScreenText ?? scene.voLine ?? "").slice(0, 80),
        });
      }
    }
    if (scene.voLine) {
      totalWords += scene.voLine.split(/\s+/).filter(Boolean).length;
      totalSeconds += scene.durationSeconds;
    }
  }

  const voWpm = totalSeconds > 0 ? (totalWords / totalSeconds) * 60 : 0;
  const voWpmExceeds175 = voWpm > 175;

  return {
    passed: forbiddenWordsFound.length === 0 && !voWpmExceeds175,
    forbiddenWordsFound,
    voWpmExceeds175,
    voWpmActual: voWpm,
  };
}

// ----------------------------------------------------------------
//  notebook 03 P0: BGM must duck -12 to -18 dB under VO
//  Use ffmpeg's loudness measurement (ebur128) as proxy.
// ----------------------------------------------------------------

async function auditBgmDucking(
  voPath: string,
  bgmPath: string
): Promise<BgmDuckingResult> {
  const voLufs = await measureLoudness(voPath);
  const bgmLufs = await measureLoudness(bgmPath);

  if (voLufs === null || bgmLufs === null) {
    return {
      passed: false,
      voRmsLufs: voLufs,
      bgmRmsLufs: bgmLufs,
      separationDb: null,
      reason: "could not measure loudness on one or both tracks",
    };
  }

  // VO should be louder than BGM. separation = voLufs - bgmLufs.
  // Target: 12-18 dB separation. Less than 8 = BGM dominates.
  const separation = voLufs - bgmLufs;
  if (separation < 8) {
    return {
      passed: false,
      voRmsLufs: voLufs,
      bgmRmsLufs: bgmLufs,
      separationDb: separation,
      reason: "BGM too loud relative to VO (separation < 8dB)",
    };
  }
  return {
    passed: true,
    voRmsLufs: voLufs,
    bgmRmsLufs: bgmLufs,
    separationDb: separation,
    reason: "BGM properly ducked under VO",
  };
}

async function measureLoudness(audioPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    const result = spawnSync(
      "ffmpeg",
      ["-i", audioPath, "-af", "ebur128=peak=true", "-f", "null", "-"],
      { encoding: "utf-8" }
    );
    const stderr = result.stderr ?? "";
    // ebur128 prints "I:    -23.0 LUFS" near the end
    const match = stderr.match(/I:\s*(-?\d+\.?\d*)\s*LUFS/);
    if (match) resolve(parseFloat(match[1]));
    else resolve(null);
  });
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
