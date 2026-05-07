/**
 * [INPUT]: Used by all scripts in scripts/
 * [OUTPUT]: Shared TypeScript interfaces for the 9-step pipeline
 * [POS]: scripts/ 类型层底座; 所有模块共用契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Shared Types — used across the entire pipeline
// ================================================================

import { z } from "zod";

// ----------------------------------------------------------------
//  [1] Content Analyzer output
// ----------------------------------------------------------------

export const VideoToneSchema = z.enum([
  "educational",
  "hot-take",
  "inspirational",
  "witty",
  "vulnerable",
  "authoritative",
  "playful",
  "serious",
]);
export type VideoTone = z.infer<typeof VideoToneSchema>;

export const ContentIntentSchema = z.object({
  subject: z.string(),
  moodTags: z.array(z.string()),
  audience: z.string().optional(),
  lengthHintSec: z.number().optional(),
  formatHint: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
  tone: VideoToneSchema,
  brand: z.string().optional(),
  brandUrl: z.string().optional(),
  contentAssets: z.array(z.string()).optional(),
  platform: z.string().optional(),
});
export type ContentIntent = z.infer<typeof ContentIntentSchema>;

// ----------------------------------------------------------------
//  [2] Refero MCP types (mirrors refero_search_screens response)
// ----------------------------------------------------------------

export interface ReferoScreen {
  screen_id: number;
  platform: string;
  site_name: string;
  site_categories: string[];
  description: string;
  page_types: string[];
  ux_patterns: string[];
  ui_elements: string[];
  fonts: string[];
  thumbnail_url: string;
  url: string;
}

export interface ReferoScreenDetail extends ReferoScreen {
  site: { name: string; categories: string[]; tagline: string };
  content: { description: string; layout: string; functions: string };
  image?: string;
  similar_screens: Array<{
    screen_id: number;
    site_name: string;
    description: string;
  }>;
}

// ----------------------------------------------------------------
//  [2] Style Hunter output — synthesized design profile
// ----------------------------------------------------------------

export interface DesignProfile {
  source: "refero-brand" | "refero-vibe" | "creator-default" | "user-assets";
  brand?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fonts: { heading: string; body: string; mono?: string };
  density: "compact" | "balanced" | "airy";
  motionMood: "precise" | "measured" | "expressive";
  archetype:
    | "Financial Precision"
    | "System Clarity"
    | "Editorial Minimalism"
    | "Infra Authority"
    | "Productive Warmth";
  visualReferences: ReferoScreen[];
  notes: string[];
}

// ----------------------------------------------------------------
//  [3] 5-dim Style Composer output
// ----------------------------------------------------------------

export const VisualStyleSchema = z.enum([
  "product-ui-mockup",
  "cinematic-luxury",
  "data-viz-driven",
  "lifestyle-shot",
  "typography-statement",
  "comparison-split",
  "before-after",
]);
export type VisualStyle = z.infer<typeof VisualStyleSchema>;

export const PacingSchema = z.enum([
  "slow-luxury",
  "medium-narrative",
  "quick-hook",
  "tiktok-flash",
]);
export type Pacing = z.infer<typeof PacingSchema>;

export const BgmArchetypeSchema = z.enum([
  "minimalist-ambient",
  "techno-driving",
  "cinematic-orchestral",
  "hip-hop-confident",
  "lo-fi-warm",
  "silence-with-sfx",
  "speech-only",
]);
export type BgmArchetype = z.infer<typeof BgmArchetypeSchema>;

export const VoArchetypeSchema = z.enum([
  "none",
  "conversational-host",
  "authoritative-narrator",
  "character-voice",
  "multi-speaker",
]);
export type VoArchetype = z.infer<typeof VoArchetypeSchema>;

export const FormatSchema = z.enum(["16:9", "9:16", "1:1", "4:5"]);
export type Format = z.infer<typeof FormatSchema>;

export interface StyleComposition {
  visual: VisualStyle;
  pacing: Pacing;
  bgm: BgmArchetype;
  vo: VoArchetype;
  format: Format;
  durationSeconds: number;
  rationale: string[];
}

// ----------------------------------------------------------------
//  Video library types
// ----------------------------------------------------------------

export interface VideoLibraryEntry {
  id: string;
  tier: "S" | "A" | "B";
  title: string;
  brand: string;
  year: number;
  duration_seconds: number;
  format: Format;
  youtube_search: string;
  tags: {
    visual: VisualStyle;
    pacing: Pacing;
    bgm: BgmArchetype;
    vo: VoArchetype;
    format: Format;
  };
  exemplary_for: string;
  study_segment?: string;
  notes?: string;
}

export interface VideoLibrary {
  version: string;
  last_updated: string;
  schema_version: string;
  tiers: Record<string, string>;
  videos: VideoLibraryEntry[];
}

// ----------------------------------------------------------------
//  [4] Script generator output
// ----------------------------------------------------------------

export interface SceneSpec {
  index: number;
  durationSeconds: number;
  visual: string;
  onScreenText?: string;
  voLine?: string;
  bgmBeat?: string;
  transition?: string;
}

export interface VideoScript {
  scenes: SceneSpec[];
  totalVoSeconds: number;
  totalBgmSeconds: number;
}

// ----------------------------------------------------------------
//  [5] Asset Producer outputs
// ----------------------------------------------------------------

export interface VoAsset {
  path: string;
  durationSeconds: number;
  provider: "kokoro"; // single provider via hyperframes-media
  voice: string;
  wpm: number;
}

export interface BgmAsset {
  path: string;
  durationSeconds: number;
  bpm: number;
  firstBeatSec: number;
  source: string;
  archetype: BgmArchetype;
}

// ----------------------------------------------------------------
//  Confirmation Gate — locked decision set
// ----------------------------------------------------------------

export interface ConfirmedPlan {
  intent: ContentIntent;
  designProfile: DesignProfile;
  composition: StyleComposition;
  references: VideoLibraryEntry[];
  questions: string[];
  defaults: string[];
  lockedAt: string; // ISO timestamp
}

// ----------------------------------------------------------------
//  Final output manifest
// ----------------------------------------------------------------

export interface DeliveryManifest {
  jobId: string;
  startedAt: string;
  completedAt: string;
  brief: string;
  plan: ConfirmedPlan;
  assets: {
    video: string;
    videoNoVo?: string;
    videoBgmOnly?: string;
    vo?: VoAsset;
    bgm: BgmAsset;
  };
  finishGateResult: {
    passed: boolean;
    iterations: number;
    notes: string[];
  };
}
