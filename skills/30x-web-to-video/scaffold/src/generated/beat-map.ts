/**
 * [INPUT]: scripts/beat-sync.ts (aubiotrack → beat-map.json → this file)
 * [OUTPUT]: beatMap constant consumed by MainVideo.tsx for downbeat-only pulse sync
 * [POS]: 音乐节拍常量, 自动生成, 禁止手工编辑
 * [PROTOCOL]: 由 beat-sync 脚本重写，不要手动修改
 *
 * Regenerate:
 *   npx tsx scripts/beat-sync.ts public/brand/bgm.mp3
 *
 * This file ships with a fallback-default stub so the scaffold compiles
 * before BGM has been wired. The first run of beat-sync against the real
 * BGM will overwrite this file with aubiotrack-derived constants.
 */
export interface BeatMap {
  bpm: number;
  firstBeatSec: number;
  firstBeatFrame: number;
  beatIntervalSec: number;
  beatIntervalFrames: number;
  measureFrames: number;
  fps: number;
  source: "aubiotrack" | "ffmpeg-onset" | "fallback-default";
  confidence: "high" | "medium" | "low";
  generatedAt: string;
}

export const beatMap: BeatMap = {
  bpm: 120,
  firstBeatSec: 0,
  firstBeatFrame: 0,
  beatIntervalSec: 0.5,
  beatIntervalFrames: 15,
  measureFrames: 60,
  fps: 30,
  source: "fallback-default",
  confidence: "low",
  generatedAt: "1970-01-01T00:00:00.000Z",
};
