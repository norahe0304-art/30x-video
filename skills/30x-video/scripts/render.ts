/**
 * [INPUT]: Composed HTML file path + format + duration
 * [OUTPUT]: Final MP4 video
 * [POS]: scripts/ pipeline 第 [7] 步; 调 hyperframes engine 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Renderer — invoke Hyperframes engine
//
//  Hyperframes uses Puppeteer + FFmpeg to render seekable HTML
//  compositions to MP4.
//
//  CLI invocation (when @hyperframes/cli is installed):
//    npx hyperframes render <html> --output <mp4> --format <16:9|9:16|...> --duration <sec>
//
//  This module wraps the CLI call. Full integration once hyperframes
//  is added as dev dependency.
// ================================================================

import { spawn } from "child_process";
import type { Format } from "./types.ts";

export interface RenderInput {
  htmlPath: string;
  outputMp4Path: string;
  format: Format;
  durationSeconds: number;
  fps?: number;
  withVo?: boolean;
}

const DIMENSIONS: Record<Format, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

export async function renderVideo(input: RenderInput): Promise<{ outputPath: string; durationActual: number }> {
  const { htmlPath, outputMp4Path, format, durationSeconds, fps = 30 } = input;
  const dims = DIMENSIONS[format];

  return new Promise((resolve, reject) => {
    const args = [
      "hyperframes",
      "render",
      htmlPath,
      "--output",
      outputMp4Path,
      "--width",
      String(dims.width),
      "--height",
      String(dims.height),
      "--duration",
      String(durationSeconds),
      "--fps",
      String(fps),
    ];

    const child = spawn("npx", args, { stdio: "inherit" });

    child.on("error", (err) => {
      reject(new Error(`hyperframes render failed: ${err.message}\n` + getInstallHelp()));
    });
    child.on("exit", (code) => {
      if (code === 0) resolve({ outputPath: outputMp4Path, durationActual: durationSeconds });
      else reject(new Error(`hyperframes render exited with code ${code}\n` + getInstallHelp()));
    });
  });
}

function getInstallHelp(): string {
  return [
    "Install hyperframes:",
    "  cd <project-root>",
    "  npm install hyperframes",
    "  npx hyperframes init",
    "Then re-run.",
  ].join("\n");
}
