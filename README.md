# ShotFlow

An AI short-video script, storyboard prompt, asset-naming, and local rendering skill (`SKILL.md`) for producing Reels, Shorts, TikTok, and landscape videos—supporting both **[Google Flow](https://flow.google.com/) / Gemini Agent** workflows and **local direct-to-MP4 rendering** (FFmpeg, TTS, and code-rendered motion graphics).

## Features

- **Customizable Parameters**: Segment count, auto-paced durations, aspect ratio (`9:16`, `16:9`, `1:1`, `4:5`), visual style, and target language (defaults to English).
- **Six Generation Modes (Cloud + Local)**:
  - **Mode 1 — Text-to-Video**: Direct video prompts (`v01`, `v02`, ...) for Google Flow.
  - **Mode 2 — First Frame + Video**: Keyframe prompts (`p01`, ...) + image-to-video prompts (`v01`, ...).
  - **Mode 3 — First & Last Frame + Video**: Start/end keyframes (`p01-1`, `p01-2`, ...) with cross-segment continuity + frame-to-frame video prompts.
  - **Mode 4 — Google Flow Gemini Agent Batch**: 3x3 storyboard grid (`storyboard_grid`) + **Unified Visual Spec** (Agent Instructions) + 5-step **Gemini Agent Command Pack** (analyze, pilot `Shot_01`, batch `Shot_02`–`Shot_[N]`, targeted QC fix, 5-collection organization).
  - **Mode 5A — Local Pure FFmpeg (No Google Flow)**: Still keyframes (`p01.png`–`p[N].png`) + local TTS (`edge-tts` / macOS `say`) + `subtitles.srt` + bundled `scripts/render_ffmpeg.sh` (Ken Burns zoom/pan, BGM ducking, subtitle burn-in → `final.mp4`).
  - **Mode 5B — Local Code-Rendered Motion Graphics (No Google Flow)**: Structured `timeline.json` + HTML5/Canvas/SVG or Remotion code rendered directly to `final.mp4` with FFmpeg.
- **Automated Local Setup**: Bundled `scripts/setup.sh` checks and installs `ffmpeg`, `ffprobe`, Python `edge-tts` (in an isolated venv), and `node`/`npm` on macOS and Linux.

## Local Setup (Modes 5A & 5B)

```bash
# Check what is already installed
chmod +x scripts/setup.sh scripts/render_ffmpeg.sh
./scripts/setup.sh --check

# Install tools for Mode 5A (FFmpeg + edge-tts)
./scripts/setup.sh --mode 5a

# Install tools for Mode 5B (FFmpeg + Node.js; add --with-remotion if using Remotion)
./scripts/setup.sh --mode 5b

# Or install everything for both 5A and 5B
./scripts/setup.sh --mode all
```

### Rendering Directly with FFmpeg (Mode 5A)

Place your generated images (`p01.png`, `p02.png`, ...), optional narration tracks (`a01.mp3`, `a02.mp3`, ...), optional `bgm.mp3`, and optional `subtitles.srt` in a folder, then run:

```bash
./scripts/render_ffmpeg.sh ./my_video_project 9:16 5
# Outputs: ./my_video_project/final.mp4
```

## Workflow with Google Flow & Gemini Agent (Modes 1–4)

1. Generate the plan with `shotflow` (specify topic, segment count, aspect ratio, visual style, mode `1`–`4`, and language).
2. Create a dedicated project in [Google Flow](https://flow.google.com/), paste the **Unified Visual Spec** into **Agent Instructions**, and keep generation confirmation set to **Always**.
3. Upload character turnaround sheets and storyboard grid (or cropped frames), run **Analyze & Lock** (0 credits), then test **`Shot_01`** before batching **`Shot_02`–`Shot_[N]`**.
4. Use **Targeted QC Fix** (`_V02`, `_V03`) for any single-shot drift, organize assets into 5 collections, and stitch clips in **Scenebuilder** (`Add to Scene`).

## Sample Usage

### English

**Mode 5A (Local Pure FFmpeg — No Google Flow):**

```text
Use shotflow to create a 5-segment bedtime fable video about a lantern-carrying owl.
- Aspect Ratio: 9:16
- Visual Style: Warm storybook watercolor illustration
- Generation Mode: 5A (Local Pure FFmpeg)
- Language: English
```

**Mode 5B (Local Code-Rendered Motion Graphics — No Google Flow):**

```text
Use shotflow to build a 4-segment explainer video on "3 Habits That Double Deep Work".
- Aspect Ratio: 9:16
- Visual Style: Minimalist kinetic typography with clean geometric motion graphics
- Generation Mode: 5B (Local Code-Rendered Motion Graphics)
- Language: English
```

**Mode 4 (Google Flow Gemini Agent Batch):**

```text
Use shotflow to plan a 9-segment healing brand animation about a Shiba Inu strolling through a quiet Japanese town.
- Aspect Ratio: 9:16
- Visual Style: Japanese hand-painted watercolor anime, soft pencil lines, warm low-saturation colors
- Generation Mode: 4 (Google Flow Gemini Agent Batch)
- Language: English
```

---

### 繁體中文 (Traditional Chinese)

**模式 5A（免 Google Flow，純 FFmpeg 本地直出 MP4）：**

```text
請使用 shotflow 製作一支 5 段式的「台北老屋咖啡館」故事短片。
- 影片比例：9:16 直式
- 視覺風格：溫暖手繪插畫風格、柔光膠片質感
- 生成模式：5A（本地純 FFmpeg 圖片運鏡 + TTS 配音 + 字幕直出）
- 語言：繁體中文（台灣中文旁白）
```

**模式 5B（免 Google Flow，程式碼動畫本地直出 MP4）：**

```text
請使用 shotflow 製作一支 4 段式的「AI 時代 3 個必備工作流」知識解說短片。
- 影片比例：9:16 直式
- 視覺風格：極簡動態字卡（Kinetic Typography）＋清爽幾何資訊圖表
- 生成模式：5B（本地程式碼渲染 HTML/Canvas 或 Remotion 直出）
- 語言：繁體中文（台灣中文旁白）
```

**模式 4（Google Flow Gemini Agent 九宮格批次工作流）：**

```text
請使用 shotflow 規劃一支 9 段式的日系療癒品牌形象動畫《慢一點，也沒關係》，主角是戴著鼠尾草綠領巾的赤柴 Haru。
- 影片比例：9:16 直式
- 視覺風格：日系手繪水彩動畫電影風格、柔和鉛筆線條、溫暖低飽和色彩
- 生成模式：4（Google Flow Gemini Agent 批次工作流）
- 語言：繁體中文（台灣中文旁白）
```

**本地直出（Mode 5A / 5B）快速流程：**
1. 首次使用先執行 `./scripts/setup.sh --check` 檢查環境，缺少工具時執行 `./scripts/setup.sh --mode 5a` 或 `--mode 5b` 自動安裝。
2. 依 `shotflow` 產出的圖片提示詞、配音指令（`edge-tts`）與 `subtitles.srt`（或 Mode 5B 的動畫程式碼）準備素材。
3. 執行 `./scripts/render_ffmpeg.sh <專案資料夾> 9:16`（或 Mode 5B 渲染指令），直接產出 `final.mp4`。

## Structure

```text
shotflow/
├── README.md
├── SKILL.md
└── scripts/
    ├── setup.sh          # Dependency checker & installer (ffmpeg, edge-tts, node/npm)
    └── render_ffmpeg.sh  # Mode 5A pure-FFmpeg Ken Burns + TTS + BGM + SRT renderer
```
