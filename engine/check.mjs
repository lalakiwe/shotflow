import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ENV_WITH_PATH = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
};

function parseMatches(stderr, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(stderr)) !== null) {
    out.push(m.groups || m.slice(1));
  }
  return out;
}

export function checkVideo(videoPath, opts = {}) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const probeJson = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", videoPath],
    { encoding: "utf8", env: ENV_WITH_PATH }
  );
  const probe = JSON.parse(probeJson);
  const vStream = (probe.streams || []).find((s) => s.codec_type === "video");
  const aStream = (probe.streams || []).find((s) => s.codec_type === "audio");

  const [num, den] = (vStream?.r_frame_rate || "30/1").split("/").map(Number);
  const fps = den ? Number((num / den).toFixed(2)) : 30;
  const durationSec = Number(Number.parseFloat(probe.format?.duration || "0").toFixed(2));

  // Black frame + freeze frame detection
  const vfRun = spawnSync(
    "ffmpeg",
    ["-i", videoPath, "-vf", "blackdetect=d=0.4:pix_th=0.10,freezedetect=n=0.003:d=3.0", "-f", "null", "-"],
    { encoding: "utf8", env: ENV_WITH_PATH }
  );
  const vfLog = vfRun.stderr || "";
  const blackSegments = parseMatches(
    vfLog,
    /black_start:(?<start>[\d.]+)\s+black_end:(?<end>[\d.]+)\s+black_duration:(?<duration>[\d.]+)/g
  );
  const freezeSegments = parseMatches(
    vfLog,
    /freeze_start:\s*(?<start>[\d.]+)[\s\S]*?freeze_duration:\s*(?<duration>[\d.]+)/g
  );

  // Audio loudness check
  let meanVolumeDb = null;
  let maxVolumeDb = null;
  if (aStream) {
    const afRun = spawnSync(
      "ffmpeg",
      ["-i", videoPath, "-af", "volumedetect", "-f", "null", "-"],
      { encoding: "utf8", env: ENV_WITH_PATH }
    );
    const afLog = afRun.stderr || "";
    const meanMatch = afLog.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    const maxMatch = afLog.match(/max_volume:\s*([-\d.]+)\s*dB/);
    if (meanMatch) meanVolumeDb = Number(meanMatch[1]);
    if (maxMatch) maxVolumeDb = Number(maxMatch[1]);
  }

  // Optional 4x3 contact sheet for agent visual inspection
  let contactSheetPath = opts.contactSheetPath || null;
  if (contactSheetPath) {
    const tileFps = Math.max(0.1, 12 / Math.max(1, durationSec));
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-i",
        videoPath,
        "-vf",
        `fps=${tileFps.toFixed(4)},scale=360:-1,tile=4x3`,
        "-frames:v",
        "1",
        contactSheetPath,
      ],
      { env: ENV_WITH_PATH }
    );
  }

  const audioTooQuiet = aStream && meanVolumeDb !== null && meanVolumeDb < -45;
  const passed =
    Boolean(vStream) &&
    durationSec > 0 &&
    blackSegments.length === 0 &&
    freezeSegments.length === 0 &&
    !audioTooQuiet;

  return {
    video: {
      path: videoPath,
      width: vStream?.width || 0,
      height: vStream?.height || 0,
      fps,
      durationSec,
    },
    audio: {
      present: Boolean(aStream),
      meanVolumeDb,
      maxVolumeDb,
      tooQuiet: Boolean(audioTooQuiet),
    },
    issues: {
      blackSegments,
      freezeSegments,
    },
    contactSheetPath,
    passed,
  };
}
