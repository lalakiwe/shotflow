# ShotFlow

An AI short-video script, storyboard prompt, and asset-naming skill (`SKILL.md`) designed to generate production-ready Reels, Shorts, TikTok, and landscape video workflows for [Google Flow](https://flow.google.com/) and its **Gemini Agent**.

## Features

- **Customizable Parameters**: Segment count, auto-paced segment durations, aspect ratio (`9:16`, `16:9`, etc.), visual style, and target language (defaults to English).
- **Four Generation Modes**:
  1. **Text-to-Video**: Direct video prompts (`v01`, `v02`, ...).
  2. **First Frame + Video**: Keyframe image prompts (`p01`, ...) paired with image-to-video prompts (`v01`, ...).
  3. **First & Last Frame + Video**: Start/end keyframe prompts (`p01-1`, `p01-2`, ...) with cross-segment continuity and frame-to-frame video prompts (`v01`, ...).
  4. **Google Flow Gemini Agent Batch Workflow**: Multi-panel storyboard grid (`storyboard_grid`) + **Unified Visual Spec** (for Agent Instructions) + ready-to-paste **Gemini Agent Command Pack** (analyze, pilot `Shot_01`, batch `Shot_02`–`Shot_[N]`, targeted QC fix, and collection organization).
- **Character & Motion Consistency**: Front/back/side turnaround prompts, a Fixed Appearance Anchor reused verbatim, and a one-primary-action-per-shot guardrail.
- **Integrated Dialogue & Pacing**: Speech-rate guardrails (~2.5–3 words/sec in English; ~3.5–4.5 chars/sec in Mandarin) with explicit delivery cues embedded in video prompts.
- **Zero-Text Packaging, BGM & Scenebuilder Plan**: Clean negative-space `cover` and `outro` prompts, a matched-duration BGM prompt, and a Google Flow Scenebuilder assembly timeline.

## Workflow with Google Flow & Gemini Agent

1. **Generate the production package with `shotflow`**: Provide your topic, segment count (e.g., `9` for a 3x3 grid), aspect ratio, visual style, generation mode, and language.
2. **Lock project rules in Google Flow**: Create a dedicated project in [Google Flow](https://flow.google.com/), paste the **Unified Visual Spec** into **Agent Instructions**, and keep the confirmation preference set to **Always** to protect credits.
3. **Upload references & run Pilot Shot (`Shot_01`)**: Upload your character turnaround sheet and storyboard grid (or cropped frames), run the **Analyze & Lock** command (0 credits), then generate only `Shot_01` to verify style and character consistency.
4. **Batch remaining shots & run targeted QC**: Once `Shot_01` looks right, run the **Batch Remaining** command (`Shot_02`–`Shot_[N]`). If a single shot drifts, use the **Targeted QC Fix** command (`_V02`, `_V03`) instead of regenerating everything.
5. **Organize & assemble**: Use the **Asset Organization** command to sort clips into collections (`01_Character_Refs` through `05_Revisions`), arrange clips in **Scenebuilder** (`Add to Scene`), export, and layer in `cover`, `outro`, titles, and BGM.

## Sample Usage

### English

**Mode 4 (Google Flow Gemini Agent Batch Workflow):**

```text
Use shotflow to plan a 9-segment healing brand animation about a Shiba Inu strolling through a quiet Japanese town.
- Aspect Ratio: 9:16
- Visual Style: Japanese hand-painted watercolor anime, soft pencil lines, warm low-saturation colors
- Generation Mode: 4 (Google Flow Gemini Agent Batch)
- Language: English
```

**Mode 3 (First & Last Frame):**

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

**模式 4（Google Flow Gemini Agent 九宮格批次工作流）：**

```text
請使用 shotflow 規劃一支 9 段式的日系療癒品牌形象動畫《慢一點，也沒關係》，主角是戴著鼠尾草綠領巾的赤柴 Haru。
- 影片比例：9:16 直式
- 視覺風格：日系手繪水彩動畫電影風格、柔和鉛筆線條、溫暖低飽和色彩
- 生成模式：4（Google Flow Gemini Agent 批次工作流）
- 語言：繁體中文（台灣中文旁白）
```

**模式 3（首尾幀精準控制）：**

```text
請使用 shotflow 規劃一支關於「台北深夜巷弄豆花攤」的 4 段式短影片。
- 影片比例：9:16 直式
- 視覺風格：電影感寫實風格、暖黃街燈光影
- 生成模式：3（首尾幀圖片 + 影片提示詞）
- 語言：繁體中文（台灣中文旁白）
```

**搭配 Google Flow Gemini Agent 工作流程：**
1. 在 [Google Flow](https://flow.google.com/) 建立獨立專案，將 `shotflow` 產出的**全片統一視覺規範**貼入 **Agent Instructions**，並將生成確認設為 **Always**（避免誤耗點數）。
2. 上傳角色定裝照與九宮格分鏡圖（若 AI 辨識不準可改傳裁切後的單張圖片），先執行 **Analyze & Lock** 指令確認分鏡理解（不消耗點數）。
3. 先生成 **Shot 01** 測試鏡頭並人工檢查；確認無誤後，再送出 **Batch Remaining** 指令一次批次生成 `Shot 02`–`Shot 09`（超過 10 鏡建議分批）。
4. 若單一鏡頭出現角色偏移，使用 **Targeted QC Fix** 指令只重算該鏡頭（標記 `_V02`、`_V03`），再請 Agent 依 5 大分類整理收藏。
5. 透過 **Scenebuilder**（`Add to Scene`）依序串接、修剪並下載，最後於剪輯軟體加上 `cover` / `outro`、字幕與配樂。

## Expected Output

After confirming parameters, `shotflow` outputs a complete production package in one response:
- Timestamped script with speech-pacing checks and one-primary-action-per-shot rules
- Character turnaround prompts (front, back, side), **Fixed Appearance Anchor**, and **Unified Visual Spec** (for Google Flow Agent Instructions)
- Structured 100–200+ word prompts labeled by filename (`p01-1`, `p01-2`, `v01`, `Shot_01`, `storyboard_grid`, etc.)
- *(Mode 4)* Ready-to-paste **Google Flow Gemini Agent Command Pack** (Analyze, Pilot Shot, Batch, QC Fix, Asset Organization)
- Catchy title ideas, `cover` and `outro` image prompts (with zero on-screen text), BGM prompt, and a Scenebuilder assembly plan

## Structure

```text
shotflow/
├── README.md
└── SKILL.md
```
