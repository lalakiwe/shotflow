#!/usr/bin/env node
import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FORMATS, LOOKS, SIZES, createStarterProject } from "../engine/presets.mjs";
import { captureSite } from "../engine/capture.mjs";
import { recordSite } from "../engine/record.mjs";
import { renderProject } from "../engine/renderer.mjs";
import { checkVideo } from "../engine/check.mjs";

const USAGE = `ShotFlow Native Engine (v1.1.0)

Usage:
  shotflow init <dir> [--format product-launch|narrated-explainer|vertical-short] [--look midnight|studio|editorial|blueprint] [--size 16:9|9:16|4:5|1:1] [--lang en|zh-TW]
  shotflow capture <url> --out <dir>
  shotflow record <url> --out <dir> [--steps steps.json] [--duration 6]
  shotflow render <dir> [--size 16:9|9:16|4:5|1:1] [--format mp4|gif|mov] [--transparent] [--fps 30] [--voice <edge-tts-voice>] [--no-tts]
  shotflow check <video.mp4> [--json] [--contact-sheet <out.jpg>]
  shotflow doctor
  shotflow --help
`;

function which(cmd) {
  try {
    return execFileSync("which", [cmd], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
      },
    }).trim();
  } catch {
    return null;
  }
}

function findChrome() {
  const candidates = [
    process.env.SHOTFLOW_CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    which("google-chrome"),
    which("chromium"),
    which("chromium-browser"),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

async function runDoctor() {
  const checks = [
    ["node", process.version, true],
    ["ffmpeg", which("ffmpeg") || "MISSING", Boolean(which("ffmpeg"))],
    ["ffprobe", which("ffprobe") || "MISSING", Boolean(which("ffprobe"))],
    ["edge-tts", which("edge-tts") || "MISSING (macOS 'say' fallback)", Boolean(which("edge-tts"))],
    ["yt-dlp", which("yt-dlp") || "MISSING (optional: Track C URLs)", Boolean(which("yt-dlp"))],
    ["chrome", findChrome() || "MISSING (install Chrome or Playwright Chromium)", Boolean(findChrome())],
  ];
  console.log("=== ShotFlow Engine Doctor ===");
  for (const [name, detail, ok] of checks) {
    console.log(`  [${ok ? "OK" : "MISS"}] ${name.padEnd(10)} ${detail}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const [command, ...rest] = args;

  if (command === "doctor") {
    await runDoctor();
    return;
  }

  if (command === "init") {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        format: { type: "string", default: "product-launch" },
        look: { type: "string", default: "midnight" },
        size: { type: "string", default: "16:9" },
        lang: { type: "string", default: "en" },
        title: { type: "string", default: "My Product" },
      },
    });
    const dir = positionals[0];
    if (!dir) throw new Error("Missing target directory: shotflow init <dir>");
    if (!FORMATS[values.format]) {
      throw new Error(`Unknown format '${values.format}'. Available: ${Object.keys(FORMATS).join(", ")}`);
    }
    if (!LOOKS[values.look]) {
      throw new Error(`Unknown look '${values.look}'. Available: ${Object.keys(LOOKS).join(", ")}`);
    }
    if (!SIZES[values.size]) {
      throw new Error(`Unknown size '${values.size}'. Available: ${Object.keys(SIZES).join(", ")}`);
    }
    const created = createStarterProject(path.resolve(dir), values);
    console.log(`Initialized ShotFlow project (${values.format}, ${values.look}, ${values.size}) at ${created.dir}`);
    console.log("Created files:", created.files.join(", "));
    return;
  }

  if (command === "capture") {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { out: { type: "string", default: "./capture_assets" } },
    });
    const url = positionals[0];
    if (!url) throw new Error("Missing URL: shotflow capture <url> --out <dir>");
    const result = await captureSite(url, path.resolve(values.out), { chromePath: findChrome() });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "record") {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        out: { type: "string", default: "./recorded_assets" },
        steps: { type: "string" },
        duration: { type: "string", default: "6" },
      },
    });
    const url = positionals[0];
    if (!url) throw new Error("Missing URL: shotflow record <url> --out <dir>");
    const steps = values.steps ? JSON.parse(fs.readFileSync(path.resolve(values.steps), "utf8")) : [];
    const result = await recordSite(url, path.resolve(values.out), {
      steps,
      durationSec: Number(values.duration),
      chromePath: findChrome(),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "render") {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        size: { type: "string" },
        format: { type: "string", default: "mp4" },
        transparent: { type: "boolean", default: false },
        fps: { type: "string", default: "30" },
        voice: { type: "string" },
        "no-tts": { type: "boolean", default: false },
      },
    });
    const dir = positionals[0] || ".";
    const out = await renderProject(path.resolve(dir), {
      size: values.size,
      format: values.format,
      transparent: values.transparent,
      fps: Number(values.fps),
      voice: values.voice,
      noTts: values["no-tts"],
      chromePath: findChrome(),
    });
    console.log(`Rendered successfully:\n  Output:   ${out.videoPath}\n  Subtitles:${out.srtPath}\n  Cover:    ${out.coverPath}`);
    if (out.overflowWarnings.length > 0) {
      console.warn(`Layout warnings (${out.overflowWarnings.length}):`, out.overflowWarnings);
    }
    return;
  }

  if (command === "check") {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        json: { type: "boolean", default: false },
        "contact-sheet": { type: "string" },
      },
    });
    const videoPath = positionals[0];
    if (!videoPath) throw new Error("Missing video path: shotflow check <video.mp4>");
    const report = checkVideo(path.resolve(videoPath), {
      contactSheetPath: values["contact-sheet"] ? path.resolve(values["contact-sheet"]) : null,
    });
    if (values.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`=== ShotFlow QC Report: ${path.basename(videoPath)} ===`);
      console.log(`  Resolution: ${report.video.width}x${report.video.height} @ ${report.video.fps}fps (${report.video.durationSec}s)`);
      console.log(`  Audio:      ${report.audio.present ? `${report.audio.meanVolumeDb} dB mean / ${report.audio.maxVolumeDb} dB max` : "NO AUDIO STREAM"}`);
      console.log(`  Black:      ${report.issues.blackSegments.length} segments`);
      console.log(`  Freeze:     ${report.issues.freezeSegments.length} segments`);
      console.log(`  Status:     ${report.passed ? "PASS" : "ISSUES FOUND"}`);
      if (report.contactSheetPath) console.log(`  Sheet:      ${report.contactSheetPath}`);
    }
    process.exitCode = report.passed ? 0 : 2;
    return;
  }

  throw new Error(`Unknown command '${command}'. Run 'shotflow --help'.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
