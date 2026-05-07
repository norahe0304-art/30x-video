/**
 * [INPUT]: ConfirmedPlan
 * [OUTPUT]: VideoScript (scene-by-scene shotlist with VO + on-screen text)
 * [POS]: scripts/ pipeline 第 [4] 步; 把决策变成可执行的镜头表
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Script Generator
//
//  LLM-driven. This module exposes:
//  1. A prompt template the agent fills out
//  2. A schema for the resulting scene list
//  3. A heuristic skeleton that produces a workable default
// ================================================================

import type {
  ConfirmedPlan,
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
      "index": number,                  // 1-based
      "durationSeconds": number,        // each scene's hold time
      "visual": string,                 // describe the visual for this scene
      "onScreenText": string | undefined, // text shown on screen
      "voLine": string | undefined,     // voice over for this scene
      "bgmBeat": string | undefined,    // "bar 1 downbeat" / "verse 2 build"
      "transition": string | undefined  // "cut" / "fade" / "match-cut"
    }
  ],
  "totalVoSeconds": number,
  "totalBgmSeconds": number
}

Rules:
- Sum of durationSeconds MUST equal plan.composition.durationSeconds.
- Number of scenes depends on pacing:
  - slow-luxury: 6-10 scenes (4-6s each)
  - medium-narrative: 8-15 scenes (2-3s each)
  - quick-hook: 8-15 scenes (1-2s each)
  - tiktok-flash: 8-25 scenes (0.5-1s each)
- VO total speech rate: 140-165 wpm.
- On-screen text: max 12 words per scene.
- Apply taste.md anti-slop rules — no purple gradients, no generic
  "elevate / unleash" copy, no AI-faces, no decorative motion.
- For typography-statement videos: VO is sparse, text carries weight.
- For product-ui-mockup: hold times longer, less text on top of UI.
- Final scene: clear close, brand mark or CTA, hold 3s minimum.
- DO NOT use forbidden phrases from anti-slop.md.
`.trim();

// ----------------------------------------------------------------
//  Heuristic skeleton (no LLM, useful for testing)
// ----------------------------------------------------------------

export function generateScriptHeuristic(plan: ConfirmedPlan): VideoScript {
  const { composition, intent } = plan;
  const total = composition.durationSeconds;
  const sceneCount = pickSceneCount(composition.pacing);
  const perScene = Math.max(1, total / sceneCount);

  const scenes: SceneSpec[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const isFirst = i === 0;
    const isLast = i === sceneCount - 1;
    scenes.push({
      index: i + 1,
      durationSeconds: parseFloat(perScene.toFixed(2)),
      visual: isFirst
        ? `Opening hook for ${intent.subject}`
        : isLast
          ? `Closing frame with brand mark / CTA`
          : `Scene ${i + 1} — illustrate ${intent.subject}`,
      onScreenText: isFirst ? toHook(intent.subject) : undefined,
      voLine: composition.vo === "none" ? undefined : `VO line ${i + 1} (TBD)`,
      transition: i === 0 ? undefined : "cut",
    });
  }
  return {
    scenes,
    totalVoSeconds: composition.vo === "none" ? 0 : total * 0.85,
    totalBgmSeconds: total,
  };
}

function pickSceneCount(pacing: ConfirmedPlan["composition"]["pacing"]): number {
  switch (pacing) {
    case "slow-luxury":
      return 8;
    case "medium-narrative":
      return 10;
    case "quick-hook":
      return 8;
    case "tiktok-flash":
      return 12;
  }
}

function toHook(subject: string): string {
  return subject.length > 50 ? subject.slice(0, 47) + "..." : subject;
}
