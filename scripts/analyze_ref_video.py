#!/usr/bin/env python3
"""
ShotFlow Reference Video Analyzer (Track C)
Extracts auto-scaled timestamped frames + time-synced captions/transcript from a
local video file or URL (YouTube, TikTok, Vimeo, Loom, X, etc. via yt-dlp) so an
AI agent can analyze editing style, pacing, framing, typography, and narrative arc.

Usage:
  python3 scripts/analyze_ref_video.py <url-or-video-path> [--start MM:SS] [--end MM:SS] [--max-frames 40] [--width 512]
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

os.environ["PATH"] = (
    f"/opt/homebrew/bin:/usr/local/bin:{os.path.expanduser('~/.shotflow-venv/bin')}:"
    + os.environ.get("PATH", "")
)

HARD_MAX_FRAMES = 100
HARD_MAX_FPS = 2.0


def parse_timestamp(ts: str) -> float:
    parts = [float(p) for p in ts.strip().split(":")]
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"Invalid timestamp: {ts}")


def fmt_ts(sec: float) -> str:
    total = max(0, int(round(sec)))
    m, s = divmod(total, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def check_bin(name: str) -> str:
    path = shutil.which(name)
    if not path:
        sys.exit(
            f"Error: '{name}' not found on PATH. Run './scripts/setup.sh --mode ref' first."
        )
    return path


def is_url(source: str) -> bool:
    return source.startswith(("http://", "https://"))


def probe_duration(video_path: str) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            video_path,
        ],
        text=True,
    ).strip()
    return float(out)


def parse_vtt_or_srt(sub_path: str) -> list[tuple[str, str]]:
    text = Path(sub_path).read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    entries: list[tuple[str, str]] = []
    ts_re = re.compile(r"(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}")
    cur_ts = None
    cur_buf: list[str] = []
    last_text = ""

    for line in lines:
        s = line.strip()
        if ts_re.search(s):
            if cur_ts and cur_buf:
                cleaned = re.sub(r"<[^>]+>", "", " ".join(cur_buf)).strip()
                if cleaned and cleaned != last_text:
                    entries.append((cur_ts, cleaned))
                    last_text = cleaned
            cur_ts = s.split("-->")[0].strip().split(".")[0].split(",")[0]
            cur_buf = []
        elif s and not s.isdigit() and not s.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
            cur_buf.append(s)

    if cur_ts and cur_buf:
        cleaned = re.sub(r"<[^>]+>", "", " ".join(cur_buf)).strip()
        if cleaned and cleaned != last_text:
            entries.append((cur_ts, cleaned))
    return entries


def download_video(url: str, work_dir: Path) -> tuple[str, dict, list[tuple[str, str]]]:
    check_bin("yt-dlp")
    out_tpl = str(work_dir / "source.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "-f",
        "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best",
        "--merge-output-format",
        "mp4",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs",
        "en.*,zh-Hant.*,zh-TW.*,zh.*,all",
        "--convert-subs",
        "vtt",
        "--write-info-json",
        "-o",
        out_tpl,
        url,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    videos = sorted(glob.glob(str(work_dir / "source*.mp4"))) + sorted(
        glob.glob(str(work_dir / "source*.mkv"))
    ) + sorted(glob.glob(str(work_dir / "source*.webm")))
    if not videos:
        sys.exit("Error: yt-dlp completed but no video file was found.")
    video_path = videos[0]

    meta: dict = {}
    info_files = glob.glob(str(work_dir / "*.info.json"))
    if info_files:
        try:
            meta = json.loads(Path(info_files[0]).read_text(encoding="utf-8"))
        except Exception:
            meta = {}

    subs: list[tuple[str, str]] = []
    vtt_files = sorted(glob.glob(str(work_dir / "*.vtt")))
    if vtt_files:
        subs = parse_vtt_or_srt(vtt_files[0])

    return video_path, meta, subs


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a reference video for ShotFlow.")
    parser.add_argument("source", help="Video URL (YouTube/TikTok/etc.) or local file path")
    parser.add_argument("--start", default=None, help="Start timestamp (SS, MM:SS, or HH:MM:SS)")
    parser.add_argument("--end", default=None, help="End timestamp (SS, MM:SS, or HH:MM:SS)")
    parser.add_argument(
        "--max-frames",
        type=int,
        default=40,
        help=f"Maximum frames to extract (default 40, hard cap {HARD_MAX_FRAMES})",
    )
    parser.add_argument("--width", type=int, default=512, help="Frame width in px (default 512)")
    parser.add_argument("--out-dir", default=None, help="Optional persistent output directory")
    args = parser.parse_args()

    check_bin("ffmpeg")
    check_bin("ffprobe")

    max_frames = max(1, min(args.max_frames, HARD_MAX_FRAMES))
    work_dir = Path(args.out_dir).resolve() if args.out_dir else Path(tempfile.mkdtemp(prefix="shotflow_ref_"))
    work_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = work_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    meta: dict = {}
    subs: list[tuple[str, str]] = []
    if is_url(args.source):
        video_path, meta, subs = download_video(args.source, work_dir)
    else:
        p = Path(args.source).expanduser().resolve()
        if not p.is_file():
            sys.exit(f"Error: Local video file not found: {p}")
        video_path = str(p)
        for ext in (".srt", ".vtt"):
            sidecar = p.with_suffix(ext)
            if sidecar.is_file():
                subs = parse_vtt_or_srt(str(sidecar))
                break

    total_dur = probe_duration(video_path)
    start_sec = parse_timestamp(args.start) if args.start else 0.0
    end_sec = parse_timestamp(args.end) if args.end else total_dur
    end_sec = min(end_sec, total_dur)
    clip_dur = max(1.0, end_sec - start_sec)

    # Auto-scale FPS within hard caps
    fps = min(HARD_MAX_FPS, max_frames / clip_dur)
    interval = 1.0 / fps

    ff_cmd = ["ffmpeg", "-y", "-v", "error"]
    if start_sec > 0:
        ff_cmd += ["-ss", f"{start_sec:.2f}"]
    ff_cmd += ["-i", video_path]
    if args.end:
        ff_cmd += ["-t", f"{clip_dur:.2f}"]
    ff_cmd += [
        "-vf",
        f"fps={fps:.4f},scale={args.width}:-2",
        "-frames:v",
        str(max_frames),
        "-q:v",
        "4",
        str(frames_dir / "frame_%03d.jpg"),
    ]
    subprocess.run(ff_cmd, check=True)

    frames = sorted(frames_dir.glob("frame_*.jpg"))
    title = meta.get("title") or Path(video_path).name
    uploader = meta.get("uploader") or "local"

    print(f"# Reference Video Analysis Report")
    print(f"- **Title**: {title}")
    print(f"- **Source**: {args.source}")
    print(f"- **Uploader**: {uploader}")
    print(f"- **Duration**: {fmt_ts(total_dur)} (Analyzed window: {fmt_ts(start_sec)}–{fmt_ts(end_sec)})")
    print(f"- **Extracted Frames**: {len(frames)} (~{fps:.2f} fps, width {args.width}px)")
    print(f"- **Transcript Source**: {'captions/sidecar' if subs else 'none available (visual-only analysis)'}")
    print()
    print("## Frames")
    for idx, fpath in enumerate(frames):
        ts = start_sec + idx * interval
        print(f"- `{fpath}` (t={fmt_ts(ts)})")
    print()
    print("## Transcript")
    if subs:
        for ts_str, line in subs:
            print(f"- [{ts_str}] {line}")
    else:
        print("_(No captions found. Inspect the extracted frames for pacing, layout, motion, and typography.)_")
    print()
    print(f"Work dir: {work_dir}")


if __name__ == "__main__":
    main()
