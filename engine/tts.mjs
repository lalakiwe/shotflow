import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ENV_WITH_PATH = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
};

function which(cmd) {
  try {
    return execFileSync("which", [cmd], { encoding: "utf8", env: ENV_WITH_PATH }).trim();
  } catch {
    return null;
  }
}

export function probeAudioDuration(audioPath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audioPath],
    { encoding: "utf8", env: ENV_WITH_PATH }
  ).trim();
  return Number.parseFloat(out);
}

function parseSrtTimestamp(ts) {
  const m = ts.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

export function parseVttCues(vttText) {
  const lines = vttText.split(/\r?\n/);
  const cues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim().split(" ")[0]);
      const textLines = [];
      while (i + 1 < lines.length && lines[i + 1].trim() !== "") {
        i++;
        textLines.push(lines[i].trim());
      }
      const text = textLines.join(" ").replace(/<[^>]+>/g, "").trim();
      if (text) {
        cues.push({
          startSec: parseSrtTimestamp(startStr.includes(":") && startStr.split(":").length === 2 ? `00:${startStr}` : startStr),
          endSec: parseSrtTimestamp(endStr.includes(":") && endStr.split(":").length === 2 ? `00:${endStr}` : endStr),
          text,
        });
      }
    }
  }
  return cues;
}

/**
 * Estimates word-level timestamps proportionally when only full duration is known
 * (e.g., --no-tts dry render or macOS `say` fallback).
 */
export function estimateWordTimings(text, durationSec) {
  const tokens = (text || "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const totalChars = tokens.reduce((acc, t) => acc + t.length, 0) || 1;
  let cursor = 0.15;
  const usable = Math.max(0.5, durationSec - 0.35);
  return tokens.map((word) => {
    const span = (word.length / totalChars) * usable;
    const item = { word, startSec: Number(cursor.toFixed(3)), endSec: Number((cursor + span).toFixed(3)) };
    cursor += span;
    return item;
  });
}

/**
 * Finds the start timestamp (seconds) of a triggerWord inside word/cue timings.
 */
export function findTriggerTime(triggerWord, cues, narration, durationSec, fallbackRatio = 0.25) {
  if (!triggerWord) return Number((durationSec * fallbackRatio).toFixed(3));
  const needle = triggerWord.toLowerCase();

  for (const c of cues) {
    const hay = (c.text || c.word || "").toLowerCase();
    if (hay.includes(needle)) return c.startSec;
  }

  const idx = (narration || "").toLowerCase().indexOf(needle);
  if (idx >= 0 && narration.length > 0) {
    return Number(((idx / narration.length) * Math.max(0.5, durationSec - 0.4)).toFixed(3));
  }
  return Number((durationSec * fallbackRatio).toFixed(3));
}

export function synthesizeSceneAudio(scene, outDir, opts = {}) {
  const voice = opts.voice || "en-US-AndrewNeural";
  const pace = opts.pace || 1.0;
  const mp3Path = path.join(outDir, `${scene.id}.mp3`);
  const vttPath = path.join(outDir, `${scene.id}.vtt`);
  const text = (scene.narration || "").trim();

  if (opts.noTts || !text) {
    const dur = scene.durationSec || 4.5;
    return {
      audioPath: null,
      durationSec: dur,
      cues: estimateWordTimings(text, dur),
      engine: "silent",
    };
  }

  const edgeTts = which("edge-tts");
  if (edgeTts) {
    const ratePct = Math.round((pace - 1) * 100);
    const rateArg = `${ratePct >= 0 ? "+" : ""}${ratePct}%`;
    execFileSync(
      edgeTts,
      ["--voice", voice, `--rate=${rateArg}`, "--text", text, "--write-media", mp3Path, "--write-subtitles", vttPath],
      { env: ENV_WITH_PATH, stdio: "pipe" }
    );
    const durationSec = probeAudioDuration(mp3Path) + 0.45;
    const cues = fs.existsSync(vttPath) ? parseVttCues(fs.readFileSync(vttPath, "utf8")) : estimateWordTimings(text, durationSec);
    return { audioPath: mp3Path, durationSec, cues, engine: "edge-tts" };
  }

  const macSay = which("say");
  if (macSay && process.platform === "darwin") {
    const aiffPath = path.join(outDir, `${scene.id}.aiff`);
    const sayVoice = voice.toLowerCase().startsWith("zh") ? "Meijia" : "Samantha";
    execFileSync(macSay, ["-v", sayVoice, "-o", aiffPath, text], { env: ENV_WITH_PATH, stdio: "pipe" });
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", aiffPath, "-c:a", "libmp3lame", "-b:a", "192k", mp3Path], {
      env: ENV_WITH_PATH,
    });
    fs.rmSync(aiffPath, { force: true });
    const durationSec = probeAudioDuration(mp3Path) + 0.45;
    return { audioPath: mp3Path, durationSec, cues: estimateWordTimings(text, durationSec), engine: "macos-say" };
  }

  throw new Error("No TTS engine found (edge-tts or macOS 'say'). Run './scripts/setup.sh --mode 5a' or pass --no-tts.");
}

function fmtSrtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const rem = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(rem).padStart(3, "0")}`;
}

export function buildSrt(sceneTimings) {
  const blocks = [];
  let idx = 1;
  let offset = 0;
  for (const item of sceneTimings) {
    const text = (item.scene.narration || "").trim();
    if (text) {
      const start = offset + 0.1;
      const end = offset + Math.max(0.8, item.durationSec - 0.25);
      blocks.push(`${idx}\n${fmtSrtTime(start)} --> ${fmtSrtTime(end)}\n${text}\n`);
      idx++;
    }
    offset += item.durationSec;
  }
  return blocks.join("\n");
}
