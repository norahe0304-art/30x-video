/**
 * [INPUT]: ContentIntent + DesignProfile from Style Hunter
 * [OUTPUT]: StyleComposition (5-dim picks: visual / pacing / bgm / vo / format)
 * [POS]: scripts/ pipeline 第 [3] 步; 决定视频风格组合
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  5-dim Style Composer
//
//  Picks ONE option per dimension based on content intent + design
//  profile. Uses heuristics aligned with style-dimensions.md.
// ================================================================

import type {
  BgmArchetype,
  ContentIntent,
  DesignProfile,
  Format,
  Pacing,
  StyleComposition,
  VisualStyle,
  VoArchetype,
} from "./types.ts";

export function composeStyle(
  intent: ContentIntent,
  profile: DesignProfile
): StyleComposition {
  const format = pickFormat(intent);
  const visual = pickVisualStyle(intent, profile);
  const pacing = pickPacing(intent, format);
  const duration = pickDuration(intent, pacing, format);
  const bgm = pickBgm(intent, profile, pacing);
  const vo = pickVo(intent, visual, pacing);

  const rationale = [
    `Format ${format}: ${formatRationale(intent, format)}`,
    `Visual ${visual}: ${visualRationale(intent, profile, visual)}`,
    `Pacing ${pacing}: ${pacingRationale(intent, pacing)}`,
    `BGM ${bgm}: ${bgmRationale(intent, profile, bgm)}`,
    `VO ${vo}: ${voRationale(intent, vo)}`,
    `Duration ${duration}s`,
  ];

  return { visual, pacing, bgm, vo, format, durationSeconds: duration, rationale };
}

// ----------------------------------------------------------------
//  Format
// ----------------------------------------------------------------

function pickFormat(intent: ContentIntent): Format {
  if (intent.formatHint) return intent.formatHint;
  const platform = intent.platform?.toLowerCase() ?? "";
  if (/\b(tiktok|reels|shorts)\b/.test(platform)) return "9:16";
  if (/\blinkedin\b/.test(platform)) return "1:1";
  if (/\b(instagram\s*feed)\b/.test(platform)) return "4:5";
  if (/\bsocial\b/.test(intent.subject.toLowerCase())) return "9:16";
  return "16:9";
}

function formatRationale(intent: ContentIntent, format: Format): string {
  if (intent.formatHint) return "explicit user hint";
  if (intent.platform) return `inferred from platform "${intent.platform}"`;
  return "default for general video";
}

// ----------------------------------------------------------------
//  Visual style
// ----------------------------------------------------------------

function pickVisualStyle(
  intent: ContentIntent,
  profile: DesignProfile
): VisualStyle {
  const subject = intent.subject.toLowerCase();
  const tags = intent.moodTags.map((t) => t.toLowerCase());

  // explicit signals first
  if (/\b(dashboard|product|feature|demo|saas)\b/.test(subject)) return "product-ui-mockup";
  if (/\b(data|metric|stat|year in|wrapped|recap)\b/.test(subject)) return "data-viz-driven";
  if (/\b(launch|reveal|brand film|premium|hardware)\b/.test(subject)) return "cinematic-luxury";
  if (/\b(comparison|vs|before|after|difference)\b/.test(subject)) return "comparison-split";
  if (/\b(quote|manifesto|principle|hot take|opinion)\b/.test(subject)) return "typography-statement";

  // archetype hints
  if (profile.archetype === "Financial Precision") return "cinematic-luxury";
  if (profile.archetype === "Infra Authority") return "product-ui-mockup";
  if (profile.archetype === "Editorial Minimalism") return "typography-statement";
  if (profile.archetype === "Productive Warmth") return "lifestyle-shot";
  if (profile.archetype === "System Clarity") return "product-ui-mockup";

  // mood tags
  if (tags.some((t) => /luxur|premium|elegant|cinematic/.test(t))) return "cinematic-luxury";
  if (tags.some((t) => /warm|cozy|lifestyle/.test(t))) return "lifestyle-shot";
  if (tags.some((t) => /bold|statement|manifesto/.test(t))) return "typography-statement";

  return "typography-statement";
}

function visualRationale(
  intent: ContentIntent,
  profile: DesignProfile,
  visual: VisualStyle
): string {
  return `archetype=${profile.archetype}, subject hints, mood=${intent.moodTags.join("/")}`;
}

// ----------------------------------------------------------------
//  Pacing
// ----------------------------------------------------------------

function pickPacing(intent: ContentIntent, format: Format): Pacing {
  if (intent.lengthHintSec !== undefined) {
    if (intent.lengthHintSec >= 35) return "slow-luxury";
    if (intent.lengthHintSec >= 20) return "medium-narrative";
    if (intent.lengthHintSec >= 10) return "quick-hook";
    return "tiktok-flash";
  }
  if (format === "9:16") return "quick-hook";
  if (intent.tone === "authoritative" || intent.tone === "serious") return "slow-luxury";
  return "medium-narrative";
}

function pacingRationale(intent: ContentIntent, pacing: Pacing): string {
  if (intent.lengthHintSec) return `derived from length hint ${intent.lengthHintSec}s`;
  return `tone=${intent.tone}, format-driven`;
}

// ----------------------------------------------------------------
//  Duration
// ----------------------------------------------------------------

function pickDuration(intent: ContentIntent, pacing: Pacing, format: Format): number {
  if (intent.lengthHintSec) return intent.lengthHintSec;
  switch (pacing) {
    case "slow-luxury":
      return 40;
    case "medium-narrative":
      return format === "9:16" ? 25 : 30;
    case "quick-hook":
      return format === "9:16" ? 15 : 20;
    case "tiktok-flash":
      return 10;
  }
}

// ----------------------------------------------------------------
//  BGM
// ----------------------------------------------------------------

function pickBgm(
  intent: ContentIntent,
  profile: DesignProfile,
  pacing: Pacing
): BgmArchetype {
  if (profile.archetype === "Financial Precision") return "minimalist-ambient";
  if (profile.archetype === "Editorial Minimalism") return "minimalist-ambient";
  if (profile.archetype === "Productive Warmth") return "lo-fi-warm";
  if (profile.archetype === "Infra Authority") return "techno-driving";

  if (pacing === "slow-luxury") return "cinematic-orchestral";
  if (pacing === "tiktok-flash") return "hip-hop-confident";
  if (pacing === "quick-hook") return "hip-hop-confident";

  // mood overrides
  const tags = intent.moodTags.map((t) => t.toLowerCase());
  if (tags.some((t) => /calm|minimal|quiet/.test(t))) return "minimalist-ambient";
  if (tags.some((t) => /warm|cozy/.test(t))) return "lo-fi-warm";
  if (tags.some((t) => /bold|powerful|cinematic/.test(t))) return "cinematic-orchestral";

  return "minimalist-ambient";
}

function bgmRationale(intent: ContentIntent, profile: DesignProfile, bgm: BgmArchetype): string {
  return `archetype=${profile.archetype}, pacing-aligned`;
}

// ----------------------------------------------------------------
//  VO
// ----------------------------------------------------------------

function pickVo(
  intent: ContentIntent,
  visual: VisualStyle,
  pacing: Pacing
): VoArchetype {
  if (visual === "typography-statement" && pacing !== "slow-luxury") return "none";
  if (intent.tone === "educational") return "conversational-host";
  if (intent.tone === "authoritative" || intent.tone === "serious")
    return "authoritative-narrator";
  if (intent.tone === "witty" || intent.tone === "playful") return "character-voice";
  if (intent.tone === "vulnerable") return "conversational-host";
  return "conversational-host";
}

function voRationale(intent: ContentIntent, vo: VoArchetype): string {
  return `tone=${intent.tone}`;
}

// ----------------------------------------------------------------
//  CLI entry
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const briefArg = process.argv.slice(2).join(" ") ?? "warm minimalist morning routine social";
  // Build a stub intent + profile for CLI testing
  const intent: ContentIntent = {
    subject: briefArg,
    moodTags: ["warm", "minimalist"],
    tone: "inspirational",
  };
  const profile: DesignProfile = {
    source: "creator-default",
    fonts: { heading: "Inter", body: "Inter" },
    density: "balanced",
    motionMood: "measured",
    archetype: "Editorial Minimalism",
    visualReferences: [],
    notes: ["CLI test stub"],
  };
  console.log(JSON.stringify(composeStyle(intent, profile), null, 2));
}
