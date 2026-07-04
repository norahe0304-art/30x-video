/**
 * [INPUT]: scaffold/ template, BrandReport, SceneConstitution, AssetManifest, output path
 * [OUTPUT]: Ready-to-edit Remotion first-cut project with root manifests, story/review docs, and generated data files
 * [POS]: scripts/ 的输出装配器; 把 intake 结果压成团队可编辑工程目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  URL-TO-VIDEO V2 — Project Blueprint Writer
// ================================================================

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import type { AssetManifest, BrandReport } from "./evidence-model.ts";
import type { SceneConstitution } from "./scene-constitution.ts";

interface BlueprintOptions {
  skillDir: string;
  outputDir: string;
  projectName: string;
  force?: boolean;
}

function ensureDir(pathname: string): void {
  mkdirSync(pathname, { recursive: true });
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return [17, 17, 20];
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function mix(color: string, other: string, ratio: number): string {
  const [r1, g1, b1] = parseHex(color);
  const [r2, g2, b2] = parseHex(other);
  const blend = (a: number, b: number): number => a + (b - a) * ratio;
  return toHex([blend(r1, r2), blend(g1, g2), blend(b1, b2)] as [number, number, number]);
}

function rgba(color: string, alpha: number): string {
  const [r, g, b] = parseHex(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function copyScaffoldProject(options: BlueprintOptions): void {
  const scaffoldDir = resolve(options.skillDir, "scaffold");
  const outputDir = resolve(options.outputDir);
  const excludedNames = new Set(["node_modules", "build", "renders", "dist", "package-lock.json"]);

  if (!existsSync(scaffoldDir)) {
    throw new Error(`Scaffold directory not found: ${scaffoldDir}`);
  }

  if (existsSync(outputDir)) {
    if (!options.force) {
      throw new Error(`Output directory already exists: ${outputDir}. Pass --force to replace it.`);
    }
    rmSync(outputDir, { recursive: true, force: true });
  }

  cpSync(scaffoldDir, outputDir, {
    recursive: true,
    filter: (sourcePath) => {
      const name = sourcePath.split("/").pop() || "";
      return !excludedNames.has(name);
    },
  });

  const packageJsonPath = join(outputDir, "package.json");
  const packageJson = readFileSync(packageJsonPath, "utf-8").replace("{{PROJECT_NAME}}", options.projectName);
  writeFileSync(packageJsonPath, packageJson);

  ensureDir(join(outputDir, "public", "brand"));
  ensureDir(join(outputDir, "src", "generated"));

  // ----------------------------------------------------------------
  //  Self-contained scripts: copy the QA scripts into the generated
  //  project so `npx tsx scripts/visual-audit.ts` works locally
  //  after the skill moves on. Without this, a user who cd's into
  //  the generated project has no way to re-run beat-sync or audit.
  // ----------------------------------------------------------------
  const scriptsTargetDir = join(outputDir, "scripts");
  ensureDir(scriptsTargetDir);
  const scriptsSourceDir = resolve(options.skillDir, "scripts");
  const portableScripts = ["visual-audit.ts", "beat-sync.ts", "timing-audit.ts"];
  for (const name of portableScripts) {
    const source = join(scriptsSourceDir, name);
    if (existsSync(source)) {
      cpSync(source, join(scriptsTargetDir, name));
    }
  }
}

export function renderThemeSource(report: BrandReport): string {
  const backgroundColor = report.designTruth.backgroundColor || "#0A0A0C";
  const textColor = report.designTruth.textColor || "#F8FAFC";
  const primaryColor = report.designTruth.primaryColor || "#6C47FF";
  const accentColor = report.designTruth.accentColor || primaryColor;
  const panel = mix(backgroundColor, "#FFFFFF", 0.06);
  const card = mix(backgroundColor, "#FFFFFF", 0.10);
  const surface = mix(backgroundColor, "#FFFFFF", 0.16);
  const body = mix(textColor, backgroundColor, 0.18);

  // Font sanitization — Remotion can't use Next.js CSS vars (`var(--font-*)`),
  // `inherit`, `initial`, `unset`, or quoted generic families. Must be a real
  // google-fonts-loadable family name. Map common sites' CSS vars to their
  // underlying fonts, strip everything else, and fall back to Outfit.
  // Emoji / symbol / dingbat fonts — these appear in CSS font-family fallback
  // chains (e.g. `font-family: Inter, "Apple Color Emoji", "Segoe UI Emoji"`)
  // and the harvester pulls them as primary candidates. Reject them outright.
  const EMOJI_FONT_BLOCKLIST = /emoji|symbol|webdings|wingdings|dingbat|fontawesome|material icons/i;
  // System fonts that aren't loadable via @remotion/google-fonts → remap to a
  // Google-Fonts equivalent so the look stays close to the brand intent.
  const SYSTEM_FONT_REMAP: Record<string, string> = {
    "-apple-system": "Inter",
    "apple-system": "Inter",
    "blinkmacsystemfont": "Inter",
    "sf pro": "Inter",
    "sf pro display": "Inter",
    "sf pro text": "Inter",
    "sf mono": "JetBrains Mono",
    "segoe ui": "Inter",
    "segoe ui variable": "Inter",
    "helvetica neue": "Inter",
    "helvetica": "Inter",
    "arial": "Inter",
    "verdana": "Inter",
    "tahoma": "Inter",
    "menlo": "JetBrains Mono",
    "monaco": "JetBrains Mono",
    "consolas": "JetBrains Mono",
    "courier new": "JetBrains Mono",
    "courier": "JetBrains Mono",
    "lucida console": "JetBrains Mono",
  };
  const sanitizeFont = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim().replace(/["']/g, "");
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (["inherit", "initial", "unset", "revert", "auto", "normal"].includes(lower)) return null;
    if (/^(sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace)$/.test(lower)) return null;
    // Next.js `var(--font-xxx)` — map known ones, drop the rest
    const varMatch = lower.match(/^var\(\s*--font-([a-z0-9-]+)/);
    if (varMatch) {
      const key = varMatch[1];
      if (/geist-mono|geistmono|jetbrains/.test(key)) return "JetBrains Mono";
      if (/geist/.test(key)) return "Geist";
      if (/inter/.test(key)) return "Inter";
      if (/outfit/.test(key)) return "Outfit";
      if (/mono|code/.test(key)) return "JetBrains Mono";
      return null; // unknown var → drop, use fallback
    }
    if (lower.startsWith("var(")) return null;
    // Take only the first family if a chain leaked through
    const head = trimmed.replace(/,.*$/, "").trim();
    const headLower = head.toLowerCase();
    // Reject emoji / symbol / dingbat fonts entirely
    if (EMOJI_FONT_BLOCKLIST.test(headLower)) return null;
    // Remap system fonts to google-fonts equivalents
    if (SYSTEM_FONT_REMAP[headLower]) return SYSTEM_FONT_REMAP[headLower];
    return head;
  };
  const sanitizedFonts = report.designTruth.fontFamilies
    .map(sanitizeFont)
    .filter((f): f is string => Boolean(f));
  const headingFont = sanitizedFonts[0] || "Outfit";
  const bodyFont = sanitizedFonts[1] || headingFont;
  const monoFont = sanitizedFonts.find((font) => /mono|code|jetbrains|geist mono/i.test(font)) || "JetBrains Mono";

  return `/**
 * [INPUT]: brand-report.json derived design truth and local generated project data
 * [OUTPUT]: theme object — global first-cut design tokens
 * [POS]: generated project's design-token spine, consumed by scenes and components
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const theme = {
  color: {
    bg: "${backgroundColor}",
    panel: "${panel}",
    card: "${card}",
    surface: "${surface}",
    text: "${textColor}",
    textBody: "${body}",
    textMuted: "${rgba(body, 0.52)}",
    primary: "${primaryColor}",
    accent: "${accentColor}",
    border: "${rgba(textColor, 0.08)}",
    borderActive: "${rgba(textColor, 0.18)}",
  },

  font: {
    heading: "${headingFont}",
    body: "${bodyFont}",
    mono: "${monoFont}",
  },

  radius: {
    sm: ${report.designTruth.radiusMood === "tight" ? 6 : 8},
    md: ${report.designTruth.radiusMood === "soft" ? 18 : 14},
    lg: ${report.designTruth.radiusMood === "soft" ? 28 : 22},
    xl: ${report.designTruth.radiusMood === "soft" ? 36 : 28},
  },

  // Context-scoped font sizes. NEVER use a flat 28px floor — that
  // turns every video into a Fisher-Price menu. Real premium video
  // uses sharp size contrast: huge hero + tiny mockup chrome.
  fontSize: {
    hero: 80,
    sub: 36,
    sectionTag: 22,
    body: 28,
    caption: 20,
    mockupTitle: 22,
    mockupRow: 18,
    mockupLabel: 14,
    metric: 96,
    metricLabel: 22,
  },
} as const;
`;
}

export function renderGeneratedDataSource(
  report: BrandReport,
  sceneConstitution: SceneConstitution,
  assetManifest: AssetManifest,
): string {
  return `/**
 * [INPUT]: URL intake V2 output JSON emitted during project generation
 * [OUTPUT]: brandReport, sceneConstitution, assetManifest constants for scaffold consumption
 * [POS]: generated project data seam between intake orchestration and Remotion scenes
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const brandReport = ${JSON.stringify(report, null, 2)} as const;

export const sceneConstitution = ${JSON.stringify(sceneConstitution, null, 2)} as const;

export const assetManifest = ${JSON.stringify(assetManifest, null, 2)} as const;
`;
}

function buildReviewMarkdown(report: BrandReport, sceneConstitution: SceneConstitution): string {
  const status = report.suggestedMode === "insufficient-evidence" ? "FAIL" : report.score.level === "high" ? "PASS" : "WARN";
  const harvestLog = report.harvestActions.length > 0
    ? report.harvestActions.map((a) => `  - ${a}`).join("\n")
    : "  - (no harvest actions logged)";

  return `# Review

## Evidence Gate — ${status}
- Overall evidence score: ${report.score.overall} (${report.score.level})
- Suggested mode: \`${report.suggestedMode}\`
- Primary archetype: \`${sceneConstitution.archetype.primary}\`
- Risks:
${report.risks.map((risk) => `  - ${risk}`).join("\n") || "  - None"}

## Harvest Log
${harvestLog}

## Taste Gate
- Reject purple-gradient monoculture unless the real brand actually uses it.
- Reject card-stack defaults when the evidence only supports one clear focal surface.
- Reject fake UI interaction whenever evidence is editorial-only.

## Edit Gate
- Every scene must keep one dominant focal plane.
- Proof act must remain calmer than reveal/showcase.
- If the generated first cut feels generic, delete scenes before adding scenes.
`;
}

export function writeProjectArtifacts(
  outputDir: string,
  report: BrandReport,
  sceneConstitution: SceneConstitution,
  assetManifest: AssetManifest,
): void {
  const root = resolve(outputDir);
  ensureDir(root);
  ensureDir(join(root, "src", "generated"));

  writeFileSync(join(root, "brand-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(root, "scene-constitution.json"), `${JSON.stringify(sceneConstitution, null, 2)}\n`);
  writeFileSync(join(root, "asset-manifest.json"), `${JSON.stringify(assetManifest, null, 2)}\n`);
  writeFileSync(join(root, "story.md"), `${sceneConstitution.storyIntentDraft}\n`);
  writeFileSync(join(root, "review.md"), buildReviewMarkdown(report, sceneConstitution));
  writeFileSync(join(root, "src", "theme.ts"), renderThemeSource(report));
  writeFileSync(
    join(root, "src", "generated", "project-data.ts"),
    renderGeneratedDataSource(report, sceneConstitution, assetManifest),
  );
}
