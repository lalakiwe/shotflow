import fs from "node:fs";
import path from "node:path";

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch {
    throw new Error("Missing 'playwright-core'. Run './scripts/setup.sh --mode 5b' (or 'npm install') first.");
  }
}

/**
 * Captures a live website's desktop screenshot, palette, fonts, title, and headings
 * for Track B product-launch videos.
 */
export async function captureSite(url, outDir, opts = {}) {
  const { chromium } = await loadPlaywright();
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: opts.chromePath || undefined,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);

    const screenshotPath = path.join(outDir, "site_hero.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const brand = await page.evaluate(() => {
      const bodyStyle = getComputedStyle(document.body);
      const h1 = document.querySelector("h1");
      const h1Style = h1 ? getComputedStyle(h1) : null;
      const headings = Array.from(document.querySelectorAll("h1, h2"))
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .slice(0, 8);
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      return {
        title: document.title,
        description: metaDesc,
        headings,
        backgroundColor: bodyStyle.backgroundColor,
        textColor: bodyStyle.color,
        bodyFont: bodyStyle.fontFamily,
        headingFont: h1Style?.fontFamily || bodyStyle.fontFamily,
      };
    });

    const metaPath = path.join(outDir, "brand.json");
    const payload = { url, screenshotPath, ...brand };
    fs.writeFileSync(metaPath, JSON.stringify(payload, null, 2) + "\n");
    return payload;
  } finally {
    await browser.close();
  }
}
