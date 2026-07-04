#!/usr/bin/env python3
"""Music-map analyzer — BGM → audiomap.json (the one canonical timing analysis).

[INPUT]: BGM audio file (anything ffmpeg decodes); librosa+numpy+soundfile (self-installed
         via pip preflight); aubiotrack as the degraded fallback when install fails
[OUTPUT]: audiomap.json at the project root — bpm, beats_sec, energy curve, onsets,
          silences, energy_phases (+density), key_moments, hard_stops, rolls, and a
          rhythmic true/false verdict with its evidence
[POS]: scripts/ 的音乐地图分析器 — beat-sync.ts (脉冲常量) 的上游真相源;
       rules/beat-sync.md 消费本输出决定转场落点; 从 hyperframes music-to-video
       的 analyze-beatgrid.py 移植 (见 FUSION-REPORT.md)
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

Usage:
    python3 scripts/analyze-audiomap.py <audio> [--output audiomap.json] [--print] [--no-install]

Design law (inherited from the source skill, verbatim in spirit):
  ONE analyzer, and you trust it. Never re-measure beats with another tool or by ear.
  energy / density / onsets / silences are reliable on ANY music; bpm / beats_sec are
  reliable ONLY when `rhythmic: true` — on calm music the beat grid is a metronome the
  tracker imposed, so pace by energy phases and silences instead and never hard-cut to it.

Degraded mode (librosa unavailable, aubiotrack present):
  audiomap carries bpm + beats_sec only; every other field is null and `rhythmic` is
  false — downstream must treat the grid as untrusted.
"""

from __future__ import annotations

import argparse
import importlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

SR = 22050
HOP = 512  # ~23 ms frames
AUDIOMAP_VERSION = 1

# ── 节奏可信判定阈值 (源 skill "genuinely rhythmic" 思路的量化) ──────────────
RHYTHM_MAX_BEAT_CV = 0.12        # 拍间隔变异系数: 稳定网格才可信
RHYTHM_MIN_BEAT_SUPPORT = 0.50   # ≥50% 的拍点附近有真实 onset (70ms 窗)
RHYTHM_MIN_ONSET_RATE = 0.8      # onset/秒: 太稀疏 = 平缓音乐
BEAT_SUPPORT_WINDOW = 0.07


# ── preflight: 自装依赖, 装不上走 aubiotrack 降级 ────────────────────────────
def ensure_librosa(allow_install: bool) -> bool:
    try:
        import librosa  # noqa: F401
        return True
    except ImportError:
        pass
    if not allow_install:
        return False
    pkgs = ["librosa", "numpy", "soundfile"]
    for extra in ([], ["--break-system-packages"], ["--user"]):
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "--quiet", *extra, *pkgs],
                check=True, capture_output=True,
            )
            importlib.invalidate_caches()
            import librosa  # noqa: F401
            return True
        except Exception:
            continue
    return False


# ── degraded path: aubiotrack → bpm + beats only, rhythm untrusted ──────────
def analyze_fallback(path: str) -> dict:
    raw = subprocess.run(
        ["aubiotrack", "-i", path], capture_output=True, text=True, check=True
    ).stdout
    beats = [float(x) for x in raw.split() if x.strip()]
    beats = [b for b in beats if b > 0]
    if len(beats) < 4:
        raise SystemExit("aubiotrack fallback found <4 beats — no usable analysis")
    diffs = [b - a for a, b in zip(beats, beats[1:]) if 0.25 <= b - a <= 1.2]
    interval = sorted(diffs)[len(diffs) // 2] if diffs else 0.5
    dur = float(subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    ).stdout.strip())
    return {
        "version": AUDIOMAP_VERSION,
        "source": "aubiotrack-fallback",
        "audio": {"path": path, "duration_sec": round(dur, 3), "sr": None},
        "bpm": round(60.0 / interval, 1),
        "beats_sec": [round(b, 3) for b in beats],
        "downbeats_sec": None,
        "rhythmic": False,
        "rhythm": {
            "beat_cv": None, "beat_onset_support": None, "onset_rate": None,
            "reason": "degraded: librosa unavailable — grid from aubiotrack only, rhythm untrusted",
        },
        "energy": None,
        "energy_phases": None,
        "key_moments": None,
        "hard_stops": None,
        "rolls": None,
        "silences": None,
        "onsets_sec": None,
        "summary": f"DEGRADED · {round(60.0 / interval)} BPM · {len(beats)} beats · {dur:.1f}s · rhythm untrusted",
    }


# ── full path (librosa) ──────────────────────────────────────────────────────
def load_audio(path: str):
    import librosa  # local import: only reached after preflight
    import soundfile as sf
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav = tmp.name
    subprocess.run(
        ["ffmpeg", "-y", "-i", path, "-ac", "1", "-ar", str(SR), wav],
        capture_output=True, check=True,
    )
    y, sr = sf.read(wav, dtype="float32")
    Path(wav).unlink(missing_ok=True)
    if y.ndim > 1:
        y = y.mean(axis=1)
    return y, sr, len(y) / sr


def energy_structure(y, sr, dur: float) -> dict:
    """RMS @1s → normalized curve, level phases, SURGE/DROP moments, hard stops."""
    import librosa
    import numpy as np
    rms = librosa.feature.rms(y=y, hop_length=sr)[0]
    norms = (rms / (rms.max() + 1e-9)).tolist()

    def lvl(n):
        return "VOID" if n < 0.2 else "LOW" if n < 0.4 else "MEDIUM" if n < 0.65 else "HIGH"

    phases, cur, cs = [], None, 0
    for i, n in enumerate(norms):
        l = lvl(n)
        if l != cur:
            if cur:
                phases.append({"s": cs, "e": i, "lvl": cur})
            cur, cs = l, i
    if cur:
        phases.append({"s": cs, "e": len(norms), "lvl": cur})

    moments = []
    for i in range(1, len(norms)):
        d = norms[i] - norms[i - 1]
        if abs(d) > 0.12:
            moments.append({"t": i, "kind": "DROP" if d < 0 else "SURGE", "delta": round(d, 2)})
    moments.sort(key=lambda m: abs(m["delta"]), reverse=True)
    hard_stops = [m for m in moments if m["kind"] == "DROP" and m["t"] > dur * 0.6 and m["delta"] < -0.25]

    phases_sec = []
    for p in phases:
        seg = norms[p["s"]:max(p["s"] + 1, p["e"])]
        phases_sec.append({
            "start": float(p["s"]),
            "end": float(min(p["e"], round(dur, 1))),
            "level": p["lvl"],
            "energy": round(float(np.mean(seg)) if seg else 0.0, 2),
        })
    return {"norms": [round(n, 2) for n in norms], "phases": phases_sec,
            "moments": moments[:8], "hard_stops": hard_stops}


ROLL_MIN_HITS = 4
ROLL_CONT = 0.55    # × beat_dur: gap up to ~half a beat keeps a run alive
ROLL_ACCEPT = 0.42  # × beat_dur: mean spacing denser than an 8th note counts
ROLL_DEDUP = 0.08   # merge onsets closer than a 32nd (double-trigger)
ROLL_MAX_BEATS = 8  # a run longer than 2 bars is the groove itself, not a fill


def detect_rolls(onsets: list, beat_dur: float) -> list:
    """Localized runs of >=4 onsets whose MEAN spacing beats an 8th note — cascade/stagger
    cues. A run spanning more than ~2 bars is the track's own groove, not a fill: discard."""
    times = []
    for t in onsets:
        if times and t - times[-1] <= ROLL_DEDUP:
            continue
        times.append(t)
    cont, accept = beat_dur * ROLL_CONT, beat_dur * ROLL_ACCEPT
    rolls, i, n = [], 0, len(times)
    while i < n - 1:
        j = i
        while j + 1 < n and (times[j + 1] - times[j]) <= cont:
            j += 1
        if j - i + 1 >= ROLL_MIN_HITS:
            gaps = [times[k + 1] - times[k] for k in range(i, j)]
            t0, t1 = times[i], times[j]
            if sum(gaps) / len(gaps) <= accept and (t1 - t0) <= beat_dur * ROLL_MAX_BEATS:
                rolls.append({
                    "start": round(t0, 3), "end": round(t1, 3),
                    "hits": j - i + 1,
                    "rate_per_min": round((j - i) / max(t1 - t0, 1e-6) * 60),
                    "kind": "sustained-fill" if t1 - t0 > 1.2 else "fill",
                })
        i = j + 1
    return rolls


def phase_density(phases: list, onsets: list) -> None:
    """Attach onset count + density verdict to each energy phase (facts, not timing)."""
    for s in phases:
        cnt = sum(1 for t in onsets if s["start"] <= t < s["end"])
        span = max(1e-6, s["end"] - s["start"])
        s["onsets"] = cnt
        s["onset_rate"] = round(cnt / span, 1)
        s["density"] = ("sparse" if s.get("energy", 0) < 0.2 or cnt < 6
                        else "dense" if cnt >= 18 else "medium")


def judge_rhythm(beats, onsets, dur: float) -> dict:
    """Is the beat grid REAL, or a metronome the tracker imposed on calm music?"""
    import numpy as np
    diffs = np.diff(beats) if len(beats) > 2 else np.array([])
    beat_cv = float(np.std(diffs) / (np.mean(diffs) + 1e-9)) if len(diffs) else 1.0
    supported = sum(
        1 for b in beats if any(abs(b - t) <= BEAT_SUPPORT_WINDOW for t in onsets)
    )
    support = supported / max(1, len(beats))
    onset_rate = len(onsets) / max(1e-6, dur)

    checks = {
        "steady grid": beat_cv <= RHYTHM_MAX_BEAT_CV,
        "onsets back the grid": support >= RHYTHM_MIN_BEAT_SUPPORT,
        "enough events": onset_rate >= RHYTHM_MIN_ONSET_RATE,
    }
    failed = [k for k, ok in checks.items() if not ok]
    return {
        "rhythmic": not failed,
        "beat_cv": round(beat_cv, 3),
        "beat_onset_support": round(support, 2),
        "onset_rate": round(onset_rate, 2),
        "reason": "all checks passed" if not failed else "failed: " + ", ".join(failed),
    }


def analyze(path: str) -> dict:
    import librosa
    import numpy as np
    y, sr, dur = load_audio(path)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP, units="frames")
    beats = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP).tolist()
    bpm = float(np.atleast_1d(tempo)[0])
    onsets = librosa.onset.onset_detect(
        y=y, sr=sr, hop_length=HOP, units="time", backtrack=True
    ).tolist()

    es = energy_structure(y, sr, dur)
    phase_density(es["phases"], onsets)
    silences = [{"start": p["start"], "end": p["end"]} for p in es["phases"] if p["level"] == "VOID"]
    beat_dur = float(np.median(np.diff(beats))) if len(beats) > 1 else 60.0 / max(bpm, 1e-6)
    rolls = detect_rolls(onsets, beat_dur)
    rhythm = judge_rhythm(beats, onsets, dur)
    downbeats = [round(float(beats[i]), 3) for i in range(0, len(beats), 4)]

    verdict = "rhythmic" if rhythm["rhythmic"] else "NOT rhythmic (pace by energy/silence)"
    return {
        "version": AUDIOMAP_VERSION,
        "source": "librosa",
        "audio": {"path": path, "duration_sec": round(dur, 3), "sr": sr},
        "bpm": round(bpm, 1),
        "beats_sec": [round(float(b), 3) for b in beats],
        "downbeats_sec": downbeats,
        "rhythmic": rhythm["rhythmic"],
        "rhythm": rhythm,
        "energy": es["norms"],
        "energy_phases": es["phases"],
        "key_moments": es["moments"],
        "hard_stops": es["hard_stops"],
        "rolls": rolls,
        "silences": silences,
        "onsets_sec": [round(float(t), 3) for t in onsets],
        "summary": (f"{bpm:.0f} BPM · {len(beats)} beats · {len(onsets)} onsets · "
                    f"{len(es['phases'])} energy phases · {len(silences)} silences · "
                    f"{dur:.1f}s · {verdict}"),
    }


def print_brief(d: dict) -> None:
    print(f"\n{d['summary']}\n{'=' * 70}")
    r = d.get("rhythm") or {}
    print(f"RHYTHM  rhythmic={d['rhythmic']}  cv={r.get('beat_cv')}  "
          f"support={r.get('beat_onset_support')}  onset_rate={r.get('onset_rate')}  ({r.get('reason')})")
    for s in d.get("energy_phases") or []:
        print(f"  {s['start']:5.1f}-{s['end']:5.1f}s  {s['level']:6s}  "
              f"energy={s['energy']}  {s.get('density', '?')} ({s.get('onsets', '?')} onsets)")
    print(f"KEY MOMENTS: {[(m['t'], m['kind'], m['delta']) for m in d.get('key_moments') or []]}")
    print(f"HARD STOPS:  {[h['t'] for h in d.get('hard_stops') or []]}")
    print(f"ROLLS:       {[(x['start'], x['end'], x['kind']) for x in d.get('rolls') or []]}")
    print(f"SILENCES:    {[(s['start'], s['end']) for s in d.get('silences') or []]}")


def main() -> None:
    ap = argparse.ArgumentParser(description="BGM → audiomap.json (one analyzer, trust it)")
    ap.add_argument("audio")
    ap.add_argument("-o", "--output", default="audiomap.json")
    ap.add_argument("--print", action="store_true", dest="do_print")
    ap.add_argument("--no-install", action="store_true", help="skip pip preflight; degrade to aubiotrack")
    a = ap.parse_args()

    if not Path(a.audio).exists():
        raise SystemExit(f"audio file not found: {a.audio}")

    if ensure_librosa(allow_install=not a.no_install):
        d = analyze(a.audio)
    else:
        print("[analyze-audiomap] librosa unavailable — degrading to aubiotrack "
              "(bpm+beats only, rhythm untrusted)", file=sys.stderr)
        d = analyze_fallback(a.audio)

    Path(a.output).write_text(json.dumps(d, ensure_ascii=False, indent=2))
    print(f"[analyze-audiomap] wrote {a.output} · {d['summary']}", file=sys.stderr)
    if a.do_print:
        print_brief(d)


if __name__ == "__main__":
    main()
