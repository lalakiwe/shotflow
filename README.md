# ShotFlow

An AI short-video script, storyboard prompt, asset-naming, and local rendering skill (`SKILL.md`) for producing Reels, Shorts, TikTok, and 16:9 product keynote videos—supporting both **simple creative ideas** and **full GitHub repo / product spec / PRD ingestion** (e.g., Apple WWDC-style launch videos), across **[Google Flow](https://flow.google.com/) / Gemini Agent** and **local direct-to-MP4 pipelines**.

## Features

- **Two Automatic Input Tracks**:
  - **Track A — Creative Idea / Brief**: Turn a short concept into a full video script, turnaround sheets, and render prompts.
  - **Track B — Repo / Product Spec / PRD**: Reads your actual codebase, `README.md`, or PRD to extract verified features, real CLI/UI flows, a **Brand & Design System Anchor**, and an Apple WWDC-style keynote arc—with zero hallucinated specs.
- **Six Generation Modes (Cloud + Local)**:
  - **Mode 1 — Text-to-Video**: Direct video prompts (`v01`, `v02`, ...) for Google Flow.
  - **Mode 2 — First Frame + Video**: Keyframe prompts (`p01`, ...) + image-to-video prompts (`v01`, ...).
  - **Mode 3 — First & Last Frame + Video**: Start/end keyframes (`p01-1`, `p01-2`, ...) with cross-segment continuity + frame-to-frame video prompts.
  - **Mode 4 — Google Flow Gemini Agent Batch**: 3x3 storyboard grid (`storyboard_grid`) + **Unified Visual Spec** (Agent Instructions) + 5-step **Gemini Agent Command Pack**.
  - **Mode 5A — Local Pure FFmpeg (No Google Flow)**: Still keyframes (`p01.png`–`p[N].png`) + local TTS (`edge-tts` / macOS `say`) + `subtitles.srt` + bundled `scripts/render_ffmpeg.sh` → `final.mp4`.
  - **Mode 5B — Local Code-Rendered Motion Graphics (No Google Flow)**: Structured `timeline.json` + HTML5/Canvas/SVG or Remotion code rendered directly to `final.mp4` with FFmpeg *(Recommended for Track B WWDC-style product keynotes)*.
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

```bash
./scripts/render_ffmpeg.sh ./my_video_project 9:16 5
# Outputs: ./my_video_project/final.mp4
```

## Sample Usage

### English

**Track B — Repo / PRD to Apple WWDC-Style Keynote (Mode 5B):**

```text
I have the repo at ./my-app (or https://github.com/org/my-app).
Use shotflow to read the repo and generate an Apple WWDC-style product launch video presenting the product.
- Aspect Ratio: 16:9
- Visual Style: Apple WWDC Keynote dark-mode minimal, crisp kinetic typography, animated UI/CLI demos, Bento summary grid
- Generation Mode: 5B (Local Code-Rendered Motion Graphics)
- Language: English
```

**Track A — Creative Idea with Local Pure FFmpeg (Mode 5A):**

```text
Use shotflow to create a 5-segment bedtime fable video about a lantern-carrying owl.
- Aspect Ratio: 9:16
- Visual Style: Warm storybook watercolor illustration
- Generation Mode: 5A (Local Pure FFmpeg)
- Language: English
```

**Track A — Google Flow Gemini Agent Batch (Mode 4):**

```text
Use shotflow to plan a 9-segment healing brand animation about a Shiba Inu strolling through a quiet Japanese town.
- Aspect Ratio: 9:16
- Visual Style: Japanese hand-painted watercolor anime, soft pencil lines, warm low-saturation colors
- Generation Mode: 4 (Google Flow Gemini Agent Batch)
- Language: English
```

---

### 繁體中文 (Traditional Chinese)

**Track B｜讀取 Repo 或 PRD 製作 Apple WWDC 風格產品發表會影片（Mode 5B）：**

```text
我有一個專案 Repo（或 PRD 文件）在 ./my-product。
請使用 shotflow 閱讀裡面的規格與程式碼，製作一支 Apple WWDC 發表會風格的產品介紹影片。
- 影片比例：16:9 橫式
- 視覺風格：Apple WWDC 深色極簡發表會風格、俐落動態字卡、實機介面／終端機操作演示、Bento 總覽方格
- 生成模式：5B（本地程式碼動畫直出 MP4）
- 語言：繁體中文（台灣中文旁白）
```

**Track A｜簡單創意想法＋純 FFmpeg 本地直出（Mode 5A）：**

```text
請使用 shotflow 製作一支 5 段式的「台北老屋咖啡館」故事短片。
- 影片比例：9:16 直式
- 視覺風格：溫暖手繪插畫風格、柔光膠片質感
- 生成模式：5A（本地純 FFmpeg 圖片運鏡 + TTS 配音 + 字幕直出）
- 語言：繁體中文（台灣中文旁白）
```

**Track A｜Google Flow Gemini Agent 九宮格批次工作流（Mode 4）：**

```text
請使用 shotflow 規劃一支 9 段式的日系療癒品牌形象動畫《慢一點，也沒關係》，主角是戴著鼠尾草綠領巾的赤柴 Haru。
- 影片比例：9:16 直式
- 視覺風格：日系手繪水彩動畫電影風格、柔和鉛筆線條、溫暖低飽和色彩
- 生成模式：4（Google Flow Gemini Agent 批次工作流）
- 語言：繁體中文（台灣中文旁白）
```

## Structure

```text
shotflow/
├── README.md
├── SKILL.md
└── scripts/
    ├── setup.sh          # Dependency checker & installer (ffmpeg, edge-tts, node/npm)
    └── render_ffmpeg.sh  # Mode 5A pure-FFmpeg Ken Burns + TTS + BGM + SRT renderer
```
