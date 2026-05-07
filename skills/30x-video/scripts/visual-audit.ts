/**
 * [INPUT]: src/scenes/*.tsx, src/components/*.tsx in the current working directory
 * [OUTPUT]: Comprehensive visual audit report, exit code 0/1
 * [POS]: Standalone CLI script — BLOCKING gate before render
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  VISUAL AUDIT — Remotion Scene Full-Spectrum Validator
//  Run: npx tsx scripts/visual-audit.ts
//  Checks: timing, font size, font weight, safe zones, objectFit,
//          color contrast, text readability
// ================================================================

import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, join } from "path";

// ----------------------------------------------------------------
//  Types
// ----------------------------------------------------------------

interface Issue {
  file: string;
  rule: string;
  severity: "FAIL" | "WARN";
  detail: string;
  line?: number;
}

interface TimingHit {
  element: string;
  type: string;
  delay: number;
  content: string;
  finish: number;
}

// ----------------------------------------------------------------
//  Constants
// ----------------------------------------------------------------

const FADE_TRANSITION = 15;
const MIN_BREATHING = 45;
const MIN_FONT_SIZE = 28;
const MAX_FONT_WEIGHT = 600;
const MIN_SAFE_ZONE = 60; // px from edge
const SCENES_DIR = join(process.cwd(), "src", "scenes");
const COMPONENTS_DIR = join(process.cwd(), "src", "components");
const MAIN_VIDEO_PATH = join(process.cwd(), "src", "MainVideo.tsx");
const BEAT_MAP_TS_PATH = join(process.cwd(), "src", "generated", "beat-map.ts");
const BGM_PATH = join(process.cwd(), "public", "brand", "bgm.mp3");

// Beat pulse budget (40s @ 30fps reference)
// disco    : > 40 hits (>1/s)        — fail
// busy     : 25-40 hits               — warn
// premium  : 10-25 hits (0.25-0.6/s)  — pass
// subtle   : < 10 hits                — warn (might feel missing)
const BEAT_HITS_FAIL_HIGH = 40;
const BEAT_HITS_WARN_HIGH = 25;
const BEAT_HITS_WARN_LOW = 8;

// BGM segment sanity
const BGM_SAMPLE_WINDOW_SEC = 2;      // probe window length
const BGM_SAMPLE_INTERVAL_SEC = 5;    // probe every Ns
const BGM_MIN_MAX_VOLUME_DB = -40;    // any segment quieter than this = silence bug

// ----------------------------------------------------------------
//  Helpers
// ----------------------------------------------------------------

function extractNumber(src: string, pattern: RegExp, fallback: number): number {
  const m = src.match(pattern);
  return m ? Number(m[1]) : fallback;
}

function extractString(src: string, pattern: RegExp, fallback: string): string {
  const m = src.match(pattern);
  return m ? m[1] : fallback;
}

function countTextChars(raw: string): number {
  return raw
    .replace(/^\{[`'"]/,  "").replace(/[`'"]\}$/,  "")
    .replace(/^["']/,     "").replace(/["']$/,     "")
    .length;
}

function getLineNumber(src: string, index: number): number {
  return src.substring(0, index).split("\n").length;
}

// ----------------------------------------------------------------
//  1. TIMING AUDIT (from timing-audit.ts)
// ----------------------------------------------------------------

function findTimingIssues(src: string, file: string): { issues: Issue[]; hits: TimingHit[] } {
  const issues: Issue[] = [];
  const hits: TimingHit[] = [];

  // ── 场景总时长 ──
  const durationRe = /durationInFrames\s*[:=]\s*\{?\s*(\d+)/g;
  let maxDuration = 0;
  let m: RegExpExecArray | null;
  while ((m = durationRe.exec(src)) !== null) {
    const v = Number(m[1]);
    if (v > maxDuration) maxDuration = v;
  }
  const constRe = /(?:DURATION|SCENE_DURATION)\s*[:=]\s*(\d+)/i;
  const cm = src.match(constRe);
  if (cm && Number(cm[1]) > maxDuration) maxDuration = Number(cm[1]);

  if (maxDuration === 0) return { issues, hits };

  // ── SplitText ──
  const splitRe = /<SplitText\b([^>]*(?:\n[^>]*)*)>/g;
  while ((m = splitRe.exec(src)) !== null) {
    const block = m[1];
    const textRaw = extractString(block, /text\s*=\s*({[^}]+}|"[^"]+"|'[^']+')/, "");
    const chars   = countTextChars(textRaw);
    const delay   = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const stagger = extractNumber(block, /staggerFrames\s*=\s*\{?\s*([\d.]+)/, 3);
    const finish  = delay + Math.ceil(chars * stagger);
    const breathing = maxDuration - finish - FADE_TRANSITION;

    hits.push({ element: "SplitText", type: "split-char", delay, content: `${chars}ch×${stagger}f`, finish });
    if (breathing < MIN_BREATHING) {
      issues.push({
        file, rule: "TIMING", severity: "FAIL",
        detail: `SplitText "${textRaw.slice(0, 30)}..." finishes at ${finish}f, scene ${maxDuration}f, breathing ${breathing}f < ${MIN_BREATHING}f`,
        line: getLineNumber(src, m.index),
      });
    }
  }

  // ── Typewriter ──
  const typeRe = /<Typewriter\b([^>]*(?:\n[^>]*)*)>/g;
  while ((m = typeRe.exec(src)) !== null) {
    const block = m[1];
    const textRaw = extractString(block, /text\s*=\s*({[^}]+}|"[^"]+"|'[^']+')/, "");
    const chars   = countTextChars(textRaw);
    const delay   = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const speed   = extractNumber(block, /speed\s*=\s*\{?\s*([\d.]+)/, 1);
    const finish  = delay + Math.ceil(chars / speed);
    const breathing = maxDuration - finish - FADE_TRANSITION;

    hits.push({ element: "Typewriter", type: "typewriter", delay, content: `${chars}ch÷${speed}`, finish });
    if (breathing < MIN_BREATHING) {
      issues.push({
        file, rule: "TIMING", severity: "FAIL",
        detail: `Typewriter finishes at ${finish}f, breathing ${breathing}f < ${MIN_BREATHING}f`,
        line: getLineNumber(src, m.index),
      });
    }
  }

  // ── CountUp ──
  const countRe = /<CountUp\b([^>]*(?:\n[^>]*)*)>/g;
  while ((m = countRe.exec(src)) !== null) {
    const block = m[1];
    const delay   = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const dur     = extractNumber(block, /duration\s*=\s*\{?\s*(\d+)/, 30);
    const finish  = delay + dur;
    const breathing = maxDuration - finish - FADE_TRANSITION;

    hits.push({ element: "CountUp", type: "count-up", delay, content: `dur=${dur}f`, finish });
    if (breathing < MIN_BREATHING) {
      issues.push({
        file, rule: "TIMING", severity: "FAIL",
        detail: `CountUp finishes at ${finish}f, breathing ${breathing}f < ${MIN_BREATHING}f`,
        line: getLineNumber(src, m.index),
      });
    }
  }

  return { issues, hits };
}

// ----------------------------------------------------------------
//  2. FONT SIZE AUDIT
// ----------------------------------------------------------------

function findFontSizeIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];
  const re = /fontSize\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const size = Number(m[1]);
    if (size < MIN_FONT_SIZE && size > 0) {
      issues.push({
        file, rule: "FONT-SIZE", severity: "FAIL",
        detail: `fontSize: ${size}px < minimum ${MIN_FONT_SIZE}px`,
        line: getLineNumber(src, m.index),
      });
    }
  }
  return issues;
}

// ----------------------------------------------------------------
//  3. FONT WEIGHT AUDIT
// ----------------------------------------------------------------

function findFontWeightIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];
  const re = /fontWeight\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const weight = Number(m[1]);
    if (weight > MAX_FONT_WEIGHT) {
      issues.push({
        file, rule: "FONT-WEIGHT", severity: "FAIL",
        detail: `fontWeight: ${weight} > maximum ${MAX_FONT_WEIGHT} (semi-bold). Never use bold.`,
        line: getLineNumber(src, m.index),
      });
    }
  }
  return issues;
}

// ----------------------------------------------------------------
//  4. SAFE ZONE AUDIT (padding from edges)
// ----------------------------------------------------------------

function findSafeZoneIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];

  // 检查 padding 值 — AbsoluteFill 的直接子元素应有足够内边距
  const paddingRe = /padding\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  const paddings: number[] = [];

  while ((m = paddingRe.exec(src)) !== null) {
    paddings.push(Number(m[1]));
  }

  // 如果有任何 padding < MIN_SAFE_ZONE 且场景是全屏的
  if (paddings.length > 0 && paddings.some(p => p < MIN_SAFE_ZONE)) {
    const smallest = Math.min(...paddings);
    if (smallest < MIN_SAFE_ZONE) {
      issues.push({
        file, rule: "SAFE-ZONE", severity: "WARN",
        detail: `Smallest padding: ${smallest}px < recommended ${MIN_SAFE_ZONE}px safe zone`,
      });
    }
  }

  // 检查绝对定位元素是否贴边
  const absRe = /(?:left|right|top|bottom)\s*:\s*0[^.]|inset\s*:\s*0/g;
  const absMatches = src.match(absRe) || [];
  // 排除 pointerEvents: "none" 的装饰层 (Background, FilmGrain 等)
  // 只对有 text/content 的元素报警 — 这里做宽松检测
  if (absMatches.length > 4 && !file.includes("Background")) {
    issues.push({
      file, rule: "SAFE-ZONE", severity: "WARN",
      detail: `${absMatches.length} elements positioned at edge (0px). Ensure text content has safe zone padding.`,
    });
  }

  return issues;
}

// ----------------------------------------------------------------
//  5. OBJECTFIT AUDIT (never "cover" on product screenshots)
// ----------------------------------------------------------------

function findObjectFitIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];
  const re = /objectFit\s*:\s*["']cover["']/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    issues.push({
      file, rule: "OBJECTFIT", severity: "FAIL",
      detail: `objectFit: "cover" will crop screenshots. Use "contain" instead.`,
      line: getLineNumber(src, m.index),
    });
  }
  return issues;
}

// ----------------------------------------------------------------
//  6. COLOR CONTRAST AUDIT (basic check)
// ----------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function findContrastIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];

  // 找 color + backgroundColor 组合 — 只检查最明显的情况
  // 寻找 theme.color.textMuted 用于小文字的场景
  const mutedRe = /color\s*:\s*theme\.color\.textMuted/g;
  const smallTextRe = /fontSize\s*:\s*(2[89]|30|31|32)/g; // 28-32px = small text

  const hasMuted = mutedRe.test(src);
  const hasSmallText = smallTextRe.test(src);

  if (hasMuted && hasSmallText) {
    issues.push({
      file, rule: "CONTRAST", severity: "WARN",
      detail: `textMuted color used with small text (28-32px). Verify WCAG AA contrast ratio ≥ 4.5:1.`,
    });
  }

  // 直接检查 hex color 对比 — 白文字在浅背景上
  const whiteTextOnLight = /color\s*:\s*["']#[fF]{3,6}["'][\s\S]{0,200}background(?:Color)?\s*:\s*["']#([eEfF][0-9a-fA-F]{5})["']/;
  if (whiteTextOnLight.test(src)) {
    issues.push({
      file, rule: "CONTRAST", severity: "FAIL",
      detail: `White text on light background detected. Contrast ratio likely < 4.5:1.`,
    });
  }

  return issues;
}

// ----------------------------------------------------------------
//  7. IMAGE SAFETY AUDIT
// ----------------------------------------------------------------

function findImageIssues(src: string, file: string): Issue[] {
  const issues: Issue[] = [];

  // 检查 Img 组件是否有合理的 maxHeight/maxWidth 或 contain
  const imgRe = /<Img\b[\s\S]*?\/>/g;
  let m: RegExpExecArray | null;

  while ((m = imgRe.exec(src)) !== null) {
    const block = m[0];
    const hasContain = /objectFit\s*:\s*["']contain["']/.test(block);
    const hasCover   = /objectFit\s*:\s*["']cover["']/.test(block);
    const hasMaxH    = /maxHeight/.test(block);

    if (hasCover) {
      issues.push({
        file, rule: "IMG-SAFETY", severity: "FAIL",
        detail: `<Img> with objectFit: "cover" — will crop content. Use "contain".`,
        line: getLineNumber(src, m.index),
      });
    }
    if (!hasContain && !hasCover && !hasMaxH) {
      issues.push({
        file, rule: "IMG-SAFETY", severity: "WARN",
        detail: `<Img> without objectFit or maxHeight — may overflow or crop unexpectedly.`,
        line: getLineNumber(src, m.index),
      });
    }
  }

  return issues;
}

// ----------------------------------------------------------------
//  8. BEAT PULSE HIT COUNT (time-dimension static analysis)
// ----------------------------------------------------------------
//
// Reads src/MainVideo.tsx + src/generated/beat-map.ts to estimate how many
// visual beat pulses will fire over the full composition duration. Catches:
//   - frame % N patterns that always pulse every beat (disco strobe)
//   - MEASURE_FRAMES < 30 (too dense for 30fps composition)
//   - firstBeatFrame unset when bgm.mp3 exists
//   - low-confidence beat-map (aubiotrack was skipped)
//
// This is the ONLY check that catches the "这卡点太多了吧" failure mode.
// ----------------------------------------------------------------

function findBeatPulseIssues(): Issue[] {
  const issues: Issue[] = [];

  if (!existsSync(MAIN_VIDEO_PATH)) return issues;
  const mainSrc = readFileSync(MAIN_VIDEO_PATH, "utf-8");

  // ── detect the "disco" pattern: frame % N where N < 30 (more than once per second)
  const modRe = /frame\s*%\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = modRe.exec(mainSrc)) !== null) {
    const n = Number(m[1]);
    if (n > 0 && n < 30) {
      issues.push({
        file: "MainVideo.tsx",
        rule: "BEAT-PULSE",
        severity: "FAIL",
        detail: `frame % ${n} pulses >1× per second — disco strobe. Use measureFrames-based downbeat pulse instead.`,
        line: getLineNumber(mainSrc, m.index),
      });
    }
  }

  // ── detect hardcoded BPM = 120 guess (the thing the skill explicitly bans)
  if (/BPM\s*[:=]\s*120\b|bpm\s*[:=]\s*120\b/.test(mainSrc) && !/beatMap/.test(mainSrc)) {
    issues.push({
      file: "MainVideo.tsx",
      rule: "BEAT-PULSE",
      severity: "FAIL",
      detail: `Hardcoded BPM = 120 guess without importing beatMap. Run scripts/beat-sync.ts on the real BGM.`,
    });
  }

  // ── load generated beat-map (if any) to cross-check against MainVideo pulse
  let beatMap: {
    measureFrames?: number;
    firstBeatFrame?: number;
    confidence?: string;
    source?: string;
  } | null = null;

  if (existsSync(BEAT_MAP_TS_PATH)) {
    const bmSrcFull = readFileSync(BEAT_MAP_TS_PATH, "utf-8");
    // Scope to the `export const beatMap: BeatMap = { ... }` literal only.
    // Without this scope, the regex would match the TS interface union
    // `confidence: "high" | "medium" | "low"` before ever reaching the
    // actual runtime value in the const object.
    const bodyMatch = bmSrcFull.match(/export\s+const\s+beatMap\s*[:=][^{]*\{([\s\S]*?)\};?/);
    const bmSrc = bodyMatch ? bodyMatch[1] : "";
    const pick = (key: string, asNumber = true): string | number | undefined => {
      // Numbers: `key: 123` or `key: 1.5`
      // Strings: `key: "value"` (single-token quoted literal, no unions)
      const re = asNumber
        ? new RegExp(`\\b${key}\\s*:\\s*(-?[\\d.]+)`)
        : new RegExp(`\\b${key}\\s*:\\s*"([^"\\n]+)"`);
      const hit = bmSrc.match(re);
      if (!hit) return undefined;
      const raw = hit[1].trim();
      if (asNumber) {
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      }
      return raw;
    };
    beatMap = {
      measureFrames: pick("measureFrames") as number | undefined,
      firstBeatFrame: pick("firstBeatFrame") as number | undefined,
      confidence: pick("confidence", false) as string | undefined,
      source: pick("source", false) as string | undefined,
    };
  }

  // ── low-confidence warning: beat-map exists but aubiotrack was skipped
  if (beatMap && beatMap.confidence === "low") {
    issues.push({
      file: "beat-map.ts",
      rule: "BEAT-PULSE",
      severity: "WARN",
      detail: `beat-map confidence=low (source=${beatMap.source || "?"}). Install aubiotrack and re-run scripts/beat-sync.ts — 3% tempo drift compounds across 40s.`,
    });
  }

  // ── hit-count estimation: need MEASURE_FRAMES, FIRST_BEAT, durationInFrames
  const measureFromMain = extractNumber(mainSrc, /MEASURE_FRAMES\s*=\s*([\d.]+)/, 0);
  const firstBeatFromMain = extractNumber(mainSrc, /FIRST_BEAT\s*=\s*(\d+)/, -1);
  const measureFrames = measureFromMain || beatMap?.measureFrames || 0;
  const firstBeat = firstBeatFromMain >= 0 ? firstBeatFromMain : beatMap?.firstBeatFrame ?? 0;

  // find durationInFrames in Root.tsx or composition definition
  let duration = 1200; // default 40s @ 30fps
  const rootPath = join(process.cwd(), "src", "Root.tsx");
  if (existsSync(rootPath)) {
    const rootSrc = readFileSync(rootPath, "utf-8");
    const durMatch = rootSrc.match(/durationInFrames\s*[:=][^;]*?(\d{3,5})/);
    const secMatch = rootSrc.match(/durationSeconds\s*\|\|\s*(\d+)/);
    if (durMatch) duration = Number(durMatch[1]);
    else if (secMatch) duration = Number(secMatch[1]) * 30;
  }

  if (measureFrames > 0) {
    const hits = Math.floor((duration - firstBeat) / measureFrames);
    const hitsPerSec = hits / (duration / 30);

    if (hits >= BEAT_HITS_FAIL_HIGH) {
      issues.push({
        file: "MainVideo.tsx",
        rule: "BEAT-PULSE",
        severity: "FAIL",
        detail: `${hits} pulses over ${(duration / 30).toFixed(1)}s (${hitsPerSec.toFixed(2)}/s) — DISCO STROBE territory. Increase MEASURE_FRAMES, or check you are pulsing on downbeats only (every 4 beats), not every beat.`,
      });
    } else if (hits >= BEAT_HITS_WARN_HIGH) {
      issues.push({
        file: "MainVideo.tsx",
        rule: "BEAT-PULSE",
        severity: "WARN",
        detail: `${hits} pulses over ${(duration / 30).toFixed(1)}s (${hitsPerSec.toFixed(2)}/s) — feels busy. Premium zone is 10-25 hits (downbeat-only).`,
      });
    } else if (hits > 0 && hits < BEAT_HITS_WARN_LOW) {
      issues.push({
        file: "MainVideo.tsx",
        rule: "BEAT-PULSE",
        severity: "WARN",
        detail: `${hits} pulses over ${(duration / 30).toFixed(1)}s — almost invisible. Premium zone is 10-25 hits. Check MEASURE_FRAMES is not too large.`,
      });
    }

    // If BGM exists but firstBeat=0, the pulse will fire during pre-roll silence
    if (existsSync(BGM_PATH) && firstBeat === 0 && beatMap?.source === "fallback-default") {
      issues.push({
        file: "MainVideo.tsx",
        rule: "BEAT-PULSE",
        severity: "WARN",
        detail: `bgm.mp3 exists but firstBeatFrame=0 (beat-map not generated). Run: npx tsx scripts/beat-sync.ts public/brand/bgm.mp3`,
      });
    }
  }

  return issues;
}

// ----------------------------------------------------------------
//  9. BGM SEGMENT SANITY (ffmpeg volumedetect at 5s intervals)
// ----------------------------------------------------------------
//
// Catches the loudnorm-silent-back-half encoding bug: if `-ss` is placed
// AFTER `-i` with a loudnorm filter, ffmpeg will silently produce audio
// that only has content in the first 10-15s and then flatlines at -91dB.
//
// Samples the BGM at 5s intervals, measures max_volume in each window,
// fails if any window is quieter than -40dB (hard silence).
// ----------------------------------------------------------------

function findBgmSegmentIssues(): Issue[] {
  const issues: Issue[] = [];
  if (!existsSync(BGM_PATH)) return issues;

  let duration = 0;
  try {
    const out = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${BGM_PATH}"`,
      { encoding: "utf-8" },
    ).trim();
    duration = parseFloat(out);
  } catch {
    issues.push({
      file: "bgm.mp3",
      rule: "BGM-SEGMENT",
      severity: "WARN",
      detail: `ffprobe not available — cannot sanity-check BGM segments. Install: brew install ffmpeg`,
    });
    return issues;
  }

  if (!Number.isFinite(duration) || duration < 5) {
    issues.push({
      file: "bgm.mp3",
      rule: "BGM-SEGMENT",
      severity: "FAIL",
      detail: `BGM duration is ${duration}s — too short for a 40s video.`,
    });
    return issues;
  }

  // Sample at 0, 5, 10, 15, 20, 25, 30, 35s (or until duration)
  const samples: { t: number; maxDb: number; meanDb: number }[] = [];
  for (let t = 0; t + BGM_SAMPLE_WINDOW_SEC <= Math.min(duration, 40); t += BGM_SAMPLE_INTERVAL_SEC) {
    try {
      const out = execSync(
        `ffmpeg -ss ${t} -t ${BGM_SAMPLE_WINDOW_SEC} -i "${BGM_PATH}" -af volumedetect -f null - 2>&1`,
        { encoding: "utf-8" },
      );
      const maxMatch = out.match(/max_volume:\s*(-?[\d.]+)\s*dB/);
      const meanMatch = out.match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
      samples.push({
        t,
        maxDb: maxMatch ? parseFloat(maxMatch[1]) : -99,
        meanDb: meanMatch ? parseFloat(meanMatch[1]) : -99,
      });
    } catch {
      // ignore individual sample failures
    }
  }

  if (samples.length === 0) {
    issues.push({
      file: "bgm.mp3",
      rule: "BGM-SEGMENT",
      severity: "WARN",
      detail: `Could not probe BGM with ffmpeg volumedetect.`,
    });
    return issues;
  }

  // Flag any window whose max_volume is quieter than the threshold (= silence)
  const silent = samples.filter((s) => s.maxDb < BGM_MIN_MAX_VOLUME_DB);
  if (silent.length > 0) {
    const windows = silent.map((s) => `${s.t}s(${s.maxDb.toFixed(1)}dB)`).join(", ");
    issues.push({
      file: "bgm.mp3",
      rule: "BGM-SEGMENT",
      severity: "FAIL",
      detail: `BGM has silent segments: ${windows}. This is the loudnorm+output-seek bug. Re-encode with -ss BEFORE -i (input-side seek).`,
    });
  }

  // Check if overall level is too quiet (user wanted ~ -14 dBFS)
  const loudWindows = samples.filter((s) => s.meanDb >= -25);
  if (loudWindows.length < Math.floor(samples.length * 0.7) && silent.length === 0) {
    issues.push({
      file: "bgm.mp3",
      rule: "BGM-SEGMENT",
      severity: "WARN",
      detail: `Only ${loudWindows.length}/${samples.length} sampled windows have mean_volume ≥ -25dB. BGM may sound quiet — consider loudnorm I=-14 LRA=8 TP=-1.`,
    });
  }

  return issues;
}

// ----------------------------------------------------------------
//  Runner
// ----------------------------------------------------------------

function auditFile(filepath: string): Issue[] {
  const src  = readFileSync(filepath, "utf-8");
  const file = basename(filepath);

  const { issues: timingIssues } = findTimingIssues(src, file);

  return [
    ...timingIssues,
    ...findFontSizeIssues(src, file),
    ...findFontWeightIssues(src, file),
    ...findSafeZoneIssues(src, file),
    ...findObjectFitIssues(src, file),
    ...findContrastIssues(src, file),
    ...findImageIssues(src, file),
  ];
}

// ----------------------------------------------------------------
//  Report Renderer
// ----------------------------------------------------------------

function renderReport(allIssues: Issue[]): void {
  const fails = allIssues.filter(i => i.severity === "FAIL");
  const warns = allIssues.filter(i => i.severity === "WARN");

  // ── 按文件分组 ──
  const byFile = new Map<string, Issue[]>();
  for (const issue of allIssues) {
    const arr = byFile.get(issue.file) || [];
    arr.push(issue);
    byFile.set(issue.file, arr);
  }

  for (const [file, issues] of byFile) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  ${file}`);
    console.log("=".repeat(60));

    console.log("| Rule | Severity | Line | Detail |");
    console.log("|------|----------|------|--------|");

    for (const issue of issues) {
      const line = issue.line ? `L${issue.line}` : "-";
      console.log(`| ${issue.rule} | ${issue.severity} | ${line} | ${issue.detail} |`);
    }
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY: ${fails.length} FAIL, ${warns.length} WARN across ${byFile.size} files`);

  if (fails.length > 0) {
    console.log("\nFAILURES (must fix before render):");
    for (const f of fails) {
      const line = f.line ? `:${f.line}` : "";
      console.log(`  ${f.file}${line} [${f.rule}] ${f.detail}`);
    }
  }

  console.log("=".repeat(60));
}

// ----------------------------------------------------------------
//  Main
// ----------------------------------------------------------------

function main(): void {
  const dirs = [SCENES_DIR, COMPONENTS_DIR];
  const files: string[] = [];

  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir)
        .filter(f => f.endsWith(".tsx"))
        .map(f => join(dir, f));
      files.push(...entries);
    } catch {
      // 目录不存在则跳过
    }
  }

  if (files.length === 0) {
    console.error("ERROR: No .tsx files found in src/scenes/ or src/components/");
    console.error("Run this script from your Remotion project root.");
    process.exit(2);
  }

  console.log(`VISUAL AUDIT — scanning ${files.length} files\n`);

  const allIssues: Issue[] = [];

  for (const f of files.sort()) {
    const issues = auditFile(f);
    allIssues.push(...issues);
  }

  // ── Project-level time-dimension checks ──
  allIssues.push(...findBeatPulseIssues());
  allIssues.push(...findBgmSegmentIssues());

  renderReport(allIssues);

  const fails = allIssues.filter(i => i.severity === "FAIL");
  if (fails.length > 0) {
    console.log(`\nRESULT: FAIL — ${fails.length} blocking issue(s). Fix before rendering.`);
    process.exit(1);
  } else {
    console.log(`\nRESULT: PASS — no blocking issues found.`);
    process.exit(0);
  }
}

main();
