# ShotFlow

An AI short-video script, storyboard prompt, and asset-naming skill (`SKILL.md`) for generating production-ready Reels, Shorts, TikTok, and landscape video workflows.

## Features

- **Customizable Parameters**: Segment count, auto-paced segment durations, aspect ratio (`9:16`, `16:9`, etc.), visual style, and target language (defaults to English).
- **Three Generation Modes**:
  1. **Text-to-Video**: Direct video prompts (`v01`, `v02`, ...).
  2. **First Frame + Video**: Keyframe image prompts (`p01`, ...) paired with image-to-video prompts (`v01`, ...).
  3. **First & Last Frame + Video** *(Recommended)*: Start/end keyframe prompts (`p01-1`, `p01-2`, ...) with cross-segment continuity and frame-to-frame video prompts (`v01`, ...).
- **Character Consistency**: Front/back/side turnaround prompts and a Fixed Appearance Anchor reused verbatim across all segments.
- **Integrated Dialogue & Pacing**: Speech-rate guardrails (~2.5–3 words/sec in English; ~3.5–4.5 chars/sec in Mandarin) with explicit delivery cues embedded in video prompts.
- **Zero-Text Packaging & BGM**: Clean negative-space `cover` and `outro` prompts plus a matched-duration BGM prompt.

## Structure

```text
shotflow/
├── README.md
└── SKILL.md
```
