/**
 * [INPUT]: BGM audio file (mp3/wav), aubiotrack preferred / ffmpeg fallback, fps flag
 * [OUTPUT]: public/brand/beat-map.json + src/generated/beat-map.ts (auto-consumed by MainVideo.tsx)
 * [POS]: Standalone CLI — 把音频节拍固化为常量, 让 MainVideo 不再需要人肉贴 BPM;
 *        现为 legacy 脉冲常量载体 — 转场/动效时机的真相源是 analyze-audiomap.py 的
 *        audiomap.json (rules/beat-sync.md); bpm 与 audiomap 偏差 >2% 时以 audiomap 为准
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  BEAT-SYNC V2 — aubiotrack → beat-map → auto-consumed constants
//  Run: npx tsx scripts/beat-sync.ts public/brand/bgm.mp3 [--fps 30]
//
//  Outputs:
//    public/brand/beat-map.json   — reference data for debugging
//    src/generated/beat-map.ts    — typed module imported by MainVideo.tsx
//
//  Shape:
//    {
//      bpm: 116.5,
//      firstBeatSec: 3.037,
//      firstBeatFrame: 91,         // ← consumed by MainVideo
//      beatIntervalSec: 0.515,
//      beatIntervalFrames: 15.45,
//      measureFrames: 61.8,        // ← consumed by MainVideo (4 beats/measure)
//      fps: 30,
//      source: "aubiotrack" | "ffmpeg-onset" | "fallback-default",
//      confidence: "high" | "medium" | "low",
//    }
//
//  NEVER reverts to a hardcoded 120 BPM guess silently. If aubiotrack is
//  missing, the script emits source="fallback-default" and the MainVideo
//  beat pulse will still run but you should install aubiotrack before
//  final render — the 3% tempo error compounds visibly across 40 seconds.
// ================================================================

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

// ----------------------------------------------------------------
//  Types
// ----------------------------------------------------------------

type Source = "aubiotrack" | "ffmpeg-onset" | "fallback-default";
type Confidence = "high" | "medium" | "low";

interface BeatMap {
  bpm: number;
  firstBeatSec: number;
  firstBeatFrame: number;
  beatIntervalSec: number;
  beatIntervalFrames: number;
  measureFrames: number;
  fps: number;
  source: Source;
  confidence: Confidence;
  generatedAt: string;
}

// ----------------------------------------------------------------
//  CLI
// ----------------------------------------------------------------

function parseArgs(): { audioPath: string; fps: number } {
  const args = process.argv.slice(2);
  let audioPath = "";
  let fps = 30;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--fps" && args[i + 1]) {
      fps = Number(args[i + 1]);
      i++;
    } else if (!args[i].startsWith("--")) {
      audioPath = resolve(args[i]);
    }
  }

  if (!audioPath) {
    console.error("Usage: npx tsx scripts/beat-sync.ts <audio-file> [--fps 30]");
    console.error("Example: npx tsx scripts/beat-sync.ts public/brand/bgm.mp3");
    process.exit(2);
  }

  if (!existsSync(audioPath)) {
    console.error(`ERROR: audio file not found: ${audioPath}`);
    process.exit(2);
  }

  return { audioPath, fps };
}

function hasCommand(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------
//  aubiotrack (preferred)
// ----------------------------------------------------------------

function detectViaAubiotrack(audioPath: string): { beats: number[] } | null {
  if (!hasCommand("aubiotrack")) {
    console.warn("⚠ aubiotrack not found on PATH — falling back to ffmpeg onset detection.");
    console.warn("  Install: brew install aubio");
    return null;
  }
  try {
    const raw = execSync(`aubiotrack -i "${audioPath}"`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const beats = raw
      .split("\n")
      .map((line) => parseFloat(line.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);
    if (beats.length < 4) {
      console.warn(`⚠ aubiotrack returned only ${beats.length} beats — likely a non-rhythmic track`);
      return null;
    }
    return { beats };
  } catch (err) {
    console.warn(`⚠ aubiotrack failed: ${(err as Error).message}`);
    return null;
  }
}

// ----------------------------------------------------------------
//  ffmpeg onset fallback (worse, but better than default)
// ----------------------------------------------------------------

function detectViaFfmpeg(audioPath: string): { beats: number[] } | null {
  if (!hasCommand("ffmpeg")) return null;
  try {
    // Extract mono waveform amplitude envelope at 8kHz → 1px/sample
    const raw = execSync(
      `ffmpeg -i "${audioPath}" -af "aresample=8000,aformat=channel_layouts=mono,showwavespic=s=2000x1:colors=white" -frames:v 1 -f rawvideo -pix_fmt gray - 2>/dev/null | od -An -tu1 -w1 -v`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
    );
    const values = raw
      .split("\n")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v));
    if (values.length < 100) return null;

    const durationSec = getAudioDuration(audioPath);
    const samplesPerSec = values.length / durationSec;
    const window = 20;
    const beats: number[] = [];
    for (let i = window; i < values.length - window; i++) {
      const cur = values[i];
      let prev = 0;
      let next = 0;
      for (let k = 1; k <= window; k++) {
        prev += values[i - k];
        next += values[i + k];
      }
      prev /= window;
      next /= window;
      if (cur > prev * 1.3 && cur > next * 1.1 && cur > 100) {
        const t = i / samplesPerSec;
        if (beats.length === 0 || t - beats[beats.length - 1] > 0.3) beats.push(t);
      }
    }
    return beats.length >= 4 ? { beats } : null;
  } catch {
    return null;
  }
}

function getAudioDuration(audioPath: string): number {
  const out = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
    { encoding: "utf-8" },
  ).trim();
  return parseFloat(out);
}

// ----------------------------------------------------------------
//  Beat → interval distillation
// ----------------------------------------------------------------

function distill(beats: number[]): { firstBeatSec: number; beatIntervalSec: number } {
  const firstBeatSec = beats[0];
  // Compute diffs and histogram-bucket to nearest 0.01s
  const diffs: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    const d = beats[i] - beats[i - 1];
    if (d >= 0.25 && d <= 1.2) diffs.push(d); // 50-240 BPM range
  }
  if (diffs.length === 0) return { firstBeatSec, beatIntervalSec: 0.5 };

  const buckets = new Map<number, number>();
  for (const d of diffs) {
    const q = Math.round(d / 0.01) * 0.01;
    buckets.set(q, (buckets.get(q) || 0) + 1);
  }
  let bestInterval = 0.5;
  let bestCount = 0;
  for (const [interval, count] of buckets) {
    if (count > bestCount) {
      bestCount = count;
      bestInterval = interval;
    }
  }
  return { firstBeatSec, beatIntervalSec: bestInterval };
}

// ----------------------------------------------------------------
//  Assembly
// ----------------------------------------------------------------

function assemble(
  firstBeatSec: number,
  beatIntervalSec: number,
  fps: number,
  source: Source,
  confidence: Confidence,
): BeatMap {
  const bpm = Math.round((60 / beatIntervalSec) * 10) / 10;
  const beatIntervalFrames = beatIntervalSec * fps;
  const measureFrames = beatIntervalFrames * 4;
  const firstBeatFrame = Math.round(firstBeatSec * fps);
  return {
    bpm,
    firstBeatSec: Math.round(firstBeatSec * 1000) / 1000,
    firstBeatFrame,
    beatIntervalSec: Math.round(beatIntervalSec * 1000) / 1000,
    beatIntervalFrames: Math.round(beatIntervalFrames * 100) / 100,
    measureFrames: Math.round(measureFrames * 100) / 100,
    fps,
    source,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}

function fallbackDefault(fps: number): BeatMap {
  // 120 BPM, first beat at frame 0 — SAME as "no beat sync at all"
  // Flagged low-confidence so visual-audit can WARN
  return assemble(0, 0.5, fps, "fallback-default", "low");
}

// ----------------------------------------------------------------
//  File writers
// ----------------------------------------------------------------

function writeJson(beatMap: BeatMap): string {
  const outDir = join(process.cwd(), "public", "brand");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "beat-map.json");
  writeFileSync(outPath, JSON.stringify(beatMap, null, 2));
  return outPath;
}

function writeTs(beatMap: BeatMap): string {
  const outDir = join(process.cwd(), "src", "generated");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "beat-map.ts");
  const body = `/**
 * [INPUT]: scripts/beat-sync.ts (aubiotrack → beat-map.json → this file)
 * [OUTPUT]: beatMap constant consumed by MainVideo.tsx for downbeat-only pulse sync
 * [POS]: 音乐节拍常量, 自动生成, 禁止手工编辑
 * [PROTOCOL]: 由 beat-sync 脚本重写，不要手动修改
 *
 * Regenerate:
 *   npx tsx scripts/beat-sync.ts public/brand/bgm.mp3
 *
 * source: ${beatMap.source}
 * confidence: ${beatMap.confidence}
 * generated: ${beatMap.generatedAt}
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

export const beatMap: BeatMap = ${JSON.stringify(beatMap, null, 2)};
`;
  writeFileSync(outPath, body);
  return outPath;
}

// ----------------------------------------------------------------
//  Main
// ----------------------------------------------------------------

function main(): void {
  const { audioPath, fps } = parseArgs();
  console.log(`BEAT-SYNC V2`);
  console.log(`  audio: ${audioPath}`);
  console.log(`  fps:   ${fps}`);
  console.log("");

  let beatMap: BeatMap;

  const fromAubio = detectViaAubiotrack(audioPath);
  if (fromAubio) {
    const { firstBeatSec, beatIntervalSec } = distill(fromAubio.beats);
    beatMap = assemble(firstBeatSec, beatIntervalSec, fps, "aubiotrack", "high");
    console.log(`✓ aubiotrack: ${fromAubio.beats.length} beats detected`);
  } else {
    const fromFfmpeg = detectViaFfmpeg(audioPath);
    if (fromFfmpeg) {
      const { firstBeatSec, beatIntervalSec } = distill(fromFfmpeg.beats);
      beatMap = assemble(firstBeatSec, beatIntervalSec, fps, "ffmpeg-onset", "medium");
      console.log(`✓ ffmpeg onset: ${fromFfmpeg.beats.length} onsets detected (install aubio for higher accuracy)`);
    } else {
      beatMap = fallbackDefault(fps);
      console.warn("✗ no beat detection available — wrote fallback (120 BPM, first beat = 0)");
      console.warn("  → INSTALL aubiotrack before final render: brew install aubio");
    }
  }

  const jsonPath = writeJson(beatMap);
  const tsPath = writeTs(beatMap);

  console.log("");
  console.log(`BPM:             ${beatMap.bpm}`);
  console.log(`First beat:      ${beatMap.firstBeatSec}s (frame ${beatMap.firstBeatFrame})`);
  console.log(`Beat interval:   ${beatMap.beatIntervalSec}s (${beatMap.beatIntervalFrames}f)`);
  console.log(`Measure frames:  ${beatMap.measureFrames}f (${(beatMap.measureFrames / fps).toFixed(2)}s, 4 beats)`);
  console.log(`Source:          ${beatMap.source} (${beatMap.confidence} confidence)`);
  console.log("");
  console.log(`Wrote: ${jsonPath}`);
  console.log(`Wrote: ${tsPath}`);
  console.log("");
  console.log(`MainVideo.tsx already imports from src/generated/beat-map.ts — no manual copy needed.`);

  if (beatMap.confidence === "low") {
    console.warn("");
    console.warn("⚠ LOW CONFIDENCE: beat pulse will drift against real music.");
    console.warn("  Visual-audit will WARN until you install aubiotrack and re-run.");
  }
}

main();

// Silence unused warning — dirname is not needed here but we keep the import for consistency with other scripts.
void dirname;
