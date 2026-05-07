/**
 * [INPUT]: ContentIntent from Content Analyzer
 * [OUTPUT]: DesignProfile + visual references
 * [POS]: scripts/ pipeline 第 [2] 步; 编排 Refero search + design synthesis
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Style Hunter — 3-mode dispatcher
//
//  Mode A: explicit brand → search by brand name → synthesize profile
//  Mode B: vibe / aesthetic → search by query → top brand → synthesize
//  Mode C: pure content → archetype-based default → search editorial
// ================================================================

import { searchScreens, aggregateByBrand, getScreen } from "./refero-search.ts";
import { synthesizeDesignProfile } from "./design-synthesizer.ts";
import type {
  ContentIntent,
  DesignProfile,
  ReferoScreen,
} from "./types.ts";

export interface StyleHuntResult {
  profile: DesignProfile;
  candidatesConsidered: { brand: string; hitCount: number }[];
  modeUsed: "A-explicit" | "B-vibe" | "C-creator";
}

export async function styleHunt(intent: ContentIntent): Promise<StyleHuntResult> {
  // ---- Mode A: explicit brand ----
  if (intent.brand) {
    return modeA(intent);
  }

  // ---- Mode B: vibe / aesthetic search ----
  const screens = await modeBSearch(intent);
  if (screens.length > 0) {
    return modeB(intent, screens);
  }

  // ---- Mode C: creator / no-brand fallback ----
  return modeC(intent);
}

// ----------------------------------------------------------------
//  Mode A: explicit brand
// ----------------------------------------------------------------

async function modeA(intent: ContentIntent): Promise<StyleHuntResult> {
  const result = await searchScreens({
    query: intent.brand!,
    limit: 20,
  });
  if (result.records.length === 0) {
    // brand not found in Refero → fall back to mode C
    return modeC(intent);
  }
  const screens = result.records.filter(
    (s) => s.site_name.toLowerCase() === intent.brand!.toLowerCase()
  );
  const screensToUse = screens.length > 0 ? screens : result.records.slice(0, 10);
  const profile = synthesizeDesignProfile({
    source: "refero-brand",
    brand: intent.brand,
    screens: screensToUse,
  });
  return {
    profile,
    candidatesConsidered: [
      { brand: intent.brand!, hitCount: screensToUse.length },
    ],
    modeUsed: "A-explicit",
  };
}

// ----------------------------------------------------------------
//  Mode B: vibe / aesthetic search
// ----------------------------------------------------------------

async function modeBSearch(intent: ContentIntent): Promise<ReferoScreen[]> {
  const query = [intent.subject, ...intent.moodTags].join(" ");
  const result = await searchScreens({ query, limit: 20 });
  return result.records;
}

async function modeB(
  intent: ContentIntent,
  screens: ReferoScreen[]
): Promise<StyleHuntResult> {
  const brands = aggregateByBrand(screens);
  if (brands.length === 0) {
    return modeC(intent);
  }
  // pick top brand
  const top = brands[0];
  const brandScreens = screens.filter((s) => s.site_name === top.brand);
  const profile = synthesizeDesignProfile({
    source: "refero-vibe",
    brand: top.brand,
    screens: brandScreens.length > 0 ? brandScreens : screens.slice(0, 10),
  });
  return {
    profile,
    candidatesConsidered: brands.slice(0, 5).map((b) => ({
      brand: b.brand,
      hitCount: b.hitCount,
    })),
    modeUsed: "B-vibe",
  };
}

// ----------------------------------------------------------------
//  Mode C: creator / no-brand fallback
// ----------------------------------------------------------------

async function modeC(intent: ContentIntent): Promise<StyleHuntResult> {
  // Pick a generic-but-tasteful query based on tone
  const fallbackQuery = pickCreatorQuery(intent);
  const result = await searchScreens({ query: fallbackQuery, limit: 15 });

  if (result.records.length === 0) {
    // Refero returned nothing — emit minimal default profile
    return {
      profile: {
        source: "creator-default",
        fonts: { heading: "Inter", body: "Inter" },
        density: "balanced",
        motionMood: "measured",
        archetype: "Editorial Minimalism",
        visualReferences: [],
        notes: [
          "No Refero results for fallback query",
          `Tone: ${intent.tone}`,
          "Using minimal default profile — agent should ask user for visual hints",
        ],
      },
      candidatesConsidered: [],
      modeUsed: "C-creator",
    };
  }

  const profile = synthesizeDesignProfile({
    source: "creator-default",
    screens: result.records.slice(0, 10),
  });
  return {
    profile,
    candidatesConsidered: aggregateByBrand(result.records)
      .slice(0, 5)
      .map((b) => ({ brand: b.brand, hitCount: b.hitCount })),
    modeUsed: "C-creator",
  };
}

function pickCreatorQuery(intent: ContentIntent): string {
  const toneToQuery: Record<string, string> = {
    educational: "editorial blog documentation reading",
    "hot-take": "personal blog opinion bold typography",
    inspirational: "manifesto editorial typography statement",
    witty: "playful brand creator personality",
    vulnerable: "personal essay editorial warm",
    authoritative: "professional report financial precision",
    playful: "consumer playful colorful brand",
    serious: "enterprise serious credibility",
  };
  return (
    toneToQuery[intent.tone] ?? "editorial minimalist personal blog"
  );
}

// ----------------------------------------------------------------
//  CLI entry (optional — for standalone testing)
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const briefArg = process.argv[2] ?? "make a video about morning routines";
  const mockIntent: ContentIntent = {
    subject: briefArg,
    moodTags: ["warm", "minimalist"],
    tone: "inspirational",
  };
  styleHunt(mockIntent)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("Style Hunt failed:", err.message);
      process.exit(1);
    });
}
