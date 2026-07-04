/**
 * [INPUT]: benchmarks/manifest.json, url-to-video.ts, optional local evidence packs, optional install/verify/render flags
 * [OUTPUT]: per-benchmark result JSON files plus one suite summary for regression runs
 * [POS]: scripts/ 的 benchmark orchestrator; 把 canonical URL 清单压成可执行回归与评测证据
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
//  URL-TO-VIDEO V2 — Benchmark Suite Runner
//  Run:
//    node --experimental-strip-types scripts/benchmark-suite.ts
//    node --experimental-strip-types scripts/benchmark-suite.ts --match stripe-fintech --offline --reuse-brand-dir ../stripe-launch-video/public/brand --install --verify --render
// ================================================================

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { slugify } from "./project-blueprint.ts";

interface BenchmarkEntry {
  id: string;
  brand: string;
  category: string;
  url: string;
  mode_hint: "product-evidence" | "editorial";
  evidence_profile: string;
  notes: string;
}

interface BenchmarkManifest {
  suite: {
    name: string;
    version: string;
    status: string;
    purpose: string;
    scope: string;
  };
  output_contract: {
    required_outputs: string[];
    field_notes: Record<string, string>;
  };
  benchmarks: BenchmarkEntry[];
}

interface CliOptions {
  outDir: string;
  match: string[];
  offline: boolean;
  force: boolean;
  reuseBrandDir?: string;
  reuseBrandRoot?: string;
  install: boolean;
  verify: boolean;
  render: boolean;
  composition: string;
  limit?: number;
}

interface CommandResult {
  ok: boolean;
  command: string;
  stdout: string;
  stderr: string;
}

interface BenchmarkResult {
  benchmark_id: string;
  brand: string;
  category: string;
  url: string;
  mode_hint: string;
  evidence_profile: string;
  evidence_score: {
    overall: number;
    level: string;
    subscores: Record<string, number>;
    rationale: string[];
  };
  chosen_mode: "product-evidence" | "editorial" | "blocked";
  archetype: {
    primary: string;
    secondary: string | null;
    rationale: string[];
  };
  first_cut: {
    status:
      | "project-generated"
      | "verified"
      | "rendered"
      | "intake-failed"
      | "install-failed"
      | "verify-failed"
      | "render-failed";
    artifact: string;
    project_dir: string;
    steps: CommandResult[];
  };
  self_review: {
    evidence_gate: string;
    taste_gate: string;
    edit_gate: string;
  };
  human_evaluation: {
    score: number;
    decision: "pending" | "worth-polishing" | "needs-rework" | "blocked";
    notes: string;
  };
  notes: string;
}

function timestampLabel(date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + "-" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
}

function parseArgs(scriptDir: string): CliOptions {
  const args = process.argv.slice(2);
  const defaultOutDir = resolve(scriptDir, "..", "benchmarks", "runs", timestampLabel());

  let outDir = defaultOutDir;
  let force = false;
  let offline = false;
  let reuseBrandDir: string | undefined;
  let reuseBrandRoot: string | undefined;
  let install = false;
  let verify = false;
  let render = false;
  let composition = "LaunchVideo";
  let limit: number | undefined;
  const match: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    if (current === "--out" && next) {
      outDir = resolve(next);
      index += 1;
      continue;
    }

    if (current === "--match" && next) {
      match.push(...next.split(",").map((value) => value.trim()).filter(Boolean));
      index += 1;
      continue;
    }

    if (current === "--reuse-brand-dir" && next) {
      reuseBrandDir = resolve(next);
      index += 1;
      continue;
    }

    if (current === "--reuse-brand-root" && next) {
      reuseBrandRoot = resolve(next);
      index += 1;
      continue;
    }

    if (current === "--composition" && next) {
      composition = next;
      index += 1;
      continue;
    }

    if (current === "--limit" && next) {
      const parsed = Number.parseInt(next, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = parsed;
      }
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

    if (current === "--install") {
      install = true;
      continue;
    }

    if (current === "--verify") {
      verify = true;
      continue;
    }

    if (current === "--render") {
      render = true;
    }
  }

  return {
    outDir,
    match,
    offline,
    force,
    reuseBrandDir,
    reuseBrandRoot,
    install,
    verify,
    render,
    composition,
    limit,
  };
}

function readJsonFile<T>(pathname: string): T {
  return JSON.parse(readFileSync(pathname, "utf-8")) as T;
}

function hasNodeModules(projectDir: string): boolean {
  return existsSync(join(projectDir, "node_modules"));
}

function runCommand(command: string, args: string[], cwd: string): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
  });

  return {
    ok: result.status === 0,
    command: [command, ...args].join(" "),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function normalizeMode(mode: string): "product-evidence" | "editorial" | "blocked" {
  if (mode === "product-evidence" || mode === "editorial") {
    return mode;
  }
  return "blocked";
}

function buildSelfReview(brandReport: any, sceneConstitution: any): BenchmarkResult["self_review"] {
  const evidenceLines = [
    `Overall evidence score: ${brandReport.score.overall} (${brandReport.score.level}).`,
    `Chosen mode: ${normalizeMode(brandReport.suggestedMode)}.`,
    `Primary archetype: ${sceneConstitution.archetype.primary}.`,
    ...(brandReport.risks.length > 0
      ? brandReport.risks.map((risk: string) => `Risk: ${risk}`)
      : ["No blocking evidence risks were detected."]),
  ];

  const tasteLines = [
    `Archetype discipline: ${sceneConstitution.archetype.primary}${sceneConstitution.archetype.secondary ? ` + ${sceneConstitution.archetype.secondary}` : ""}.`,
    `Motion mood: ${brandReport.designTruth.motionMood}.`,
    normalizeMode(brandReport.suggestedMode) === "editorial"
      ? "Guardrail: do not fabricate product interaction inside editorial mode."
      : "Guardrail: keep proof and product logic above decorative motion.",
    "Reject purple reflex, template stacks, and card-on-card filler unless the brand evidence explicitly supports them.",
  ];

  const editLines = [
    `Scene count: ${sceneConstitution.sceneList.length}.`,
    `Pacing profile: ${sceneConstitution.pacingProfile.style}, ${sceneConstitution.pacingProfile.durationSeconds}s target.`,
    "Each act must keep one dominant focal plane.",
    normalizeMode(brandReport.suggestedMode) === "product-evidence"
      ? "Proof act must stay calmer than reveal/showcase."
      : "Editorial acts must prefer crop discipline over motion density.",
  ];

  return {
    evidence_gate: evidenceLines.join("\n"),
    taste_gate: tasteLines.join("\n"),
    edit_gate: editLines.join("\n"),
  };
}

function resolveReuseBrandDir(
  entry: BenchmarkEntry,
  options: CliOptions,
  benchmarkCount: number,
): string | undefined {
  if (options.reuseBrandDir) {
    return options.reuseBrandDir;
  }

  if (!options.reuseBrandRoot) {
    return undefined;
  }

  const hostname = new URL(entry.url).hostname.replace(/^www\./, "");
  const candidates = [
    join(options.reuseBrandRoot, entry.id),
    join(options.reuseBrandRoot, slugify(entry.brand)),
    join(options.reuseBrandRoot, slugify(hostname)),
    join(options.reuseBrandRoot, entry.category, entry.id),
    join(options.reuseBrandRoot, entry.category, slugify(entry.brand)),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (benchmarkCount === 1 && existsSync(options.reuseBrandRoot)) {
    return options.reuseBrandRoot;
  }

  return undefined;
}

function collectSuiteSummary(results: BenchmarkResult[]) {
  const modeCounts = results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.chosen_mode] = (accumulator[result.chosen_mode] || 0) + 1;
    return accumulator;
  }, {});

  const statusCounts = results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.first_cut.status] = (accumulator[result.first_cut.status] || 0) + 1;
    return accumulator;
  }, {});

  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + result.evidence_score.overall, 0) / results.length)
    : 0;

  return {
    total: results.length,
    average_evidence_score: averageScore,
    mode_counts: modeCounts,
    first_cut_status_counts: statusCounts,
  };
}

function buildSuiteMarkdown(results: BenchmarkResult[]): string {
  const lines = [
    "# Benchmark Summary",
    "",
    "| Benchmark | Mode | Score | First Cut | Archetype |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.benchmark_id} | ${result.chosen_mode} | ${result.evidence_score.overall} | ${result.first_cut.status} | ${result.archetype.primary} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function buildFailureResult(
  entry: BenchmarkEntry,
  outputDir: string,
  projectDir: string,
  intake: CommandResult,
): BenchmarkResult {
  const failureNote = intake.stderr.trim() || intake.stdout.trim() || "Unknown intake failure.";
  const stableProjectDir = stableSuitePath(outputDir, projectDir);

  return {
    benchmark_id: entry.id,
    brand: entry.brand,
    category: entry.category,
    url: entry.url,
    mode_hint: entry.mode_hint,
    evidence_profile: entry.evidence_profile,
    evidence_score: {
      overall: 0,
      level: "low",
      subscores: {},
      rationale: [failureNote],
    },
    chosen_mode: "blocked",
    archetype: {
      primary: "Unresolved",
      secondary: null,
      rationale: ["Intake failed before archetype inference."],
    },
    first_cut: {
      status: "intake-failed",
      artifact: "",
      project_dir: stableProjectDir,
      steps: [intake],
    },
    self_review: {
      evidence_gate: failureNote,
      taste_gate: "Not run because intake failed.",
      edit_gate: "Not run because intake failed.",
    },
    human_evaluation: {
      score: 0,
      decision: "blocked",
      notes: "Benchmark did not produce a first cut.",
    },
    notes: entry.notes,
  };
}

function stableSuitePath(outputDir: string, pathname: string): string {
  const normalized = relative(outputDir, pathname);
  if (!normalized || normalized.startsWith("..")) {
    return pathname;
  }
  return normalized;
}

function executeBenchmark(
  entry: BenchmarkEntry,
  skillDir: string,
  outputDir: string,
  options: CliOptions,
  benchmarkCount: number,
): BenchmarkResult {
  const scriptDir = join(skillDir, "scripts");
  const projectDir = join(outputDir, entry.id);

  const intakeArgs = [
    "--experimental-strip-types",
    join(scriptDir, "url-to-video.ts"),
    entry.url,
    "--out",
    projectDir,
    "--project-name",
    entry.id,
  ];

  if (options.force) {
    intakeArgs.push("--force");
  }
  if (options.offline) {
    intakeArgs.push("--offline");
  }

  const reuseBrandDir = resolveReuseBrandDir(entry, options, benchmarkCount);
  if (reuseBrandDir) {
    intakeArgs.push("--reuse-brand-dir", reuseBrandDir);
  }

  const intake = runCommand(process.execPath, intakeArgs, skillDir);
  if (!intake.ok) {
    const failed = buildFailureResult(entry, outputDir, projectDir, intake);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, "benchmark-result.json"), `${JSON.stringify(failed, null, 2)}\n`);
    return failed;
  }

  const brandReport = readJsonFile<any>(join(projectDir, "brand-report.json"));
  const sceneConstitution = readJsonFile<any>(join(projectDir, "scene-constitution.json"));
  const steps: CommandResult[] = [intake];
  const stableProjectDir = stableSuitePath(outputDir, projectDir);

  let firstCutStatus: BenchmarkResult["first_cut"]["status"] = "project-generated";
  let artifact = stableProjectDir;

  if (options.install) {
    const install = runCommand("npm", ["install"], projectDir);
    steps.push(install);
    if (!install.ok) {
      firstCutStatus = "install-failed";
    }
  }

  if (options.verify && firstCutStatus !== "install-failed") {
    if (!hasNodeModules(projectDir)) {
      steps.push({
        ok: false,
        command: "npm install",
        stdout: "",
        stderr: "Verification requested but node_modules is missing. Re-run with --install or verify an already-installed project.",
      });
      firstCutStatus = "verify-failed";
    } else {
      const lint = runCommand("npm", ["run", "lint"], projectDir);
      steps.push(lint);
      const build = lint.ok ? runCommand("npm", ["run", "build"], projectDir) : {
        ok: false,
        command: "npm run build",
        stdout: "",
        stderr: "Skipped because lint failed.",
      };
      steps.push(build);
      if (lint.ok && build.ok) {
        firstCutStatus = "verified";
      } else {
        firstCutStatus = "verify-failed";
      }
    }
  }

  if (options.render && (firstCutStatus === "project-generated" || firstCutStatus === "verified")) {
    const renderDir = join(projectDir, "renders");
    mkdirSync(renderDir, { recursive: true });
    const renderPath = join(renderDir, `${entry.id}.mp4`);
    const render = runCommand(
      "npx",
      ["remotion", "render", "src/index.ts", options.composition, renderPath],
      projectDir,
    );
    steps.push(render);
    if (render.ok) {
      firstCutStatus = "rendered";
      artifact = stableSuitePath(outputDir, renderPath);
    } else {
      firstCutStatus = "render-failed";
    }
  }

  const result: BenchmarkResult = {
    benchmark_id: entry.id,
    brand: entry.brand,
    category: entry.category,
    url: entry.url,
    mode_hint: entry.mode_hint,
    evidence_profile: entry.evidence_profile,
    evidence_score: {
      overall: brandReport.score.overall,
      level: brandReport.score.level,
      subscores: {
        screenshotCompleteness: brandReport.score.screenshotCompleteness,
        videoUsefulness: brandReport.score.videoUsefulness,
        logoQuality: brandReport.score.logoQuality,
        fontCertainty: brandReport.score.fontCertainty,
        productClarity: brandReport.score.productClarity,
        proofRichness: brandReport.score.proofRichness,
        brandDistinctiveness: brandReport.score.brandDistinctiveness,
      },
      rationale: brandReport.score.rationale,
    },
    chosen_mode: normalizeMode(brandReport.suggestedMode),
    archetype: {
      primary: sceneConstitution.archetype.primary,
      secondary: sceneConstitution.archetype.secondary || null,
      rationale: sceneConstitution.archetype.rationale || [],
    },
    first_cut: {
      status: firstCutStatus,
      artifact,
      project_dir: stableProjectDir,
      steps,
    },
    self_review: buildSelfReview(brandReport, sceneConstitution),
    human_evaluation: {
      score: 0,
      decision: "pending",
      notes: "Waiting for human review.",
    },
    notes: entry.notes,
  };

  writeFileSync(join(projectDir, "benchmark-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function selectBenchmarks(manifest: BenchmarkManifest, options: CliOptions): BenchmarkEntry[] {
  const loweredNeedles = options.match.map((value) => value.toLowerCase());
  const filtered = loweredNeedles.length === 0
    ? manifest.benchmarks
    : manifest.benchmarks.filter((entry) => {
      const haystack = [entry.id, entry.brand, entry.category, entry.url, entry.mode_hint, entry.evidence_profile]
        .join(" ")
        .toLowerCase();
      return loweredNeedles.every((needle) => haystack.includes(needle));
    });

  if (typeof options.limit === "number") {
    return filtered.slice(0, options.limit);
  }

  return filtered;
}

function main(): void {
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptDir = dirname(scriptPath);
  const skillDir = resolve(scriptDir, "..");
  const options = parseArgs(scriptDir);
  const manifestPath = join(skillDir, "benchmarks", "manifest.json");
  const manifest = readJsonFile<BenchmarkManifest>(manifestPath);
  const selected = selectBenchmarks(manifest, options);

  if (selected.length === 0) {
    throw new Error("No benchmarks matched the current filters.");
  }

  mkdirSync(options.outDir, { recursive: true });
  const results = selected.map((entry) => executeBenchmark(entry, skillDir, options.outDir, options, selected.length));
  const summary = collectSuiteSummary(results);

  writeFileSync(
    join(options.outDir, "benchmark-suite-result.json"),
    `${JSON.stringify(
      {
        suite: manifest.suite,
        generated_at: new Date().toISOString(),
        options,
        summary,
        results,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(options.outDir, "summary.md"), buildSuiteMarkdown(results));

  console.log("BENCHMARK-SUITE");
  console.log(`Output: ${options.outDir}`);
  console.log(`Benchmarks: ${results.length}`);
  console.log(`Average evidence score: ${summary.average_evidence_score}`);
  console.log(`Rendered: ${summary.first_cut_status_counts.rendered || 0}`);
  console.log(`Blocked: ${summary.mode_counts.blocked || 0}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
