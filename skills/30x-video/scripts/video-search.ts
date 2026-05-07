/**
 * [INPUT]: StyleComposition (5-dim picks)
 * [OUTPUT]: 2-3 video library entries that best exemplify the picks
 * [POS]: scripts/ 局部辅助; 在 INDEX.json 里按 5 维标签搜索参考视频
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Video Library Search
//
//  Reads references/video-library/INDEX.json and returns videos
//  matching the chosen 5-dim composition. Used by the orchestrator
//  to populate the Confirmation Gate plan with reference examples.
// ================================================================

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type {
  StyleComposition,
  VideoLibrary,
  VideoLibraryEntry,
} from "./types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INDEX_PATH = join(__dirname, "..", "references", "video-library", "INDEX.json");

let cachedLibrary: VideoLibrary | null = null;

function loadLibrary(): VideoLibrary {
  if (cachedLibrary) return cachedLibrary;
  const raw = readFileSync(INDEX_PATH, "utf-8");
  cachedLibrary = JSON.parse(raw) as VideoLibrary;
  return cachedLibrary;
}

// ----------------------------------------------------------------
//  Score: how well does an entry match the composition?
// ----------------------------------------------------------------

function scoreMatch(entry: VideoLibraryEntry, comp: StyleComposition): number {
  let score = 0;
  if (entry.tags.visual === comp.visual) score += 4;
  if (entry.tags.pacing === comp.pacing) score += 3;
  if (entry.tags.bgm === comp.bgm) score += 2;
  if (entry.tags.vo === comp.vo) score += 1;
  if (entry.tags.format === comp.format) score += 2;
  // tier bonus (S > A > B)
  if (entry.tier === "S") score += 1.5;
  else if (entry.tier === "A") score += 1;
  return score;
}

export function findReferenceVideos(
  comp: StyleComposition,
  limit = 3
): VideoLibraryEntry[] {
  const library = loadLibrary();
  const scored = library.videos
    .map((entry) => ({ entry, score: scoreMatch(entry, comp) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.entry);
}

// Diversity-boosted version: avoid all-same-brand picks
export function findDiverseReferenceVideos(
  comp: StyleComposition,
  limit = 3
): VideoLibraryEntry[] {
  const library = loadLibrary();
  const scored = library.videos
    .map((entry) => ({ entry, score: scoreMatch(entry, comp) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: VideoLibraryEntry[] = [];
  const seenBrands = new Set<string>();
  for (const { entry } of scored) {
    if (picked.length >= limit) break;
    if (seenBrands.has(entry.brand)) continue;
    picked.push(entry);
    seenBrands.add(entry.brand);
  }
  // if we can't fill with brand diversity, fall back to top-N
  while (picked.length < limit && scored.length > picked.length) {
    const next = scored[picked.length].entry;
    if (!picked.find((p) => p.id === next.id)) picked.push(next);
  }
  return picked;
}

// ----------------------------------------------------------------
//  CLI entry
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const visual = (process.argv[2] ?? "typography-statement") as StyleComposition["visual"];
  const pacing = (process.argv[3] ?? "medium-narrative") as StyleComposition["pacing"];
  const bgm = (process.argv[4] ?? "minimalist-ambient") as StyleComposition["bgm"];
  const vo = (process.argv[5] ?? "conversational-host") as StyleComposition["vo"];
  const format = (process.argv[6] ?? "9:16") as StyleComposition["format"];
  const stub: StyleComposition = {
    visual,
    pacing,
    bgm,
    vo,
    format,
    durationSeconds: 15,
    rationale: ["CLI stub"],
  };
  console.log(JSON.stringify(findDiverseReferenceVideos(stub, 3), null, 2));
}
