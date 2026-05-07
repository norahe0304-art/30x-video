/**
 * [INPUT]: BgmArchetype, target duration, target BPM range
 * [OUTPUT]: BgmAsset (mp3 path + BPM + first-beat offset)
 * [POS]: scripts/ pipeline 第 [5] 步; royalty-free BGM 抓取 + BPM 检测 + 裁剪
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  BGM Fetcher
//
//  Strategy per archetype:
//    1. Build a curated yt-dlp search query targeting known
//       royalty-free channels (NoCopyrightSounds, Lofi Girl,
//       Audionautix, etc.)
//    2. Download top N candidates (audio only)
//    3. Run aubiotrack to detect BPM + first beat offset
//    4. Pick the candidate with BPM closest to archetype target
//    5. ffmpeg trim or loop-with-crossfade to exact target duration
//
//  Requires: yt-dlp, aubiotrack, ffmpeg in PATH.
// ================================================================

import { execFileSync, spawnSync } from "child_process";
import { existsSync, mkdtempSync, readdirSync, statSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import type { BgmArchetype, BgmAsset } from "./types.ts";

export interface BgmFetchOptions {
  archetype: BgmArchetype;
  durationSeconds: number;
  outputPath: string;
  preferredBpmRange?: [number, number];
  candidateCount?: number;
}

// ----------------------------------------------------------------
//  BPM ranges per archetype (matches style-dimensions.md)
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

// Curated yt-dlp search queries per archetype.
// Tested for reliable results — short, brand-anchored queries return
// results faster than verbose ones. NCS is the most reliable royalty-
// free source on YouTube.
const SEARCH_QUERIES: Record<BgmArchetype, string> = {
  "minimalist-ambient": "NoCopyrightSounds chill ambient",
  "techno-driving": "NoCopyrightSounds electronic dance",
  "cinematic-orchestral": "NoCopyrightSounds cinematic",
  "hip-hop-confident": "NoCopyrightSounds hip hop",
  "lo-fi-warm": "NoCopyrightSounds lofi chill",
  "silence-with-sfx": "",
  "speech-only": "",
};

export function getBpmRange(archetype: BgmArchetype): [number, number] {
  return BPM_RANGES[archetype];
}

export function getBpmTarget(
  archetype: BgmArchetype,
  override?: [number, number]
): number {
  const [min, max] = override ?? BPM_RANGES[archetype];
  return Math.round((min + max) / 2);
}

export function shouldFetchBgm(archetype: BgmArchetype): boolean {
  return archetype !== "silence-with-sfx" && archetype !== "speech-only";
}

// ----------------------------------------------------------------
//  Main fetcher
// ----------------------------------------------------------------

export async function fetchBgm(opts: BgmFetchOptions): Promise<BgmAsset> {
  if (!shouldFetchBgm(opts.archetype)) {
    throw new Error(
      `fetchBgm called with non-music archetype "${opts.archetype}".`
    );
  }

  ensureToolsAvailable();

  const targetBpm = getBpmTarget(opts.archetype, opts.preferredBpmRange);
  const candidateCount = opts.candidateCount ?? 3;
  const query = SEARCH_QUERIES[opts.archetype];
  const tempDir = mkdtempSync(join(tmpdir(), "30x-bgm-"));

  // 1. Download top candidates as mp3
  const candidates = downloadCandidates(query, candidateCount, tempDir);

  if (candidates.length === 0) {
    throw new Error(
      `BGM fetch found no candidates for archetype="${opts.archetype}". ` +
        `yt-dlp search query: "${query}"`
    );
  }

  // 2. Detect BPM for each, pick closest to target
  let best: { path: string; bpm: number; firstBeatSec: number } | undefined;
  let bestDelta = Infinity;
  for (const candidatePath of candidates) {
    try {
      const detected = detectBpm(candidatePath);
      const delta = Math.abs(detected.bpm - targetBpm);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = { path: candidatePath, ...detected };
      }
    } catch (err) {
      // skip candidate that fails BPM detection
      continue;
    }
  }

  if (!best) {
    throw new Error(
      `BGM fetch: aubiotrack failed on all ${candidates.length} candidates.`
    );
  }

  // 3. Trim or loop to target duration
  const finalPath = opts.outputPath;
  const dirName = dirname(finalPath);
  if (!existsSync(dirName)) {
    execFileSync("mkdir", ["-p", dirName]);
  }
  trimOrLoopToDuration({
    sourcePath: best.path,
    outputPath: finalPath,
    targetDuration: opts.durationSeconds,
    firstBeatSec: best.firstBeatSec,
  });

  return {
    path: finalPath,
    durationSeconds: opts.durationSeconds,
    bpm: best.bpm,
    firstBeatSec: best.firstBeatSec,
    source: query,
    archetype: opts.archetype,
  };
}

// ----------------------------------------------------------------
//  Helper: yt-dlp download
// ----------------------------------------------------------------

function downloadCandidates(
  query: string,
  count: number,
  tempDir: string
): string[] {
  // Limit to 15-min max video length and ≤ 30MB to avoid huge downloads
  const args = [
    `ytsearch${count}:${query}`,
    "--no-playlist",
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--match-filters",
    "duration<3600",
    "--max-filesize",
    "100M",
    "--output",
    join(tempDir, "%(autonumber)s.%(ext)s"),
    "--no-progress",
    "--socket-timeout",
    "30",
  ];

  // 4-min hard timeout: stop hangs from YouTube JS challenge issues
  const result = spawnSync("yt-dlp", args, {
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 240_000,
  });

  if (result.error || result.status !== 0) {
    console.error(
      `yt-dlp non-zero exit (${result.status}). Continuing with whatever was downloaded.`
    );
  }

  if (!existsSync(tempDir)) return [];
  return readdirSync(tempDir)
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => join(tempDir, f))
    .filter((p) => statSync(p).size > 100_000);
}

// ----------------------------------------------------------------
//  Helper: aubiotrack BPM + first-beat detection
// ----------------------------------------------------------------

interface BpmDetection {
  bpm: number;
  firstBeatSec: number;
}

function detectBpm(audioPath: string): BpmDetection {
  // aubiotrack outputs beat onset times (seconds), one per line
  const result = spawnSync("aubiotrack", [audioPath], {
    encoding: "utf-8",
  });
  if (result.status !== 0 || !result.stdout) {
    throw new Error(
      `aubiotrack failed for ${audioPath}: ${result.stderr ?? "no stdout"}`
    );
  }
  const lines = result.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const beats = lines.map((l) => parseFloat(l)).filter((n) => !isNaN(n));
  if (beats.length < 4) {
    throw new Error(`aubiotrack returned < 4 beats for ${audioPath}`);
  }

  const firstBeatSec = beats[0];
  // BPM = average beats-per-second × 60
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }
  // remove outliers (top/bottom 10%)
  intervals.sort((a, b) => a - b);
  const trimStart = Math.floor(intervals.length * 0.1);
  const trimEnd = Math.ceil(intervals.length * 0.9);
  const trimmed = intervals.slice(trimStart, trimEnd);
  const avgInterval = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const bpm = 60 / avgInterval;

  return { bpm: parseFloat(bpm.toFixed(1)), firstBeatSec };
}

// ----------------------------------------------------------------
//  Helper: ffmpeg trim or loop to target duration
// ----------------------------------------------------------------

interface TrimLoopOpts {
  sourcePath: string;
  outputPath: string;
  targetDuration: number;
  firstBeatSec: number;
}

function trimOrLoopToDuration(opts: TrimLoopOpts): void {
  const sourceDuration = getAudioDuration(opts.sourcePath);

  // notebook 03 P0: BGM must sit ~12-18 dB under VO. Tested -18dB volume
  // reduction → still only 5dB separation (NCS source very loud). Switch
  // to loudnorm targeting -36 LUFS — broadcast-style guaranteed level.
  // notebook 02 P0: trim start aligned to first DOWNBEAT (most stable
  // 4-beat sequence start), not first arbitrary onset.
  const downbeatSec = findDownbeat(opts.sourcePath, opts.firstBeatSec);

  // afilter chain:
  //   loudnorm I=-36       → integrated loudness pinned at -36 LUFS
  //                          (VO typically -21..-23 LUFS → 13-15 dB ducking)
  //   afade in/out         → no abrupt cut-in / graceful tail
  const fadeOutStart = Math.max(0, opts.targetDuration - 1.5);
  const filterChain = `loudnorm=I=-36:LRA=11:TP=-2,afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart}:d=1.5`;

  if (sourceDuration >= opts.targetDuration + 1) {
    runFfmpeg([
      "-y",
      "-ss", String(downbeatSec),
      "-i", opts.sourcePath,
      "-t", String(opts.targetDuration),
      "-acodec", "libmp3lame",
      "-b:a", "192k",
      "-af", filterChain,
      opts.outputPath,
    ]);
    return;
  }

  const loopCount = Math.ceil(opts.targetDuration / sourceDuration) + 1;
  runFfmpeg([
    "-y",
    "-stream_loop", String(loopCount),
    "-i", opts.sourcePath,
    "-t", String(opts.targetDuration),
    "-acodec", "libmp3lame",
    "-b:a", "192k",
    "-af", filterChain,
    opts.outputPath,
  ]);
}

// notebook 02 P0: find a true downbeat (start of a 4-beat phrase),
// not just any onset. Picks the onset whose next 8 inter-beat
// intervals have the lowest variance — that's where the metronome
// is most stable, i.e., the start of a phrase.
function findDownbeat(audioPath: string, fallbackSec: number): number {
  const result = spawnSync("aubiotrack", [audioPath], { encoding: "utf-8" });
  if (result.status !== 0 || !result.stdout) return fallbackSec;
  const beats = result.stdout
    .split("\n")
    .map((l) => parseFloat(l.trim()))
    .filter((n) => !isNaN(n));
  if (beats.length < 12) return fallbackSec;

  // For each candidate beat (skipping first 2 to avoid edge), compute
  // variance of next 8 inter-beat intervals.
  let bestSec = fallbackSec;
  let bestVar = Infinity;
  for (let i = 2; i < beats.length - 9; i++) {
    const intervals: number[] = [];
    for (let j = i; j < i + 8; j++) intervals.push(beats[j + 1] - beats[j]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    if (variance < bestVar) {
      bestVar = variance;
      bestSec = beats[i];
    }
  }
  return Math.max(0, bestSec - 0.05); // 50ms pre-roll
}

function runFfmpeg(args: string[]): void {
  const result = spawnSync("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr?.toString() ?? "unknown error"}`);
  }
}

function getAudioDuration(path: string): number {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    { encoding: "utf-8" }
  );
  return parseFloat(result.stdout?.trim() ?? "0");
}

// ----------------------------------------------------------------
//  Helper: ensure required tools are present
// ----------------------------------------------------------------

function ensureToolsAvailable(): void {
  const required = ["yt-dlp", "aubiotrack", "ffmpeg", "ffprobe"];
  for (const tool of required) {
    const result = spawnSync("command", ["-v", tool], { shell: true });
    if (result.status !== 0) {
      throw new Error(
        `Required tool not found: ${tool}.\n` +
          `Install via: brew install yt-dlp aubio ffmpeg`
      );
    }
  }
}

// ----------------------------------------------------------------
//  CLI entry — quick test
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const archetype = (process.argv[2] ?? "lo-fi-warm") as BgmArchetype;
  const duration = parseFloat(process.argv[3] ?? "15");
  const outputPath = process.argv[4] ?? "/tmp/test-bgm.mp3";
  fetchBgm({ archetype, durationSeconds: duration, outputPath })
    .then((asset) => {
      console.log(JSON.stringify(asset, null, 2));
    })
    .catch((err) => {
      console.error("BGM fetch failed:", err.message);
      process.exit(1);
    });
}
