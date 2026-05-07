/**
 * [INPUT]: Hyperframes project directory
 * [OUTPUT]: Final MP4 video file
 * [POS]: scripts/ pipeline 第 [7] 步; 调 hyperframes render
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Renderer — invoke `hyperframes render <project-dir>`
//
//  Hyperframes render takes a project DIRECTORY and produces an MP4
//  in renders/<name>.mp4 by default, or a custom path with --output.
// ================================================================

import { spawn } from "child_process";
import { existsSync } from "fs";

export interface RenderInput {
  projectDir: string;
  outputMp4Path: string;
  fps?: number;
  quality?: "draft" | "standard" | "high";
  variables?: Record<string, unknown>;
  strict?: boolean;
}

export async function renderVideo(
  input: RenderInput
): Promise<{ outputPath: string; durationActual: number }> {
  const { projectDir, outputMp4Path, fps = 30, quality = "standard" } = input;

  if (!existsSync(projectDir)) {
    throw new Error(`Project directory does not exist: ${projectDir}`);
  }

  const args = [
    "hyperframes",
    "render",
    projectDir,
    "--output",
    outputMp4Path,
    "--fps",
    String(fps),
    "--quality",
    quality,
  ];

  if (input.variables) {
    args.push("--variables", JSON.stringify(input.variables));
  }
  if (input.strict) {
    args.push("--strict");
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn("npx", args, { stdio: "inherit" });

    child.on("error", (err) => {
      reject(new Error(`hyperframes render failed: ${err.message}`));
    });
    child.on("exit", (code) => {
      if (code === 0) {
        const durationActual = (Date.now() - startedAt) / 1000;
        resolve({ outputPath: outputMp4Path, durationActual });
      } else {
        reject(new Error(`hyperframes render exited with code ${code}`));
      }
    });
  });
}

// ----------------------------------------------------------------
//  Optional: lint before render to catch issues early
// ----------------------------------------------------------------

export async function lintProject(projectDir: string): Promise<{ passed: boolean; output: string }> {
  return new Promise((resolve) => {
    let output = "";
    const child = spawn("npx", ["hyperframes", "lint", projectDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("exit", (code) => {
      resolve({ passed: code === 0, output });
    });
    child.on("error", (err) => {
      resolve({ passed: false, output: `lint spawn error: ${err.message}` });
    });
  });
}
