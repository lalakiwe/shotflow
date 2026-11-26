---
name: shotflow
description: Generate customizable AI short-video scripts, structured high-detail storyboard prompts, character turnaround sheets, asset naming specs, Google Flow Gemini Agent batch-generation command packs, and local direct-to-MP4 pipelines (pure FFmpeg or code-rendered HTML/Remotion motion graphics) with automated dependency setup scripts. Use when planning or rendering AI short videos (Reels, Shorts, TikTok, or landscape clips) with custom segment counts, auto-paced durations, aspect ratios, visual styles, generation modes (1–4 for Google Flow; 5A/5B for local MP4 output without Google Flow), and multi-language dialogue/voiceover integration (defaults to English).
---
# ShotFlow: AI Short-Video Script, Storyboard & Local Render Engine

## Summary

This skill generates a complete, production-ready AI short-video workflow—supporting both **[Google Flow](https://flow.google.com/) / Gemini Agent** cloud generation (Modes 1–4) and **local direct-to-MP4 rendering without Google Flow** (Mode 5A via pure FFmpeg + TTS + SRT, and Mode 5B via code-rendered HTML/Canvas or Remotion + FFmpeg). It enforces strict file naming, character consistency anchors, speech-rate guardrails, and includes bundled setup and render scripts (`scripts/setup.sh`, `scripts/render_ffmpeg.sh`).

## Bundled Scripts

- `scripts/setup.sh`: Idempotent dependency checker and installer (`--check`, `--mode 5a`, `--mode 5b`, `--mode all`, `--with-remotion`) for `ffmpeg`, `ffprobe`, Python `edge-tts` (in an isolated venv), and `node`/`npm`.
- `scripts/render_ffmpeg.sh`: Mode 5A local renderer that turns `p01.png`–`p[N].png` + optional `a01.mp3`–`a[N].mp3` + `bgm.mp3` + `subtitles.srt` into `final.mp4` with alternating Ken Burns motion, audio ducking, and burned-in captions.

## When to Use

- The user wants to plan an AI short video (Reels, Shorts, TikTok, or landscape clips) with customizable segment count, duration, aspect ratio, visual style, generation mode, and language.
- The user wants ready-to-paste **Google Flow / Gemini Agent** prompts and batch commands (Modes 1–4), **or** wants to bypass Google Flow and render a finished `final.mp4` directly on their machine using `ffmpeg` / TTS / code-driven motion graphics (Modes 5A & 5B).

## Parameter Check & Defaults

Before generating, verify whether the user has provided the following parameters:

1. **Segment Count**: Required. Ask if not specified (note: `9` segments pairs naturally with a 3x3 storyboard grid).
2. **Duration per Segment**: **Do NOT ask.** If omitted, automatically allocate durations per segment based on narrative pacing.
3. **Aspect Ratio**: Required (e.g., `9:16` vertical, `16:9` horizontal). Ask if not specified.
4. **Visual Style**: Required (e.g., cinematic live-action, 90s anime, hand-painted watercolor, minimal motion graphics, kinetic typography). Ask if not specified.
5. **Generation Mode (`1`, `2`, `3`, `4`, `5A`, or `5B`)**: Ask if not specified:
   - `Mode 1`: Text-to-Video (Direct Google Flow prompts)
   - `Mode 2`: First Frame Image + Video Prompt (Google Flow)
   - `Mode 3`: First & Last Frame Images + Video Prompt *(Recommended for maximum transition control in Google Flow)*
   - `Mode 4`: Google Flow Gemini Agent Batch Workflow *(Recommended for fast multi-shot batching via storyboard grid)*
   - `Mode 5A`: **Local Pure FFmpeg** *(No Google Flow — still keyframes + Ken Burns motion + local TTS + SRT captions → `final.mp4`)*
   - `Mode 5B`: **Local Code-Rendered Motion Graphics** *(No Google Flow — HTML/Canvas/SVG or Remotion + FFmpeg → `final.mp4`)*
6. **Language**: **Always ask** which language to use for prompts and dialogue/voiceover. If the user omits it or opts for the default, **default to English**.

> If any required parameter (Segment Count, Aspect Ratio, Style, Mode, or Language) is missing, ask concisely in a single bulleted message before generating. Once confirmed (or if the user asks to proceed with defaults), output **all sections below in a single, complete response**.

## Pre-Flight Environment Setup (Modes 5A & 5B Only)

Whenever the user selects **Mode 5A** or **Mode 5B** and wants local execution:
1. Run `scripts/setup.sh --check --mode <5a|5b>` first to verify installed tools (`ffmpeg`, `ffprobe`, `edge-tts`, `node`/`npm`).
2. If any required tool is missing, run (or instruct the user to run) `scripts/setup.sh --mode <5a|5b>` (add `--with-remotion` when using Remotion in Mode 5B).
3. Never assume system Python allows global `pip install`; `setup.sh` isolates `edge-tts` in `~/.shotflow-venv`.

## Steps

### 1. Script, Unified Visual Bible & Character Foundation

- **Storyboard Script & Pacing Check**:
  - Outline the full short-video script with clear timestamps and narrative beats for each segment.
  - **One Primary Action Rule**: Limit each shot to **one clear primary action** with natural, stable camera movement to prevent motion artifacts and maintain visual coherence.
  - **Speech Pacing Guardrail**: Strictly cap dialogue/voiceover length per segment and leave a 0.5 to 1 second breathing buffer (~2.5 to 3 words/sec for English; ~3.5 to 4.5 characters/sec for Mandarin).
- **Character Turnaround & Fixed Appearance Anchor** *(skip for pure kinetic-typography Mode 5B videos without characters)*:
  - Provide detailed turnaround prompts (front, back, and side views) for the main character(s) (100 to 200+ words each).
  - Extract a **Fixed Appearance Anchor** (hairstyle/fur markings, facial features, body proportions, outfit/accessories, and color palette) to reuse verbatim across every prompt.
- **Unified Visual Spec (Google Flow Agent Instructions / Local Style Spec)**:
  - Output a compact project control block covering: `[Character]`, `[Visual Style]`, `[Setting & Continuity]`, `[Cinematography & Pacing]`, and `[Output Spec & Negative Constraints]`.

### 2. Storyboard, Prompts & Local Render Pipeline

Provide complete assets for **every segment** in the script. **Always prefix each prompt or file block with its exact designated filename.**

- **Structured Long-Form Prompt Standard (100 to 200+ words per prompt)** *(Applies to Modes 1–4 and Mode 5A image prompts)*:
  - Short, one-to-two-line prompts are strictly forbidden.
  - Use these structured blocks in the selected language:
    - `[Subject & Action]` (Include the exact **Fixed Appearance Anchor** and stick to one primary action)
    - `[Shot & Camera Movement]` (Shot size, camera angle, focal length, and trajectory)
    - `[Environment & Lighting]` (Setting details, light direction, color temperature, and atmosphere)
    - `[Style & Texture]` (Art style keywords, material textures, and **explicit instruction: no on-screen text, titles, or subtitles**)
    - `[Dialogue / Voiceover & Delivery]` *(Modes 1–4 video prompts only)*: Embed exact lines plus spoken language, accent, and vocal tone.

- **Mode 1: Text-to-Video (Direct)**
  - Structured video prompts named `v01`, `v02`, ..., `v[N]`.
- **Mode 2: First Frame Image + Video Prompt**
  - First-frame image prompts (`p01`, ..., `p[N]`) + image-to-video prompts (`v01`, ..., `v[N]`).
- **Mode 3: First & Last Frame Images + Video Prompt**
  - First-frame (`p01-1`, `p02-1`, ...) and last-frame (`p01-2`, `p02-2`, ...) image prompts with cross-segment continuity, plus frame-to-frame video prompts (`v01`, ..., `v[N]`).
- **Mode 4: Google Flow Gemini Agent (Storyboard Grid & Batch Workflow)**
  - **Storyboard Grid Prompt** (`storyboard_grid`): Multi-panel storyboard sheet prompt (e.g., 3x3 for 9 shots, left-to-right, top-to-bottom, zero text).
  - **Per-Shot Video Prompts**: `Shot_01`–`Shot_[N]`.
  - **Google Flow Gemini Agent Command Pack** *(copy-pasteable in the selected language)*:
    1. *Analyze & Lock (0 credits)*: Parse uploads into `Shot_01`–`Shot_[N]`, confirm rules, do not generate yet.
    2. *Pilot Test (`Shot_01` Only)*: Generate only `Shot_01`, confirm model/count/credits first, wait for review.
    3. *Batch Remaining (`Shot_02`–`Shot_[N]`)*: Generate independent clips (never animate the full grid, never re-run `Shot_01`, confirm credits, flag failures without auto-retrying; split >10 shots into batches of 6–8).
    4. *Targeted QC Fix Template*: Regenerate only a defective shot (`_V02`, `_V03`) referencing original character sheet + approved shots.
    5. *Asset Organization Command*: Sort into `01_Character_Refs`, `02_Scene_Refs`, `03_Storyboard`, `04_Generated_Clips`, `05_Revisions`; preserve originals.
- **Mode 5A: Local Pure FFmpeg (No Google Flow)**
  - **Keyframe Image Prompts**: Provide structured 100–200+ word still-image prompts named `p01.png`, `p02.png`, ..., `p[N].png` (zero on-screen text).
  - **TTS Voiceover Script & Commands**: Provide exact per-segment narration lines (`a01.mp3`–`a[N].mp3`) with ready-to-run `edge-tts` commands (matching the target language/voice, e.g., `en-US-AndrewNeural` or `zh-TW-HsiaoChenNeural`) and macOS `say` fallback.
  - **Subtitles (`subtitles.srt`)**: Provide a complete, properly timed `.srt` subtitle block synced to the script timestamps.
  - **Direct Render Command**: Provide the exact setup and render commands using `scripts/setup.sh --mode 5a` and `scripts/render_ffmpeg.sh <project_dir> <aspect_ratio>` to produce `final.mp4` directly.
- **Mode 5B: Local Code-Rendered Motion Graphics (No Google Flow)**
  - **Scene Timeline Spec (`timeline.json`)**: Structured JSON defining resolution, FPS, color palette, typography, and per-segment scenes (`id`, `startSec`, `durationSec`, `layout`, `onScreenText`, `motionCue`, `voiceover`, `sfx`).
  - **Code Implementation**: Choose the lightest engine that fits the visual style:
    - *HTML5 / Canvas / SVG + Headless Frame Capture + FFmpeg* (zero React/Remotion license overhead; ideal for explainers, kinetic typography, animated diagrams, and 2D vector scenes).
    - *Remotion (React/TypeScript)* when the user explicitly requests reusable React video templates (note Remotion's commercial license for companies with >3 employees).
  - **Setup & Render Commands**: Provide exact commands starting with `scripts/setup.sh --mode 5b` (or `--with-remotion`) and the final build/FFmpeg mux command to output `final.mp4` with optional TTS audio and BGM.

### 3. Packaging, Assembly & BGM Setup

- **Catchy Title Ideas**: 3 to 5 engaging title options tailored to the target language and audience.
- **Cover Image Prompt** (`cover`): 100+ words with clean negative space and zero AI-generated text.
- **Outro / End-Card Prompt** (`outro`): 100+ words with clean negative space, zero AI-generated text, plus 1–2 punchy closing taglines or viewer questions.
- **Background Music (BGM) Prompt**: Style description and generation prompt matching total duration (instrumentation, BPM, emotional arc).
- **Assembly Plan**: Concise shot-order and transition table for Google Flow **Scenebuilder** (Modes 1–4) or local `final.mp4` verification checklist (Modes 5A & 5B).

## Gotchas

- **Language Default**: Always confirm target language; default to **English** for all prompts, voice delivery cues, TTS voices, and Agent commands.
- **Zero-Text Rule (AI Image/Video Prompts)**: Never ask image or video diffusion models to render text, titles, or subtitles. *(Exception: Mode 5B programmatic code rendering handles crisp typography natively via HTML/CSS/SVG or Remotion.)*
- **Credit & Confirmation Guardrail (Modes 1–4)**: Keep Google Flow Agent confirmation set to **Always**; test `Shot_01` before batching; never re-run an entire batch on partial failure.
- **Local Setup First (Modes 5A & 5B)**: Always check dependencies with `scripts/setup.sh --check` before invoking `ffmpeg`, `edge-tts`, or Node/Remotion render commands.
- **Strict File Naming**: Clearly label every asset (`v01`, `p01`, `p01-1`, `p01-2`, `Shot_01`, `storyboard_grid`, `a01.mp3`, `subtitles.srt`, `timeline.json`, `cover`, `outro`).
- **No Short Prompts**: Every AI image/video prompt must be 100 to 200+ words.
- **Single-Pass Delivery**: Once parameters are confirmed, deliver the entire package in one complete response.
