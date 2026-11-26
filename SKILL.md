---
name: shotflow
description: Generate customizable AI short-video scripts, structured high-detail storyboard prompts, character turnaround sheets, asset naming specs, and Google Flow Gemini Agent batch-generation command packs. Use when planning AI short videos (Reels, Shorts, TikTok, or landscape clips) with custom segment counts, auto-paced durations, aspect ratios, visual styles, generation modes (Text-to-Video, First-Frame, First-to-Last Frame, or Google Flow Gemini Agent Grid/Batch), and multi-language dialogue/voiceover integration (defaults to English).
---
# ShotFlow: AI Short-Video Script & Storyboard Prompt Engine

## Summary

This skill generates a complete, production-ready AI short-video workflow optimized for [Google Flow](https://flow.google.com/) and its **Gemini Agent**. It supports four generation workflows (including storyboard-grid conversational batching), enforces strict file-naming and version conventions, produces structured high-detail prompts, embeds **dialogue and voiceover directly into video prompts** (confirming target language; defaults to English), and includes a test-first, batch-second **Gemini Agent Command Pack** with credit and QC guardrails.

## When to Use

- The user wants to plan an AI short video (Reels, Shorts, TikTok, or landscape clips) with customizable segment count, duration, aspect ratio, visual style, generation mode, and language.
- The user needs structured, high-detail image/video prompts, character consistency anchors, strict asset naming, or ready-to-paste **Google Flow Gemini Agent** instructions for pilot testing, batch generation, targeted shot fixes, and asset organization.

## Parameter Check & Defaults

Before generating, verify whether the user has provided the following parameters:

1. **Segment Count**: Required. Ask if not specified (note: `9` segments pairs naturally with a 3x3 storyboard grid).
2. **Duration per Segment**: **Do NOT ask.** If omitted, automatically allocate durations per segment based on narrative pacing.
3. **Aspect Ratio**: Required (e.g., `9:16` vertical, `16:9` horizontal). Ask if not specified.
4. **Visual Style**: Required (e.g., cinematic live-action, 90s anime, hand-painted watercolor animation, Pixar 3D). Ask if not specified.
5. **Generation Mode (1, 2, 3, or 4)**: Ask if not specified:
   - `Mode 1`: Text-to-Video (Direct)
   - `Mode 2`: First Frame Image + Video Prompt
   - `Mode 3`: First & Last Frame Images + Video Prompt *(Recommended for maximum transition control)*
   - `Mode 4`: Google Flow Gemini Agent Batch Workflow *(Recommended for fast multi-shot production via storyboard grid + conversational batching)*
6. **Language**: **Always ask** which language to use for prompts and dialogue/voiceover. If the user omits it or opts for the default, **default to English**.

> If any required parameter (Segment Count, Aspect Ratio, Style, Mode, or Language) is missing, ask concisely in a single bulleted message before generating. Once confirmed (or if the user asks to proceed with defaults), output **all sections below in a single, complete response**.

## Steps

### 1. Script, Unified Visual Bible & Character Foundation

- **Storyboard Script & Pacing Check**:
  - Outline the full short-video script with clear timestamps and narrative beats for each segment.
  - **One Primary Action Rule**: Limit each shot to **one clear primary action** with natural, stable camera movement to prevent motion artifacts and maintain visual coherence.
  - **Speech Pacing Guardrail**: Strictly cap dialogue/voiceover length per segment and leave a 0.5 to 1 second breathing buffer to prevent rushed speech or cut-off lines (~2.5 to 3 words/sec for English; ~3.5 to 4.5 characters/sec for Mandarin).
- **Character Turnaround & Fixed Appearance Anchor**:
  - Provide detailed turnaround prompts (front, back, and side views) for the main character(s) (100 to 200+ words each, specifying focal length, camera angle, lighting, skin/hair/fur texture, outfit/fabric details, and quality keywords).
  - Extract a **Fixed Appearance Anchor** (hairstyle/fur markings, facial features, body proportions, outfit/accessories, and color palette) to reuse verbatim across every prompt.
- **Unified Visual Spec (Google Flow Agent Instructions Block)**:
  - Output a compact, copy-pasteable project control block covering: `[Character]`, `[Visual Style]`, `[Setting & Continuity]`, `[Cinematography & Pacing]`, and `[Output Spec & Negative Constraints (no text/logos/extra characters)]`. Users can paste this directly into Google Flow's **Agent Instructions** to lock consistency across the project.

### 2. Storyboard & Video Generation Prompts (Naming, Continuity & Audio)

Provide prompts for every segment in the script. **Always prefix each prompt with its exact designated filename.**

- **Structured Long-Form Prompt Standard (100 to 200+ words per prompt)**:
  - Short, one-to-two-line prompts are strictly forbidden.
  - Write all prompts in the selected language using these structured blocks to prevent prompt dilution:
    - `[Subject & Action]` (Must include the exact **Fixed Appearance Anchor** from Step 1 and stick to one primary action)
    - `[Shot & Camera Movement]` (Shot size, camera angle, focal length, and trajectory)
    - `[Environment & Lighting]` (Setting details, light direction, color temperature, and atmosphere)
    - `[Style & Texture]` (Art style keywords, material textures, and **explicit instruction: no on-screen text, titles, or subtitles**)
    - `[Dialogue / Voiceover & Delivery]` *(Video prompts only)*: Embed the exact lines and specify spoken language, accent, and tone (e.g., `Spoken in English, calm and deadpan tone` or `Spoken in Taiwanese Mandarin, warm conversational tone`).

- **Mode 1: Text-to-Video (Direct)**
  - Provide structured video generation prompts (with integrated dialogue/voiceover).
  - **Filenames**: `v01`, `v02`, ..., `v[N]`.
- **Mode 2: First Frame Image + Video Prompt**
  - Provide first-frame image prompts (`p01`, `p02`, ..., `p[N]`) and image-to-video prompts (`v01`, `v02`, ..., `v[N]`).
- **Mode 3: First & Last Frame Images + Video Prompt**
  - Provide first-frame (`p01-1`, `p02-1`, ...) and last-frame (`p01-2`, `p02-2`, ...) image prompts.
  - **Cross-Segment Continuity**: Ensure the next segment's first frame (`p02-1`) inherits the spatial layout, lighting, and character positioning from the previous segment's last frame (`p01-2`).
  - Provide frame-to-frame video prompts (`v01`, `v02`, ..., `v[N]`) focusing on the physical transition, camera path, and integrated audio.
- **Mode 4: Google Flow Gemini Agent (Storyboard Grid & Batch Workflow)**
  - **Storyboard Grid Prompt** (`storyboard_grid`): Provide a single high-detail multi-panel storyboard sheet prompt (e.g., 3x3 grid for 9 shots, ordered left-to-right, top-to-bottom, zero text/labels inside frames) matching the aspect ratio and Unified Visual Spec. *(Note: If the grid has >9 shots, split into multiple grids or individual reference frames.)*
  - **Per-Shot Video Prompts**: Provide structured video prompts labeled `Shot_01`, `Shot_02`, ..., `Shot_[N]`.
  - **Google Flow Gemini Agent Command Pack** *(copy-pasteable prompts in the selected language)*:
    1. **Analyze & Lock (0 credits)**: Instruct Gemini Agent to parse the uploaded character sheet + storyboard grid left-to-right, top-to-bottom into `Shot_01`–`Shot_[N]`, confirm visual rules, and **do not generate yet**.
    2. **Pilot Test (`Shot_01` Only)**: Generate only `Shot_01` as a standalone clip; confirm video model, count (1), and estimated credits before running; wait for review before generating `Shot_02`–`Shot_[N]`.
    3. **Batch Remaining (`Shot_02`–`Shot_[N]`)**: Generate remaining shots as **independent clips** (never animate the whole grid as one video, never regenerate `Shot_01`, 1 version per shot, confirm total credits first, and flag any failed shot IDs without auto-retrying). For >10 shots, split into batches of 6–8 shots.
    4. **Targeted QC Fix Template**: A fill-in-the-blank prompt to regenerate only a defective shot (e.g., `Shot_04`) by referencing the original character sheet and approved shots while locking scene, composition, and camera movement (`_V02`, `_V03` versioning).
    5. **Asset Organization Command**: Instruct Gemini Agent to sort project assets into 5 collections (`01_Character_Refs`, `02_Scene_Refs`, `03_Storyboard`, `04_Generated_Clips`, `05_Revisions`), rename clips `Shot_01`–`Shot_[N]` (with `_V02`/`_V03` for revisions), preserve all originals, and report completion status.

### 3. Packaging, Scenebuilder Assembly & BGM Setup

- **Catchy Title Ideas**: Provide 3 to 5 engaging title options tailored to the target language and audience (for post-production overlay).
- **Cover Image Prompt** (`cover`): A visually striking cover prompt (100+ words). **Leave clean negative space for post-production title placement; strictly forbid AI-generated text.**
- **Outro / End-Card Prompt** (`outro`): A contextual closing visual matching the story's tone and aspect ratio (100+ words) with clean negative space and zero AI-generated text, plus 1 to 2 punchy closing lines or viewer questions for post-production overlay.
- **Background Music (BGM) Prompt**: Provide a BGM style description and generation prompt matching total video duration (instrumentation, BPM, emotional arc).
- **Scenebuilder & Post-Production Assembly Plan**: Provide a concise shot-order and transition table (clip order, trim/pacing cue, transition type, and where to layer subtitles/SFX/BGM in Google Flow **Scenebuilder** or an external editor).

## Gotchas

- **Language Default**: Always confirm the target language; if unspecified, default to **English** for all prompts, voice delivery cues, and Agent commands. Never hardcode a single language.
- **Zero-Text Rule**: Never instruct image or video models to render text, titles, or subtitles inside the frame. Reserve clean negative space for post-production editing (e.g., CapCut, Premiere).
- **Credit & Confirmation Guardrail (Google Flow)**: Remind the user to keep Gemini Agent's confirmation preference set to **Always** (not *Never*) before batch runs so credits aren't consumed without approval. Always test `Shot_01` before batching remaining shots, and never re-run an entire batch when only specific shots fail.
- **Grid Recognition Fallback**: If Gemini Agent misreads panels from a single multi-panel storyboard grid, crop the grid into individual frame images and assign them per shot.
- **Strict File Naming**: Clearly label every prompt's heading with its exact filename (`v01`, `p01`, `p01-1`, `p01-2`, `Shot_01`, `storyboard_grid`, `cover`, `outro`).
- **No Short Prompts**: Every image and video prompt must be a structured, 100 to 200+ word description.
- **Single-Pass Delivery**: Once parameters are confirmed, deliver the entire package in one complete response.
