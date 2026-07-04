/**
 * [INPUT]: src/scenes/*.tsx files in the current working directory
 * [OUTPUT]: Markdown timing audit table per scene, exit code 0/1
 * [POS]: Standalone CLI script for Remotion video timing validation
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  TIMING AUDIT — Remotion Scene Animation Validator
//  Run: npx tsx scripts/timing-audit.ts
// ================================================================

import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

// ----------------------------------------------------------------
//  Types
// ----------------------------------------------------------------

interface AnimationHit {
  element: string;
  type: string;
  delay: number;
  content: string;
  finish: number;
}

interface SceneAudit {
  file: string;
  duration: number;
  animations: AnimationHit[];
}

// ----------------------------------------------------------------
//  Constants
// ----------------------------------------------------------------

const FADE_TRANSITION = 15;
const MIN_BREATHING = 45;
const SCENES_DIR = join(process.cwd(), "src", "scenes");

// ----------------------------------------------------------------
//  Regex Extractors
// ----------------------------------------------------------------

function extractNumber(src: string, pattern: RegExp, fallback: number): number {
  const m = src.match(pattern);
  return m ? Number(m[1]) : fallback;
}

function extractString(src: string, pattern: RegExp, fallback: string): string {
  const m = src.match(pattern);
  return m ? m[1] : fallback;
}

// Count chars in a text prop — handles {`...`} and "..." and {'...'}
function countTextChars(raw: string): number {
  const cleaned = raw
    .replace(/^\{[`'"]/,  "")
    .replace(/[`'"]\}$/,  "")
    .replace(/^["']/,     "")
    .replace(/["']$/,     "");
  return cleaned.length;
}

// ----------------------------------------------------------------
//  Animation Detectors
// ----------------------------------------------------------------

function findSplitText(src: string): AnimationHit[] {
  const hits: AnimationHit[] = [];
  const re = /<SplitText\b([^>]*(?:\n[^>]*)*)>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const block = m[1];
    const textRaw = extractString(block, /text\s*=\s*({[^}]+}|"[^"]+"|'[^']+')/, "");
    const chars   = countTextChars(textRaw);
    const delay   = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const stagger = extractNumber(block, /staggerFrames\s*=\s*\{?\s*(\d+)/, 3);
    const finish  = delay + chars * stagger;

    hits.push({
      element: "SplitText",
      type: "split-char",
      delay,
      content: `${chars} chars, stagger=${stagger}`,
      finish,
    });
  }
  return hits;
}

function findTypewriter(src: string): AnimationHit[] {
  const hits: AnimationHit[] = [];
  const re = /<Typewriter\b([^>]*(?:\n[^>]*)*)>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const block = m[1];
    const textRaw = extractString(block, /text\s*=\s*({[^}]+}|"[^"]+"|'[^']+')/, "");
    const chars   = countTextChars(textRaw);
    const delay   = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const speed   = extractNumber(block, /speed\s*=\s*\{?\s*([\d.]+)/, 1);
    const finish  = delay + Math.ceil(chars / speed);

    hits.push({
      element: "Typewriter",
      type: "typewriter",
      delay,
      content: `${chars} chars, speed=${speed}`,
      finish,
    });
  }
  return hits;
}

function findSpringStagger(src: string): AnimationHit[] {
  const hits: AnimationHit[] = [];

  // Pattern: array.map with index-based delay, e.g. delay={i * 8}
  const mapRe = /(\w+)\.map\(\s*\(\s*\w+\s*,\s*(\w+)\s*\)[\s\S]*?delay\s*=\s*\{\s*\2\s*\*\s*(\d+)/g;
  let m: RegExpExecArray | null;

  while ((m = mapRe.exec(src)) !== null) {
    const arrayName = m[1];
    const stagger   = Number(m[3]);

    // Try to find array length from const declaration
    const lenRe = new RegExp(`const\\s+${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\]`);
    const lenM  = src.match(lenRe);
    let count   = 6; // sensible fallback
    if (lenM) {
      // Count commas + 1 for rough item count
      count = (lenM[1].match(/,/g) || []).length + 1;
    }

    const baseDelay = extractNumber(
      src.slice(Math.max(0, m.index - 200), m.index + m[0].length + 200),
      /baseDelay\s*[:=]\s*(\d+)/,
      0
    );
    const finish = baseDelay + (count - 1) * stagger + 30; // +30 for spring settle

    hits.push({
      element: `${arrayName}.map stagger`,
      type: "spring-stagger",
      delay: baseDelay,
      content: `${count} items, gap=${stagger}f`,
      finish,
    });
  }
  return hits;
}

function findCountUp(src: string): AnimationHit[] {
  const hits: AnimationHit[] = [];
  const re = /<CountUp\b([^>]*(?:\n[^>]*)*)>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const block  = m[1];
    const delay  = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const dur    = extractNumber(block, /duration\s*=\s*\{?\s*(\d+)/, 30);
    const finish = delay + dur;

    hits.push({
      element: "CountUp",
      type: "count-up",
      delay,
      content: `duration=${dur}f`,
      finish,
    });
  }
  return hits;
}

function findFadeIn(src: string): AnimationHit[] {
  const hits: AnimationHit[] = [];
  const re = /<FadeIn\b([^>]*(?:\n[^>]*)*)>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const block  = m[1];
    const delay  = extractNumber(block, /delay\s*=\s*\{?\s*(\d+)/, 0);
    const dur    = extractNumber(block, /duration\s*=\s*\{?\s*(\d+)/, 15);
    const finish = delay + dur;

    hits.push({
      element: "FadeIn",
      type: "fade-in",
      delay,
      content: `duration=${dur}f`,
      finish,
    });
  }
  return hits;
}

// ----------------------------------------------------------------
//  Scene Duration Extractor
// ----------------------------------------------------------------

function extractSceneDuration(src: string, filename: string): number {
  // Check for durationInFrames on Sequence/AbsoluteFill/Component
  const durationRe = /durationInFrames\s*[:=]\s*\{?\s*(\d+)/g;
  let best = 0;
  let m: RegExpExecArray | null;
  while ((m = durationRe.exec(src)) !== null) {
    const v = Number(m[1]);
    if (v > best) best = v;
  }

  // Also check for exported constant like SCENE_DURATION
  const constRe = /(?:DURATION|SCENE_DURATION|sceneDuration)\s*[:=]\s*(\d+)/i;
  const cm = src.match(constRe);
  if (cm && Number(cm[1]) > best) best = Number(cm[1]);

  if (best === 0) {
    console.warn(`  [WARN] Could not determine duration for ${filename}, skipping`);
  }
  return best;
}

// ----------------------------------------------------------------
//  Audit Runner
// ----------------------------------------------------------------

function auditScene(filepath: string): SceneAudit | null {
  const src  = readFileSync(filepath, "utf-8");
  const file = basename(filepath);
  const duration = extractSceneDuration(src, file);

  if (duration === 0) return null;

  const animations = [
    ...findSplitText(src),
    ...findTypewriter(src),
    ...findSpringStagger(src),
    ...findCountUp(src),
    ...findFadeIn(src),
  ];

  return { file, duration, animations };
}

// ----------------------------------------------------------------
//  Table Renderer
// ----------------------------------------------------------------

function renderTable(audit: SceneAudit): { output: string; hasFail: boolean } {
  let hasFail = false;
  const lines: string[] = [];

  lines.push("");
  lines.push(`TIMING AUDIT -- ${audit.file} (durationInFrames: ${audit.duration}f)`);
  lines.push("| Element | Type | delay | content | finish | breathing | Status |");
  lines.push("|---------|------|-------|---------|--------|-----------|--------|");

  if (audit.animations.length === 0) {
    lines.push("| (none)  | -    | -     | -       | -      | -         | SKIP   |");
  }

  for (const a of audit.animations) {
    const breathing = audit.duration - a.finish - FADE_TRANSITION;
    const pass      = breathing >= MIN_BREATHING;
    if (!pass) hasFail = true;

    const status = pass ? "PASS" : "**FAIL**";
    lines.push(
      `| ${a.element} | ${a.type} | ${a.delay}f | ${a.content} | ${a.finish}f | ${breathing}f | ${status} |`
    );
  }

  return { output: lines.join("\n"), hasFail };
}

// ----------------------------------------------------------------
//  Main
// ----------------------------------------------------------------

function main(): void {
  let files: string[];
  try {
    files = readdirSync(SCENES_DIR)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => join(SCENES_DIR, f))
      .sort();
  } catch {
    console.error(`ERROR: Cannot read ${SCENES_DIR}`);
    console.error("Run this script from your Remotion project root.");
    process.exit(2);
  }

  if (files.length === 0) {
    console.error(`ERROR: No .tsx files found in ${SCENES_DIR}`);
    process.exit(2);
  }

  console.log(`Scanning ${files.length} scene files in src/scenes/\n`);

  let anyFail = false;

  for (const f of files) {
    const audit = auditScene(f);
    if (!audit) continue;

    const { output, hasFail } = renderTable(audit);
    console.log(output);

    if (hasFail) anyFail = true;
  }

  console.log("\n" + "=".repeat(60));
  if (anyFail) {
    console.log("RESULT: FAIL — some animations overflow their scenes");
    process.exit(1);
  } else {
    console.log("RESULT: PASS — all animations have >= 45f breathing room");
    process.exit(0);
  }
}

main();
