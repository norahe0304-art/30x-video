/**
 * [INPUT]: URL intake harvest output, local brand assets, heuristic evidence scores
 * [OUTPUT]: Shared V2 evidence/report types plus score normalization helpers
 * [POS]: scripts/ 的证据模型底座; 给 url-to-video、scene constitution、project blueprint 共用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  URL-TO-VIDEO V2 — Shared Evidence Model
//  Keep this file dependency-light: Node built-ins only upstream.
// ================================================================

export type EvidenceLevel = "high" | "medium" | "low";
export type VideoMode = "product-evidence" | "editorial" | "insufficient-evidence";
export type AssetStatus = "downloaded" | "referenced" | "missing" | "pending";
export type AssetKind =
  | "logo"
  | "wordmark"
  | "homepage-screenshot"
  | "product-screenshot"
  | "hero-image"
  | "video"
  | "bgm"
  | "font-proof"
  | "proof-image"
  | "app-store-screenshot";

export interface TextTruth {
  title: string;
  headline: string;
  subheadline: string;
  cta: string[];
  featureNames: string[];
}

export interface DesignTruth {
  colors: string[];
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamilies: string[];
  radiusMood: "tight" | "balanced" | "soft";
  densityMood: "compact" | "balanced" | "airy";
  motionMood: "precise" | "measured" | "expressive";
}

export interface StructureTruth {
  productType:
    | "app"
    | "marketplace"
    | "developer-platform"
    | "fintech"
    | "consumer-brand"
    | "service-brand"
    | "content-brand"
    | "unknown";
  productClarity: "high" | "medium" | "low";
  uiPresence: "strong" | "medium" | "light";
  proofStyle: "metrics" | "customers" | "editorial" | "mixed" | "unknown";
  notes: string[];
}

export interface BrandAssetProof {
  logo: AssetRecord | null;
  wordmark: AssetRecord | null;
  fonts: string[];
}

export interface ScreenshotProof {
  homepage: AssetRecord | null;
  product: AssetRecord | null;
  hero: AssetRecord | null;
  supporting: AssetRecord[];
}

export interface VideoProof {
  primary: AssetRecord | null;
  candidates: AssetRecord[];
  attempted: boolean;
}

export interface AssetRecord {
  kind: AssetKind;
  label: string;
  sourceUrl?: string;
  localPath?: string;
  source:
    | "official-site"
    | "same-origin-css"
    | "same-origin-media"
    | "traceable-embed"
    | "existing-brand-dir"
    | "manual"
    | "not-found";
  status: AssetStatus;
  notes?: string;
}

export interface EvidenceDimensions {
  screenshotCompleteness: number;
  videoUsefulness: number;
  logoQuality: number;
  fontCertainty: number;
  productClarity: number;
  proofRichness: number;
  brandDistinctiveness: number;
}

export interface EvidenceScore extends EvidenceDimensions {
  overall: number;
  level: EvidenceLevel;
  rationale: string[];
}

// productCategory governs which scaffold MainVideo template gets cloned.
// productType (in StructureTruth) is text-keyword inferred and used for
// narrative archetype. productCategory is asset/url-shape inferred and
// used for scene FORM (phone frame vs desktop frame vs hardware shot).
// They are deliberately separate axes.
export type ProductCategory =
  | "mobile-app"     // iOS/Android app — phone frame mockups, 9:16 screens
  | "saas-desktop"   // web SaaS dashboard — browser frame, desktop UI mockups
  | "hardware"       // physical product — product render rotations
  | "marketplace"    // multi-sided platform — listing grids, transaction flows
  | "content-media"  // editorial / publishing — typography-led, image-led
  | "developer-tool" // CLI, SDK, infra — terminal + code editor mockups
  | "unknown";

export interface ProductCategorySignal {
  category: ProductCategory;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

export interface BrandReport {
  sourceUrl: string;
  generatedAt: string;
  brandName: string;
  textTruth: TextTruth;
  designTruth: DesignTruth;
  structureTruth: StructureTruth;
  productCategory: ProductCategorySignal;
  screenshotProof: ScreenshotProof;
  videoProof: VideoProof;
  brandAssetProof: BrandAssetProof;
  score: EvidenceScore;
  suggestedMode: VideoMode;
  risks: string[];
  harvestActions: string[];
}

export interface AssetManifest {
  sourceUrl: string;
  generatedAt: string;
  requiredAssets: AssetKind[];
  assets: AssetRecord[];
  gaps: string[];
}

// ----------------------------------------------------------------
//  共用关键词表 — 单一真相源，url-to-video 和 scene-constitution 都从这里读
// ----------------------------------------------------------------

export const PRODUCT_KEYWORDS = [
  "dashboard", "platform", "editor", "workflow", "automation",
  "api", "developer", "deploy", "code", "assistant", "ai",
  "payments", "billing", "analytics", "monitoring", "security",
  "data", "agent", "copilot", "cloud", "infra",
] as const;

export const PROOF_KEYWORDS = [
  "trusted by", "enterprise", "customers", "security", "compliance",
  "uptime", "teams", "million", "billion", "case study", "benchmark",
] as const;

export const EDITORIAL_KEYWORDS = [
  "craft", "luxury", "studio", "fashion", "collection",
  "experience", "story", "world", "hospitality", "travel",
] as const;

export function keywordHits(source: string, keywords: readonly string[]): number {
  return keywords.reduce((count, kw) => (source.includes(kw) ? count + 1 : count), 0);
}

// ----------------------------------------------------------------
//  评分权重 — screenshotCompleteness 权重最高因为无截图 = 无可信度
// ----------------------------------------------------------------

const DIMENSION_WEIGHTS: Record<keyof EvidenceDimensions, number> = {
  screenshotCompleteness: 0.24,
  videoUsefulness: 0.12,
  logoQuality: 0.12,
  fontCertainty: 0.10,
  productClarity: 0.18,
  proofRichness: 0.12,
  brandDistinctiveness: 0.12,
};

export function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evidenceLevelFromScore(score: number): EvidenceLevel {
  if (score >= 75) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

export function computeEvidenceScore(
  dimensions: EvidenceDimensions,
  rationale: string[],
): EvidenceScore {
  const normalized = {
    screenshotCompleteness: clampScore(dimensions.screenshotCompleteness),
    videoUsefulness: clampScore(dimensions.videoUsefulness),
    logoQuality: clampScore(dimensions.logoQuality),
    fontCertainty: clampScore(dimensions.fontCertainty),
    productClarity: clampScore(dimensions.productClarity),
    proofRichness: clampScore(dimensions.proofRichness),
    brandDistinctiveness: clampScore(dimensions.brandDistinctiveness),
  };

  const weighted = Object.entries(normalized).reduce((sum, [key, value]) => {
    const weight = DIMENSION_WEIGHTS[key as keyof EvidenceDimensions];
    return sum + value * weight;
  }, 0);

  const overall = clampScore(weighted);
  return {
    ...normalized,
    overall,
    level: evidenceLevelFromScore(overall),
    rationale,
  };
}

export function detectModeFromReport(
  report: Pick<BrandReport, "score" | "structureTruth" | "screenshotProof">,
): VideoMode {
  const { score, structureTruth, screenshotProof } = report;

  const strongProductSignal =
    (structureTruth.uiPresence === "strong" || Boolean(screenshotProof.product)) &&
    (structureTruth.productClarity !== "low" || Boolean(screenshotProof.product)) &&
    score.screenshotCompleteness >= 65;

  if (strongProductSignal && (score.videoUsefulness >= 40 || score.productClarity >= 70)) {
    return "product-evidence";
  }

  if (Boolean(screenshotProof.product) && score.screenshotCompleteness >= 70) {
    return "product-evidence";
  }

  const strongEditorialSignal =
    score.screenshotCompleteness >= 40 &&
    score.brandDistinctiveness >= 40;

  if (strongEditorialSignal) {
    return "editorial";
  }

  return "insufficient-evidence";
}

export function collectManifestAssets(report: BrandReport): AssetRecord[] {
  const assets: AssetRecord[] = [];

  const maybePush = (record: AssetRecord | null): void => {
    if (record) {
      assets.push(record);
    }
  };

  maybePush(report.brandAssetProof.logo);
  maybePush(report.brandAssetProof.wordmark);
  maybePush(report.screenshotProof.homepage);
  maybePush(report.screenshotProof.product);
  maybePush(report.screenshotProof.hero);
  maybePush(report.videoProof.primary);
  assets.push(...report.screenshotProof.supporting);
  assets.push(...report.videoProof.candidates);

  return assets;
}

export function dedupeStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

export function buildGapList(report: BrandReport): string[] {
  const gaps: string[] = [];

  if (!report.screenshotProof.homepage) {
    gaps.push("Missing homepage screenshot proof.");
  }
  if (!report.screenshotProof.product && !report.screenshotProof.hero) {
    gaps.push("Missing strong product or hero visual proof.");
  }
  if (!report.videoProof.primary) {
    gaps.push("No usable product video found; first cut will stay screenshot-first or editorial.");
  }
  if (!report.brandAssetProof.logo) {
    gaps.push("Missing logo or wordmark asset.");
  }
  if (report.score.fontCertainty < 35) {
    gaps.push("Font certainty is weak; typography should be reviewed manually.");
  }

  return gaps;
}
