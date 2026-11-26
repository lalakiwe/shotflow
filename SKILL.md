---
name: shotflow
description: Generate customizable AI short-video scripts, structured high-detail storyboard prompts, character turnaround sheets (or brand design anchors), asset naming specs, Google Flow Gemini Agent batch-generation command packs, and local direct-to-MP4 pipelines (pure FFmpeg or code-rendered HTML/Remotion motion graphics) with automated setup scripts. Supports both simple creative ideas AND full repository / product spec / PRD ingestion (e.g., Apple WWDC-style product keynote videos). Use when planning or rendering AI short videos or product launch presentations (Reels, Shorts, TikTok, or 16:9 keynotes) with custom segment counts, auto-paced durations, aspect ratios, visual styles, generation modes (1–4 for Google Flow; 5A/5B for local MP4 output), and multi-language dialogue/voiceover integration (defaults to English).
---
# ShotFlow: AI Short-Video Script, Storyboard & Local Render Engine

## Summary

This skill generates a complete, production-ready video workflow from either a **simple creative idea** (Track A) or a **real repository, product spec, or PRD** (Track B—e.g., Apple WWDC-style keynote presentations). It supports both **[Google Flow](https://flow.google.com/) / Gemini Agent** cloud generation (Modes 1–4) and **local direct-to-MP4 rendering without Google Flow** (Mode 5A via pure FFmpeg + TTS + SRT, and Mode 5B via code-rendered HTML/Canvas or Remotion + FFmpeg), paired with `scripts/setup.sh` and `scripts/render_ffmpeg.sh` in `https://github.com/lalakiwe/shotflow`.

## Setup & Render Scripts

- `scripts/setup.sh`: Idempotent dependency checker and installer (`--check`, `--mode 5a`, `--mode 5b`, `--mode all`, `--with-remotion`) for `ffmpeg`, `ffprobe`, Python `edge-tts` (isolated in `~/.shotflow-venv`), and `node`/`npm`.
- `scripts/render_ffmpeg.sh`: Mode 5A local renderer turning `p01.png`–`p[N].png` + optional `a01.mp3`–`a[N].mp3` + `bgm.mp3` + `subtitles.srt` into `final.mp4` with alternating Ken Burns motion, audio ducking, and burned-in captions.

## When to Use

- **Creative Short Videos (Track A)**: The user has a topic or story idea for Reels, Shorts, TikTok, or landscape clips and wants structured scripts, prompts, Google Flow Gemini Agent batch commands, or local MP4 rendering.
- **Repo / Product Spec / PRD Videos (Track B)**: The user provides a GitHub repo, local codebase, PRD, spec doc, or screenshots and wants a grounded product launch, demo, or **Apple WWDC-style keynote presentation video**.

## Input Track Detection (Automatic)

Automatically detect which input track applies—do **not** ask the user to pick a track:

- **Track A — Idea / Creative Brief**: Proceed directly to Parameter Check & Step 1.
- **Track B — Repo / Product Spec / PRD**: Run **Step 0 (Source Ingestion & Product Brief Extraction)** before Parameter Check / scripting.

## Parameter Check & Defaults

Before generating the full output, verify whether the user has provided:

1. **Segment Count**: Required. Ask if not specified *(for Track B keynotes, suggest `6`–`8` beats; for Mode 4 grids, `9` pairs with 3x3)*.
2. **Duration per Segment**: **Do NOT ask.** Automatically allocate durations per segment based on narrative pacing.
3. **Aspect Ratio**: Required (`9:16` vertical, `16:9` horizontal—suggest `16:9` for WWDC/keynote product videos if unspecified). Ask if not specified.
4. **Visual Style**: Required (e.g., Apple WWDC Keynote dark-mode minimal, cinematic live-action, 90s anime, kinetic typography). Ask if not specified.
5. **Generation Mode (`1`, `2`, `3`, `4`, `5A`, or `5B`)**: Ask if not specified:
   - `Mode 1`: Text-to-Video (Direct Google Flow prompts)
   - `Mode 2`: First Frame Image + Video Prompt (Google Flow)
   - `Mode 3`: First & Last Frame Images + Video Prompt *(Recommended for transition control in Google Flow)*
   - `Mode 4`: Google Flow Gemini Agent Batch Workflow *(Recommended for fast multi-shot batching via storyboard grid)*
   - `Mode 5A`: **Local Pure FFmpeg** *(No Google Flow — still keyframes + Ken Burns + local TTS + SRT → `final.mp4`)*
   - `Mode 5B`: **Local Code-Rendered Motion Graphics** *(No Google Flow — HTML/Canvas/SVG or Remotion + FFmpeg → `final.mp4`; **Recommended default for Track B Repo/PRD & WWDC-style product videos**)*
6. **Language**: **Always ask** which language to use for prompts, on-screen copy, and dialogue/voiceover. If omitted or default is chosen, **default to English**.

> If any required parameter (Segment Count, Aspect Ratio, Style, Mode, or Language) is missing, ask concisely in a single bulleted message before generating. Once confirmed (or if the user asks to proceed with defaults), output **all sections below in a single, complete response**.

## Pre-Flight Environment Setup (Modes 5A & 5B Only)

Whenever **Mode 5A** or **Mode 5B** is selected for local execution:
1. Run `./scripts/setup.sh --check --mode <5a|5b>` first to verify installed tools (`ffmpeg`, `ffprobe`, `edge-tts`, `node`/`npm`).
2. If any required tool is missing, run (or instruct the user to run) `./scripts/setup.sh --mode <5a|5b>` (add `--with-remotion` for Remotion in Mode 5B).
3. Isolate `edge-tts` in `~/.shotflow-venv` (never assume global `pip install` works; fall back to macOS `say` if needed).

## Steps

### Step 0. Source Ingestion & Product Brief *(Track B: Repo / Spec / PRD Only)*

1. **Inspect Primary Sources**: Read the provided repo (`README.md`, main entrypoints, architecture/feature modules, CLI/UI code, docs, or screenshots) or PRD/spec document thoroughly.
2. **Extract Grounded Product Brief** *(strictly zero hallucination—every feature name, CLI command, API, metric, and UI label must come verbatim from the source)*:
   - **Problem / Cold Open Hook**: The real user pain point this product eliminates.
   - **Hero Reveal Line**: One crisp keynote headline describing what the product is.
   - **Top 3–5 Verified Features / Capabilities**: Grounded in real code, workflows, or spec sections.
   - **Concrete Proof / Demo Beats**: Real CLI commands, code snippets, UI flows, or verified benchmarks from the source.
   - **Closing CTA**: Exact repo URL, install command, or launch tagline.
3. **Keynote Narrative Arc (e.g., Apple WWDC Style)**:
   - Structure segments cleanly: *Cold Open (Problem) → Hero Product Reveal → 3–4 Crisp Feature / Demo Beats → Architecture / Workflow Payoff → Summary Bento Grid ("All at a Glance") → Clean Closing CTA*.

### 1. Script, Unified Visual Bible & Anchor Foundation

- **Storyboard Script & Pacing Check**:
  - Outline the full script with exact timestamps and narrative beats per segment.
  - **One Primary Action / Concept Rule**: Limit each shot to **one clear primary action** (Track A) or **one focal product capability** (Track B) to keep pacing crisp and readable.
  - **Speech Pacing Guardrail**: Cap narration/dialogue per segment with a 0.5 to 1 second breathing buffer (~2.5 to 3 words/sec for English; ~3.5 to 4.5 characters/sec for Mandarin).
- **Character Turnaround OR Brand & Design System Anchor**:
  - *If the video has recurring characters (Track A / mascot videos)*: Provide front, back, and side turnaround prompts (100–200+ words each) and extract a **Fixed Appearance Anchor** to reuse verbatim.
  - *If the video is a product / repo / PRD presentation without characters (Track B)*: Skip character turnarounds and define a **Brand & Design System Anchor** (color palette, dark/light surface theme, typography hierarchy, UI/terminal chrome style, accent glow/motion easing, and logo/wordmark treatment) reused across every scene.
- **Unified Visual Spec (Google Flow Agent Instructions / Local Style Spec)**:
  - Output a compact project control block covering: `[Subject / Brand System]`, `[Visual Style]`, `[Setting / Canvas Continuity]`, `[Cinematography & Motion Pacing]`, and `[Output Spec & Negative Constraints]`.

### 2. Storyboard, Prompts & Local Render Pipeline

Provide complete assets for **every segment** in the script. **Always prefix each prompt or file block with its exact designated filename.**

- **Structured Long-Form Prompt Standard (100 to 200+ words per prompt)** *(Applies to Modes 1–4 and Mode 5A image prompts)*:
  - Short, one-to-two-line prompts are strictly forbidden.
  - Use these structured blocks in the selected language:
    - `[Subject & Action]` (Include the exact Appearance or Brand Anchor; stick to one primary action)
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
    4. *Targeted QC Fix Template*: Regenerate only a defective shot (`_V02`, `_V03`) referencing original character/brand sheet + approved shots.
    5. *Asset Organization Command*: Sort into `01_Character_Refs`, `02_Scene_Refs`, `03_Storyboard`, `04_Generated_Clips`, `05_Revisions`; preserve originals.
- **Mode 5A: Local Pure FFmpeg (No Google Flow)**
  - **Keyframe Image Prompts**: Structured 100–200+ word still-image prompts named `p01.png`–`p[N].png` (zero on-screen text).
  - **TTS Voiceover Script & Commands**: Exact per-segment narration lines (`a01.mp3`–`a[N].mp3`) with `edge-tts` commands (matching target language/voice) and macOS `say` fallback.
  - **Subtitles (`subtitles.srt`)**: Complete, properly timed `.srt` subtitle block synced to script timestamps.
  - **Direct Render Command**: Setup and render commands using `./scripts/setup.sh --mode 5a` and `./scripts/render_ffmpeg.sh <project_dir> <aspect_ratio>`.
- **Mode 5B: Local Code-Rendered Motion Graphics (No Google Flow)**
  - **Scene Timeline Spec (`timeline.json`)**: Structured JSON defining resolution, FPS, color palette, typography, and per-segment scenes (`id`, `startSec`, `durationSec`, `layout`, `onScreenText`, `codeOrUiSnippet`, `motionCue`, `voiceover`, `sfx`).
  - **Code Implementation**: Choose the lightest engine that fits:
    - *HTML5 / Canvas / SVG + Headless Frame Capture + FFmpeg* (zero Remotion license overhead; ideal for WWDC-style keynotes, kinetic typography, animated terminal/UI demos, Bento feature grids, and architecture diagrams).
    - *Remotion (React/TypeScript)* when the user explicitly requests reusable React video templates (note Remotion's commercial license for companies with >3 employees).
  - **Setup & Render Commands**: Commands starting with `./scripts/setup.sh --mode 5b` (or `--with-remotion`) plus TTS + FFmpeg mux commands to output `final.mp4`.

### 3. Packaging, Assembly & BGM Setup

- **Catchy Title Ideas**: 3 to 5 engaging title options tailored to the target language and audience.
- **Cover Image Prompt** (`cover`): 100+ words with clean negative space and zero AI-generated text *(or a crisp code-rendered title card in Mode 5B)*.
- **Outro / End-Card Prompt** (`outro`): 100+ words with clean negative space, zero AI-generated text, plus 1–2 punchy closing taglines / CTAs.
- **Background Music (BGM) Prompt**: Style description and generation prompt matching total duration (instrumentation, BPM, emotional arc—e.g., upbeat minimalist electronic pulse for WWDC keynotes).
- **Assembly Plan**: Concise shot-order and transition table for Google Flow **Scenebuilder** (Modes 1–4) or local `final.mp4` verification checklist (Modes 5A & 5B).

## Gotchas

- **Zero Hallucination on Repo / PRD Inputs (Track B)**: Never invent product features, performance numbers, benchmarks, UI labels, or CLI flags that were not verified in the provided repository or PRD.
- **Language Default**: Always confirm target language; default to **English** for all prompts, voice delivery cues, TTS voices, and Agent commands.
- **Zero-Text Rule (AI Image/Video Prompts)**: Never ask image or video diffusion models to render text, titles, or subtitles. *(Exception: Mode 5B programmatic code rendering handles crisp typography, terminal output, and Bento cards natively via HTML/CSS/SVG or Remotion.)*
- **Credit & Confirmation Guardrail (Modes 1–4)**: Keep Google Flow Agent confirmation set to **Always**; test `Shot_01` before batching; never re-run an entire batch on partial failure.
- **Local Setup First (Modes 5A & 5B)**: Always check dependencies with `./scripts/setup.sh --check` before invoking `ffmpeg`, `edge-tts`, or Node/Remotion render commands.
- **Strict File Naming**: Clearly label every asset (`v01`, `p01`, `p01-1`, `p01-2`, `Shot_01`, `storyboard_grid`, `a01.mp3`, `subtitles.srt`, `timeline.json`, `cover`, `outro`).
- **No Short Prompts**: Every AI image/video prompt must be 100 to 200+ words.
- **Single-Pass Delivery**: Once parameters are confirmed, deliver the entire package in one complete response.
