/**
 * [INPUT]: BgmArchetype, target duration, target BPM range
 * [OUTPUT]: BgmAsset (mp3 path + BPM + first-beat offset)
 * [POS]: scripts/ pipeline 第 [5] 步; royalty-free BGM 抓取 + BPM 检测
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  BGM Fetcher
//
//  Strategy:
//    1. Maintain a small royalty-free pool indexed by archetype + BPM
//    2. If pool insufficient, use yt-dlp to grab from royalty-free YouTube channels
//    3. Run aubiotrack for BPM + first-beat offset
//    4. Trim / loop to target duration with ffmpeg
//
//  This module is a STUB. Full implementation requires:
//    - Local royalty-free pool curated separately
//    - yt-dlp installed
//    - aubiotrack installed (port from remotion-video/scripts/beat-sync.ts)
//    - ffmpeg installed
// ================================================================

import type { BgmArchetype, BgmAsset } from "./types.ts";

export interface BgmFetchOptions {
  archetype: BgmArchetype;
  durationSeconds: number;
  outputPath: string;
  preferredBpmRange?: [number, number];
}

interface BgmCandidate {
  source: "pool" | "yt-dlp";
  reference: string; // file path or YouTube URL
  bpm?: number;
  archetype: BgmArchetype;
  label?: string;
}

// ----------------------------------------------------------------
//  BPM ranges per archetype (from style-dimensions.md)
// ----------------------------------------------------------------

const BPM_RANGES: Record<BgmArchetype, [number, number]> = {
  "minimalist-ambient": [60, 80],
  "techno-driving": [120, 130],
  "cinematic-orchestral": [70, 100],
  "hip-hop-confident": [80, 100],
  "lo-fi-warm": [70, 90],
  "silence-with-sfx": [0, 0],
  "speech-only": [0, 0],
};

export function getBpmRange(archetype: BgmArchetype): [number, number] {
  return BPM_RANGES[archetype];
}

export function getBpmTarget(archetype: BgmArchetype, override?: [number, number]): number {
  const [min, max] = override ?? BPM_RANGES[archetype];
  return Math.round((min + max) / 2);
}

// ----------------------------------------------------------------
//  Main fetcher (STUB)
// ----------------------------------------------------------------

export async function fetchBgm(opts: BgmFetchOptions): Promise<BgmAsset> {
  if (opts.archetype === "silence-with-sfx" || opts.archetype === "speech-only") {
    throw new Error(
      `fetchBgm called with non-music archetype "${opts.archetype}". ` +
        `These archetypes require SFX or VO-only — not BGM fetch.`
    );
  }

  const target = getBpmTarget(opts.archetype, opts.preferredBpmRange);
  // STUB: actual implementation
  throw new Error(
    `BGM fetch not yet implemented. Target: archetype=${opts.archetype}, ` +
      `bpm=${target}, duration=${opts.durationSeconds}s.\n` +
      `To implement:\n` +
      `  1. Search local royalty-free pool by archetype + BPM range\n` +
      `  2. If miss, yt-dlp from curated channels (e.g. NoCopyrightSounds, FreePD)\n` +
      `  3. ffmpeg trim/loop to ${opts.durationSeconds}s\n` +
      `  4. aubiotrack --bpm and aubiotrack --offset for sync\n` +
      `Output: mp3 at ${opts.outputPath}`
  );
}

// ----------------------------------------------------------------
//  Helpers used by orchestrator
// ----------------------------------------------------------------

export function shouldFetchBgm(archetype: BgmArchetype): boolean {
  return archetype !== "silence-with-sfx" && archetype !== "speech-only";
}
