/**
 * [INPUT]: Brand URL, optional existing evidence directory, scaffold/, local helper scripts, external tools when present
 * [OUTPUT]: brand-report.json, scene-constitution.json, asset-manifest.json, story.md, review.md, and a generated Remotion first-cut project directory
 * [POS]: scripts/ 的 URL intake orchestrator; 把一个 URL 压成可编辑的团队级 first cut 工程
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  URL-TO-VIDEO V2 — One URL To Editable First Cut
//  Run:
//    tsx scripts/url-to-video.ts <url> --out ./brand-launch-video
//    tsx scripts/url-to-video.ts https://stripe.com --reuse-brand-dir ../stripe-launch-video/public/brand --offline
// ================================================================

import { execFileSync, spawnSync } from "child_process";
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { basename, dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import {
  PRODUCT_KEYWORDS,
  PROOF_KEYWORDS,
  buildGapList,
  clampScore,
  collectManifestAssets,
  computeEvidenceScore,
  dedupeStrings,
  detectModeFromReport,
  keywordHits,
  type AssetKind,
  type AssetManifest,
  type AssetRecord,
  type BrandAssetProof,
  type BrandReport,
  type DesignTruth,
  type EvidenceDimensions,
  type ProductCategory,
  type ProductCategorySignal,
  type ScreenshotProof,
  type StructureTruth,
  type TextTruth,
  type VideoProof,
} from "./evidence-model.ts";
import { buildSceneConstitution } from "./scene-constitution.ts";
import { copyScaffoldProject, slugify, writeProjectArtifacts } from "./project-blueprint.ts";

interface CliOptions {
  url: string;
  outputDir: string;
  projectName: string;
  force: boolean;
  reuseBrandDir?: string;
  offline: boolean;
  autoInstall: "ask" | "yes" | "skip";
}

interface HarvestContext {
  brandDir: string;
  offline: boolean;
  reuseBrandDir?: string;
}

interface HarvestResult {
  html: string;
  cssText: string;
  textTruth: TextTruth;
  designTruth: DesignTruth;
  structureTruth: StructureTruth;
  screenshotProof: ScreenshotProof;
  videoProof: VideoProof;
  brandAssetProof: BrandAssetProof;
  harvestActions: string[];
}

const DEFAULT_BG_COLOR = "#0A0A0C";
const DEFAULT_TEXT_COLOR = "#F8FAFC";

// 关键词列表统一从 evidence-model.ts 导入 — 单一真相源

function titleCaseBrandLabel(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function brandLabelFromUrl(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  return titleCaseBrandLabel(hostname.split(".")[0] || hostname);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url || url.startsWith("--")) {
    console.error("Usage: tsx scripts/url-to-video.ts <url> [--out ./brand-launch-video] [--force] [--reuse-brand-dir ./public/brand] [--offline]");
    process.exit(2);
  }

  let outputDir = "";
  let projectName = "";
  let force = false;
  let reuseBrandDir: string | undefined;
  let offline = false;
  let autoInstall: "ask" | "yes" | "skip" = "ask";

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    if (current === "--out" && next) {
      outputDir = resolve(next);
      index += 1;
      continue;
    }

    if (current === "--project-name" && next) {
      projectName = next;
      index += 1;
      continue;
    }

    if (current === "--reuse-brand-dir" && next) {
      reuseBrandDir = resolve(next);
      index += 1;
      continue;
    }

    if (current === "--force") {
      force = true;
      continue;
    }

    if (current === "--offline") {
      offline = true;
      continue;
    }

    if (current === "--yes" || current === "-y") {
      autoInstall = "yes";
      continue;
    }

    if (current === "--no-install") {
      autoInstall = "skip";
      continue;
    }
  }

  const hostname = new URL(ensureProtocol(url)).hostname.replace(/^www\./, "");
  const slug = slugify(hostname);
  const resolvedOutput = outputDir || resolve(process.cwd(), `${slug}-launch-video`);

  return {
    url: ensureProtocol(url),
    outputDir: resolvedOutput,
    projectName: projectName || `${slug}-launch-video`,
    force,
    reuseBrandDir,
    offline,
    autoInstall,
  };
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function hasCommand(command: string): boolean {
  return spawnSync("which", [command], { stdio: "ignore" }).status === 0;
}

// ================================================================
//  Preflight: ensure the external toolchain is installed.
//  The pipeline leans on ffmpeg (BGM mix), yt-dlp (BGM/video harvest),
//  aubiotrack (beat detection), and playwright (headless screenshot).
//  Missing tools silently degrade the output — a new user running this
//  cold would end up with a project that "works" but has no BGM, no
//  beat-map, and a low-res downloaded-image hero. Fail-fast and offer
//  to install instead.
// ================================================================
interface ToolSpec {
  cmd: string;
  label: string;
  purpose: string;
  install: { mac: string; linux: string };
  installer: () => boolean; // returns true on success
}

// ----------------------------------------------------------------
//  Package manager abstraction
//
//  macOS: always go through brew.
//  Linux: try apt-get (Debian/Ubuntu) → dnf (Fedora/RHEL) → pacman
//  (Arch) → linuxbrew, in that order. First one present wins.
//  Package NAMES sometimes differ across distros — the LINUX_PKG
//  map holds per-manager names; if unset we fall back to the tool
//  name verbatim. yt-dlp is pip-only on older apt, so we special-
//  case it via `pipx`/`pip` as a last resort.
// ----------------------------------------------------------------
const IS_MAC = process.platform === "darwin";
const IS_LINUX = process.platform === "linux";

interface LinuxPackageNames {
  apt?: string;
  dnf?: string;
  pacman?: string;
  brew?: string;
  pip?: string;
}

const LINUX_PKG: Record<string, LinuxPackageNames> = {
  ffmpeg:     { apt: "ffmpeg",  dnf: "ffmpeg",      pacman: "ffmpeg",     brew: "ffmpeg" },
  "yt-dlp":   { apt: "yt-dlp",  dnf: "yt-dlp",      pacman: "yt-dlp",     brew: "yt-dlp",  pip: "yt-dlp" },
  aubio:      { apt: "aubio-tools", dnf: "aubio",   pacman: "aubio",      brew: "aubio" },
};

function describeLinuxInstall(tool: string): string {
  const names = LINUX_PKG[tool] || {};
  const parts: string[] = [];
  if (names.apt)    parts.push(`sudo apt-get install -y ${names.apt}`);
  if (names.dnf)    parts.push(`sudo dnf install -y ${names.dnf}`);
  if (names.pacman) parts.push(`sudo pacman -S --noconfirm ${names.pacman}`);
  if (names.brew)   parts.push(`brew install ${names.brew}`);
  if (names.pip)    parts.push(`pipx install ${names.pip}`);
  return parts.join("  |  ") || `(install ${tool} manually)`;
}

const TOOLCHAIN: ToolSpec[] = [
  {
    cmd: "ffmpeg",
    label: "ffmpeg",
    purpose: "audio processing, BGM fades, video trim",
    install: { mac: "brew install ffmpeg", linux: describeLinuxInstall("ffmpeg") },
    installer: () => runPackageInstall("ffmpeg"),
  },
  {
    cmd: "yt-dlp",
    label: "yt-dlp",
    purpose: "BGM harvest from YouTube + product video download",
    install: { mac: "brew install yt-dlp", linux: describeLinuxInstall("yt-dlp") },
    installer: () => runPackageInstall("yt-dlp"),
  },
  {
    cmd: "aubiotrack",
    label: "aubio (aubiotrack)",
    purpose: "beat detection for MainVideo downbeat pulse sync",
    install: { mac: "brew install aubio", linux: describeLinuxInstall("aubio") },
    // apt ships aubiotrack under the aubio-tools package; other managers use `aubio`.
    installer: () => runPackageInstall("aubio"),
  },
  {
    cmd: "playwright",
    label: "playwright",
    purpose: "headless rendered homepage screenshot",
    install: {
      mac: "npm install -g playwright && playwright install chromium",
      linux: "npm install -g playwright && playwright install chromium",
    },
    installer: () => runPlaywrightInstall(),
  },
];

function runPackageInstall(tool: string): boolean {
  if (IS_MAC) return runBrew(tool);
  if (IS_LINUX) return runLinuxPkg(tool);
  console.error(`  ! Unsupported platform ${process.platform}; install ${tool} manually.`);
  return false;
}

function runBrew(tool: string): boolean {
  if (!hasCommand("brew")) {
    console.error(`  ! brew not found. Install Homebrew first: https://brew.sh`);
    return false;
  }
  const pkg = LINUX_PKG[tool]?.brew || tool; // same name on mac brew in practice
  try {
    execFileSync("brew", ["install", pkg], { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function runLinuxPkg(tool: string): boolean {
  const names = LINUX_PKG[tool] || {};

  // apt-get
  if (names.apt && hasCommand("apt-get")) {
    try {
      execFileSync("sudo", ["apt-get", "install", "-y", names.apt], { stdio: "inherit" });
      return true;
    } catch { /* fall through */ }
  }

  // dnf
  if (names.dnf && hasCommand("dnf")) {
    try {
      execFileSync("sudo", ["dnf", "install", "-y", names.dnf], { stdio: "inherit" });
      return true;
    } catch { /* fall through */ }
  }

  // pacman
  if (names.pacman && hasCommand("pacman")) {
    try {
      execFileSync("sudo", ["pacman", "-S", "--noconfirm", names.pacman], { stdio: "inherit" });
      return true;
    } catch { /* fall through */ }
  }

  // linuxbrew
  if (names.brew && hasCommand("brew")) {
    try {
      execFileSync("brew", ["install", names.brew], { stdio: "inherit" });
      return true;
    } catch { /* fall through */ }
  }

  // pip/pipx for yt-dlp
  if (names.pip && hasCommand("pipx")) {
    try {
      execFileSync("pipx", ["install", names.pip], { stdio: "inherit" });
      return true;
    } catch { /* fall through */ }
  }

  console.error(`  ! No supported package manager found for ${tool}. Install manually: ${describeLinuxInstall(tool)}`);
  return false;
}

function runPlaywrightInstall(): boolean {
  if (!hasCommand("npm")) {
    console.error(`  ! npm not found. Install Node.js first.`);
    return false;
  }
  try {
    execFileSync("npm", ["install", "-g", "playwright"], { stdio: "inherit" });
    execFileSync("playwright", ["install", "chromium"], { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function promptYesNo(question: string): boolean {
  // Minimal sync prompt. Only usable when stdin is a TTY — automation
  // callers (Claude, CI) must pass --yes or --no-install explicitly.
  if (!process.stdin.isTTY) {
    return false;
  }
  try {
    process.stdout.write(question);
    const buffer = Buffer.alloc(64);
    // readSync blocks until newline. fd 0 = stdin.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const bytes = fs.readSync(0, buffer, 0, 64, null);
    const answer = buffer.slice(0, bytes).toString().trim().toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
  } catch {
    return false;
  }
}

function preflight(mode: "ask" | "yes" | "skip"): void {
  const missing = TOOLCHAIN.filter((t) => !hasCommand(t.cmd));
  if (missing.length === 0) {
    return;
  }

  console.log("");
  console.log("─────────────── PREFLIGHT ───────────────");
  console.log("Missing external tools detected:");
  for (const t of missing) {
    console.log(`  • ${t.label.padEnd(18)} → ${t.purpose}`);
    const installHint = IS_MAC ? t.install.mac : IS_LINUX ? t.install.linux : `${t.install.mac}  (mac)`;
    console.log(`    install: ${installHint}`);
  }
  console.log("");

  if (mode === "skip") {
    console.log("--no-install passed; continuing in degraded mode.");
    console.log("Features above will be silently skipped.\n");
    return;
  }

  const shouldInstall = mode === "yes" || promptYesNo("Install missing tools now? [Y/n] ");
  if (!shouldInstall) {
    console.log("\nSkipping install. Run again with --yes once installed, or --no-install to suppress this prompt.\n");
    return;
  }

  console.log("");
  for (const t of missing) {
    console.log(`→ Installing ${t.label}...`);
    const ok = t.installer();
    if (!ok || !hasCommand(t.cmd)) {
      console.error(`  ! Failed to install ${t.label}. Run manually: ${t.install.mac}`);
    } else {
      console.log(`  ✓ ${t.label} installed`);
    }
  }
  console.log("─────────────────────────────────────────\n");
}

function sanitizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
}

function stripTags(raw: string): string {
  return sanitizeText(raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function matchMeta(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return sanitizeText(match[1]);
    }
  }
  return "";
}

function resolveUrl(baseUrl: string, candidate?: string): string | undefined {
  if (!candidate) {
    return undefined;
  }
  try {
    return new URL(candidate, baseUrl).href;
  } catch {
    return undefined;
  }
}

async function safeFetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; URLToVideoV2/1.0; +https://example.com/agent)",
      accept: "text/html, text/css, application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.text();
}

async function safeDownload(url: string, destination: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; URLToVideoV2/1.0; +https://example.com/agent)",
      },
    });

    if (!response.ok) {
      return false;
    }

    mkdirSync(dirname(destination), { recursive: true });
    const arrayBuffer = await response.arrayBuffer();
    writeFileSync(destination, Buffer.from(arrayBuffer));
    return true;
  } catch {
    return false;
  }
}

function extractTextTruth(html: string): TextTruth {
  const title = matchMeta(html, [/<title>([^<]+)<\/title>/i]);
  const headline =
    matchMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ]) || title;
  const subheadline =
    matchMeta(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<p[^>]*>([\s\S]*?)<\/p>/i,
    ]);

  const ctaMatches = [...html.matchAll(/<(?:a|button)[^>]*>([^<]{2,40})<\/(?:a|button)>/gi)]
    .map((match) => sanitizeText(match[1]))
    .filter((text) => /(start|get|book|see|request|watch|contact|talk|try|sign|read|explore|learn|buy|shop)/i.test(text))
    .slice(0, 4);

  // Single-word h2/h3s are almost always nav/footer junk (Blog, Questions, FAQ, About, Pricing).
  // A real feature is either >= 2 words or a multi-word marketing claim.
  const NAV_BLOCKLIST = new Set([
    "blog", "questions", "faq", "faqs", "contact", "about", "about us", "pricing", "login", "log in",
    "sign in", "sign up", "signup", "register", "privacy", "terms", "cookies", "cookie policy",
    "resources", "company", "careers", "press", "help", "support", "newsletter", "subscribe",
    "docs", "documentation", "menu", "search", "home", "products", "product", "solutions",
    "features", "use cases", "customers", "partners", "events", "community", "learn", "more",
    "twitter", "linkedin", "github", "youtube", "instagram", "facebook", "discord",
  ]);
  const featureMatches = [...html.matchAll(/<(?:h2|h3)[^>]*>([\s\S]*?)<\/(?:h2|h3)>/gi)]
    .map((match) => sanitizeText(stripTags(match[1])))
    .filter((text) => {
      if (text.length < 4 || text.length > 80) return false;
      if (NAV_BLOCKLIST.has(text.toLowerCase().trim())) return false;
      // Require either multi-word OR clearly descriptive single token (>= 12 chars)
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount === 1 && text.length < 12) return false;
      return true;
    })
    .slice(0, 8);

  return {
    title,
    headline,
    subheadline,
    cta: dedupeStrings(ctaMatches),
    featureNames: dedupeStrings(featureMatches),
  };
}

function extractFontFamilies(cssText: string, html: string): string[] {
  const fontMatches = [
    ...cssText.matchAll(/font-family\s*:\s*([^;}{]+)/gi),
    ...html.matchAll(/font-family\s*:\s*([^;"'}]+)/gi),
  ].map((match) =>
    match[1]
      .split(",")
      .map((font) => font.replace(/['"]/g, "").trim())
      .filter((font) => font && !/system-ui|sans-serif|serif|monospace/i.test(font)),
  );

  return dedupeStrings(fontMatches.flat()).slice(0, 4);
}

function brightness(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return 0;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function saturation(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return 0;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return 0;
  }
  const lightness = (max + min) / 2;
  const delta = max - min;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

// Returns CSS-declared hex colors sorted by frequency (descending).
// Frequency matters: a color used 40 times in CSS rules is the brand color;
// a color used once is an accent or a one-off section. The previous
// "unique-in-source-order" approach lost this signal entirely, which let
// the screenshot hue extractor override CSS truth.
function extractColorHexes(cssText: string, html: string): string[] {
  const matches = [...`${cssText}\n${html}`.matchAll(/#(?:[0-9a-fA-F]{6})\b/g)].map((match) => match[0].toUpperCase());
  const counts = new Map<string, number>();
  for (const hex of matches) counts.set(hex, (counts.get(hex) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 32);
}

// Hue in degrees (0-360). Used for hue-family agreement checks between
// CSS palette truth and screenshot pixel sampling.
function hueDegrees(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const d = mx - mn;
  let h = 0;
  if (mx === r) h = 60 * (((g - b) / d + 6) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return h;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ================================================================
//  Brand color = how the website actually deploys color in pixels.
//  Not logo. Not CSS text frequency. The rendered website IS truth.
//
//  Algorithm — hue-weighted dominance:
//    1. Scale screenshot to 256x256, read as raw RGBA
//    2. Filter: skip transparent / near-black / near-white / near-grey
//    3. Bucket each pixel by its HUE (12 slots × 30° each)
//    4. Per slot, sum chroma (brightness-weighted saturation)
//    5. Winning slot = the color family that dominates visually
//    6. Within that slot, pick the highest-chroma sample
//       — this returns the brightest deployment of the brand hue
//  This beats RGB-bucket frequency (which gives dull averages) and
//  logo dominant pixel (which misses the site's actual CTA/hero tone).
//
//  Source priority: hero.png (og:image, brand-authored) →
//    homepage.png (rendered reality) → logo.png (last resort fallback)
// ================================================================
function rgbToHueSlot(r: number, g: number, b: number): number {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const mx = Math.max(rf, gf, bf);
  const mn = Math.min(rf, gf, bf);
  const d = mx - mn;
  if (d === 0) return 0;
  let h = 0;
  if (mx === rf) h = 60 * (((gf - bf) / d + 6) % 6);
  else if (mx === gf) h = 60 * ((bf - rf) / d + 2);
  else h = 60 * ((rf - gf) / d + 4);
  return Math.floor(h / 30); // 0..11
}

function extractBrandColorFromImage(imagePath: string): string | null {
  try {
    const raw = execFileSync(
      "ffmpeg",
      ["-hide_banner", "-loglevel", "error", "-i", imagePath, "-vf", "scale=256:256", "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
      { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 8 * 1024 * 1024 },
    );
    const buf = Buffer.from(raw);
    if (buf.length < 4) return null;

    const slotChromaSum = new Array<number>(12).fill(0);
    const slotBest: Array<{ chroma: number; r: number; g: number; b: number } | null> = new Array(12).fill(null);

    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const a = buf[i + 3];
      if (a < 128) continue;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (mx < 40 || mn > 210) continue; // near-black / near-white
      const chroma = mx - mn;
      if (chroma < 50) continue; // near-grey
      const slot = rgbToHueSlot(r, g, b);
      slotChromaSum[slot] += chroma;
      const cur = slotBest[slot];
      if (!cur || chroma > cur.chroma) {
        slotBest[slot] = { chroma, r, g, b };
      }
    }

    let winnerSlot = -1;
    let winnerWeight = 0;
    for (let s = 0; s < 12; s += 1) {
      if (slotChromaSum[s] > winnerWeight) {
        winnerWeight = slotChromaSum[s];
        winnerSlot = s;
      }
    }
    if (winnerSlot < 0 || winnerWeight < 1000) return null; // not enough saturated content
    const best = slotBest[winnerSlot];
    if (!best) return null;
    return `#${[best.r, best.g, best.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  } catch {
    return null;
  }
}

function extractBrandColorFromWebsite(brandDir: string): string | null {
  // og:image / brand-authored hero first — it's what the brand chose to represent itself.
  // Then the rendered homepage screenshot (playwright or agent-browser).
  // Then logo as a last-resort fallback for minimal-evidence sites.
  for (const name of ["hero.png", "homepage.png", "product-ui.png", "logo.png"]) {
    const p = join(brandDir, name);
    if (existsSync(p)) {
      const hit = extractBrandColorFromImage(p);
      if (hit) return hit;
    }
  }
  return null;
}

function colorDistance(a: string, b: string): number {
  const parse = (h: string): [number, number, number] => {
    const n = h.replace("#", "");
    return [
      Number.parseInt(n.slice(0, 2), 16),
      Number.parseInt(n.slice(2, 4), 16),
      Number.parseInt(n.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function buildDesignTruth(colors: string[], fonts: string[], html: string, screenshotColor: string | null = null): DesignTruth {
  // colors[] arrives FREQUENCY-SORTED from extractColorHexes (most-used first).
  // brandColors = saturated, mid-brightness CSS colors, frequency order preserved.
  const brandColors = colors.filter((color) => saturation(color) >= 0.25 && brightness(color) > 30 && brightness(color) < 235);

  // Background: 优先挑最深 + 最低饱和度 (真正 neutral 的 bg, 不是 section-specific 的彩色).
  const darkColors = colors
    .filter((color) => brightness(color) <= 80)
    .sort((a, b) => brightness(a) + saturation(a) * 30 - (brightness(b) + saturation(b) * 30));

  // Text: 优先挑最亮 + 最低饱和度 (真正 neutral 的白/灰).
  const lightColors = colors
    .filter((color) => brightness(color) >= 180)
    .sort((a, b) => -brightness(a) + saturation(a) * 40 - (-brightness(b) + saturation(b) * 40));

  // ============================================================
  // PRIMARY COLOR — CSS truth wins, screenshot is fallback only.
  //
  // Why: CSS hex codes are explicit designer intent. Screenshot
  // pixel sampling gets contaminated by logo PNGs (which often
  // use a brand-icon color different from the actual website
  // surface, e.g. an orange App Store icon on a blue website).
  //
  // Algorithm:
  //   1. If CSS yields ≥1 strong saturated color → CSS wins.
  //      Pick the most-frequent saturated CSS color as primary.
  //   2. If CSS palette is empty/grey-only → screenshot fallback.
  //   3. If CSS primary and screenshot color disagree on hue
  //      family (>60°), keep CSS but log a divergence warning.
  // ============================================================
  const strongCssColors = brandColors.filter((c) => saturation(c) >= 0.40);
  let primaryColor: string;
  if (strongCssColors.length > 0) {
    primaryColor = strongCssColors[0]; // frequency winner
  } else if (screenshotColor) {
    primaryColor = screenshotColor;
  } else {
    primaryColor = brandColors[0] || "#6C47FF";
  }

  // Accent = next brand color in a visibly different hue family.
  const primaryHue = hueDegrees(primaryColor);
  const distantAccent = brandColors.find((c) => c !== primaryColor && hueDistance(hueDegrees(c), primaryHue) > 40 && saturation(c) >= 0.30);
  const accentColor = distantAccent || brandColors.find((c) => c !== primaryColor) || "#FFFFFF";
  const backgroundColor = darkColors[0] || DEFAULT_BG_COLOR;
  const textColor = lightColors[0] || DEFAULT_TEXT_COLOR;

  const radiusMood = /border-radius\s*:\s*(?:2[4-9]|[3-9]\d)/i.test(html) ? "soft" : /border-radius\s*:\s*(?:0|1|2|3|4|5|6)/i.test(html) ? "tight" : "balanced";
  const densityMood = /pricing|developer|api|docs|features|integration|dashboard/i.test(html) ? "compact" : /luxury|story|journal|collection/i.test(html) ? "airy" : "balanced";
  const motionMood = /video|autoplay|animate|motion|spring/i.test(html) ? "expressive" : densityMood === "compact" ? "precise" : "measured";

  return {
    colors,
    primaryColor,
    accentColor,
    backgroundColor,
    textColor,
    fontFamilies: fonts,
    radiusMood,
    densityMood,
    motionMood,
  };
}

function inferStructureTruth(html: string, textTruth: TextTruth): StructureTruth {
  const haystack = stripTags(html).toLowerCase();
  const productKeywordHits = keywordHits(haystack, PRODUCT_KEYWORDS);
  const proofKeywordHits = keywordHits(haystack, PROOF_KEYWORDS);

  let productType: StructureTruth["productType"] = "unknown";
  if (/payments|billing|finance|banking|treasury/.test(haystack)) {
    productType = "fintech";
  } else if (/developer|api|sdk|infra|cloud|security|observability|database|deploy/.test(haystack)) {
    productType = "developer-platform";
  } else if (/shop|buy|cart|commerce|catalog/.test(haystack)) {
    productType = "marketplace";
  } else if (/agency|consulting|services|studio/.test(haystack)) {
    productType = "service-brand";
  } else if (/collection|hotel|fashion|travel|journal/.test(haystack)) {
    productType = "consumer-brand";
  } else if (productKeywordHits >= 3) {
    productType = "app";
  }

  const uiPresence: StructureTruth["uiPresence"] =
    /dashboard|editor|table|graph|analytics|workspace|code|conversation|terminal|control panel/.test(haystack)
      ? "strong"
      : /product|platform|app|software|tool|service/.test(haystack)
        ? "medium"
        : "light";

  const productClarity: StructureTruth["productClarity"] =
    productKeywordHits >= 5 ? "high" : productKeywordHits >= 2 ? "medium" : "low";
  const proofStyle: StructureTruth["proofStyle"] =
    /trusted by|customers|logos|used by|case study/.test(haystack)
      ? "customers"
      : /compliance|security|uptime|benchmark|scale|million|billion/.test(haystack)
        ? "metrics"
        : /story|world|journal|collection/.test(haystack)
          ? "editorial"
          : proofKeywordHits >= 2
            ? "mixed"
            : "unknown";

  return {
    productType,
    productClarity,
    uiPresence,
    proofStyle,
    notes: dedupeStrings([
      textTruth.cta[0],
      proofStyle !== "unknown" ? `Proof style: ${proofStyle}` : undefined,
      uiPresence === "strong" ? "Strong UI presence detected." : undefined,
      productClarity === "high" ? "Product model is clearly legible from site copy." : undefined,
    ]),
  };
}

// offline 模式只依赖本地证据文件推断，不硬编码品牌名
function inferOfflineStructureTruth(existing: ReturnType<typeof inspectExistingEvidence>): StructureTruth {
  const hasProductSurface = Boolean(existing.screenshotProof.product || existing.videoProof.primary);
  const hasProof = existing.screenshotProof.supporting.length > 0;

  return {
    productType: hasProductSurface ? "app" : "unknown",
    productClarity: hasProductSurface ? "medium" : "low",
    uiPresence: hasProductSurface ? "strong" : "light",
    proofStyle: hasProof ? "mixed" : "unknown",
    notes: dedupeStrings([
      hasProductSurface ? "Recovered product surface from local evidence pack." : undefined,
      hasProof ? "Supporting proof visuals exist in the local evidence pack." : undefined,
    ]),
  };
}

function collectCandidateUrls(html: string, baseUrl: string, pattern: RegExp): string[] {
  return dedupeStrings([...html.matchAll(pattern)].map((match) => resolveUrl(baseUrl, match[1])));
}

async function fetchCssText(html: string, baseUrl: string, offline: boolean): Promise<string> {
  if (offline) {
    return "";
  }

  const stylesheetUrls = collectCandidateUrls(
    html,
    baseUrl,
    /<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]+href=["']([^"']+)["']/gi,
  ).slice(0, 5);

  const chunks = await Promise.all(
    stylesheetUrls.map(async (stylesheetUrl) => {
      try {
        return await safeFetchText(stylesheetUrl);
      } catch {
        return "";
      }
    }),
  );

  return chunks.join("\n");
}

function candidateRecord(kind: AssetKind, label: string, sourceUrl?: string, source: AssetRecord["source"] = "official-site"): AssetRecord {
  return {
    kind,
    label,
    sourceUrl,
    source: sourceUrl ? source : "not-found",
    status: sourceUrl ? "referenced" : "missing",
  };
}

function pickImageCandidates(html: string, baseUrl: string): { logo: string[]; screenshots: string[]; supporting: string[] } {
  const logo = dedupeStrings([
    resolveUrl(baseUrl, matchMeta(html, [/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i])),
    resolveUrl(baseUrl, matchMeta(html, [/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i])),
  ]);

  const screenshots = dedupeStrings([
    resolveUrl(baseUrl, matchMeta(html, [/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i])),
    resolveUrl(baseUrl, matchMeta(html, [/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i])),
    ...collectCandidateUrls(
      html,
      baseUrl,
      /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt=["'][^"']*(?:product|dashboard|app|platform|editor|hero)[^"']*["'])?[^>]*>/gi,
    ),
  ]);

  const supporting = collectCandidateUrls(
    html,
    baseUrl,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
  ).slice(0, 12);

  return { logo, screenshots, supporting };
}

function pickVideoCandidates(html: string, baseUrl: string): string[] {
  return dedupeStrings([
    ...collectCandidateUrls(html, baseUrl, /<video[^>]+src=["']([^"']+)["']/gi),
    ...collectCandidateUrls(html, baseUrl, /<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi),
    ...collectCandidateUrls(html, baseUrl, /<iframe[^>]+src=["']([^"']*(?:youtube|youtu\.be|vimeo)[^"']*)["']/gi),
  ]);
}

function fileRecord(kind: AssetKind, label: string, localPath: string, source: AssetRecord["source"]): AssetRecord {
  // homepage-screenshot 永远是 playwright 自截图, 不是品牌自产素材.
  // 标注为 preview-only, 禁止进入 scaffold 的 ASSET_POOL.
  const notes =
    kind === "homepage-screenshot"
      ? "playwright-capture; preview/debug only; NOT scene-eligible"
      : undefined;
  return {
    kind,
    label,
    localPath,
    source,
    status: existsSync(localPath) ? "downloaded" : "missing",
    ...(notes ? { notes } : {}),
  };
}

function copyExistingBrandDir(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry);
    const targetPath = join(targetDir, entry);
    if (statSync(sourcePath).isFile()) {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function inspectExistingEvidence(brandDir: string): {
  screenshotProof: ScreenshotProof;
  videoProof: VideoProof;
  brandAssetProof: BrandAssetProof;
} {
  const locate = (patterns: RegExp[]): string | undefined => {
    const files = readdirSync(brandDir);
    return files.find((file) => patterns.some((pattern) => pattern.test(file)));
  };

  const imageLike = "(svg|png|jpg|jpeg|webp)";
  const logoFile = locate([new RegExp(`^logo\\.${imageLike}$`, "i"), new RegExp(`^favicon\\.${imageLike}$`, "i")]);
  const wordmarkFile = locate([new RegExp(`^wordmark\\.${imageLike}$`, "i")]);
  const homepageFile = locate([new RegExp(`^homepage.*\\.${imageLike}$`, "i"), new RegExp(`^home.*\\.${imageLike}$`, "i")]);
  const productFile = locate([
    new RegExp(`^product.*\\.${imageLike}$`, "i"),
    new RegExp(`^ui.*\\.${imageLike}$`, "i"),
    new RegExp(`^dashboard.*\\.${imageLike}$`, "i"),
  ]);
  const heroFile = locate([new RegExp(`^hero.*\\.${imageLike}$`, "i"), new RegExp(`^og-image.*\\.${imageLike}$`, "i")]);
  const videoFile = locate([/^demo.*\.(mp4|mov|webm)$/i, /^clip.*\.(mp4|mov|webm)$/i]);
  const bgmFile = locate([/^bgm.*\.(mp3|wav|m4a)$/i]);

  const supporting = readdirSync(brandDir)
    .filter((file) => /\.(svg|png|jpg|jpeg|webp)$/i.test(file) && ![homepageFile, productFile, heroFile, logoFile, wordmarkFile].includes(file))
    .slice(0, 6)
    .map((file) => fileRecord("proof-image", basename(file), join(brandDir, file), "existing-brand-dir"));

  return {
    screenshotProof: {
      homepage: homepageFile ? fileRecord("homepage-screenshot", "Homepage screenshot", join(brandDir, homepageFile), "existing-brand-dir") : null,
      product: productFile ? fileRecord("product-screenshot", "Product screenshot", join(brandDir, productFile), "existing-brand-dir") : null,
      hero: heroFile ? fileRecord("hero-image", "Hero image", join(brandDir, heroFile), "existing-brand-dir") : null,
      supporting,
    },
    videoProof: {
      primary: videoFile ? fileRecord("video", "Product video", join(brandDir, videoFile), "existing-brand-dir") : null,
      candidates: [],
      attempted: Boolean(videoFile),
    },
    brandAssetProof: {
      logo: logoFile ? fileRecord("logo", "Logo", join(brandDir, logoFile), "existing-brand-dir") : null,
      wordmark: wordmarkFile ? fileRecord("wordmark", "Wordmark", join(brandDir, wordmarkFile), "existing-brand-dir") : null,
      fonts: [],
    },
  };
}

function buildEvidenceDimensions(report: Omit<BrandReport, "score" | "suggestedMode" | "risks">): EvidenceDimensions {
  const screenshotCompleteness =
    (report.screenshotProof.homepage ? 45 : 0) +
    (report.screenshotProof.product ? 35 : 0) +
    (report.screenshotProof.hero ? 10 : 0) +
    Math.min(report.screenshotProof.supporting.length * 5, 10);

  const videoUsefulness =
    report.videoProof.primary?.status === "downloaded"
      ? 85
      : report.videoProof.primary?.status === "referenced"
        ? 55
        : report.videoProof.candidates.length > 0
          ? 25
          : 0;

  const logoQuality =
    report.brandAssetProof.logo?.localPath?.endsWith(".svg")
      ? 90
      : report.brandAssetProof.logo
        ? 65
        : report.brandAssetProof.wordmark
          ? 40
          : 0;

  const fontCertainty = clampScore(
    report.designTruth.fontFamilies.length * 25 + (report.brandAssetProof.fonts.length > 0 ? 20 : 0),
  );

  const productClarity = clampScore(
    report.structureTruth.productClarity === "high"
      ? 85
      : report.structureTruth.productClarity === "medium"
        ? 55
        : report.screenshotProof.product
          ? 60
          : report.screenshotProof.hero
            ? 35
            : 20,
  );

  const proofRichness = clampScore(
    report.structureTruth.notes.length * 12 +
      (report.structureTruth.proofStyle === "mixed" ? 20 : report.structureTruth.proofStyle === "unknown" ? 0 : 15) +
      report.screenshotProof.supporting.length * 6,
  );

  const brandDistinctiveness = clampScore(
    Math.min(report.designTruth.colors.length, 8) * 8 +
      Math.min(report.designTruth.fontFamilies.length, 3) * 12 +
      (report.textTruth.headline ? 18 : 0) +
      (report.textTruth.subheadline ? 10 : 0),
  );

  return {
    screenshotCompleteness,
    videoUsefulness,
    logoQuality,
    fontCertainty,
    productClarity,
    proofRichness,
    brandDistinctiveness,
  };
}

function buildRationale(report: Omit<BrandReport, "score" | "suggestedMode" | "risks">): string[] {
  const rationale: string[] = [];

  if (report.screenshotProof.homepage) {
    rationale.push("Homepage screenshot proof is present.");
  } else {
    rationale.push("Homepage screenshot proof is missing.");
  }

  if (report.screenshotProof.product || report.screenshotProof.hero) {
    rationale.push("A product or hero visual exists, so composition can stay brand-faithful.");
  } else {
    rationale.push("No strong product/hero visual was found; editorial fallback may be required.");
  }

  if (report.videoProof.primary) {
    rationale.push("A usable video source exists for motion reference.");
  } else {
    rationale.push("No usable video source was harvested.");
  }

  if (report.structureTruth.uiPresence === "strong") {
    rationale.push("The site language and assets imply strong UI presence.");
  }

  return rationale;
}

// ----------------------------------------------------------------
//  Browser screenshot: prefer playwright (stable, CLI-friendly),
//  fall back to agent-browser if that's what the user has wired up.
//  Playwright's `screenshot` subcommand handles navigation, timeout,
//  and full-page capture in a single exec — no multi-step dance.
// ----------------------------------------------------------------
function attemptBrowserScreenshot(url: string, destination: string, harvestActions: string[]): boolean {
  if (hasCommand("playwright")) {
    try {
      execFileSync(
        "playwright",
        ["screenshot", "--wait-for-timeout", "2000", "--full-page", url, destination],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      harvestActions.push(`Captured rendered screenshot via playwright -> ${destination}`);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message.split("\n")[0] : String(error);
      harvestActions.push(`playwright screenshot failed: ${msg}`);
      // fall through to agent-browser
    }
  }

  if (hasCommand("agent-browser")) {
    try {
      execFileSync("agent-browser", ["open", url], { stdio: "ignore" });
      execFileSync("agent-browser", ["wait", "1500"], { stdio: "ignore" });
      execFileSync("agent-browser", ["screenshot", destination], { stdio: "ignore" });
      harvestActions.push(`Captured rendered screenshot via agent-browser -> ${destination}`);
      return true;
    } catch {
      harvestActions.push("agent-browser screenshot attempt failed; falling back to downloadable image evidence.");
      return false;
    }
  }

  harvestActions.push("No browser automation tool available; rendered screenshot skipped.");
  return false;
}

function chooseImageExtension(url: string): string {
  const extension = extname(new URL(url).pathname || "").toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extension)) {
    return extension;
  }
  return ".png";
}

async function attemptVideoDownload(candidateUrl: string, destination: string, harvestActions: string[]): Promise<boolean> {
  if (!hasCommand("yt-dlp")) {
    harvestActions.push("yt-dlp not found; video download skipped.");
    return false;
  }

  try {
    execFileSync(
      "yt-dlp",
      ["-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]", "-o", destination, candidateUrl],
      { stdio: "ignore" },
    );
    harvestActions.push(`Downloaded video proof from ${candidateUrl}`);
    return true;
  } catch {
    harvestActions.push(`Video download failed for ${candidateUrl}`);
    return false;
  }
}

// ----------------------------------------------------------------
//  BGM harvest — cascade search
//
//  Bugs we learned the hard way:
//    1. Including the full page title in the query (e.g. "Raycast -
//       Your shortcut to everything royalty free ...") tanks YouTube
//       search recall; ytsearch1 returns zero items and yt-dlp
//       exits 0 with no file. The next ffmpeg call then crashes on
//       ENOENT and the catch block blames "BGM automation failed".
//    2. `stdio: "ignore"` silently swallows the real failure signal
//       ("Downloading 0 items"), so the harvest log gives no hint.
//
//  Fix: use generic royalty-free queries (brand name is useless in
//  music search), cascade through several candidates, verify the
//  file actually exists after each attempt, and surface the last
//  error tail into harvestActions so users can debug.
// ----------------------------------------------------------------
const BGM_FALLBACK_QUERIES = [
  "corporate ambient background music no copyright",
  "uplifting corporate background music instrumental no copyright",
  "cinematic tech background music royalty free",
  "minimal electronic background music no copyright",
] as const;

async function attemptBgmDownload(brandDir: string, hintQuery: string, harvestActions: string[]): Promise<AssetRecord | null> {
  if (!hasCommand("yt-dlp") || !hasCommand("ffmpeg")) {
    harvestActions.push("BGM automation skipped because yt-dlp or ffmpeg is unavailable.");
    return null;
  }

  const rawPath = join(brandDir, "bgm-raw.mp3");
  const bgmPath = join(brandDir, "bgm.mp3");
  const queries = [hintQuery, ...BGM_FALLBACK_QUERIES];
  let lastError = "";

  for (const query of queries) {
    // Clean any leftover from a prior failed attempt
    try { if (existsSync(rawPath)) rmSync(rawPath, { force: true }); } catch { /* ignore */ }

    try {
      execFileSync(
        "yt-dlp",
        ["-x", "--audio-format", "mp3", "--no-playlist", "-o", rawPath, `ytsearch1:${query}`],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message.split("\n").slice(-3).join(" ").slice(0, 240) : String(error);
      continue;
    }

    // yt-dlp exits 0 on empty playlist — must verify the file exists.
    if (!existsSync(rawPath)) {
      lastError = `yt-dlp returned 0 items for query "${query}"`;
      continue;
    }

    try {
      execFileSync(
        "ffmpeg",
        ["-y", "-i", rawPath, "-t", "45", "-af", "afade=in:0:d=2,afade=out:st=42:d=3", bgmPath],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message.split("\n").slice(-3).join(" ").slice(0, 240) : String(error);
      continue;
    }

    harvestActions.push(`Generated BGM from search query: ${query}`);
    return {
      kind: "bgm",
      label: "Background music",
      localPath: bgmPath,
      source: "manual",
      status: "downloaded",
      notes: `Source query: ${query}`,
    };
  }

  harvestActions.push(`BGM automation failed after ${queries.length} queries. Last error: ${lastError || "unknown"}`);
  return null;
}

function attemptBeatMap(scriptDir: string, outputDir: string, brandDir: string, harvestActions: string[]): void {
  const bgmPath = join(brandDir, "bgm.mp3");
  if (!existsSync(bgmPath)) {
    harvestActions.push("Beat-map generation skipped because no BGM was harvested.");
    return;
  }

  try {
    execFileSync(
      process.execPath,
      ["--experimental-strip-types", join(scriptDir, "beat-sync.ts"), bgmPath, "--fps", "30"],
      {
        cwd: outputDir,
        stdio: "ignore",
      },
    );
    harvestActions.push("Generated beat-map.json from harvested BGM.");
  } catch {
    harvestActions.push("Beat-map generation failed; review beat-sync manually.");
  }
}

// ----------------------------------------------------------------
//  Visual audit runner: runs the static QA pass (font sizes,
//  safe zones, contrast, beat pulse hit count, BGM segment
//  silence) against the freshly generated project. Always writes
//  visual-audit-report.txt and always appends a summary block to
//  review.md so the human sees QA state without needing to rerun
//  anything. Never throws — audit non-zero exit is information.
// ----------------------------------------------------------------
function attemptVisualAudit(scriptDir: string, outputDir: string): void {
  const localScript = join(outputDir, "scripts", "visual-audit.ts");
  const auditScript = existsSync(localScript) ? localScript : join(scriptDir, "visual-audit.ts");
  if (!existsSync(auditScript)) {
    return;
  }

  let output = "";
  let status: "PASS" | "FAIL" | "ERROR" = "PASS";

  try {
    output = execFileSync(
      process.execPath,
      ["--experimental-strip-types", auditScript],
      {
        cwd: outputDir,
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf-8",
      },
    );
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; status?: number };
    output = `${err.stdout || ""}${err.stderr || ""}`.trim();
    status = err.status === 1 ? "FAIL" : "ERROR";
  }

  const trimmed = output.trim() || "(no output captured)";
  const summaryLine =
    trimmed.split("\n").find((line) => /^SUMMARY:/.test(line)) ||
    trimmed.split("\n").slice(-1)[0] ||
    "(no summary)";

  // Always persist the full raw report.
  writeFileSync(join(outputDir, "visual-audit-report.txt"), `${trimmed}\n`);

  // Always append a readable block to review.md.
  const reviewPath = join(outputDir, "review.md");
  if (existsSync(reviewPath)) {
    const current = readFileSync(reviewPath, "utf-8");
    const block = `
## Visual Audit — ${status}
- ${summaryLine.trim()}
- Full report: \`visual-audit-report.txt\`
`;
    writeFileSync(reviewPath, `${current.trimEnd()}\n${block}`);
  }
}

// ----------------------------------------------------------------
//  采集管线: fetchPage -> downloadAssets -> downloadBgm -> assembleProof
// ----------------------------------------------------------------

interface PageData {
  html: string;
  cssText: string;
  textTruth: TextTruth;
  imageCandidates: ReturnType<typeof pickImageCandidates>;
  videoCandidates: string[];
}

async function fetchPage(url: string, offline: boolean): Promise<PageData> {
  const html = offline ? "" : await safeFetchText(url);
  const cssText = offline ? "" : await fetchCssText(html, url, offline);
  const textTruth = html.length > 0
    ? extractTextTruth(html)
    : { title: brandLabelFromUrl(url), headline: brandLabelFromUrl(url), subheadline: "", cta: [], featureNames: [] };
  const imageCandidates = html.length > 0 ? pickImageCandidates(html, url) : { logo: [], screenshots: [], supporting: [] };
  const videoCandidates = html.length > 0 ? pickVideoCandidates(html, url) : [];
  return { html, cssText, textTruth, imageCandidates, videoCandidates };
}

async function downloadAssets(
  url: string, page: PageData, brandDir: string, offline: boolean, actions: string[],
): Promise<void> {
  if (!existsSync(join(brandDir, "homepage.png")) && !offline) {
    attemptBrowserScreenshot(url, join(brandDir, "homepage.png"), actions);
  }
  if (!existsSync(join(brandDir, "logo.svg")) && page.imageCandidates.logo[0]) {
    const target = join(brandDir, `logo${chooseImageExtension(page.imageCandidates.logo[0])}`);
    if (await safeDownload(page.imageCandidates.logo[0], target)) {
      actions.push(`Downloaded logo from ${page.imageCandidates.logo[0]}`);
    }
  }
  const shots: Array<{ url: string; target: string; label: string }> = [];
  if (!existsSync(join(brandDir, "hero.png")) && page.imageCandidates.screenshots[0]) {
    shots.push({ url: page.imageCandidates.screenshots[0], target: join(brandDir, "hero.png"), label: "hero" });
  }
  if (!existsSync(join(brandDir, "product-ui.png")) && page.imageCandidates.screenshots[1]) {
    shots.push({ url: page.imageCandidates.screenshots[1], target: join(brandDir, "product-ui.png"), label: "product" });
  }
  for (const s of shots) {
    if (await safeDownload(s.url, s.target)) actions.push(`Downloaded ${s.label} from ${s.url}`);
  }
  if (!existsSync(join(brandDir, "demo.mp4")) && page.videoCandidates[0]) {
    await attemptVideoDownload(page.videoCandidates[0], join(brandDir, "demo.mp4"), actions);
  }
}

function assembleProof(
  page: PageData, existing: ReturnType<typeof inspectExistingEvidence>, brandDir: string, actions: string[],
): { designTruth: DesignTruth; structureTruth: StructureTruth; brandAssetProof: BrandAssetProof; screenshotProof: ScreenshotProof; videoProof: VideoProof } {
  const fonts = extractFontFamilies(page.cssText, page.html);
  const websiteColor = extractBrandColorFromWebsite(brandDir);
  if (websiteColor) {
    actions.push(`Screenshot hue sample: ${websiteColor} (fallback only — CSS palette is source of truth)`);
  }
  const designTruth = buildDesignTruth(extractColorHexes(page.cssText, page.html), fonts, `${page.cssText}\n${page.html}`, websiteColor);
  // Hue-divergence audit: when CSS and screenshot point at different hue
  // families (e.g. orange logo PNG on a blue website), surface the conflict
  // so future tuning can investigate the asset rather than silently failing.
  if (websiteColor && designTruth.primaryColor && websiteColor !== designTruth.primaryColor) {
    const hueGap = hueDistance(hueDegrees(designTruth.primaryColor), hueDegrees(websiteColor));
    if (hueGap > 60) {
      actions.push(`HUE CONFLICT: CSS primary ${designTruth.primaryColor} vs screenshot sample ${websiteColor} (Δ${Math.round(hueGap)}°). Trusting CSS palette — screenshot likely sampled a logo PNG that doesn't match the site surface.`);
    }
  }
  const structureTruth = page.html.length > 0 ? inferStructureTruth(page.html, page.textTruth) : inferOfflineStructureTruth(existing);

  return {
    designTruth,
    structureTruth,
    brandAssetProof: {
      logo: existing.brandAssetProof.logo || (page.imageCandidates.logo[0] ? candidateRecord("logo", "Logo", page.imageCandidates.logo[0]) : null),
      wordmark: existing.brandAssetProof.wordmark,
      fonts,
    },
    screenshotProof: {
      homepage: existing.screenshotProof.homepage,
      product: existing.screenshotProof.product || (page.imageCandidates.screenshots[1] ? candidateRecord("product-screenshot", "Product screenshot", page.imageCandidates.screenshots[1]) : null),
      hero: existing.screenshotProof.hero || (page.imageCandidates.screenshots[0] ? candidateRecord("hero-image", "Hero image", page.imageCandidates.screenshots[0]) : null),
      supporting: existing.screenshotProof.supporting,
    },
    videoProof: {
      primary: existing.videoProof.primary || (page.videoCandidates[0] ? candidateRecord("video", "Primary video candidate", page.videoCandidates[0], /youtube|vimeo/i.test(page.videoCandidates[0]) ? "traceable-embed" : "same-origin-media") : null),
      candidates: page.videoCandidates.slice(1).map((c, i) => candidateRecord("video", `Secondary video ${i + 1}`, c, /youtube|vimeo/i.test(c) ? "traceable-embed" : "same-origin-media")),
      attempted: page.html.length === 0 ? Boolean(existing.videoProof.primary) : true,
    },
  };
}

async function harvestBrand(url: string, context: HarvestContext): Promise<HarvestResult> {
  const actions: string[] = [];

  if (context.reuseBrandDir && existsSync(context.reuseBrandDir)) {
    copyExistingBrandDir(context.reuseBrandDir, context.brandDir);
    actions.push(`Reused local evidence from ${context.reuseBrandDir}`);
  }

  const page = await fetchPage(url, context.offline);
  await downloadAssets(url, page, context.brandDir, context.offline, actions);

  // Mobile-app bonus harvest: if the homepage links to apps.apple.com, pull
  // the full App Store screenshot gallery. A single `product-ui.png` is not
  // enough — Act 3 needs 3+ DIFFERENT phone screens or it looks like the
  // same asset panned three ways (which it is).
  if (!context.offline) {
    await attemptAppStoreGalleryHarvest(page.html, context.brandDir, actions);
  }

  if (!existsSync(join(context.brandDir, "bgm.mp3")) && !context.offline) {
    // Brand name is deliberately NOT used in the query — YouTube search
    // for "<brand> royalty free music" almost always returns zero hits.
    // BUT a fixed query gave every project the SAME track (2026-07-04
    // same-md5 incident, twice). Fix: pick from a mood pool by a
    // deterministic brand-name hash — different brands, different queries.
    // Callers must still md5-dedup vs the global bgm ledger (workflow.md).
    const BGM_MOOD_POOL = [
      "corporate ambient background music no copyright",
      "uplifting acoustic background music instrumental no copyright",
      "cinematic technology background music royalty free",
      "minimal electronic ambient music no copyright",
      "warm indie electronic background music no copyright",
      "elegant piano ambient background music royalty free",
      "driving electronic corporate music no copyright",
      "playful upbeat background music instrumental no copyright",
    ];
    const nameSeed = [...url].reduce((a, c) => a + c.charCodeAt(0), 0);
    await attemptBgmDownload(context.brandDir, BGM_MOOD_POOL[nameSeed % BGM_MOOD_POOL.length], actions);
  }

  const existing = inspectExistingEvidence(context.brandDir);
  const proof = assembleProof(page, existing, context.brandDir, actions);

  return { html: page.html, cssText: page.cssText, textTruth: page.textTruth, ...proof, harvestActions: actions };
}

// ================================================================
// App Store gallery harvester
//
// Why: The App Store marketing page exposes 3-10 real in-app phone
// screenshots as direct CDN URLs. Our homepage crawler often only pulls
// one `product-ui.png` hero image — which forces Act 3 to render the
// same asset three times with only pan offsets. That reads as "lazy
// template" to anyone with eyes. Pulling the real gallery means each
// Act 3 vignette can show a DIFFERENT app screen and Rimbo stops looking
// like Rackracy.
//
// Flow: find apps.apple.com/...idN in html → fetch that page with a
// mobile UA → regex PurpleSource*.png/{w}x{h}{c}.{f} template URLs →
// rewrite to 1290x2796bb.png → download as app-screen-1..N.png.
// ================================================================
async function attemptAppStoreGalleryHarvest(
  homepageHtml: string,
  brandDir: string,
  actions: string[],
): Promise<void> {
  const match = homepageHtml.match(/https?:\/\/apps\.apple\.com\/[^\s"'<>]*id\d+/i);
  if (!match) return;
  const appStoreUrl = match[0];
  let html: string;
  try {
    const res = await fetch(appStoreUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      actions.push(`App Store gallery fetch failed: HTTP ${res.status} for ${appStoreUrl}`);
      return;
    }
    html = await res.text();
  } catch (error) {
    actions.push(`App Store gallery fetch error: ${(error as Error).message}`);
    return;
  }

  // PurpleSource URLs are the screenshot CDN. Template ends in /{w}x{h}{c}.{f}
  // and there's one entry per unique screenshot (numbered 1.png, 2.png, ...).
  // De-dupe on the base path so we don't download the same screenshot at
  // multiple resolutions.
  const templateRe =
    /https:\/\/is\d-ssl\.mzstatic\.com\/image\/thumb\/PurpleSource[^/]+\/v4\/[0-9a-f/-]+\/\d+\.png\/\{w\}x\{h\}\{c\}\.\{f\}/g;
  const unique = new Set<string>();
  const matches = html.match(templateRe) || [];
  for (const template of matches) {
    // Only keep entries that end in N.png (gallery screenshots), skip .mill/.webp/etc.
    if (/\/\d+\.png\/\{/.test(template)) unique.add(template);
  }
  const templates = [...unique].sort();
  if (templates.length === 0) {
    actions.push(`App Store page loaded but no PurpleSource screenshots found (${appStoreUrl})`);
    return;
  }

  const take = Math.min(5, templates.length);
  let downloaded = 0;
  for (let i = 0; i < take; i++) {
    const url = templates[i].replace("{w}x{h}{c}.{f}", "1290x2796bb.png");
    const dest = join(brandDir, `app-screen-${i + 1}.png`);
    const ok = await safeDownload(url, dest);
    if (ok) downloaded += 1;
  }
  if (downloaded > 0) {
    actions.push(
      `App Store gallery: downloaded ${downloaded} real phone screenshots as app-screen-1..${downloaded}.png (source: ${appStoreUrl})`,
    );
  } else {
    actions.push(`App Store gallery: found ${templates.length} templates but all downloads failed`);
  }
}

// ================================================================
// PNG dimension reader — IHDR chunk lives at byte 16-23.
// PNG header: 8 bytes, then IHDR chunk: 4 length + 4 "IHDR" + 4 width + 4 height + ...
// ================================================================
function readPngDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const fd = openSync(filePath, "r");
    const buf = Buffer.alloc(24);
    readSync(fd, buf, 0, 24, 0);
    closeSync(fd);
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

// ================================================================
// productCategory detection
//
// Why this exists separate from structureTruth.productType:
//   productType is text-keyword inferred → governs narrative archetype
//   productCategory is asset/url-shape inferred → governs scene FORM
//   (phone frame vs browser frame vs hardware shot)
//
// Signals (cumulative, highest-confidence wins):
//   mobile-app:
//     - logo URL contains "app-store" / "play-store" / "ios" / "android"
//     - logo PNG is 1024×1024 (App Store icon spec) or 512×512 (Play)
//     - any product screenshot has 9:16 aspect (portrait phone)
//     - HTML contains "Download on the App Store" / "Get it on Google Play"
//     - HTML contains apps.apple.com / play.google.com link
//   developer-tool:
//     - HTML mentions "npm install" / "pip install" / "cargo add" / "go get"
//     - HTML has <code> blocks with shell commands
//     - hostname matches docs./api./developers.
//   hardware:
//     - HTML mentions "shipping" / "preorder" / "free returns" / "warranty"
//     - product imagery is 1:1 square or transparent PNG (product cutouts)
//   marketplace:
//     - HTML mentions "buyers and sellers" / "list your" / "browse listings"
//   content-media:
//     - HTML has many <article> tags / publication date metadata
//   saas-desktop (DEFAULT for sites with dashboards but no mobile signals)
// ================================================================
function detectProductCategory(
  url: string,
  html: string,
  brandDir: string,
  brandAssetProof: BrandAssetProof,
  screenshotProof: ScreenshotProof,
): ProductCategorySignal {
  const reasons: string[] = [];
  const lower = html.toLowerCase();
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();

  // ---- mobile-app signals ----
  let mobileScore = 0;
  const logoSrc = brandAssetProof.logo?.sourceUrl?.toLowerCase() || "";
  const logoPath = brandAssetProof.logo?.localPath || "";
  if (/app-store|appstore|ios-app|play-store|google-play/.test(logoSrc)) {
    mobileScore += 3;
    reasons.push(`logo URL contains app-store marker: ${logoSrc.split("/").pop()}`);
  }
  if (logoPath && existsSync(logoPath)) {
    const dim = readPngDimensions(logoPath);
    if (dim && dim.width === dim.height && (dim.width === 1024 || dim.width === 512)) {
      mobileScore += 2;
      reasons.push(`logo is ${dim.width}² square (App Store / Play Store icon spec)`);
    }
  }
  // Check screenshots aspect ratio for portrait
  for (const name of ["product-ui.png", "hero.png", "homepage.png"]) {
    const p = join(brandDir, name);
    if (!existsSync(p)) continue;
    const dim = readPngDimensions(p);
    if (!dim) continue;
    const aspect = dim.width / dim.height;
    if (aspect < 0.65 && dim.height > 1200) {
      mobileScore += 2;
      reasons.push(`${name} is ${dim.width}×${dim.height} (portrait, phone aspect ${aspect.toFixed(2)})`);
      break;
    }
  }
  if (/download on the app store|get it on google play|app store badge|download from the app store/i.test(html)) {
    mobileScore += 3;
    reasons.push("HTML contains App Store / Play Store download badge text");
  }
  if (/apps\.apple\.com|play\.google\.com\/store/i.test(html)) {
    mobileScore += 3;
    reasons.push("HTML links to apps.apple.com or play.google.com");
  }

  // ---- developer-tool signals ----
  let devScore = 0;
  if (/\b(npm install|pip install|cargo add|go get|brew install|yarn add)\b/i.test(lower)) {
    devScore += 3;
    reasons.push("HTML contains package manager install command");
  }
  if (/^(docs|api|developers?)\./i.test(host)) {
    devScore += 2;
    reasons.push(`hostname starts with ${host.split(".")[0]}.`);
  }
  if ((lower.match(/<code/g) || []).length > 5) {
    devScore += 1;
    reasons.push("HTML has many <code> blocks");
  }

  // ---- hardware signals ----
  let hardwareScore = 0;
  if (/\b(free shipping|preorder|warranty|free returns|in the box|tech specs)\b/i.test(lower)) {
    hardwareScore += 2;
    reasons.push("HTML contains hardware commerce vocabulary");
  }

  // ---- marketplace signals ----
  let marketScore = 0;
  if (/buyers and sellers|list your|browse listings|find a (?:host|driver|tasker|cleaner|seller)/i.test(lower)) {
    marketScore += 3;
    reasons.push("HTML contains marketplace two-sided vocabulary");
  }

  // ---- content-media signals ----
  let mediaScore = 0;
  const articleCount = (lower.match(/<article/g) || []).length;
  if (articleCount > 4) {
    mediaScore += 2;
    reasons.push(`HTML has ${articleCount} <article> tags`);
  }
  if (/published\s*(?:on|:)|byline|editor-in-chief/i.test(lower)) {
    mediaScore += 1;
    reasons.push("HTML has editorial metadata");
  }

  // ---- pick winner ----
  const scores: Array<[ProductCategory, number]> = [
    ["mobile-app", mobileScore],
    ["developer-tool", devScore],
    ["hardware", hardwareScore],
    ["marketplace", marketScore],
    ["content-media", mediaScore],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = scores[0];

  if (topScore >= 4) return { category: topCat, confidence: "high", reasons };
  if (topScore >= 2) return { category: topCat, confidence: "medium", reasons };
  // Default for sites with no strong category signal but with dashboard / SaaS smell
  if (/\b(dashboard|workspace|team|workflow|analytics|integration|api)\b/i.test(lower)) {
    reasons.push("Defaulted to saas-desktop (dashboard/workspace vocabulary present, no mobile signals)");
    return { category: "saas-desktop", confidence: "low", reasons };
  }
  reasons.push("Defaulted to unknown (no clear category signals)");
  return { category: "unknown", confidence: "low", reasons };
}

function buildBrandReport(url: string, harvest: HarvestResult, brandDir: string): BrandReport {
  const rawBrandName =
    harvest.textTruth.title.split("|")[0]?.split("–")[0]?.split("-")[0]?.trim()
    || brandLabelFromUrl(url);
  const brandName = /\./.test(rawBrandName) ? brandLabelFromUrl(url) : rawBrandName;

  const productCategory = detectProductCategory(
    url,
    harvest.html,
    brandDir,
    harvest.brandAssetProof,
    harvest.screenshotProof,
  );
  harvest.harvestActions.push(
    `Product category: ${productCategory.category} (${productCategory.confidence} confidence) — ${productCategory.reasons.slice(0, 3).join("; ")}`,
  );

  const draftReport: Omit<BrandReport, "score" | "suggestedMode" | "risks"> = {
    sourceUrl: url,
    generatedAt: new Date().toISOString(),
    brandName,
    textTruth: harvest.textTruth,
    designTruth: harvest.designTruth,
    structureTruth: harvest.structureTruth,
    productCategory,
    screenshotProof: harvest.screenshotProof,
    videoProof: harvest.videoProof,
    brandAssetProof: harvest.brandAssetProof,
    harvestActions: harvest.harvestActions,
  };

  const score = computeEvidenceScore(buildEvidenceDimensions(draftReport), buildRationale(draftReport));
  const suggestedMode = detectModeFromReport({
    score,
    structureTruth: draftReport.structureTruth,
    screenshotProof: draftReport.screenshotProof,
  });
  const risks = buildGapList({ ...draftReport, score, suggestedMode, risks: [] });

  return {
    ...draftReport,
    score,
    suggestedMode,
    risks,
  };
}

function buildAssetManifest(report: BrandReport, brandDir: string): AssetManifest {
  const requiredAssets: AssetKind[] = ["logo", "homepage-screenshot", "bgm"];

  if (report.suggestedMode === "product-evidence") {
    requiredAssets.push("product-screenshot", "video");
  } else if (report.suggestedMode === "editorial") {
    requiredAssets.push("hero-image");
  }

  const assets = collectManifestAssets(report);
  const bgmPath = join(brandDir, "bgm.mp3");
  if (existsSync(bgmPath)) {
    assets.push({
      kind: "bgm",
      label: "Background music",
      localPath: bgmPath,
      source: "manual",
      status: "downloaded",
    });
  }

  // App Store gallery screenshots — registered so the scaffold
  // dedup gate + Act 3 cover loader can find them by kind.
  for (let i = 1; i <= 10; i++) {
    const p = join(brandDir, `app-screen-${i}.png`);
    if (existsSync(p)) {
      assets.push({
        kind: "app-store-screenshot",
        label: `App Store screenshot ${i}`,
        localPath: p,
        source: "official-site",
        status: "downloaded",
      });
    }
  }

  return {
    sourceUrl: report.sourceUrl,
    generatedAt: report.generatedAt,
    requiredAssets,
    assets,
    gaps: buildGapList(report),
  };
}

async function main(): Promise<void> {
  const options = parseArgs();

  // Ensure the external toolchain is installed before touching the
  // filesystem. If the user says no, we proceed in degraded mode and
  // features like BGM / beat-sync / rendered screenshots are skipped.
  preflight(options.autoInstall);

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const skillDir = resolve(scriptDir, "..");

  copyScaffoldProject({
    skillDir,
    outputDir: options.outputDir,
    projectName: options.projectName,
    force: options.force,
  });

  const brandDir = join(options.outputDir, "public", "brand");
  mkdirSync(brandDir, { recursive: true });

  const harvest = await harvestBrand(options.url, {
    brandDir,
    offline: options.offline,
    reuseBrandDir: options.reuseBrandDir,
  });

  attemptBeatMap(scriptDir, options.outputDir, brandDir, harvest.harvestActions);

  const brandReport = buildBrandReport(options.url, harvest, brandDir);
  const sceneConstitution = buildSceneConstitution(brandReport);
  const assetManifest = buildAssetManifest(brandReport, brandDir);

  writeProjectArtifacts(options.outputDir, brandReport, sceneConstitution, assetManifest);

  // Post-artifact static QA sweep. Runs against the freshly-written
  // project (MainVideo.tsx + Root.tsx + beat-map.ts), not just the
  // scaffold defaults, so it can actually see wrong font sizes or
  // disco-strobe pulse configs. Non-blocking: failures land in
  // visual-audit-report.txt and a one-liner in harvest.harvestActions.
  attemptVisualAudit(scriptDir, options.outputDir);

  console.log("URL-TO-VIDEO V2");
  console.log(`Source URL: ${options.url}`);
  console.log(`Output: ${options.outputDir}`);
  console.log(`Mode: ${brandReport.suggestedMode}`);
  console.log(`Evidence score: ${brandReport.score.overall} (${brandReport.score.level})`);
  console.log(`Primary archetype: ${sceneConstitution.archetype.primary}`);
  console.log(`Scenes: ${sceneConstitution.sceneList.length}`);

  if (brandReport.risks.length > 0) {
    console.log("Risks:");
    for (const risk of brandReport.risks) {
      console.log(`- ${risk}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
