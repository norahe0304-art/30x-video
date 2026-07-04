#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * [INPUT]: 渲染完成的 MP4 (Step 8 输出)，依赖系统 ffprobe/ffmpeg（orchestrator preflight 已保证存在）
 * [OUTPUT]: 对外提供 renderQa(videoPath, options) 与 CLI；输出 stream/尺寸/时长/黑帧/静帧/静音/削波 检查报告
 *          (pass/warn/fail)，可选 --json 落盘，exit 1 on fail。
 * [POS]: scripts/ 的渲染后机器质检器 — Step 8 render 之后、Gate 4 披露之前的最后一道机器门。
 *        概念移植自 maxazure/video-editing-skill 的 render_qa.py，按本 skill 的产物特性重调阈值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

// ================================================================
// 类型 — 检查项与区段
// ================================================================
type Status = "pass" | "warn" | "fail";

interface Segment {
  start: number;
  end: number;
  duration: number;
}

interface Check {
  name: string;
  status: Status;
  message: string;
  segments?: Segment[];
}

interface QaOptions {
  width: number;
  height: number;
  expectDuration?: number; // seconds; ±1s tolerance
  maxBlackSeconds: number;
  maxFreezeSeconds: number;
  maxSilenceSeconds: number;
}

const DEFAULTS: QaOptions = {
  width: 1920,
  height: 1080,
  maxBlackSeconds: 0.5, // 开场淡入允许的黑帧预算
  maxFreezeSeconds: 8, // hold-then-snap 是本 skill 的语言 — 静帧只在总量失控时 fail
  maxSilenceSeconds: 3, // BGM 是强制项; 结尾 fade 尾巴给 3s 余量
};

// ================================================================
// ffmpeg/ffprobe 执行
// ================================================================
function run(cmd: string, args: string[]): { stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function probe(path: string): any {
  const { stdout } = run("ffprobe", [
    "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path,
  ]);
  return JSON.parse(stdout || "{}");
}

function runFilter(path: string, filter: string, audio: boolean): string {
  const args = ["-hide_banner", "-nostats", "-i", path];
  args.push(...(audio ? ["-af", filter, "-vn"] : ["-vf", filter, "-an"]));
  args.push("-f", "null", "-");
  return run("ffmpeg", args).stderr;
}

// ================================================================
// stderr 区段解析 — black/freeze/silence 共用一套 start/end 抽取
// 注意: freeze_end 在冻结持续到片尾时不会输出 — 未闭合的 start 用 closeAt (视频时长) 收尾
// ================================================================
function parseSegments(log: string, startKey: string, endKey: string, closeAt: number): Segment[] {
  const segments: Segment[] = [];
  const starts: number[] = [];
  for (const line of log.split("\n")) {
    const s = line.match(new RegExp(`${startKey}:\\s*([0-9.]+)`));
    if (s) starts.push(Number(s[1]));
    const e = line.match(new RegExp(`${endKey}:\\s*([0-9.]+)`));
    if (e) {
      const end = Number(e[1]);
      const start = starts.shift() ?? end;
      segments.push({ start: round3(start), end: round3(end), duration: round3(end - start) });
    }
  }
  for (const start of starts) {
    segments.push({ start: round3(start), end: round3(closeAt), duration: round3(closeAt - start) });
  }
  return segments;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function budgetCheck(name: string, segments: Segment[], limit: number): Check {
  const total = round3(segments.reduce((a, s) => a + s.duration, 0));
  if (total > limit) {
    return { name, status: "fail", message: `${name}: ${total}s total, over ${limit}s budget`, segments };
  }
  if (segments.length > 0) {
    return { name, status: "warn", message: `${name}: ${total}s within budget — review the listed windows`, segments };
  }
  return { name, status: "pass", message: `no ${name} detected` };
}

// ================================================================
// 主检查流程
// ================================================================
export function renderQa(path: string, opts: QaOptions): { status: Status; checks: Check[] } {
  const checks: Check[] = [];
  const meta = probe(path);
  const video = (meta.streams ?? []).find((s: any) => s.codec_type === "video");
  const audio = (meta.streams ?? []).find((s: any) => s.codec_type === "audio");
  const duration = Number(meta.format?.duration ?? 0);

  // ── 流与元数据 ──
  if (!video) {
    checks.push({ name: "video_stream", status: "fail", message: "no video stream" });
  } else {
    const w = Number(video.width), h = Number(video.height);
    checks.push({
      name: "video_stream",
      status: w === opts.width && h === opts.height ? "pass" : "fail",
      message: `${w}x${h} (expected ${opts.width}x${opts.height}), codec ${video.codec_name}, pix_fmt ${video.pix_fmt}`,
    });
    checks.push({
      name: "pixel_format",
      status: video.pix_fmt === "yuv420p" ? "pass" : "warn",
      message: `pix_fmt ${video.pix_fmt} — yuv420p is the compatibility baseline`,
    });
  }

  // BGM 在本 skill 是 MANDATORY — 无音轨即 fail
  checks.push(
    audio
      ? { name: "audio_stream", status: "pass", message: `audio present (${audio.codec_name})` }
      : { name: "audio_stream", status: "fail", message: "no audio stream — BGM is mandatory in this skill" },
  );

  if (opts.expectDuration != null) {
    const drift = Math.abs(duration - opts.expectDuration);
    checks.push({
      name: "duration",
      status: drift <= 1 ? "pass" : "fail",
      message: `duration ${duration.toFixed(2)}s vs expected ${opts.expectDuration}s (drift ${drift.toFixed(2)}s)`,
    });
  } else {
    checks.push({ name: "duration", status: duration > 1 ? "pass" : "fail", message: `duration ${duration.toFixed(2)}s` });
  }

  // ── 信号检测 — 黑帧 / 静帧 / 静音 / 削波 ──
  const black = parseSegments(runFilter(path, "blackdetect=d=0.25:pix_th=0.10", false), "black_start", "black_end", duration);
  checks.push(budgetCheck("black_frames", black, opts.maxBlackSeconds));

  // 静帧检测阈值 3s: 本 skill 的 hold/breathing (≥1.5s) 是设计语言, 只揪真正的死帧
  const freeze = parseSegments(runFilter(path, "freezedetect=n=-60dB:d=3.0", false), "freeze_start", "freeze_end", duration);
  checks.push(budgetCheck("frozen_video", freeze, opts.maxFreezeSeconds));

  if (audio) {
    const silence = parseSegments(runFilter(path, "silencedetect=n=-45dB:d=1.5", true), "silence_start", "silence_end", duration);
    checks.push(budgetCheck("silence", silence, opts.maxSilenceSeconds));

    const volLog = runFilter(path, "volumedetect", true);
    const maxVol = volLog.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if (maxVol) {
      const v = Number(maxVol[1]);
      checks.push({
        name: "clipping",
        status: v > -0.5 ? "warn" : "pass",
        message: `max_volume ${v} dB${v > -0.5 ? " — near/at 0 dB, audio may clip" : ""}`,
      });
    }
  }

  const status: Status = checks.some((c) => c.status === "fail")
    ? "fail"
    : checks.some((c) => c.status === "warn")
      ? "warn"
      : "pass";
  return { status, checks };
}

// ================================================================
// CLI — render-qa.ts <video.mp4> [--expect-duration S] [--width W] [--height H] [--json out.json]
// ================================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const path = args.find((a) => !a.startsWith("--"));
  const flag = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  if (!path || !existsSync(path)) {
    console.error("usage: render-qa.ts <video.mp4> [--expect-duration S] [--width W] [--height H] [--json report.json]");
    process.exit(1);
  }

  const opts: QaOptions = {
    ...DEFAULTS,
    width: Number(flag("width") ?? DEFAULTS.width),
    height: Number(flag("height") ?? DEFAULTS.height),
    expectDuration: flag("expect-duration") ? Number(flag("expect-duration")) : undefined,
  };

  const report = renderQa(path, opts);
  console.log(`\n${report.status.toUpperCase()} ${path}`);
  for (const c of report.checks) {
    console.log(`  [${c.status.toUpperCase()}] ${c.name}: ${c.message}`);
    for (const s of c.segments ?? []) {
      console.log(`         ${s.start}s – ${s.end}s (${s.duration}s)`);
    }
  }
  console.log(
    "\nWARN windows are timestamps to LOOK AT, not to explain away — extract a frame" +
      "\n(ffmpeg -ss <t> -i video.mp4 -frames:v 1 check.png), Read it, judge: intentional hold or dead frame.",
  );

  const jsonOut = flag("json");
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}
