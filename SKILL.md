---
name: shotflow
description: Generate customizable AI short-video scripts, structured high-detail storyboard prompts, character turnaround sheets (or brand design anchors), asset naming specs, Google Flow Gemini Agent batch-generation command packs, and a standalone local MP4 rendering engine (pure FFmpeg or native ShotFlow Playwright+FFmpeg motion-graphics engine with word-synced TTS, website capture, and automated QC). Supports simple creative ideas, full repository / product spec / PRD ingestion (e.g., Apple WWDC-style product keynote videos), AND reference video style/pacing analysis (local MP4/MOV or YouTube/TikTok/Vimeo URLs). Use when planning or rendering AI short videos or product launch presentations (Reels, Shorts, TikTok, or 16:9 keynotes) with custom segment counts, auto-paced durations, aspect ratios, visual styles, generation modes (1–4 for Google Flow; 5A/5B for local MP4 output), and multi-language dialogue/voiceover integration (defaults to English).
---
# ShotFlow: AI Short-Video Script, Storyboard & Native Local Render Engine

## Summary

This skill generates a complete, production-ready video workflow from:
- **Track A**: A simple creative idea or brief.
- **Track B**: A real GitHub repository, codebase, product spec, or PRD (e.g., Apple WWDC-style keynote presentations).
- **Track C**: An existing **reference video** (local `.mp4`/`.mov` or YouTube/TikTok/Vimeo/Loom URL) analyzed for editing style, pacing, framing, transitions, and narrative structure—usable standalone or combined with Track A or Track B.

It supports **[Google Flow](https://flow.google.com/) / Gemini Agent** cloud generation (Modes 1–4) and **100% standalone local direct-to-MP4 rendering** (Mode 5A via pure FFmpeg + TTS + SRT, and Mode 5B via the built-in **ShotFlow Native Engine** in `bin/shotflow.mjs` + `engine/`—no external video studio dependency or watermark).

## Built-In CLI & Scripts (`https://github.com/lalakiwe/shotflow`)

- `bin/shotflow.mjs`: Standalone Node.js engine CLI:
  - `shotflow init <dir> --format product-launch|narrated-explainer|vertical-short --look midnight|studio|editorial|blueprint --size 16:9|9:16|4:5|1:1 --lang en|zh-TW`
  - `shotflow capture <url> --out <dir>` (captures website hero screenshot, palette, fonts, and headings)
  - `shotflow record <url> --out <dir> [--steps steps.json] [--duration 6]` (records browser walkthrough with animated cursor to MP4)
  - `shotflow render <dir> [--format mp4|gif|mov] [--transparent]` (word-synced `edge-tts` / macOS `say` + Playwright headless Chromium frame-by-frame rendering + runtime Lucide/Rough.js/KaTeX/SFX assets + DOM overflow check + FFmpeg muxing + BGM ducking → `out/final.mp4`, `out/subtitles.srt`, `out/cover.png`)
  - `shotflow check <video.mp4> [--json] [--contact-sheet <out.jpg>]` (automated QC for black frames, freeze frames, audio loudness, and 4x3 visual contact sheet—works on any MP4 from Modes 1–5B)
  - `shotflow doctor` (verifies Node, FFmpeg, `edge-tts`, `yt-dlp`, and Chrome/Chromium)
- `scripts/setup.sh`: Idempotent dependency checker and installer (`--check`, `--mode 5a`, `--mode 5b`, `--mode ref`, `--mode all`).
- `scripts/analyze_ref_video.py`: Track C reference-video analyzer (auto-scaled frames capped at 100 frames / 2 fps, optional `--start`/`--end`, plus time-synced captions).
- `scripts/render_ffmpeg.sh`: Mode 5A pure-FFmpeg 4x-supersampled Ken Burns + TTS + BGM + SRT renderer (burns compact proportional subtitles via `libass` or macOS CoreGraphics PNG overlay via `scripts/render_subtitles.swift`).

## Input Track Detection (Automatic)

Automatically detect all applicable input tracks—do **not** ask the user to pick a track:
- **Track A — Idea / Creative Brief**: Proceed directly to Parameter Check & Step 1.
- **Track B — Repo / Product Spec / PRD**: Run **Step 0A (Repo/PRD Ingestion & Product Brief)** before scripting.
- **Track C — Reference Video (URL or Local File)**: Run **Step 0B (Reference Video Analysis & Style DNA Extraction)** before scripting. *(Track B and Track C can run together.)*

## Parameter Check & Defaults

Before generating the full output, verify whether the user has provided:

1. **Segment Count**: Required. Ask if not specified *(for Track B keynotes, suggest `6`–`8` beats; for Mode 4 grids, `9` pairs with 3x3; if Track C reference video has a clear beat count, propose matching it)*.
2. **Duration per Segment**: **Do NOT ask.** Automatically allocate durations per segment based on narrative pacing (or matched to Track C reference cadence). For **Google Flow** (Modes 1–4), always use **whole-second integer durations** (e.g., `5s`, `6s`, `8s`—never decimals like `5.5s`, as Flow/Omni models require integer seconds).
3. **Aspect Ratio**: Required (`9:16`, `16:9`, `4:5`, `1:1`—suggest `16:9` for WWDC/keynote videos or match Track C if unspecified). Ask if not specified.
4. **Visual Style**: Required—*unless a Track C reference video already defines the target visual style*.
5. **Generation Mode (`1`, `2`, `3`, `4`, `5A`, or `5B`)**: Ask if not specified:
   - `Mode 1`: Text-to-Video (Direct Google Flow prompts)
   - `Mode 2`: First Frame Image + Video Prompt (Google Flow)
   - `Mode 3`: First & Last Frame Images + Video Prompt *(Recommended for transition control in Google Flow)*
   - `Mode 4`: Google Flow Gemini Agent Batch Workflow *(Recommended for fast multi-shot batching via storyboard grid)*
   - `Mode 5A`: **Local Pure FFmpeg** *(No Google Flow — still keyframes + Ken Burns + local TTS + SRT → `final.mp4`)*
   - `Mode 5B`: **ShotFlow Native Motion-Graphics Engine** *(No Google Flow — `shotflow init / capture / record / render / check` with word-synced TTS, HTML5/CSS/SVG layouts, runtime Lucide/Rough.js/KaTeX assets, DOM overflow check, and FFmpeg → `final.mp4` / `final.gif` / transparent `final.mov`; **Recommended default for Track B Repo/PRD & WWDC-style product videos**)*
6. **Language**: **Always ask** which language to use for prompts, on-screen copy, and dialogue/voiceover. If omitted or default is chosen, **default to English**.
7. **Target Model(s) (Ask & Recommend)**: **Always ask** the user to confirm which model(s) they want to use, and proactively recommend the best fit for their chosen mode:
   - *Modes 1–4 (Google Flow)*: Recommend **Veo 3.1** (*Fast* for pilot testing / lower credit spend; *Quality* for final shots; supports native dialogue & Frames-to-Video) + **Imagen 4 / Nano Banana** for turnaround/keyframe/grid images (also adapt if the user picks another model like Kling, Seedance, Sora, or Runway).
   - *Mode 5A (Local Pure FFmpeg)*: Recommend **Imagen 4 / Nano Banana** (or Flux/Midjourney) for still keyframes + **`edge-tts`** (style-matched voice + `--rate`/`--pitch`, free) for narration, with macOS `say` offline fallback.
   - *Mode 5B (ShotFlow Native Engine)*: No video diffusion model needed (renders natively via Playwright + FFmpeg); confirm TTS model—recommend **`edge-tts`** (free, word-synced timing, style-matched voice) with macOS `say` fallback.

> If any required parameter (Segment Count, Aspect Ratio, Style, Mode, Language, or Target Model) is missing, ask concisely in a single bulleted message—including your recommended model(s)—before generating. Once confirmed (or if the user asks to proceed with defaults), output **all sections below in a single, complete response** tailored to the selected model(s).

## Pre-Flight Environment Setup & Staging (Modes 5A, 5B & Track C)

Whenever **Mode 5A**, **Mode 5B**, or **Track C** requires local execution:
1. **Stage in a Connected User Folder**: Always create project folders and scripts inside a user-accessible connected folder (e.g., `~/Development/shotflow/<project>`), never only in an internal agent scratch directory, and always share clickable `file://` links to scripts and outputs (`final.mp4`, `sheet.jpg`).
2. **Pre-Flight Check**: Run `./scripts/setup.sh --check --mode <5a|5b|ref>` (or `node bin/shotflow.mjs doctor`) first.
3. **Sandbox Fallback for Homebrew**: If `./scripts/setup.sh` cannot write to `/opt/homebrew` from a sandboxed agent shell, immediately give the user the exact 1-line Terminal command (`cd <repo_path> && ./scripts/setup.sh --mode <5a|5b|ref>`) so they can run it in their own Terminal.
4. **Venv Isolation**: Isolate `edge-tts` in `~/.shotflow-venv` (fall back to macOS `say` if needed).
5. **Inline Image Staging (Mode 5A)**: When generating keyframe images inline in chat, explicitly tell the user they are displayed inline (not auto-saved to disk) and instruct them to download into `<project_dir>` (or `~/Desktop` / `~/Downloads`). On follow-up, automatically scan `~/Desktop` and `~/Downloads` for `p01.*`–`p[N].*` (`.png`, `.jpg`, `.jpeg`, `.webp`), copy them into `<project_dir>`, render `final.mp4`, and run `shotflow check`.

## Steps

### Step 0A. Repo / Spec / PRD Ingestion *(Track B Only)*

1. **Inspect Primary Sources**: Read the provided repo (`README.md`, main entrypoints, architecture/feature modules, CLI/UI code, docs, or screenshots) or PRD/spec document thoroughly. If a live product URL is provided, optionally run `node bin/shotflow.mjs capture <url> --out <dir>/assets` (or `record`) to grab real screenshots, recordings, palette, and typography.
2. **Extract Grounded Product Brief** *(strictly zero hallucination—every feature name, CLI command, API, metric, and UI label must come verbatim from the source)*: Problem Hook, Hero Reveal Line, Top 3–5 Verified Features, Concrete Proof / Demo Beats, and Closing CTA.
3. **Keynote Narrative Arc (e.g., Apple WWDC Style)**: *Cold Open (Problem) → Hero Product Reveal → 3–4 Crisp Feature / Code / UI Beats → Summary Bento Grid → Clean Closing CTA*.

### Step 0B. Reference Video Analysis & Style DNA Extraction *(Track C Only)*

1. Run `python3 scripts/analyze_ref_video.py "<url-or-local-path>"` (pass `--start`/`--end` for a focus window; hard cap 100 frames / 2 fps).
2. Inspect the extracted frames alongside the time-synced transcript to extract **Style & Pacing DNA** (hook structure, shot cadence, framing/camera motion, palette, typography, audio energy).
3. Delete the printed temp `Work dir:` after extracting Style DNA, then apply the style/pacing to Step 1 and Step 2 without copying copyrighted content.

### 1. Script, Unified Visual Bible & Anchor Foundation

- **Storyboard Script & Pacing Check**: Exact timestamps, **one primary action/concept per shot**, and **speech pacing guardrail** (~2.5–3 words/sec English; ~3.5–4.5 chars/sec Mandarin; 0.5–1s buffer).
- **Character Turnaround OR Brand & Design System Anchor**:
  - *Recurring characters (Track A)*: Front/back/side turnaround prompts (100–200+ words each) + **Fixed Appearance Anchor**.
  - *Product / repo / PRD presentations (Track B)*: **Brand & Design System Anchor** (palette, look preset `midnight`/`studio`/`editorial`/`blueprint`, typography, terminal/UI style).
- **Unified Visual Spec**: Compact control block for Google Flow Agent Instructions (Modes 1–4) or `video.json` (Mode 5B).
- **Voice & Tone Synchronization (Required for All Modes)**: Always align voice selection, pacing (`--rate`), and pitch (`--pitch`) with the visual style and emotional mood—never leave a flat/brisk default on a soft or emotional visual style:
  - *Warm / Healing / Watercolor / Lifestyle*: Expressive, gentle voice (`en-US-AvaMultilingualNeural`, `ja-JP-NanamiNeural`, `zh-TW-HsiaoChenNeural`) with unhurried pacing (`--rate=-10%` to `-12%`) and soft pitch (`--pitch=-2Hz`).
  - *Keynote / Product / Technical*: Clear, warm-confident voice (`en-US-AndrewMultilingualNeural` / `en-US-BrianMultilingualNeural`) at steady pacing (`--rate=+0%` to `+4%`).
  - *High-Energy / Hook-Driven Short*: Upbeat, lively voice (`en-US-EmmaMultilingualNeural` / `en-US-GuyNeural`) at brisk pacing (`--rate=+6%` to `+10%`).

### 2. Storyboard, Prompts & Local Render Pipeline

Always prefix each prompt or file block with its exact designated filename.

- **Structured Long-Form Prompt Standard (100 to 200+ words)** *(Modes 1–4 and Mode 5A image prompts)*: `[Subject & Action]`, `[Shot & Camera Movement]`, `[Environment & Lighting]`, `[Style & Texture]` (**no on-screen text, titles, or subtitles**), and `[Dialogue / Voiceover & Delivery]` *(Modes 1–4 video prompts only)*.
- **Mode 1**: `v01`–`v[N]` direct video prompts.
- **Mode 2**: `p01`–`p[N]` + `v01`–`v[N]`.
- **Mode 3**: `p01-1`/`p01-2`–`p[N]-1`/`p[N]-2` (cross-segment continuity) + `v01`–`v[N]`.
- **Mode 4 (Google Flow Gemini Agent Batch)**: `storyboard_grid` + `Shot_01`–`Shot_[N]` + 5-step **Gemini Agent Command Pack** (Analyze & Lock [0 credits], Pilot `Shot_01`, Batch `Shot_02`–`Shot_[N]`, Targeted QC Fix `_V02`/`_V03`, 5-Collection Organization).
- **Mode 5A (Local Pure FFmpeg)**: `p01.png`–`p[N].png` prompts + style-matched `edge-tts` commands (`--voice`, `--rate`, `--pitch` → `a01.mp3`–`a[N].mp3`) + timed `subtitles.srt` (set `SHOTFLOW_BRAND_TERMS="BrandName"` so brand names are bolded and highlighted in subtitles) + `./scripts/render_ffmpeg.sh <project_dir> <aspect_ratio>`.
- **Mode 5B (ShotFlow Native Engine)**:
  1. Initialize project: `node bin/shotflow.mjs init <dir> --format <product-launch|narrated-explainer|vertical-short> --look <midnight|studio|editorial|blueprint> --size <16:9|9:16|4:5|1:1> --lang <en|zh-TW>`.
  2. Populate `video.json` and `scenes.json` using native layouts (`hero`, `feature`, `code`, `bento`, `cta`), optional `icon` (Lucide), `formula` (KaTeX), `sketch: true` (Rough.js), `sfx` (`whoosh`/`pop`/`chime`), and `triggerWord` on each bullet/code line/card so elements animate on exact spoken words.
  3. Render: `node bin/shotflow.mjs render <dir>` (or `--format gif` / `--format mov --transparent`) → outputs `out/final.mp4`, `out/subtitles.srt`, `out/cover.png` (and flags any DOM layout overflow warnings).
  4. **Mandatory QC Loop**: Run `node bin/shotflow.mjs check <dir>/out/final.mp4 --json --contact-sheet <dir>/out/sheet.jpg`, inspect any flagged black/freeze/loudness/overflow issues, fix `scenes.json`, and re-render until `passed: true`.

### 3. Packaging, Assembly & BGM Setup

- **Catchy Title Ideas** (3–5), **Cover** (`cover`, zero AI text or native `out/cover.png` in Mode 5B), **Outro** (`outro`, zero AI text + 1–2 CTAs), **BGM Prompt** (matched duration, BPM, mood; place as `assets/bgm.mp3` in Mode 5B for automatic ducking), and **Assembly / QC Summary**.

## Gotchas

- **Zero Hallucination on Repo / PRD Inputs (Track B)**: Never invent features, benchmarks, UI labels, or CLI flags not verified in the source.
- **Reference Video Cleanup & Cap (Track C)**: Cap at 100 frames / 2 fps; delete temp working directories after extracting Style DNA.
- **Language Default**: Always confirm target language; default to **English**.
- **Model Confirmation**: Always prompt the user to confirm their target model(s) and include a clear recommendation before generating.
- **Zero-Text Rule (AI Diffusion Prompts)**: Forbid AI-rendered text in Modes 1–4 and 5A image prompts *(Mode 5B renders crisp typography natively via HTML/CSS)*.
- **Credit & Confirmation Guardrail (Modes 1–4)**: Keep Google Flow Agent confirmation on **Always**; test `Shot_01` before batching.
- **Local Setup & QC Loop (Modes 5A, 5B & Track C)**: Always run `./scripts/setup.sh --check` (or `shotflow doctor`) before local commands, and run `shotflow check` after rendering MP4s.
