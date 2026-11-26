import fs from "node:fs";
import path from "node:path";

export const SIZES = {
  "16:9": { width: 1920, height: 1080, safePadding: { top: 72, right: 96, bottom: 72, left: 96 } },
  "9:16": { width: 1080, height: 1920, safePadding: { top: 180, right: 140, bottom: 320, left: 80 } },
  "4:5": { width: 1080, height: 1350, safePadding: { top: 96, right: 80, bottom: 140, left: 80 } },
  "1:1": { width: 1080, height: 1080, safePadding: { top: 80, right: 80, bottom: 100, left: 80 } },
};

export const LOOKS = {
  midnight: {
    name: "midnight",
    bg: "#07090f",
    surface: "#111624",
    surfaceBorder: "rgba(255,255,255,0.12)",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#38bdf8",
    accent2: "#818cf8",
    codeBg: "#0b1020",
    fontSans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans TC', 'PingFang TC', sans-serif",
    fontMono: "'SF Mono', Menlo, Consolas, monospace",
  },
  studio: {
    name: "studio",
    bg: "#f8fafc",
    surface: "#ffffff",
    surfaceBorder: "rgba(15,23,42,0.10)",
    text: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    accent2: "#7c3aed",
    codeBg: "#0f172a",
    fontSans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans TC', 'PingFang TC', sans-serif",
    fontMono: "'SF Mono', Menlo, Consolas, monospace",
  },
  editorial: {
    name: "editorial",
    bg: "#f5f1e8",
    surface: "#fffdf8",
    surfaceBorder: "rgba(28,25,23,0.14)",
    text: "#1c1917",
    muted: "#57534e",
    accent: "#c2410c",
    accent2: "#b45309",
    codeBg: "#1c1917",
    fontSans: "'Georgia', 'Noto Serif TC', serif",
    fontMono: "'SF Mono', Menlo, Consolas, monospace",
  },
  blueprint: {
    name: "blueprint",
    bg: "#0a192f",
    surface: "#112240",
    surfaceBorder: "rgba(100,255,218,0.22)",
    text: "#e6f1ff",
    muted: "#8892b0",
    accent: "#64ffda",
    accent2: "#38bdf8",
    codeBg: "#071324",
    fontSans: "-apple-system, BlinkMacSystemFont, 'Inter', 'Noto Sans TC', sans-serif",
    fontMono: "'SF Mono', Menlo, Consolas, monospace",
  },
};

export const FORMATS = {
  "product-launch": {
    description: "Apple WWDC-style product keynote: problem hook, hero reveal, feature/code demos, Bento summary, CTA.",
    defaultLook: "midnight",
    defaultSize: "16:9",
  },
  "narrated-explainer": {
    description: "Concept explainer: hook, structured visual steps, key takeaway.",
    defaultLook: "studio",
    defaultSize: "16:9",
  },
  "vertical-short": {
    description: "9:16 vertical short for Reels/Shorts/TikTok with safe-zone margins.",
    defaultLook: "midnight",
    defaultSize: "9:16",
  },
};

export function createStarterProject(targetDir, opts = {}) {
  const format = opts.format || "product-launch";
  const look = opts.look || FORMATS[format]?.defaultLook || "midnight";
  const size = opts.size || FORMATS[format]?.defaultSize || "16:9";
  const lang = opts.lang || "en";
  const title = opts.title || "My Product";
  const isZh = lang.toLowerCase().startsWith("zh");
  const voice = isZh ? "zh-TW-HsiaoChenNeural" : "en-US-AndrewNeural";

  fs.mkdirSync(path.join(targetDir, "assets"), { recursive: true });

  const videoConfig = {
    title,
    format,
    look,
    size,
    fps: 30,
    lang,
    voice,
    pace: 1.0,
    captions: size === "9:16" ? "bold" : "subtle",
    bgmVolume: 0.16,
  };

  const scenes = [
    {
      id: "scene_01",
      layout: "hero",
      badge: format === "product-launch" ? "INTRODUCING" : "OVERVIEW",
      headline: title,
      subheadline: isZh ? "從想法到成片，一條流程完成。" : "From idea to finished MP4 in one workflow.",
      narration: isZh
        ? `歡迎認識 ${title}。我們重新設計了整個工作流程，讓創作更直覺、更快速。`
        : `Meet ${title}. We rebuilt the entire workflow from the ground up so you can ship faster.`,
      durationSec: 5.5,
    },
    {
      id: "scene_02",
      layout: "code",
      headline: isZh ? "快速啟動專案" : "Start with a single command",
      windowTitle: "ShotFlow CLI",
      codeLines: [
        { text: "shotflow init ./launch --format product-launch", triggerWord: "command" },
        { text: "shotflow render ./launch", triggerWord: "render" },
        { text: "Output: out/final.mp4 (1920x1080 @ 30fps)", triggerWord: "MP4" },
      ],
      narration: isZh
        ? "只需要一行指令就能初始化專案、自動渲染畫面，並直接輸出高畫質影片。"
        : "Run a single command to initialize your project, render every frame locally, and export a crisp MP4.",
      durationSec: 6.5,
    },
    {
      id: "scene_03",
      layout: "bento",
      headline: isZh ? "核心亮點一次掌握" : "Everything built in",
      cards: [
        { title: isZh ? "詞級對齊" : "Word-Synced", body: isZh ? "畫面跟著旁白精準進場" : "Visuals animate on exact spoken words", triggerWord: "synced" },
        { title: isZh ? "全本地執行" : "100% Local", body: isZh ? "免點數、免 API Key" : "Zero cloud video credits required", triggerWord: "local" },
        { title: isZh ? "自動品管" : "Auto QC", body: isZh ? "黑畫面、音量與溢位自動檢查" : "Checks loudness, freezes and overflow", triggerWord: "quality" },
        { title: isZh ? "多尺寸輸出" : "Multi-Size", body: "16:9 / 9:16 / 4:5 / 1:1", triggerWord: "platform" },
      ],
      narration: isZh
        ? "內建詞級音畫同步、全本地零點數渲染、自動品質檢查，並支援各大社群平台尺寸。"
        : "Everything is synced to your voice, runs completely local, verifies quality automatically, and exports for every platform.",
      durationSec: 7.0,
    },
    {
      id: "scene_04",
      layout: "cta",
      headline: title,
      subheadline: "Open Source Video Engine",
      ctaPill: isZh ? "立即免費開源體驗" : "Try It Today",
      narration: isZh
        ? `現在就試試 ${title}，開始打造你的下一支作品。`
        : `Try ${title} today and ship your next launch video in minutes.`,
      durationSec: 4.5,
    },
  ];

  fs.writeFileSync(path.join(targetDir, "video.json"), JSON.stringify(videoConfig, null, 2) + "\n");
  fs.writeFileSync(path.join(targetDir, "scenes.json"), JSON.stringify(scenes, null, 2) + "\n");

  return { dir: targetDir, files: ["video.json", "scenes.json", "assets/"] };
}
