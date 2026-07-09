#!/usr/bin/env node
/**
 * 30x-web-to-video — one URL in, a launch video project out.
 *
 * Stage 1 (deterministic): harvest the brand site + scaffold a Remotion
 *   project via the bundled orchestrator.
 * Stage 2 (agentic taste): install the bundled skill into the project's
 *   .claude/skills/ and hand off to Claude Code, which designs the five
 *   acts under the battle-tested rules (12-brand validated codex).
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const url = args.find((a) => !a.startsWith("--"));

const HELP = `
30x-web-to-video — one URL in, an agency-grade launch video out.

Usage:
  npx 30x-web-to-video <brand-url> [--out <dir>] [--agent] [--no-harvest]
  npx 30x-web-to-video --global              # install skill for ALL projects (~/.claude/skills)

Options:
  --global       Install the skill user-wide (~/.claude/skills) instead of per-project
  --out <dir>    Output project directory (default: ./<brand>-launch-video)
  --agent        After harvest, launch Claude Code on the build prompt
                 (requires the \`claude\` CLI; agent time/tokens are yours)
  --no-harvest   Skip harvest; only (re)install the skill + print next steps
  -h, --help     Show this help

What you get:
  1. Brand harvest: real colors/fonts/copy/logo/screenshots/BGM from the site
  2. A Remotion project scaffold wired with the evidence
  3. The 30x-web-to-video skill installed into ./.claude/skills/ — Claude Code
     picks it up automatically and designs the five acts under its taste codex
     (asset-audit gates, Claim→World artifact selection, small-text budget,
     transition families, word-timestamp narration sync, BGM variety mandate)

Requirements: node 20+. ffmpeg/yt-dlp/playwright auto-install during harvest.
Optional: ELEVENLABS_API_KEY in the project .env for premium narration
(falls back to Kokoro local TTS — zero keys needed).
`;

const helpRequested = flags.has("--help") || flags.has("-h");
if (helpRequested || (!url && !flags.has("--global"))) {
  console.log(HELP.trim());
  process.exit(helpRequested || url || flags.has("--global") ? 0 : 1);
}

const slug = (() => {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .split(".")[0];
  } catch {
    return "brand";
  }
})();
const outIdx = args.indexOf("--out");
const outDir = resolve(outIdx > -1 && args[outIdx + 1] ? args[outIdx + 1] : `./${slug}-launch-video`);

// ── 1) install the skill into the project-local .claude/skills ──────────
const skillSrc = join(__dirname, "skill");
const skillDst = flags.has("--global")
  ? join(process.env.HOME || process.cwd(), ".claude", "skills", "30x-web-to-video")
  : join(process.cwd(), ".claude", "skills", "30x-web-to-video");
mkdirSync(dirname(skillDst), { recursive: true });
cpSync(skillSrc, skillDst, { recursive: true });
console.log(`✔ skill installed → ${skillDst}`);

if (flags.has("--global") && !url) {
  console.log("✔ skill installed user-wide. Open Claude Code anywhere and say: 给 <brand-url> 做个 launch video");
  process.exit(0);
}

// ── 2) deterministic harvest + scaffold ─────────────────────────────────
if (!flags.has("--no-harvest")) {
  const tsxCli = require.resolve("tsx/cli");
  const orchestrator = join(skillSrc, "scripts", "url-to-video.ts");
  console.log(`⛏ harvesting ${url} → ${outDir}\n`);
  const r = spawnSync(process.execPath, [tsxCli, orchestrator, url, "--out", outDir, "--yes"], {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error(
      "\n✖ harvest failed. If the site blocks scrapers (403), open Claude Code and say:\n" +
        `  "用 30x-web-to-video skill 的 403 playbook 给 ${url} 人工采收后出片"`,
    );
    process.exit(r.status ?? 1);
  }
}

// ── 3) hand off to the agent ─────────────────────────────────────────────
// --no-harvest skips the scaffold step above, so outDir is never actually
// created — point the user at the directory that really got touched
// (the one the skill was just installed into) instead of a phantom path.
const projectDir = flags.has("--no-harvest") ? process.cwd() : outDir;
const prompt = `用 30x-web-to-video skill 完成 ${projectDir} 的 launch video：先读 SKILL.md 与 rules/（尤其 artifact-catalog 选型优先级、taste、typography、narration-sync），Gate 1 逐张审计素材，然后设计五幕、配音配乐、每幕渲证据帧自检，最后开 remotion studio 给我预览。`;

const hasClaude = spawnSync("claude", ["--version"], { stdio: "ignore" }).status === 0;
if (flags.has("--agent") && hasClaude) {
  console.log("\n🤖 handing off to Claude Code…\n");
  const a = spawnSync("claude", [prompt], { stdio: "inherit", cwd: projectDir });
  process.exit(a.status ?? 0);
}

console.log(`
── next step ────────────────────────────────────────────────
${hasClaude ? "Run:" : "Install Claude Code (https://claude.com/claude-code), then run:"}

  cd ${projectDir}
  claude "${prompt.replace(/"/g, '\\"')}"

(or re-run with --agent to launch it automatically)
─────────────────────────────────────────────────────────────`);
