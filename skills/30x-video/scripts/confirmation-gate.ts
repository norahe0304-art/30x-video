/**
 * [INPUT]: ContentIntent + DesignProfile + StyleComposition + reference videos
 * [OUTPUT]: Formatted plan string for user review + lock signal
 * [POS]: scripts/ pipeline 中间门; 渲染前必经
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Confirmation Gate
//
//  Renders the plan in the format specified by SKILL.md and
//  references/confirmation-gate.md. Returns a string the agent
//  shows the user. Lock decisions only happen via explicit user
//  reply ("go" / "yes" / adjustments).
// ================================================================

import type {
  ConfirmedPlan,
  ContentIntent,
  DesignProfile,
  StyleComposition,
  VideoLibraryEntry,
} from "./types.ts";

export interface PlanInput {
  intent: ContentIntent;
  designProfile: DesignProfile;
  composition: StyleComposition;
  references: VideoLibraryEntry[];
}

export function renderPlan(input: PlanInput): {
  display: string;
  questions: string[];
  defaults: string[];
} {
  const { intent, designProfile, composition, references } = input;
  const questions: string[] = [];
  const defaults: string[] = [];

  // detect ambiguities and propose defaults
  if (!intent.formatHint) {
    questions.push(
      `Format: ${composition.format} (suggested) — confirm or change to 16:9 / 9:16 / 1:1 / 4:5?`
    );
    defaults.push(`format=${composition.format}`);
  }
  if (composition.vo !== "none" && !intent.contentAssets?.length) {
    questions.push(
      `Voice over script: should I draft VO copy, or do you have a script you want me to use?`
    );
    defaults.push(`I will draft VO copy unless you provide one`);
  }
  if (designProfile.source === "creator-default" && !intent.brand) {
    questions.push(
      `No brand specified — I'll synthesize a neutral profile from "${composition.visual}" archetype. ` +
        `Want to anchor to a specific reference (Apple-like / Linear-like / Aesop-like)?`
    );
    defaults.push(`creator-default profile`);
  }

  // build display
  const refLines = references.map(
    (r, i) =>
      `│   ${i + 1}. ${r.brand} — ${r.title}${r.study_segment ? ` (${r.study_segment})` : ""}`
  );

  const display = `
┌─── Video Plan ───────────────────────────────────────┐
│ Topic:        ${intent.subject}
│ Duration:     ${composition.durationSeconds}s
│ Format:       ${composition.format}
│ Visual:       ${composition.visual}
│ Pacing:       ${composition.pacing}
│ Voice over:   ${composition.vo}
│ BGM:          ${composition.bgm}
│ Brand source: ${designProfile.source}${designProfile.brand ? ` (${designProfile.brand})` : ""}
│ Archetype:    ${designProfile.archetype}
│ Fonts:        heading=${designProfile.fonts.heading}, body=${designProfile.fonts.body}
│
│ References:
${refLines.join("\n")}
└───────────────────────────────────────────────────────┘
${
  questions.length > 0
    ? `\nQuestions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nReply 'go' to proceed with defaults, or adjust any line.`
    : `\nReply 'go' to proceed.`
}
`.trim();

  return { display, questions, defaults };
}

export function lockPlan(input: PlanInput, questions: string[], defaults: string[]): ConfirmedPlan {
  return {
    intent: input.intent,
    designProfile: input.designProfile,
    composition: input.composition,
    references: input.references,
    questions,
    defaults,
    lockedAt: new Date().toISOString(),
  };
}
