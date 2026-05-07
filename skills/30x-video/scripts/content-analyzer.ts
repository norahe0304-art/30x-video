/**
 * [INPUT]: User brief (free-form text), optional jobspec fields
 * [OUTPUT]: ContentIntent (subject / mood / tone / format / length / brand)
 * [POS]: scripts/ pipeline 第 [1] 步; brief → 结构化意图
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Content Analyzer
//
//  This module is INTENDED to be invoked by an LLM agent. It exposes:
//  1. A structured prompt template the agent fills out
//  2. A Zod schema for validation
//  3. A heuristic fallback for simple briefs (regex-based)
//
//  In Claude Code: agent reads brief → fills schema → returns JSON
//  In CLI mode: heuristic extracts what it can, leaves rest blank
// ================================================================

import { ContentIntentSchema, type ContentIntent } from "./types.ts";

// ----------------------------------------------------------------
//  Prompt template for LLM agents
// ----------------------------------------------------------------

export const CONTENT_ANALYZER_PROMPT = `
You are the Content Analyzer for 30x-video.

Read the user's brief and extract structured intent. Return JSON matching
this schema:

{
  "subject": string,                    // what the video is about (1-3 word phrase)
  "moodTags": string[],                 // 2-5 adjectives describing the desired feel
  "audience": string | undefined,       // who watches this (if specified)
  "lengthHintSec": number | undefined,  // explicit duration if mentioned
  "formatHint": "16:9" | "9:16" | "1:1" | "4:5" | undefined,
  "tone": "educational" | "hot-take" | "inspirational" | "witty"
        | "vulnerable" | "authoritative" | "playful" | "serious",
  "brand": string | undefined,          // brand name if explicit (e.g. "Stripe")
  "brandUrl": string | undefined,       // brand URL if explicit (e.g. "acmecorp.io")
  "contentAssets": string[] | undefined,
  "platform": string | undefined        // TikTok / Instagram / LinkedIn / YouTube etc.
}

Rules:
- Extract only what is in the brief; do not invent.
- For tone, infer from word choice and topic.
- For format/length: if "social" or "TikTok" mentioned → 9:16, default 15s.
  If "ad" → default 16:9 30s. If "launch" → 16:9 40s.
- moodTags should be specific (e.g. "warm", "minimalist", "luxurious"),
  not generic ("nice", "good").
- If brief is too vague to fill required fields (subject, tone), set them
  but include a 'clarificationNeeded' field listing what to ask user.
`.trim();

// ----------------------------------------------------------------
//  Heuristic fallback (no LLM, useful for testing)
// ----------------------------------------------------------------

export function analyzeContentHeuristic(brief: string): ContentIntent {
  const lower = brief.toLowerCase();

  // length hint
  let lengthHintSec: number | undefined;
  const lenMatch = brief.match(/(\d+)\s*(?:s|sec|second)/i);
  if (lenMatch) lengthHintSec = parseInt(lenMatch[1], 10);

  // format hint
  let formatHint: ContentIntent["formatHint"];
  if (/\b(tiktok|reels?|shorts?|vertical)\b/.test(lower)) formatHint = "9:16";
  else if (/\b(square)\b/.test(lower)) formatHint = "1:1";
  else if (/\b(linkedin|instagram\s+feed)\b/.test(lower)) formatHint = "4:5";
  else if (/\b(horizontal|youtube|landscape|16.9)\b/.test(lower)) formatHint = "16:9";

  // platform
  let platform: string | undefined;
  for (const p of ["tiktok", "instagram", "youtube", "linkedin", "twitter", "x.com"]) {
    if (lower.includes(p)) {
      platform = p;
      break;
    }
  }

  // brand detection (very light — proper brand extraction is LLM territory)
  let brand: string | undefined;
  const forMatch = brief.match(/\bfor\s+([A-Z][a-zA-Z]+)/);
  if (forMatch) brand = forMatch[1];

  // tone — keyword-based
  let tone: ContentIntent["tone"] = "inspirational";
  if (/\b(how to|tutorial|explain|teach|learn)\b/.test(lower)) tone = "educational";
  else if (/\b(hot take|controversial|opinion)\b/.test(lower)) tone = "hot-take";
  else if (/\b(funny|witty|joke|playful)\b/.test(lower)) tone = "witty";
  else if (/\b(serious|enterprise|professional)\b/.test(lower)) tone = "serious";
  else if (/\b(vulnerable|honest|personal)\b/.test(lower)) tone = "vulnerable";

  // mood tags — extract adjectives heuristically
  const adjectives = [
    "warm",
    "minimalist",
    "luxurious",
    "playful",
    "serious",
    "modern",
    "calm",
    "energetic",
    "bold",
    "elegant",
    "casual",
    "premium",
  ];
  const moodTags = adjectives.filter((adj) => lower.includes(adj));
  if (moodTags.length === 0) moodTags.push("modern", "balanced");

  // subject — naive: take first noun phrase after "about" or use brief itself
  const aboutMatch = brief.match(/about\s+(.+?)(?:[.,!?]|$)/i);
  const subject = aboutMatch?.[1]?.trim() ?? brief.slice(0, 50);

  return {
    subject,
    moodTags,
    audience: undefined,
    lengthHintSec,
    formatHint,
    tone,
    brand,
    platform,
  };
}

export function validateContentIntent(input: unknown): ContentIntent {
  return ContentIntentSchema.parse(input);
}

// ----------------------------------------------------------------
//  CLI entry
// ----------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const brief = process.argv.slice(2).join(" ");
  if (!brief) {
    console.error("Usage: tsx content-analyzer.ts <brief>");
    process.exit(1);
  }
  const intent = analyzeContentHeuristic(brief);
  console.log(JSON.stringify(intent, null, 2));
}
