import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ENV_WITH_PATH = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.HOME}/.shotflow-venv/bin:${process.env.PATH || ""}`,
};

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch {
    throw new Error("Missing 'playwright-core'. Run './scripts/setup.sh --mode 5b' (or 'npm install') first.");
  }
}

/**
 * Records a live web app walkthrough with an animated cursor overlay via Playwright,
 * then transcodes the capture into a clean MP4 for product-launch scenes.
 *
 * Optional steps JSON array format:
 *   [{ "action": "wait", "ms": 800 },
 *    { "action": "click", "selector": "button.cta" },
 *    { "action": "fill", "selector": "input[name=q]", "value": "ShotFlow" },
 *    { "action": "scroll", "y": 500 }]
 */
export async function recordSite(url, outDir, opts = {}) {
  const { chromium } = await loadPlaywright();
  fs.mkdirSync(outDir, { recursive: true });
  const rawDir = path.join(outDir, ".raw_record");
  fs.rmSync(rawDir, { recursive: true, force: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const width = opts.width || 1440;
  const height = opts.height || 900;
  const durationMs = (opts.durationSec || 6) * 1000;
  const steps = Array.isArray(opts.steps) ? opts.steps : [];

  const browser = await chromium.launch({
    headless: true,
    executablePath: opts.chromePath || undefined,
  });

  let webmPath = null;
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      recordVideo: { dir: rawDir, size: { width, height } },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Inject subtle visual cursor ring for demo clarity
    await page.addStyleTag({
      content: `
        #shotflow-cursor {
          position: fixed; z-index: 2147483647; pointer-events: none;
          width: 24px; height: 24px; border-radius: 50%;
          border: 3px solid #38bdf8; background: rgba(56,189,248,0.22);
          transform: translate(-50%, -50%); transition: left 0.25s ease, top 0.25s ease;
          left: -40px; top: -40px;
        }
      `,
    });
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "shotflow-cursor";
      document.body.appendChild(el);
    });

    if (steps.length > 0) {
      for (const step of steps) {
        if (step.action === "wait") {
          await page.waitForTimeout(step.ms || 600);
        } else if (step.action === "scroll") {
          await page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), step.y || 400);
          await page.waitForTimeout(600);
        } else if (step.action === "click" && step.selector) {
          const box = await page.locator(step.selector).first().boundingBox();
          if (box) {
            await page.evaluate(({ x, y }) => {
              const c = document.getElementById("shotflow-cursor");
              if (c) { c.style.left = `${x}px`; c.style.top = `${y}px`; }
            }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
            await page.waitForTimeout(300);
          }
          await page.locator(step.selector).first().click();
          await page.waitForTimeout(500);
        } else if (step.action === "fill" && step.selector) {
          await page.locator(step.selector).first().fill(step.value || "");
          await page.waitForTimeout(400);
        }
      }
    } else {
      // Default smooth scroll showcase
      await page.waitForTimeout(Math.round(durationMs * 0.3));
      await page.evaluate(() => window.scrollBy({ top: 450, behavior: "smooth" }));
      await page.waitForTimeout(Math.round(durationMs * 0.4));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await page.waitForTimeout(Math.round(durationMs * 0.3));
    }

    const video = page.video();
    await context.close();
    webmPath = await video.path();
  } finally {
    await browser.close();
  }

  const mp4Path = path.join(outDir, "recording.mp4");
  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", mp4Path],
    { env: ENV_WITH_PATH }
  );
  fs.rmSync(rawDir, { recursive: true, force: true });
  return { url, mp4Path, width, height };
}
