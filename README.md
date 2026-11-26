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

## Sample Usage

### English

**Full-Parameter Prompt:**

```text
Use shotflow to plan a 4-segment short video about a cozy rainy-night ramen shop in Tokyo.
- Aspect Ratio: 9:16
- Visual Style: 90s anime, warm cel-shaded lighting
- Generation Mode: 3 (First & Last Frame)
- Language: English
```

**Quick Prompt (triggers parameter confirmation):**

```text
Use shotflow to create a 3-segment product reveal video for a minimalist titanium coffee dripper.
```

---

### 繁體中文 (Traditional Chinese)

**完整參數範例：**

```text
請使用 shotflow 規劃一支關於「台北深夜巷弄豆花攤」的 4 段式短影片。
- 影片比例：9:16 直式
- 視覺風格：電影感寫實風格、暖黃街燈光影
- 生成模式：3（首尾幀圖片 + 影片提示詞）
- 語言：繁體中文（台灣中文旁白）
```

**快速指令（系統會先確認缺少的參數）：**

```text
請幫我用 shotflow 製作一支 3 段式的極簡鈦金屬咖啡濾杯開箱短影片。
```

## Expected Output

After confirming parameters, `shotflow` outputs a complete production package in one response:
- Timestamped script with speech-pacing checks
- Character turnaround prompts (front, back, side) and a **Fixed Appearance Anchor**
- Structured 100–200+ word prompts labeled by filename (`p01-1`, `p01-2`, `v01`, etc.)
- Catchy title ideas, `cover` and `outro` image prompts (with zero on-screen text), and a BGM prompt

## Structure

```text
shotflow/
├── README.md
└── SKILL.md
```
