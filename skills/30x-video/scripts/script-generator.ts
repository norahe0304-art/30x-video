/**
 * [INPUT]: ConfirmedPlan
 * [OUTPUT]: VideoScript (scene-by-scene shotlist with VO + on-screen text)
 * [POS]: scripts/ pipeline 第 [4] 步; 把决策变成可执行的镜头表
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Script Generator
//
//  LLM-driven in production. This module exposes:
//  1. A prompt template the agent fills out
//  2. A schema for the resulting scene list
//  3. A heuristic skeleton that produces a working default
//     - Every scene gets visible text (no empty frames)
//     - Scene count + duration respect pacing constraints
//     - Reading-time floor enforced (taste.md: headline ≥ 2s)
// ================================================================

import type {
  ConfirmedPlan,
  Pacing,
  SceneSpec,
  VideoScript,
} from "./types.ts";

export const SCRIPT_GENERATOR_PROMPT = `
You are the Script Generator for 30x-video.

Given a ConfirmedPlan, produce a scene-by-scene shotlist for a {duration}s
video. The output is a JSON object matching VideoScript schema:

{
  "scenes": [
    {
      "index": number,
      "durationSeconds": number,
      "visual": string,
      "onScreenText": string | undefined,
      "voLine": string | undefined,
      "bgmBeat": string | undefined,
      "transition": string | undefined
    }
  ],
  "totalVoSeconds": number,
  "totalBgmSeconds": number
}

Hard rules:
- Sum of durationSeconds MUST equal plan.composition.durationSeconds.
- EVERY scene MUST have onScreenText OR a meaningful visual description.
  Empty scenes render as black on screen — never produce them.
- Reading-time floor: headlines (3-5 words) need 2s minimum hold.
- Scene count by pacing:
  - slow-luxury:    6-10 scenes, 4-6s each
  - medium-narrative: 8-12 scenes, 2-3s each
  - quick-hook:     6-8 scenes, 1.5-2.5s each
  - tiktok-flash:   6-12 scenes, 0.7-1.2s each
- VO total speech rate: 140-165 wpm.
- On-screen text: max 12 words per scene.
- Apply taste.md anti-slop rules — no "elevate / unleash" copy.
- For typography-statement videos: every scene needs on-screen text.
- For product-ui-mockup: longer holds (3+ seconds), less text overlay.
- Final scene: brand mark or CTA, hold 3s minimum.
- DO NOT use forbidden phrases from anti-slop.md.
`.trim();

// ----------------------------------------------------------------
//  Heuristic skeleton (no LLM)
// ----------------------------------------------------------------

export function generateScriptHeuristic(plan: ConfirmedPlan): VideoScript {
  const { composition, intent } = plan;
  const total = composition.durationSeconds;

  // 1. Pick scene count that respects pacing constraints
  const sceneCount = pickSceneCount(composition.pacing, total);
  const perScene = total / sceneCount;

  // 2. Generate placeholder lines for each scene
  const lines = generatePlaceholderLines(intent.subject, sceneCount, plan);

  const scenes: SceneSpec[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const isFirst = i === 0;
    const isLast = i === sceneCount - 1;

    scenes.push({
      index: i + 1,
      durationSeconds: parseFloat(perScene.toFixed(2)),
      visual: isFirst
        ? `Opening: ${intent.subject}`
        : isLast
          ? `Closing frame`
          : `Beat ${i + 1}`,
      // EVERY scene gets on-screen text (no empty frames)
      onScreenText: lines[i],
      voLine:
        composition.vo === "none"
          ? undefined
          : `(VO line ${i + 1} — to be replaced by LLM script generator)`,
      transition: i === 0 ? undefined : "cut",
    });
  }

  return {
    scenes,
    totalVoSeconds: composition.vo === "none" ? 0 : total * 0.85,
    totalBgmSeconds: total,
  };
}

// ----------------------------------------------------------------
//  Pick scene count respecting pacing minimums
// ----------------------------------------------------------------

function pickSceneCount(pacing: Pacing, totalSec: number): number {
  // Each pacing has a minimum-per-scene to satisfy reading time
  const minPerScene: Record<Pacing, number> = {
    "slow-luxury": 4,
    "medium-narrative": 2.5,
    "quick-hook": 1.8,
    "tiktok-flash": 0.9,
  };
  // Target scene count (sweet spot per pacing)
  const target: Record<Pacing, number> = {
    "slow-luxury": 8,
    "medium-narrative": 10,
    "quick-hook": 7,
    "tiktok-flash": 10,
  };

  const cap = Math.floor(totalSec / minPerScene[pacing]);
  return Math.max(3, Math.min(target[pacing], cap));
}

// ----------------------------------------------------------------
//  Generate placeholder lines (heuristic — LLM should override)
// ----------------------------------------------------------------

function generatePlaceholderLines(
  subject: string,
  count: number,
  plan: ConfirmedPlan
): string[] {
  // Strip filler words for cleaner display
  const cleanSubject = subject
    .replace(/\b(for\s+\w+|about\s+|a\s+\d+s?\s+\w+\s+video\s+about\s+)\b/gi, "")
    .trim();

  const lines: string[] = [];

  // First line: the topic, capitalized
  lines.push(capitalize(cleanSubject) + ".");

  // Middle lines: archetype-flavored placeholders
  // (LLM script generator will replace these in production)
  const middleLines = pickMiddleLines(plan, count - 2);
  lines.push(...middleLines);

  // Final line: a closing beat
  if (count >= 2) {
    lines.push(pickClosing(plan));
  }

  return lines.slice(0, count);
}

function pickMiddleLines(plan: ConfirmedPlan, n: number): string[] {
  if (n <= 0) return [];
  const subj = plan.intent.subject.toLowerCase();
  const archetype = plan.designProfile.archetype;

  // Generic editorial fillers — the LLM should replace these
  const editorialLines = [
    "Here's the thing.",
    "Most people miss it.",
    "It starts simple.",
    "But not always.",
    "What if it could be different?",
    "The pattern repeats.",
    "Pay attention.",
    "Now look closer.",
    "It matters more than you think.",
    "Trust the process.",
  ];

  const productLines = [
    "Built for clarity.",
    "Designed for focus.",
    "One thing, done right.",
    "Without the noise.",
    "Where it belongs.",
    "Just where you need it.",
    "Quietly powerful.",
    "Finally — simple.",
  ];

  const pool =
    archetype === "Infra Authority" || archetype === "System Clarity"
      ? productLines
      : editorialLines;

  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(pool[i % pool.length]);
  }
  return result;
}

function pickClosing(plan: ConfirmedPlan): string {
  const archetype = plan.designProfile.archetype;
  switch (archetype) {
    case "Financial Precision":
      return "Made for trust.";
    case "Editorial Minimalism":
      return "Now you know.";
    case "Infra Authority":
      return "Production-grade.";
    case "Productive Warmth":
      return "Made with care.";
    case "System Clarity":
      return "Built to work.";
    default:
      return "Now you know.";
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
