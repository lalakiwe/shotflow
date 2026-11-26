---
name: shotflow
description: Generate customizable AI short-video scripts, structured high-detail storyboard prompts, character turnaround sheets, and asset naming specs. Use when planning AI short videos (Reels, Shorts, TikTok, or landscape clips) with custom segment counts, auto-paced durations, aspect ratios, visual styles, generation modes (Text-to-Video, First-Frame, First-to-Last Frame), and multi-language dialogue/voiceover integration (defaults to English).
---
# ShotFlow: AI Short-Video Script & Storyboard Prompt Engine

## Summary

This skill guides the generation of a complete, production-ready AI video workflow. It integrates three video generation modes, enforces strict asset file-naming conventions, produces structured high-detail prompts, and embeds **dialogue and voiceover directly into video generation prompts** with explicit language and delivery instructions (asks the user for language preference; defaults to English).

## When to Use

- The user wants to plan an AI short video (Reels, Shorts, TikTok, or landscape clips) with customizable segment count, duration, aspect ratio, visual style, generation mode, and language.
- The user needs structured, high-detail image/video prompts, strict file-naming rules, character consistency anchors, and integrated voiceover/dialogue cues.

## Parameter Check & Defaults

Before generating, verify whether the user has provided the following parameters:

1. **Segment Count**: Required. Ask if not specified.
2. **Duration per Segment**: **Do NOT ask.** If omitted, automatically allocate durations per segment based on narrative pacing.
3. **Aspect Ratio**: Required (e.g., `9:16` vertical, `16:9` horizontal). Ask if not specified.
4. **Visual Style**: Required (e.g., cinematic live-action, 90s anime, Pixar 3D). Ask if not specified.
5. **Generation Mode (1, 2, or 3)**: Ask if not specified (note that Mode 3: First-to-Last Frame is the recommended default).
6. **Language**: **Always ask** which language to use for prompts and dialogue/voiceover. If the user omits it or opts for the default, **default to English**.

> If any required parameter (Segment Count, Aspect Ratio, Style, Mode, or Language) is missing, ask concisely in a single bulleted message before generating. Once confirmed (or if the user asks to proceed with defaults), output **all sections below in a single, complete response**.

## Steps

### 1. Script & Character Foundation

- **Storyboard Script & Pacing Check**:
  - Outline the full short-video script with clear timestamps and narrative beats for each segment.
  - **Speech Pacing Guardrail**: Strictly cap dialogue/voiceover length per segment and leave a 0.5 to 1 second breathing buffer to prevent rushed speech or cut-off lines (~2.5 to 3 words/sec for English; ~3.5 to 4.5 characters/sec for Mandarin).
- **Character Turnaround & Consistency Anchors**:
  - Provide detailed turnaround prompts (front, back, and side views) for the main character(s) (100 to 200+ words each, specifying focal length, camera angle, lighting, skin/hair texture, fabric details, and quality keywords).
  - Extract a **Fixed Appearance Anchor** (hairstyle, facial features, outfit silhouette, and color palette) to be reused verbatim across all subsequent storyboard prompts.

### 2. Storyboard & Video Generation Prompts (Naming, Continuity & Audio)

Provide prompts for every segment in the script. **Always prefix each prompt with its exact designated filename.**

- **Structured Long-Form Prompt Standard (100 to 200+ words per prompt)**:
  - Short, one-to-two-line prompts are strictly forbidden.
  - Write all prompts in the selected language using the following structured blocks to prevent prompt dilution:
    - `[Subject & Action]` (Must include the exact **Fixed Appearance Anchor** from Step 1)
    - `[Shot & Camera Movement]` (Focal length, framing, and camera trajectory)
    - `[Environment & Lighting]` (Setting details, light direction, color temperature, and atmosphere)
    - `[Style & Texture]` (Art style keywords, material textures, and **explicit instruction: no on-screen text, titles, or subtitles**)
    - `[Dialogue / Voiceover & Delivery]` *(Video prompts only)*: Embed the exact lines and specify the spoken language, accent, and tone (e.g., `Spoken in English, calm and deadpan tone` or `Spoken in Taiwanese Mandarin, energetic tone`).

- **Mode 1: Text-to-Video (Direct)**
  - Provide structured video generation prompts (with integrated dialogue/voiceover).
  - **Filenames**: `v01`, `v02`, ..., `v[N]`.
- **Mode 2: First Frame Image + Video Prompt**
  - Provide first-frame image prompts. **Filenames**: `p01`, `p02`, ..., `p[N]`.
  - Provide image-to-video prompts focusing on motion continuation, camera movement, and audio from the first frame. **Filenames**: `v01`, `v02`, ..., `v[N]`.
- **Mode 3: First & Last Frame Images + Video Prompt**
  - Provide both first-frame (`p01-1`, `p02-1`, ...) and last-frame (`p01-2`, `p02-2`, ...) image prompts.
  - **Cross-Segment Continuity**: Ensure the next segment's first frame (`p02-1`) naturally inherits the spatial layout, lighting, and character positioning from the previous segment's last frame (`p01-2`) to avoid jarring jump cuts.
  - Provide frame-to-frame video prompts (`v01`, `v02`, ...) focusing on the physical transition, camera path, and integrated audio from the first frame to the last frame.

### 3. Packaging & BGM Setup

- **Catchy Title Ideas**: Provide 3 to 5 engaging title options tailored to the target language and audience (for post-production overlay).
- **Cover Image Prompt**: A visually striking cover prompt (100+ words). **Leave clean negative space for post-production title placement; strictly forbid AI-generated text.**
  - **Filename**: `cover`
- **Outro / End-Card Prompt**: A contextual closing visual matching the story's tone and aspect ratio (100+ words). **Leave clean negative space and forbid AI-generated text.** Also provide 1 to 2 punchy closing lines or viewer questions for post-production text overlay (avoid generic "Thanks for watching" templates).
  - **Filename**: `outro`
- **Background Music (BGM) Prompt**: Provide a BGM style description and generation prompt matching the total video duration (including instrumentation, BPM, and emotional arc).

## Gotchas

- **Language Default**: Always confirm the target language; if unspecified, default to **English** for all prompts and voice delivery cues. Never hardcode a single language.
- **Zero-Text Rule**: Never instruct image or video models to render text, titles, or subtitles inside the frame. Reserve clean negative space for post-production editing (e.g., CapCut, Premiere).
- **Strict File Naming**: Clearly label every prompt's heading with its exact filename (`v01`, `p01`, `p01-1`, `p01-2`, `cover`, `outro`).
- **No Short Prompts**: Every image and video prompt must be a structured, 100 to 200+ word description.
- **Single-Pass Delivery**: Once parameters are confirmed, deliver the entire package in one complete response.
