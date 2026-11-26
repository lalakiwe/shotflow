# ShotFlow

An AI short-video script, storyboard prompt, reference-video analyzer, and **standalone local MP4 rendering engine** (`SKILL.md` + native Node.js CLI) for producing Reels, Shorts, TikTok, and 16:9 Apple WWDC-style product keynote videos—supporting **[Google Flow](https://flow.google.com/) / Gemini Agent** and **100% local zero-watermark MP4 rendering**.

## Features

- **Three Automatic Input Tracks (Combinable)**:
  - **Track A — Creative Idea / Brief**: Turn a short concept into a full video script, turnaround sheets, and render prompts.
  - **Track B — Repo / Product Spec / PRD**: Reads your actual codebase, `README.md`, or PRD to extract verified features, real CLI/UI flows, a **Brand & Design System Anchor**, and an Apple WWDC-style keynote arc—with zero hallucinated specs.
  - **Track C — Reference Video Style & Pacing Analysis**: `scripts/analyze_ref_video.py` extracts auto-scaled timestamped frames (hard cap 100 frames / 2 fps) and captions from a local video (`.mp4`/`.mov`) or URL (YouTube, TikTok, Vimeo, Loom, X via `yt-dlp`) to capture editing cadence, framing, and hook structure.
- **Six Generation Modes (Cloud + Local)**:
  - **Mode 1–3 (Google Flow)**: Text-to-Video (`v01`), First Frame + Video (`p01` + `v01`), First & Last Frame + Video (`p01-1`/`p01-2` + `v01`).
  - **Mode 4 (Google Flow Gemini Agent Batch)**: 3x3 storyboard grid + **Unified Visual Spec** (Agent Instructions) + 5-step **Gemini Agent Command Pack**.
  - **Mode 5A (Local Pure FFmpeg)**: Still keyframes + Ken Burns zoom/pan + `edge-tts` / macOS `say` + `subtitles.srt` + `scripts/render_ffmpeg.sh` → `final.mp4`.
  - **Mode 5B (ShotFlow Native Motion-Graphics Engine)**: Standalone Node.js engine (`bin/shotflow.mjs` + `engine/`) with word-synced TTS, HTML5/CSS/SVG WWDC & explainer layouts (`hero`, `feature`, `code`, `bento`, `cta`), website brand capture (`capture`), DOM overflow detection, FFmpeg muxing + BGM ducking, and automated QC (`check` + 4x3 contact sheet).

## Quick Start (Local Modes 5A, 5B & Track C)

```bash
# 1. Check and install local dependencies (ffmpeg, edge-tts, yt-dlp, node, playwright-core)
chmod +x scripts/setup.sh scripts/render_ffmpeg.sh scripts/analyze_ref_video.py bin/shotflow.mjs
./scripts/setup.sh --check
./scripts/setup.sh --mode all

# 2. Verify the native engine
node bin/shotflow.mjs doctor

# 3. Scaffold, render, and QC a Mode 5B product launch video
node bin/shotflow.mjs init ./my-launch --format product-launch --look midnight --size 16:9 --lang en
node bin/shotflow.mjs capture https://example.com --out ./my-launch/assets
node bin/shotflow.mjs render ./my-launch
node bin/shotflow.mjs check ./my-launch/out/final.mp4 --contact-sheet ./my-launch/out/sheet.jpg
```

### Reference Video Analysis (Track C)

```bash
python3 scripts/analyze_ref_video.py "https://www.youtube.com/watch?v=..." --start 0:15 --end 1:00
python3 scripts/analyze_ref_video.py /path/to/reference.mp4 --max-frames 30
```

### Pure FFmpeg Slideshow / Ken Burns Render (Mode 5A)

```bash
./scripts/render_ffmpeg.sh ./my_video_project 9:16 5
```

## Sample Usage

### English

**Track B + C — Repo + Reference Video to Apple WWDC-Style Keynote (Mode 5B):**

```text
Read my repo at ./my-app and analyze this reference video (https://youtu.be/example, 0:00 to 0:45) for pacing and motion style.
Use shotflow (Mode 5B) to generate an Apple WWDC-style 16:9 product launch video in English and run QC before delivering final.mp4.
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

**Track B + C｜讀取 Repo 並參考現有影片節奏製作產品發表會影片（Mode 5B 原生引擎）：**

```text
請使用 shotflow 閱讀 ./my-product 的程式碼，並參考這支影片（/path/to/ref.mp4 或 YouTube 連結，0:00–0:45）的節奏與動態字卡風格，以 Mode 5B 原生引擎製作一支 16:9 Apple WWDC 風格的繁體中文（台灣中文旁白）產品發表會影片，完成後執行自動品管。
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

## Repository Structure

```text
shotflow/
├── package.json
├── README.md
├── SKILL.md
├── bin/
│   └── shotflow.mjs            # Native CLI: init | capture | render | check | doctor
├── engine/
│   ├── presets.mjs             # Formats (product-launch, narrated-explainer, vertical-short), looks & safe zones
│   ├── tts.mjs                 # edge-tts WordBoundary timing + macOS say fallback + SRT builder
│   ├── capture.mjs             # Playwright website screenshot & brand palette extractor
│   ├── renderer.mjs            # Headless Chromium frame renderer + DOM overflow check + FFmpeg muxing
│   └── check.mjs               # Automated QC (black/freeze frames, loudness, 4x3 contact sheet)
├── scripts/
│   ├── setup.sh                # Cross-platform dependency checker & installer
│   ├── analyze_ref_video.py    # Track C reference video frame + caption analyzer
│   └── render_ffmpeg.sh        # Mode 5A pure-FFmpeg Ken Burns renderer
└── test/
    └── smoke.test.mjs          # Node.js built-in test suite
```
