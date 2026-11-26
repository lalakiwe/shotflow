import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ENV_WITH_PATH = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
};

export const FONT_CACHE_DIR = process.env.SHOTFLOW_FONT_CACHE || path.join(os.homedir(), ".shotflow-cache", "fonts");

/**
 * Loads an inline SVG string from lucide-static (1,800+ icons) at runtime.
 * Returns "" gracefully if lucide-static is not installed or icon name is unknown.
 */
export function loadLucideIcon(name, size = 32, stroke = "currentColor") {
  if (!name) return "";
  const safeName = String(name).toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const pkgDir = path.dirname(require.resolve("lucide-static/package.json"));
    const iconPath = path.join(pkgDir, "icons", `${safeName}.svg`);
    if (!fs.existsSync(iconPath)) return "";
    let svg = fs.readFileSync(iconPath, "utf8");
    svg = svg
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`)
      .replace(/stroke="[^"]*"/, `stroke="${stroke}"`);
    return svg;
  } catch {
    return "";
  }
}

/**
 * Renders a LaTeX math expression via KaTeX at runtime (with graceful fallback).
 */
export async function renderKatex(latex, displayMode = true) {
  if (!latex) return { html: "", css: "" };
  try {
    const katexMod = await import("katex");
    const katex = katexMod.default || katexMod;
    const html = katex.renderToString(latex, { displayMode, throwOnError: false });
    let css = "";
    try {
      const katexCssPath = require.resolve("katex/dist/katex.min.css");
      css = fs.readFileSync(katexCssPath, "utf8");
    } catch {
      css = "";
    }
    return { html, css };
  } catch {
    const escaped = String(latex).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return { html: `<code class="formula-fallback">${escaped}</code>`, css: "" };
  }
}

/**
 * Loads Rough.js browser bundle source string at runtime for sketch-style overlays.
 */
export function loadRoughJsInlineScript() {
  try {
    const roughPath = require.resolve("roughjs/bundled/rough.js");
    return fs.readFileSync(roughPath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Loads any cached .woff2/.ttf fonts from ~/.shotflow-cache/fonts as inline @font-face CSS.
 * Also supports optional Google Fonts <link> stylesheet tag when online.
 */
export function loadCachedFontCss(googleFontFamilies = []) {
  const cssBlocks = [];
  if (fs.existsSync(FONT_CACHE_DIR)) {
    for (const file of fs.readdirSync(FONT_CACHE_DIR)) {
      const ext = path.extname(file).toLowerCase();
      if (ext !== ".woff2" && ext !== ".ttf") continue;
      const family = path.basename(file, ext).replace(/[_-]+/g, " ");
      const b64 = fs.readFileSync(path.join(FONT_CACHE_DIR, file)).toString("base64");
      const mime = ext === ".woff2" ? "font/woff2" : "font/ttf";
      const fmt = ext === ".woff2" ? "woff2" : "truetype";
      cssBlocks.push(
        `@font-face { font-family: '${family}'; src: url('data:${mime};base64,${b64}') format('${fmt}'); }`
      );
    }
  }
  const links = googleFontFamilies
    .filter(Boolean)
    .map((f) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;600;700;800&display=swap" />`)
    .join("\n");
  return { inlineCss: cssBlocks.join("\n"), headLinks: links };
}

/**
 * Generates clean procedural transition SFX using pure FFmpeg (zero external audio assets).
 * Supported kinds: "whoosh" | "pop" | "chime"
 */
export function generateProceduralSfx(kind, outPath) {
  let filter;
  if (kind === "pop") {
    filter = "sine=frequency=520:duration=0.09,afade=t=in:d=0.01,afade=t=out:st=0.03:d=0.06,volume=0.35";
  } else if (kind === "chime") {
    filter = "sine=frequency=880:duration=0.35,afade=t=in:d=0.02,afade=t=out:st=0.10:d=0.25,volume=0.28";
  } else {
    filter = "anoisesrc=color=pink:duration=0.35,lowpass=f=900,highpass=f=180,afade=t=in:d=0.10,afade=t=out:st=0.18:d=0.17,volume=0.22";
  }

  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-f", "lavfi", "-i", filter, "-c:a", "libmp3lame", "-b:a", "128k", outPath],
    { env: ENV_WITH_PATH }
  );
  return outPath;
}
