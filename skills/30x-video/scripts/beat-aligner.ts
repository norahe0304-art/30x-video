/**
 * [INPUT]: SceneSpec[] + BgmAsset (with bpm + firstBeatSec)
 * [OUTPUT]: SceneSpec[] with durations snapped to BPM bar boundaries
 * [POS]: scripts/ pipeline 第 [4.5] 步; 解决用户反馈 "文字没卡点"
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Beat Aligner (notebook 02 P0)
//
//  Why this exists: storyboard scene durations were "total / count" —
//  arbitrary. With BPM detected, we should snap each scene boundary to
//  a bar (4 beats) or phrase (8 beats). This makes scene transitions
//  land on the music — the "卡点" feel.
//
//  Algorithm:
//    barSec = 60 / bpm * 4
//    for each scene:
//      requestedDur = scene.durationSeconds
//      snappedDur   = roundToNearest(requestedDur, barSec)
//      enforce floor: max(barSec, snappedDur)
//    redistribute leftover from total mismatch into final scene
// ================================================================

import type { BgmAsset, SceneSpec } from "./types.ts";

export interface BeatAlignOptions {
  scenes: SceneSpec[];
  bgm: BgmAsset;
  totalDuration: number;
  /**
   * "bar" = 4 beats (default, most natural for scene cuts)
   * "phrase" = 8 beats (slower, for slow-luxury pacing)
   * "beat" = 1 beat (for tiktok-flash kinetic content)
   */
  granularity?: "beat" | "bar" | "phrase";
}

export interface BeatAlignResult {
  scenes: SceneSpec[];
  barSec: number;
  unitSec: number;
  granularity: "beat" | "bar" | "phrase";
  notes: string[];
}

export function alignScenesToBeats(opts: BeatAlignOptions): BeatAlignResult {
  const { scenes, bgm, totalDuration } = opts;
  const granularity = opts.granularity ?? "bar";
  const beatSec = 60 / bgm.bpm;
  const barSec = beatSec * 4;
  const unitSec =
    granularity === "beat" ? beatSec : granularity === "bar" ? barSec : barSec * 2;

  const notes: string[] = [
    `BPM=${bgm.bpm.toFixed(1)} → beat=${beatSec.toFixed(3)}s, bar=${barSec.toFixed(3)}s`,
    `Snapping scene durations to ${granularity} (${unitSec.toFixed(3)}s)`,
  ];

  // 1. snap each scene to nearest unit, enforce minimum = 1 unit
  const snapped: SceneSpec[] = scenes.map((s) => {
    const raw = s.durationSeconds;
    const units = Math.max(1, Math.round(raw / unitSec));
    return { ...s, durationSeconds: parseFloat((units * unitSec).toFixed(3)) };
  });

  // 2. compute drift from target total
  const snappedTotal = snapped.reduce((a, s) => a + s.durationSeconds, 0);
  const drift = totalDuration - snappedTotal;

  // 3. correct drift on final scene (if drift small) or distribute (if large)
  if (Math.abs(drift) < unitSec * 0.5) {
    // small drift: absorb into final scene
    if (snapped.length > 0) {
      const last = snapped[snapped.length - 1];
      snapped[snapped.length - 1] = {
        ...last,
        durationSeconds: parseFloat((last.durationSeconds + drift).toFixed(3)),
      };
      notes.push(`drift=${drift.toFixed(3)}s → absorbed into final scene`);
    }
  } else {
    // large drift: redistribute proportionally
    const factor = totalDuration / snappedTotal;
    for (let i = 0; i < snapped.length; i++) {
      snapped[i] = {
        ...snapped[i],
        durationSeconds: parseFloat((snapped[i].durationSeconds * factor).toFixed(3)),
      };
    }
    notes.push(`drift=${drift.toFixed(3)}s → redistributed proportionally`);
  }

  return { scenes: snapped, barSec, unitSec, granularity, notes };
}

/**
 * Compute scene start times after beat alignment.
 * Helper for compose.ts to know where each scene starts.
 */
export function sceneStartTimes(scenes: SceneSpec[]): number[] {
  let cursor = 0;
  return scenes.map((s) => {
    const start = cursor;
    cursor += s.durationSeconds;
    return start;
  });
}

/**
 * Pick the best granularity for a given pacing archetype.
 */
export function granularityForPacing(
  pacing: "slow-luxury" | "medium-narrative" | "quick-hook" | "tiktok-flash"
): "beat" | "bar" | "phrase" {
  switch (pacing) {
    case "slow-luxury":
      return "phrase";
    case "medium-narrative":
      return "bar";
    case "quick-hook":
      return "bar";
    case "tiktok-flash":
      return "beat";
  }
}
