/**
 * [INPUT]: BrandReport evidence package from url-to-video V2
 * [OUTPUT]: Design archetype inference, story intent draft, and scene-constitution object
 * [POS]: scripts/ 的本质层生成器; 把证据转成 mode-aware 叙事宪法
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  URL-TO-VIDEO V2 — Scene Constitution Generator
// ================================================================

import {
  EDITORIAL_KEYWORDS,
  PRODUCT_KEYWORDS,
  keywordHits,
  type BrandReport,
  type VideoMode,
} from "./evidence-model.ts";

export type DesignArchetype =
  | "Financial Precision"
  | "System Clarity"
  | "Editorial Minimalism"
  | "Infra Authority"
  | "Productive Warmth";

export interface ArchetypeSelection {
  primary: DesignArchetype;
  secondary?: DesignArchetype;
  rationale: string[];
}

export interface PacingProfile {
  durationSeconds: number;
  style: "measured" | "kinetic" | "editorial";
  notes: string[];
  targetActs: Record<string, number>;
}

export interface SceneDefinition {
  id: string;
  act: number;
  label: string;
  purpose: string;
  visualSource: string[];
  copyPayload: string[];
  motionTemperament: string;
  evidenceDependency: string[];
  failureFallback: string;
}

export interface SceneConstitution {
  sourceUrl: string;
  generatedAt: string;
  mode: VideoMode;
  archetype: ArchetypeSelection;
  storyIntentDraft: string;
  pacingProfile: PacingProfile;
  sceneList: SceneDefinition[];
}

// 关键词列表和 keywordHits 统一从 evidence-model.ts 导入

export function inferDesignArchetype(report: BrandReport): ArchetypeSelection {
  const haystack = [
    report.brandName,
    report.textTruth.title,
    report.textTruth.headline,
    report.textTruth.subheadline,
    ...report.textTruth.featureNames,
    ...report.structureTruth.notes,
  ]
    .join(" ")
    .toLowerCase();

  const productHits = keywordHits(haystack, PRODUCT_KEYWORDS);
  const editorialHits = keywordHits(haystack, EDITORIAL_KEYWORDS);
  const financeHits = keywordHits(haystack, ["payments", "finance", "banking", "billing", "treasury"]);
  const designHits = keywordHits(haystack, ["design", "collaboration", "workspace", "productivity", "editor"]);
  const infraHits = keywordHits(haystack, ["infra", "security", "cloud", "data", "observability", "developer"]);

  const rationale: string[] = [];

  if (report.structureTruth.productType === "fintech" || financeHits >= 2) {
    rationale.push("Brand language signals trust-sensitive financial product behavior.");
    return {
      primary: "Financial Precision",
      secondary: infraHits > 0 ? "Infra Authority" : undefined,
      rationale,
    };
  }

  if (
    infraHits >= 2
    || report.structureTruth.productType === "developer-platform"
  ) {
    rationale.push("Evidence points to developer, data, infra, or security credibility.");
    return {
      primary: "Infra Authority",
      secondary: designHits > 0 ? "System Clarity" : undefined,
      rationale,
    };
  }

  if (designHits >= 2) {
    rationale.push("UI/system density and workspace language suggest product/system clarity.");
    return {
      primary: "System Clarity",
      secondary: productHits > 0 ? "Productive Warmth" : undefined,
      rationale,
    };
  }

  if (report.suggestedMode === "editorial" && editorialHits >= 1) {
    rationale.push("Brand signal is visual/editorial before it is product-operational.");
    return {
      primary: "Editorial Minimalism",
      secondary: report.score.brandDistinctiveness >= 65 ? "Productive Warmth" : undefined,
      rationale,
    };
  }

  if (report.score.brandDistinctiveness >= 60 && report.score.screenshotCompleteness >= 45) {
    rationale.push("Distinct brand surface with usable visual proof supports warm branded storytelling.");
    return {
      primary: "Productive Warmth",
      secondary: report.suggestedMode === "editorial" ? "Editorial Minimalism" : "System Clarity",
      rationale,
    };
  }

  rationale.push("Defaulting to system clarity because the brand evidence is product-adjacent but not highly specific.");
  return {
    primary: "System Clarity",
    secondary: report.suggestedMode === "editorial" ? "Editorial Minimalism" : undefined,
    rationale,
  };
}

function buildPacingProfile(mode: VideoMode, report: BrandReport): PacingProfile {
  if (mode === "product-evidence") {
    return {
      durationSeconds: 40,
      style: report.score.videoUsefulness >= 55 ? "kinetic" : "measured",
      notes: [
        "Let product reality lead the rhythm.",
        "Reserve fastest motion for reveal/showcase handoffs.",
        "Proof act should feel calmer than feature montage.",
      ],
      targetActs: {
        authority: 5,
        reveal: 6,
        showcase: 14,
        proof: 8,
        close: 7,
      },
    };
  }

  if (mode === "editorial") {
    return {
      durationSeconds: 35,
      style: "editorial",
      notes: [
        "Use slower reveals and fewer simultaneous elements.",
        "Typography and crop discipline should do most of the work.",
        "Do not fake product interaction if evidence is weak.",
      ],
      targetActs: {
        "mood-establish": 6,
        "brand-claim": 7,
        "motif-expansion": 10,
        "trust-proof": 6,
        close: 6,
      },
    };
  }

  return {
    durationSeconds: 25,
    style: "measured",
    notes: [
      "Evidence is too weak for a credible auto-build.",
      "Generate only a gap report and a minimal editorial holding pattern.",
    ],
    targetActs: {
      gaps: 25,
    },
  };
}

function buildProductScenes(report: BrandReport): SceneDefinition[] {
  const fallback = "Fallback to screenshot-first framing and freeze UI motion into controlled parallax.";
  return [
    {
      id: "authority",
      act: 1,
      label: "Authority",
      purpose: "Establish the brand's category authority and serious tone in under five seconds.",
      visualSource: ["homepage-screenshot", "logo"],
      copyPayload: [report.textTruth.headline || report.textTruth.title, report.textTruth.subheadline].filter(Boolean),
      motionTemperament: "Measured camera move, restrained typography reveal, no gimmick particles.",
      evidenceDependency: ["homepage screenshot", "logo"],
      failureFallback: fallback,
    },
    {
      id: "reveal",
      act: 2,
      label: "Reveal",
      purpose: "Turn abstract promise into visible product reality.",
      visualSource: ["product-screenshot", "video", "hero-image"],
      copyPayload: report.textTruth.featureNames.slice(0, 2),
      motionTemperament: "Clip-led reveal if video exists; otherwise hard-framed product crop with editorial wipes.",
      evidenceDependency: ["product screenshot or demo clip"],
      failureFallback: "Use hero image and primary CTA while suppressing UI-claim language.",
    },
    {
      id: "showcase",
      act: 3,
      label: "Showcase",
      purpose: "Explain the operating model through 2-3 evidence-backed product moments.",
      visualSource: ["video", "product-screenshot", "proof-image"],
      copyPayload: report.textTruth.featureNames.slice(0, 4),
      motionTemperament: "Sequence rhythm follows product logic, not random montage energy.",
      evidenceDependency: ["at least two evidence-backed features"],
      failureFallback: "Reduce to two vignettes and reuse strongest product screenshot with alternate crops.",
    },
    {
      id: "proof",
      act: 4,
      label: "Proof",
      purpose: "Make trust visible through metrics, customer proof, compliance, or density of real product evidence.",
      visualSource: ["proof-image", "homepage-screenshot", "product-screenshot"],
      copyPayload: report.structureTruth.notes.slice(0, 3),
      motionTemperament: "Calmer pace, crisp counters, no hype motion.",
      evidenceDependency: ["proof-rich section or product detail"],
      failureFallback: "Use customer logos, metrics, or CTA sections from the homepage if product proof is weak.",
    },
    {
      id: "close",
      act: 5,
      label: "Close",
      purpose: "Resolve the narrative with one clear action and one memorable brand lockup.",
      visualSource: ["logo", "homepage-screenshot"],
      copyPayload: [...report.textTruth.cta.slice(0, 1), report.textTruth.title].filter(Boolean),
      motionTemperament: "Minimal motion, premium hold, strong contrast finish.",
      evidenceDependency: ["logo", "primary CTA"],
      failureFallback: "Use wordmark or favicon lockup with a simplified CTA plate.",
    },
  ];
}

function buildEditorialScenes(report: BrandReport): SceneDefinition[] {
  return [
    {
      id: "mood-establish",
      act: 1,
      label: "Mood Establish",
      purpose: "Introduce the brand world before making product claims.",
      visualSource: ["homepage-screenshot", "hero-image", "logo"],
      copyPayload: [report.textTruth.title, report.textTruth.headline].filter(Boolean),
      motionTemperament: "Slow editorial crop, subtle type entrance, atmosphere over density.",
      evidenceDependency: ["hero or homepage image"],
      failureFallback: "Fall back to logo and title only, with a neutral motion bed.",
    },
    {
      id: "brand-claim",
      act: 2,
      label: "Brand Claim",
      purpose: "State the brand promise with disciplined copy and hierarchy.",
      visualSource: ["homepage-screenshot", "proof-image"],
      copyPayload: [report.textTruth.subheadline, ...report.textTruth.cta.slice(0, 1)].filter(Boolean),
      motionTemperament: "Typography-first. No fake UI interaction.",
      evidenceDependency: ["headline or subheadline evidence"],
      failureFallback: "Use a distilled claim from title + category instead of fabricated copy.",
    },
    {
      id: "motif-expansion",
      act: 3,
      label: "Visual Motif Expansion",
      purpose: "Deepen the brand surface through recurring visual motifs, crops, and supportive artifacts.",
      visualSource: ["hero-image", "proof-image", "homepage-screenshot"],
      copyPayload: report.textTruth.featureNames.slice(0, 3),
      motionTemperament: "Layered editorial cuts, scale shifts, restrained texture motion.",
      evidenceDependency: ["multiple visual references"],
      failureFallback: "Reuse strongest hero image with alternate crops and type rhythm changes.",
    },
    {
      id: "trust-proof",
      act: 4,
      label: "Trust / Proof",
      purpose: "Anchor the piece in proof instead of pure mood.",
      visualSource: ["proof-image", "homepage-screenshot"],
      copyPayload: report.structureTruth.notes.slice(0, 2),
      motionTemperament: "Quiet proof cards or stat plates with generous breathing room.",
      evidenceDependency: ["metrics, customer logos, trust content, or clear CTA context"],
      failureFallback: "Use screenshot crops of trust sections or replace with category trust language from the site.",
    },
    {
      id: "close",
      act: 5,
      label: "Close",
      purpose: "Deliver one brand-true lockup that leaves room for manual polish.",
      visualSource: ["logo", "homepage-screenshot"],
      copyPayload: [...report.textTruth.cta.slice(0, 1), report.textTruth.title].filter(Boolean),
      motionTemperament: "Strong hold, simple brand plate, no extra effects.",
      evidenceDependency: ["logo or wordmark"],
      failureFallback: "Close on favicon-derived mark plus URL if no wordmark exists.",
    },
  ];
}

export function buildStoryIntentDraft(report: BrandReport, archetype: ArchetypeSelection): string {
  const headline = report.textTruth.headline || report.textTruth.title || report.brandName;

  if (report.suggestedMode === "product-evidence") {
    return `Show ${report.brandName} as a credible ${report.structureTruth.productType} system: lead with ${headline}, prove it with real interface evidence, and close with one decisive action in a ${archetype.primary} tone.`;
  }

  if (report.suggestedMode === "editorial") {
    return `Treat ${report.brandName} as a brand world first and a product second: let the visual surface, copy hierarchy, and trust cues carry the film in a ${archetype.primary} register.`;
  }

  return `Evidence is weak. Build a minimal editorial holding pattern for ${report.brandName}, surface the missing proof, and avoid any fabricated product story.`;
}

export function buildSceneConstitution(report: BrandReport): SceneConstitution {
  const archetype = inferDesignArchetype(report);
  const storyIntentDraft = buildStoryIntentDraft(report, archetype);
  const pacingProfile = buildPacingProfile(report.suggestedMode, report);
  const sceneList =
    report.suggestedMode === "product-evidence"
      ? buildProductScenes(report)
      : report.suggestedMode === "editorial"
        ? buildEditorialScenes(report)
        : [
            {
              id: "gaps",
              act: 1,
              label: "Gap Report",
              purpose: "Stop before fiction and explain what evidence is missing.",
              visualSource: ["homepage-screenshot"],
              copyPayload: report.risks,
              motionTemperament: "Static editorial board with concise warnings.",
              evidenceDependency: ["at least one traceable screenshot"],
              failureFallback: "Emit report only; do not generate a fake first cut.",
            },
          ];

  return {
    sourceUrl: report.sourceUrl,
    generatedAt: report.generatedAt,
    mode: report.suggestedMode,
    archetype,
    storyIntentDraft,
    pacingProfile,
    sceneList,
  };
}
