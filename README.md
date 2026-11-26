# ShotFlow

An AI short-video script, storyboard prompt, and asset-naming skill (`SKILL.md`) designed to generate production-ready Reels, Shorts, TikTok, and landscape video workflows for tools like [Google Flow](https://flow.google.com/).

## Features

- **Customizable Parameters**: Segment count, auto-paced segment durations, aspect ratio (`9:16`, `16:9`, etc.), visual style, and target language (defaults to English).
- **Three Generation Modes**:
  1. **Text-to-Video**: Direct video prompts (`v01`, `v02`, ...).
  2. **First Frame + Video**: Keyframe image prompts (`p01`, ...) paired with image-to-video prompts (`v01`, ...).
  3. **First & Last Frame + Video** *(Recommended)*: Start/end keyframe prompts (`p01-1`, `p01-2`, ...) with cross-segment continuity and frame-to-frame video prompts (`v01`, ...).
- **Character Consistency**: Front/back/side turnaround prompts and a Fixed Appearance Anchor reused verbatim across all segments.
- **Integrated Dialogue & Pacing**: Speech-rate guardrails (~2.5–3 words/sec in English; ~3.5–4.5 chars/sec in Mandarin) with explicit delivery cues embedded in video prompts.
- **Zero-Text Packaging & BGM**: Clean negative-space `cover` and `outro` prompts plus a matched-duration BGM prompt.

## Workflow with Google Flow

1. **Generate the plan with `shotflow`**: Provide your topic, segment count, aspect ratio, visual style, generation mode, and language.
2. **Create character & keyframe assets**: Generate the character turnaround sheets and keyframe images (`p01`, or `p01-1` / `p01-2`) in [Google Flow](https://flow.google.com/) (or your preferred image model) and name each file using the specified convention.
3. **Render video clips in Google Flow**: Upload the matching keyframe(s) into [Google Flow](https://flow.google.com/) (Text-to-Video, First Frame, or Frames-to-Video) and paste the corresponding `v01`, `v02`, ... prompt—including the embedded dialogue/voiceover cues—to generate each clip.
4. **Assemble & package**: Stitch the rendered `v01`–`v[N]` clips in your video editor, add the `cover` and `outro` frames with post-production titles, and layer in the generated BGM.

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

**搭配 Google Flow 工作流程：**
1. 使用 `shotflow` 產出完整腳本、角色定裝照提示詞、首尾幀圖片提示詞（`p01-1`、`p01-2` 等）與影片提示詞（`v01` 等）。
2. 在 [Google Flow](https://flow.google.com/) 生成定裝照與各段關鍵幀圖片，並依規範命名存檔。
3. 將對應的關鍵幀圖片與內含旁白/對話指示的 `v01`–`v[N]` 提示詞輸入 [Google Flow](https://flow.google.com/) 生成各段影片。
4. 最後在剪輯軟體中串接影片、加上 `cover` / `outro` 與後製標題及配樂。

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
