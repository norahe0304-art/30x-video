/**
 * [INPUT]: scaffold placeholder defaults, overwritten by URL intake V2 generation
 * [OUTPUT]: brandReport, sceneConstitution, assetManifest placeholder constants
 * [POS]: scaffold/src/generated 的默认占位 seam，保证模板在未生成品牌数据前也能独立运行
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const brandReport = {
  sourceUrl: "https://example.com",
  generatedAt: "1970-01-01T00:00:00.000Z",
  brandName: "Example Brand",
  textTruth: {
    title: "Example Brand",
    headline: "One URL should become a premium first cut.",
    subheadline: "This placeholder keeps the scaffold renderable until the orchestrator writes real evidence.",
    cta: ["Review the generated evidence before polishing."],
    featureNames: ["Evidence-first storytelling", "Editable scene constitution", "Remotion-ready output"],
  },
  designTruth: {
    colors: ["#0A0A0C", "#5FA8FF", "#7BE3C5"],
    primaryColor: "#5FA8FF",
    accentColor: "#7BE3C5",
    backgroundColor: "#0A0A0C",
    textColor: "#F8FAFC",
    fontFamilies: ["Outfit", "JetBrains Mono"],
    radiusMood: "balanced",
    densityMood: "balanced",
    motionMood: "measured",
  },
  structureTruth: {
    productType: "app",
    productClarity: "medium",
    uiPresence: "medium",
    proofStyle: "mixed",
    notes: ["Replace this placeholder with real proof emitted by URL intake V2."],
  },
  screenshotProof: {
    homepage: null,
    product: null,
    hero: null,
    supporting: [],
  },
  videoProof: {
    primary: null,
    candidates: [],
    attempted: false,
  },
  brandAssetProof: {
    logo: null,
    wordmark: null,
    fonts: ["Outfit", "JetBrains Mono"],
  },
  score: {
    screenshotCompleteness: 0,
    videoUsefulness: 0,
    logoQuality: 0,
    fontCertainty: 0,
    productClarity: 40,
    proofRichness: 0,
    brandDistinctiveness: 0,
    overall: 20,
    level: "low",
    rationale: ["Placeholder data only; run URL intake before trusting this project."],
  },
  suggestedMode: "product-evidence",
  risks: ["Placeholder mode only; generated evidence has not been written yet."],
  harvestActions: ["Scaffold placeholder data active."],
} as const;

export const sceneConstitution = {
  sourceUrl: "https://example.com",
  generatedAt: "1970-01-01T00:00:00.000Z",
  mode: "product-evidence",
  archetype: {
    primary: "System Clarity",
    rationale: ["Placeholder archetype until URL intake emits real evidence."],
  },
  storyIntentDraft: "Turn one URL into an editable first cut, then replace this placeholder with real brand evidence.",
  pacingProfile: {
    durationSeconds: 40,
    style: "measured",
    notes: ["Placeholder constitution only."],
    targetActs: {
      authority: 5,
      reveal: 6,
      showcase: 14,
      proof: 8,
      close: 7,
    },
  },
  sceneList: [
    {
      id: "authority",
      act: 1,
      label: "Authority",
      purpose: "Explain what this generated project is supposed to do.",
      visualSource: ["homepage-screenshot", "logo"],
      copyPayload: ["Example Brand", "Evidence-first first cut"],
      motionTemperament: "Measured placeholder reveal.",
      evidenceDependency: ["homepage screenshot", "logo"],
      failureFallback: "Stay abstract until the orchestrator overwrites this seam.",
    },
    {
      id: "reveal",
      act: 2,
      label: "Reveal",
      purpose: "Show where product proof will appear after generation.",
      visualSource: ["product-screenshot", "hero-image"],
      copyPayload: ["Generated evidence lands in src/generated/project-data.ts"],
      motionTemperament: "Controlled placeholder reveal.",
      evidenceDependency: ["product screenshot or hero image"],
      failureFallback: "Use copy only.",
    },
    {
      id: "showcase",
      act: 3,
      label: "Showcase",
      purpose: "Reserve the long middle act for real product motion or editorial crops.",
      visualSource: ["product-screenshot", "video"],
      copyPayload: ["Scene constitution will drive the final structure."],
      motionTemperament: "Placeholder showcase rhythm.",
      evidenceDependency: ["scene constitution"],
      failureFallback: "Use a single strongest screenshot crop.",
    },
    {
      id: "proof",
      act: 4,
      label: "Proof",
      purpose: "Surface evidence score and gaps instead of fabricating proof.",
      visualSource: ["proof-image", "homepage-screenshot"],
      copyPayload: ["No fabricated proof.", "Review evidence before polish."],
      motionTemperament: "Calmer proof plate.",
      evidenceDependency: ["evidence score"],
      failureFallback: "Show the review note only.",
    },
    {
      id: "close",
      act: 5,
      label: "Close",
      purpose: "End on a simple lockup and a clear editing handoff.",
      visualSource: ["logo", "homepage-screenshot"],
      copyPayload: ["Polish in Remotion after intake."],
      motionTemperament: "Minimal premium hold.",
      evidenceDependency: ["brand lockup"],
      failureFallback: "End on headline only.",
    },
  ],
} as const;

export const assetManifest = {
  sourceUrl: "https://example.com",
  generatedAt: "1970-01-01T00:00:00.000Z",
  requiredAssets: ["homepage-screenshot", "logo"],
  assets: [],
  gaps: ["Run URL intake V2 to populate real assets."],
} as const;
