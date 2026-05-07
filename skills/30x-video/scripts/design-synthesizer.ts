/**
 * [INPUT]: Refero screens (5-10) + their metadata
 * [OUTPUT]: Synthesized DesignProfile (lightweight design tokens)
 * [POS]: scripts/ 设计合成层; 把 Refero 屏幕变成 agent 可消费的 token 集
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Design Synthesizer
//
//  Refero MCP returns screens + metadata, NOT a DESIGN.md file.
//  This module extracts a lightweight design profile from those
//  screens by analyzing:
//    - font frequencies (most common = primary font)
//    - ui_elements (suggests density)
//    - ux_patterns (suggests motion temperament)
//    - site_categories (suggests archetype)
//
//  Color extraction would require fetching actual image data and
//  pixel sampling. For v1 we leave colors as TBD (can be enhanced
//  later via vision-LLM analysis or pixel sampling of thumbnail_url).
// ================================================================

import type { DesignProfile, ReferoScreen } from "./types.ts";

interface SynthesizeOptions {
  source: DesignProfile["source"];
  brand?: string;
  screens: ReferoScreen[];
}

export function synthesizeDesignProfile(opts: SynthesizeOptions): DesignProfile {
  const { source, brand, screens } = opts;

  if (screens.length === 0) {
    throw new Error("synthesizeDesignProfile requires at least 1 screen");
  }

  // ----- font extraction -----
  const fontCounts = new Map<string, number>();
  for (const s of screens) {
    for (const f of s.fonts) {
      fontCounts.set(f, (fontCounts.get(f) ?? 0) + 1);
    }
  }
  const sortedFonts = Array.from(fontCounts.entries()).sort((a, b) => b[1] - a[1]);
  const headingFont = sortedFonts[0]?.[0] ?? "Inter";
  const bodyFont = sortedFonts[1]?.[0] ?? sortedFonts[0]?.[0] ?? "Inter";
  const monoFont = sortedFonts.find(([name]) => /mono|code/i.test(name))?.[0];

  // ----- archetype inference -----
  const archetype = inferArchetype(screens);

  // ----- density inference -----
  const density = inferDensity(screens);

  // ----- motion mood inference -----
  const motionMood = inferMotionMood(screens);

  return {
    source,
    brand,
    primaryColor: undefined, // TODO: sample from thumbnail_url pixel data
    accentColor: undefined,
    backgroundColor: undefined,
    textColor: undefined,
    fonts: { heading: headingFont, body: bodyFont, mono: monoFont },
    density,
    motionMood,
    archetype,
    visualReferences: screens.slice(0, 50),
    notes: [
      `Synthesized from ${screens.length} Refero screens`,
      `Top fonts: ${sortedFonts.slice(0, 3).map(([n, c]) => `${n}(${c})`).join(", ")}`,
      `Source mode: ${source}`,
    ],
  };
}

// ----------------------------------------------------------------
//  Archetype inference (by site_categories + ux_patterns)
// ----------------------------------------------------------------

function inferArchetype(screens: ReferoScreen[]): DesignProfile["archetype"] {
  const cats = screens.flatMap((s) => s.site_categories.map((c) => c.toLowerCase()));
  const patterns = screens.flatMap((s) => s.ux_patterns.map((p) => p.toLowerCase()));

  const has = (xs: string[], needles: string[]) =>
    needles.some((n) => xs.some((x) => x.includes(n)));

  if (has(cats, ["fintech", "finance", "payment", "banking", "crypto"])) {
    return "Financial Precision";
  }
  if (has(cats, ["data", "analytics", "infrastructure", "developer", "api", "security"])) {
    return "Infra Authority";
  }
  if (has(cats, ["productivity", "collaboration", "knowledge", "team"])) {
    return "Productive Warmth";
  }
  if (has(patterns, ["editorial", "blog", "documentation", "long-form"])) {
    return "Editorial Minimalism";
  }
  // default for product-led B2B
  return "System Clarity";
}

// ----------------------------------------------------------------
//  Density inference (by ui_elements per screen)
// ----------------------------------------------------------------

function inferDensity(screens: ReferoScreen[]): DesignProfile["density"] {
  const avgElements =
    screens.reduce((sum, s) => sum + s.ui_elements.length, 0) / screens.length;
  if (avgElements > 12) return "compact";
  if (avgElements < 6) return "airy";
  return "balanced";
}

// ----------------------------------------------------------------
//  Motion mood inference (by ux_patterns hints)
// ----------------------------------------------------------------

function inferMotionMood(screens: ReferoScreen[]): DesignProfile["motionMood"] {
  const patterns = screens.flatMap((s) => s.ux_patterns.map((p) => p.toLowerCase()));
  const has = (needles: string[]) => needles.some((n) => patterns.some((p) => p.includes(n)));

  if (has(["animation", "transition", "motion", "interactive"])) return "expressive";
  if (has(["dashboard", "table", "data", "report"])) return "precise";
  return "measured";
}
