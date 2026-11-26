import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { LOOKS, SIZES } from "./presets.mjs";
import { buildSrt, findTriggerTime, synthesizeSceneAudio } from "./tts.mjs";

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch {
    throw new Error("Missing 'playwright-core'. Run './scripts/setup.sh --mode 5b' (or 'npm install') first.");
  }
}

const ENV_WITH_PATH = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
};

function esc(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveReveal(elTime, currentSec) {
  const dt = currentSec - elTime;
  if (dt < 0) return { opacity: 0, translateY: 28, scale: 0.96 };
  const t = Math.min(1, dt / 0.42);
  // Smooth ease-out cubic
  const ease = 1 - Math.pow(1 - t, 3);
  return {
    opacity: Number(ease.toFixed(3)),
    translateY: Number(((1 - ease) * 28).toFixed(2)),
    scale: Number((0.96 + ease * 0.04).toFixed(4)),
  };
}

export function buildSceneHtml(scene, look, sizeCfg, currentSec, durationSec, cues, projectDir) {
  const { width, height, safePadding } = sizeCfg;
  const isVertical = height > width;
  const titleSize = isVertical ? 68 : 76;
  const subSize = isVertical ? 32 : 34;

  const headStyle = resolveReveal(0.05, currentSec);
  const subStyle = resolveReveal(0.35, currentSec);

  let bodyHtml = "";

  if (scene.layout === "hero") {
    bodyHtml = `
      <div class="center-stack">
        ${scene.badge ? `<div class="badge" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px)">${esc(scene.badge)}</div>` : ""}
        <h1 class="hero-title" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px) scale(${headStyle.scale})">${esc(scene.headline)}</h1>
        ${scene.subheadline ? `<p class="subtitle" style="opacity:${subStyle.opacity};transform:translateY(${subStyle.translateY}px)">${esc(scene.subheadline)}</p>` : ""}
      </div>
    `;
  } else if (scene.layout === "code") {
    const lines = (scene.codeLines || []).map((line, i) => {
      const trig = findTriggerTime(line.triggerWord, cues, scene.narration, durationSec, 0.15 + i * 0.22);
      const r = resolveReveal(trig, currentSec);
      const isHighlight = currentSec >= trig && currentSec < trig + 1.8;
      return `<div class="code-line ${isHighlight ? "active" : ""}" style="opacity:${r.opacity};transform:translateY(${r.translateY}px)">${esc(line.text)}</div>`;
    });
    bodyHtml = `
      <div class="section-wrap">
        <h2 class="sec-title" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px)">${esc(scene.headline)}</h2>
        <div class="terminal">
          <div class="term-bar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="term-title">${esc(scene.windowTitle || "terminal")}</span>
          </div>
          <div class="term-body">${lines.join("")}</div>
        </div>
      </div>
    `;
  } else if (scene.layout === "bento") {
    const cards = (scene.cards || []).map((c, i) => {
      const trig = findTriggerTime(c.triggerWord, cues, scene.narration, durationSec, 0.12 + i * 0.18);
      const r = resolveReveal(trig, currentSec);
      return `
        <div class="bento-card" style="opacity:${r.opacity};transform:translateY(${r.translateY}px) scale(${r.scale})">
          <div class="bento-title">${esc(c.title)}</div>
          <div class="bento-body">${esc(c.body)}</div>
        </div>`;
    });
    bodyHtml = `
      <div class="section-wrap">
        <h2 class="sec-title" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px)">${esc(scene.headline)}</h2>
        <div class="bento-grid ${isVertical ? "cols-1" : "cols-2"}">${cards.join("")}</div>
      </div>
    `;
  } else if (scene.layout === "feature") {
    let mediaTag = "";
    if (scene.imagePath) {
      const absImg = path.isAbsolute(scene.imagePath) ? scene.imagePath : path.join(projectDir, scene.imagePath);
      if (fs.existsSync(absImg)) {
        const b64 = fs.readFileSync(absImg).toString("base64");
        const ext = path.extname(absImg).slice(1) || "png";
        mediaTag = `<img class="feature-img" src="data:image/${ext};base64,${b64}" />`;
      }
    }
    const bullets = (scene.bullets || []).map((b, i) => {
      const obj = typeof b === "string" ? { text: b } : b;
      const trig = findTriggerTime(obj.triggerWord, cues, scene.narration, durationSec, 0.15 + i * 0.2);
      const r = resolveReveal(trig, currentSec);
      return `<li style="opacity:${r.opacity};transform:translateY(${r.translateY}px)">${esc(obj.text)}</li>`;
    });
    bodyHtml = `
      <div class="section-wrap">
        <h2 class="sec-title" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px)">${esc(scene.headline)}</h2>
        <div class="feature-row ${isVertical ? "stack" : ""}">
          <ul class="feature-list">${bullets.join("")}</ul>
          ${mediaTag}
        </div>
      </div>
    `;
  } else {
    // CTA / closing card
    const pillStyle = resolveReveal(0.6, currentSec);
    bodyHtml = `
      <div class="center-stack">
        <h1 class="hero-title" style="opacity:${headStyle.opacity};transform:translateY(${headStyle.translateY}px)">${esc(scene.headline)}</h1>
        ${scene.subheadline ? `<p class="subtitle mono" style="opacity:${subStyle.opacity};transform:translateY(${subStyle.translateY}px)">${esc(scene.subheadline)}</p>` : ""}
        ${scene.ctaPill ? `<div class="cta-pill" style="opacity:${pillStyle.opacity};transform:translateY(${pillStyle.translateY}px) scale(${pillStyle.scale})">${esc(scene.ctaPill)}</div>` : ""}
      </div>
    `;
  }

  // Subtle progress bar at bottom
  const progressPct = Math.min(100, Math.max(0, (currentSec / Math.max(0.1, durationSec)) * 100)).toFixed(2);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: radial-gradient(circle at 20% 20%, ${look.accent}22, transparent 45%),
                radial-gradient(circle at 80% 80%, ${look.accent2}22, transparent 45%),
                ${look.bg};
    color: ${look.text};
    font-family: ${look.fontSans};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${safePadding.top}px ${safePadding.right}px ${safePadding.bottom}px ${safePadding.left}px;
  }
  .stage { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .center-stack { text-align: center; max-width: 92%; display: flex; flex-direction: column; align-items: center; gap: 28px; }
  .badge {
    font-size: 20px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
    color: ${look.accent}; background: ${look.accent}1f; border: 1px solid ${look.accent}55;
    padding: 10px 24px; border-radius: 999px;
  }
  .hero-title {
    font-size: ${titleSize}px; font-weight: 800; line-height: 1.12; letter-spacing: -0.02em;
    background: linear-gradient(135deg, ${look.text}, ${look.accent});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .subtitle { font-size: ${subSize}px; color: ${look.muted}; line-height: 1.45; max-width: 960px; }
  .mono { font-family: ${look.fontMono}; }
  .section-wrap { width: 100%; display: flex; flex-direction: column; gap: 36px; }
  .sec-title { font-size: ${isVertical ? 52 : 56}px; font-weight: 750; letter-spacing: -0.02em; }
  .terminal {
    background: ${look.codeBg}; border: 1px solid ${look.surfaceBorder};
    border-radius: 20px; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.45);
  }
  .term-bar { display: flex; align-items: center; gap: 10px; padding: 16px 22px; background: rgba(255,255,255,0.04); border-bottom: 1px solid ${look.surfaceBorder}; }
  .dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
  .dot.r { background: #ff5f56; } .dot.y { background: #ffbd2e; } .dot.g { background: #27c93f; }
  .term-title { margin-left: 12px; color: ${look.muted}; font-family: ${look.fontMono}; font-size: 18px; }
  .term-body { padding: 34px; display: flex; flex-direction: column; gap: 22px; font-family: ${look.fontMono}; font-size: ${isVertical ? 26 : 30}px; color: #e2e8f0; }
  .code-line { padding: 12px 18px; border-radius: 12px; border-left: 4px solid transparent; }
  .code-line.active { background: ${look.accent}1f; border-left-color: ${look.accent}; }
  .bento-grid { display: grid; gap: 26px; width: 100%; }
  .bento-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
  .bento-grid.cols-1 { grid-template-columns: 1fr; }
  .bento-card {
    background: ${look.surface}; border: 1px solid ${look.surfaceBorder}; border-radius: 24px;
    padding: 36px; display: flex; flex-direction: column; gap: 14px;
  }
  .bento-title { font-size: 32px; font-weight: 700; color: ${look.accent}; }
  .bento-body { font-size: 26px; color: ${look.muted}; line-height: 1.4; }
  .feature-row { display: flex; gap: 40px; align-items: center; }
  .feature-row.stack { flex-direction: column; align-items: flex-start; }
  .feature-list { list-style: none; display: flex; flex-direction: column; gap: 20px; flex: 1; font-size: 30px; line-height: 1.4; }
  .feature-list li { padding: 18px 24px; background: ${look.surface}; border: 1px solid ${look.surfaceBorder}; border-radius: 16px; }
  .feature-img { max-width: ${isVertical ? "100%" : "48%"}; border-radius: 18px; border: 1px solid ${look.surfaceBorder}; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
  .cta-pill {
    margin-top: 12px; padding: 18px 42px; border-radius: 999px; font-size: 28px; font-weight: 700;
    background: linear-gradient(135deg, ${look.accent}, ${look.accent2}); color: #ffffff;
  }
  .progress { position: fixed; bottom: 0; left: 0; height: 6px; width: ${progressPct}%; background: linear-gradient(90deg, ${look.accent}, ${look.accent2}); }
</style>
</head>
<body>
  <div class="stage">${bodyHtml}</div>
  <div class="progress"></div>
</body>
</html>`;
}

export async function renderProject(projectDir, opts = {}) {
  const videoJsonPath = path.join(projectDir, "video.json");
  const scenesJsonPath = path.join(projectDir, "scenes.json");
  if (!fs.existsSync(videoJsonPath) || !fs.existsSync(scenesJsonPath)) {
    throw new Error(`Missing video.json or scenes.json in ${projectDir}. Run 'shotflow init ${projectDir}' first.`);
  }

  const config = JSON.parse(fs.readFileSync(videoJsonPath, "utf8"));
  const scenes = JSON.parse(fs.readFileSync(scenesJsonPath, "utf8"));

  const sizeKey = opts.size || config.size || "16:9";
  const sizeCfg = SIZES[sizeKey];
  if (!sizeCfg) throw new Error(`Unsupported size '${sizeKey}'.`);

  const look = LOOKS[config.look] || LOOKS.midnight;
  const fps = opts.fps || config.fps || 30;
  const outDir = path.join(projectDir, "out");
  const tmpDir = path.join(projectDir, ".shotflow_build");
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  // 1. Synthesize narration + word timings per scene
  const sceneTimings = scenes.map((scene) => {
    const tts = synthesizeSceneAudio(scene, tmpDir, {
      voice: opts.voice || config.voice,
      pace: config.pace || 1.0,
      noTts: opts.noTts,
    });
    return { scene, ...tts };
  });

  // 2. Write SRT subtitles
  const srtPath = path.join(outDir, "subtitles.srt");
  fs.writeFileSync(srtPath, buildSrt(sceneTimings), "utf8");

  // 3. Render frames per scene via headless Chromium + check layout overflow
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    executablePath: opts.chromePath || undefined,
  });

  const overflowWarnings = [];
  const concatLines = [];
  const coverPath = path.join(outDir, "cover.png");

  try {
    const page = await browser.newPage({ viewport: { width: sizeCfg.width, height: sizeCfg.height } });

    for (let sIdx = 0; sIdx < sceneTimings.length; sIdx++) {
      const { scene, durationSec, cues, audioPath } = sceneTimings[sIdx];
      const framesDir = path.join(tmpDir, `frames_${scene.id}`);
      fs.mkdirSync(framesDir, { recursive: true });
      const totalFrames = Math.max(1, Math.round(durationSec * fps));

      for (let f = 0; f < totalFrames; f++) {
        const currentSec = f / fps;
        const html = buildSceneHtml(scene, look, sizeCfg, currentSec, durationSec, cues, projectDir);
        await page.setContent(html, { waitUntil: "load" });

        // Check DOM overflow on final frame of each scene
        if (f === totalFrames - 1) {
          const overflow = await page.evaluate(() => {
            const stage = document.querySelector(".stage");
            return stage ? stage.scrollHeight > stage.clientHeight + 2 || stage.scrollWidth > stage.clientWidth + 2 : false;
          });
          if (overflow) overflowWarnings.push(`${scene.id}: content overflowed safe stage bounds`);
        }

        const framePath = path.join(framesDir, `f_${String(f).padStart(5, "0")}.jpg`);
        await page.screenshot({ path: framePath, type: "jpeg", quality: 92 });

        if (sIdx === 0 && f === Math.min(totalFrames - 1, Math.round(fps * 0.8))) {
          await page.screenshot({ path: coverPath, type: "png" });
        }
      }

      // Encode scene clip with FFmpeg
      const clipPath = path.join(tmpDir, `${scene.id}.mp4`);
      const ffArgs = ["-y", "-v", "error", "-framerate", String(fps), "-i", path.join(framesDir, "f_%05d.jpg")];
      if (audioPath) {
        ffArgs.push("-i", audioPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", "-af", "apad", "-shortest", clipPath);
      } else {
        ffArgs.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", clipPath);
      }
      execFileSync("ffmpeg", ffArgs, { env: ENV_WITH_PATH });
      concatLines.push(`file '${clipPath}'`);
    }
  } finally {
    await browser.close();
  }

  // 4. Concat all scenes
  const concatFile = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatFile, concatLines.join("\n") + "\n");
  const mergedPath = path.join(tmpDir, "merged.mp4");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", mergedPath], {
    env: ENV_WITH_PATH,
  });

  // 5. Optional BGM ducking
  const bgmPath = path.join(projectDir, "assets", "bgm.mp3");
  const videoPath = path.join(outDir, "final.mp4");
  if (fs.existsSync(bgmPath)) {
    const vol = config.bgmVolume ?? 0.16;
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-i",
        mergedPath,
        "-stream_loop",
        "-1",
        "-i",
        bgmPath,
        "-filter_complex",
        `[1:a]volume=${vol}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        videoPath,
      ],
      { env: ENV_WITH_PATH }
    );
  } else {
    fs.copyFileSync(mergedPath, videoPath);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return { videoPath, srtPath, coverPath, overflowWarnings };
}
