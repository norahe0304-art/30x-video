#!/usr/bin/env python3
"""BGM generator — mood prompt → brand-toned music bed (local MusicGen, no network API).

[INPUT]: mood prompt (CLI 参数) 或 brand-report.json (designTruth/productCategory 推导);
         transformers+torch+soundfile+numpy (pip preflight 自装); ffmpeg (fade+loudnorm+转码);
         facebook/musicgen-small 权重 (首跑自动下载 ~1.5GB 到 HF cache)
[OUTPUT]: 一条 mp3/wav 音乐床 (默认 45s, 首尾 fade + loudnorm -16 LUFS) — 即
          SKILL.md Step 2 的 bgm.mp3, 下游交给 analyze-audiomap.py 出 audiomap.json
[POS]: scripts/ 的 BGM 生成器 — bgm 三级来源的第②级 (用户音频 → 本地生成 → yt-dlp 降级);
       从 hyperframes-media scripts/lib/bgm.mjs 的 inline MusicGen 移植 (见 FUSION-REPORT.md);
       与 analyze-audiomap.py 是上下游: 本脚本产音频, 它产时间真相
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

Usage:
    python3 generate-bgm.py "<mood prompt>" --duration 45 --output bgm.mp3
    python3 generate-bgm.py --brand-report brand-report.json --duration 45 --output bgm.mp3

Design law (inherited from the source skill):
  ONE seed clip (≤28s — under the decoder's positional limit), crossfade-looped up to the
  target. Never generate per-segment and stitch: seams read as edits the music never earned.
  BGM failure never blocks a video — if this script can't run, fall back to yt-dlp sourcing.

Expectation setting:
  First run downloads facebook/musicgen-small (~1.5GB). Generation itself is minutes-scale:
  fast on Apple MPS / CUDA, potentially 30-60 min on bare CPU. The script prints device +
  elapsed so slowness is visible, not mysterious.
"""

from __future__ import annotations

import argparse
import importlib
import json
import math
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

MODEL_ID = "facebook/musicgen-small"
TOKEN_RATE = 50          # MusicGen decoder: 50 tokens / second of audio
MAX_SEED_S = 28.0        # stay under the positional-embedding limit (~30s)
CROSSFADE_S = 0.3        # loop seam crossfade
FADE_IN_S = 0.6          # delivery fades (ffmpeg, on the final file)
FADE_OUT_S = 1.2
LOUDNORM = "loudnorm=I=-16:TP=-1.5:LRA=11"


# ── preflight: 自装依赖 (plain → --break-system-packages → --user) ────────────
def ensure_deps(allow_install: bool) -> bool:
    try:
        import transformers, torch, soundfile, numpy  # noqa: F401
        return True
    except ImportError:
        pass
    if not allow_install:
        return False
    pkgs = ["transformers", "torch", "soundfile", "numpy"]
    for extra in ([], ["--break-system-packages"], ["--user"]):
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "--quiet", *extra, *pkgs],
                check=True, capture_output=True,
            )
            importlib.invalidate_caches()
            import transformers  # noqa: F401
            return True
        except Exception:
            continue
    return False


def model_cached() -> bool:
    cache = Path.home() / ".cache" / "huggingface" / "hub"
    return any(cache.glob(f"models--{MODEL_ID.replace('/', '--')}"))


# ── mood prompt from brand-report.json ────────────────────────────────────────
# designTruth (画布明暗 + motionMood) × productCategory → 默认 mood。显式 prompt 永远赢。
CATEGORY_BASE = [
    (("crypto", "web3", "blockchain"),
     "atmospheric electronic, deep bass, futuristic synths, restrained percussion"),
    (("fintech", "finance", "bank", "payment"),
     "calm cinematic, soft strings, subtle piano, restrained percussion"),
    (("creative", "agency", "design", "studio"),
     "playful electronic, warm pads, light percussion"),
    (("developer", "devtool", "api", "infra", "platform"),
     "minimal electronic, precise pulse, clean synth arpeggios, tech confidence"),
]
MOTION_SHAPE = {
    "precise": "steady 120-126 bpm, tight percussion",
    "playful": "bouncy 115-125 bpm, syncopated",
    "calm": "spacious 88-100 bpm, ambient",
    "energetic": "driving 126-132 bpm, momentum",
}


def is_dark(hex_color: str) -> bool:
    h = (hex_color or "").lstrip("#")
    if len(h) != 6:
        return False
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.25


def prompt_from_brand(report_path: str) -> str:
    d = json.loads(Path(report_path).read_text())
    category = str((d.get("productCategory") or {}).get("category", "")).lower()
    design = d.get("designTruth") or {}
    base = next(
        (p for keys, p in CATEGORY_BASE if any(k in category for k in keys)),
        "uplifting corporate tech, bright modern piano with synth pads",
    )
    if is_dark(design.get("backgroundColor", "")):
        base = "dark " + base
    shape = MOTION_SHAPE.get(str(design.get("motionMood", "")).lower(), "steady 108 bpm")
    return f"{base}, {shape}, instrumental, no vocals"


# ── generation: one seed clip → crossfade loop → target length ────────────────
def pick_device(choice: str):
    import torch
    if choice == "cpu":
        return "cpu"
    if choice == "mps" or (choice == "auto" and torch.backends.mps.is_available()):
        return "mps"
    if choice == "auto" and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def generate_seed(prompt: str, seed_s: float, device: str):
    """Returns (samples float32 mono, sample_rate). Falls back to CPU if the device fails."""
    import torch
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_ID)
    model.eval()
    sr = int(model.config.audio_encoder.sampling_rate)
    tokens = max(1, int(math.ceil(seed_s * TOKEN_RATE)))
    inputs = processor(text=[prompt], padding=True, return_tensors="pt")
    for dev in ([device, "cpu"] if device != "cpu" else ["cpu"]):
        try:
            model.to(dev)
            moved = {k: v.to(dev) for k, v in inputs.items()}
            print(f"[generate-bgm] device={dev} seed={seed_s:.0f}s tokens={tokens} — generating…",
                  file=sys.stderr, flush=True)
            with torch.no_grad():
                audio = model.generate(**moved, max_new_tokens=tokens)
            return audio[0, 0].detach().cpu().numpy().astype("float32"), sr
        except Exception as e:
            if dev == "cpu":
                raise
            print(f"[generate-bgm] {dev} failed ({e}); retrying on cpu", file=sys.stderr)
    raise RuntimeError("unreachable")


def loop_to_length(seed, target_len: int, xf: int):
    """Crossfade-loop the seed up to target_len samples (or trim down). 等功率余弦交叉淡化."""
    import numpy as np
    if seed.shape[0] >= target_len:
        return seed[:target_len].copy()
    xf = min(xf, seed.shape[0] // 2)
    if xf < 1:
        return np.tile(seed, math.ceil(target_len / seed.shape[0]))[:target_len]
    t = np.linspace(0.0, 1.0, xf, dtype="float32")
    fade_out, fade_in = np.cos(t * math.pi / 2), np.sin(t * math.pi / 2)
    out = seed.copy()
    while out.shape[0] < target_len:
        out = np.concatenate([out[:-xf], out[-xf:] * fade_out + seed[:xf] * fade_in, seed[xf:]])
    return out[:target_len]


def finalize(samples, sr: int, target_s: float, out_path: Path) -> None:
    """peak-normalize → temp wav → ffmpeg: 首尾 fade + loudnorm + 按扩展名转码."""
    import numpy as np
    import soundfile as sf
    peak = float(np.max(np.abs(samples)))
    if peak > 1e-6:
        samples = samples * (0.89 / peak)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        raw = Path(tmp.name)
    sf.write(raw, samples, sr)
    fade_out_start = max(0.0, target_s - FADE_OUT_S)
    af = (f"afade=t=in:st=0:d={FADE_IN_S},"
          f"afade=t=out:st={fade_out_start:.3f}:d={FADE_OUT_S},{LOUDNORM}")
    codec = ["-codec:a", "libmp3lame", "-q:a", "2"] if out_path.suffix == ".mp3" else []
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw), "-af", af, *codec, str(out_path)],
        check=True, capture_output=True,
    )
    raw.unlink(missing_ok=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="mood prompt → BGM (facebook/musicgen-small, local)")
    ap.add_argument("prompt", nargs="?", default=None, help="mood prompt; omit with --brand-report")
    ap.add_argument("--brand-report", help="brand-report.json — 推导默认 mood (显式 prompt 优先)")
    ap.add_argument("--duration", type=float, default=45.0, help="target seconds (default 45)")
    ap.add_argument("-o", "--output", default="bgm.mp3", help="output .mp3 or .wav (default bgm.mp3)")
    ap.add_argument("--seed-seconds", type=float, default=MAX_SEED_S,
                    help=f"seed clip length ≤{MAX_SEED_S:.0f}s (default {MAX_SEED_S:.0f})")
    ap.add_argument("--device", choices=["auto", "mps", "cuda", "cpu"], default="auto")
    ap.add_argument("--no-install", action="store_true", help="skip pip preflight")
    a = ap.parse_args()

    prompt = a.prompt or (prompt_from_brand(a.brand_report) if a.brand_report else None)
    if not prompt:
        raise SystemExit("need a mood prompt or --brand-report")
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg not found — install it first (brew install ffmpeg)")
    if not ensure_deps(allow_install=not a.no_install):
        raise SystemExit(
            "MusicGen deps unavailable (pip install transformers torch soundfile numpy) — "
            "fall back to yt-dlp BGM sourcing; BGM must never block the video"
        )
    if not model_cached():
        print(f"[generate-bgm] first run: downloading {MODEL_ID} (~1.5GB) to the HF cache — "
              "this happens once", file=sys.stderr, flush=True)

    target_s = max(1.0, a.duration)
    seed_s = min(max(a.seed_seconds, 10.0), MAX_SEED_S, target_s if target_s >= 10 else MAX_SEED_S)
    t0 = time.time()
    seed, sr = generate_seed(prompt, seed_s, pick_device(a.device))
    final = loop_to_length(seed, int(round(target_s * sr)), int(round(CROSSFADE_S * sr)))
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    finalize(final, sr, target_s, out)
    loops = math.ceil(target_s / seed_s) if target_s > seed_s else 1
    print(f"[generate-bgm] wrote {out} · {target_s:.1f}s (seed {seed_s:.0f}s × {loops} loop) · "
          f"sr={sr} · {time.time() - t0:.0f}s elapsed\n"
          f"[generate-bgm] prompt: {prompt}", file=sys.stderr)


if __name__ == "__main__":
    main()
