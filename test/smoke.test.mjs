import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FORMATS, LOOKS, SIZES, createStarterProject } from "../engine/presets.mjs";
import { buildSrt, estimateWordTimings, findTriggerTime, parseVttCues } from "../engine/tts.mjs";
import { buildSceneHtml } from "../engine/renderer.mjs";

test("createStarterProject scaffolds video.json and scenes.json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shotflow-test-"));
  try {
    const res = createStarterProject(dir, { format: "product-launch", look: "midnight", size: "16:9", lang: "zh-TW", title: "DemoApp" });
    assert.equal(res.dir, dir);
    const video = JSON.parse(fs.readFileSync(path.join(dir, "video.json"), "utf8"));
    const scenes = JSON.parse(fs.readFileSync(path.join(dir, "scenes.json"), "utf8"));
    assert.equal(video.title, "DemoApp");
    assert.equal(video.voice, "zh-TW-HsiaoChenNeural");
    assert.ok(scenes.length >= 4);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("VTT cue parsing, trigger word matching, and SRT export", () => {
  const sampleVtt = `WEBVTT\n\n00:00:00.200 --> 00:00:01.000\nRun a single command\n\n00:00:01.100 --> 00:00:02.400\nand render your MP4\n`;
  const cues = parseVttCues(sampleVtt);
  assert.equal(cues.length, 2);
  assert.equal(findTriggerTime("MP4", cues, "Run a single command and render your MP4", 3.0), 1.1);

  const est = estimateWordTimings("hello world test", 3.0);
  assert.equal(est.length, 3);
  assert.ok(est[1].startSec > est[0].startSec);

  const srt = buildSrt([{ scene: { narration: "Hello world." }, durationSec: 2.5 }]);
  assert.match(srt, /00:00:00,100 --> 00:00:02,250/);
});

test("buildSceneHtml renders hero, code, bento, and cta layouts cleanly", () => {
  const cues = estimateWordTimings("synced local quality platform", 6.0);
  for (const layout of ["hero", "code", "bento", "feature", "cta"]) {
    const html = buildSceneHtml(
      {
        id: `s_${layout}`,
        layout,
        headline: "Headline",
        subheadline: "Sub",
        badge: "NEW",
        codeLines: [{ text: "shotflow render .", triggerWord: "local" }],
        cards: [{ title: "A", body: "B", triggerWord: "synced" }],
        bullets: [{ text: "Bullet 1", triggerWord: "quality" }],
        ctaPill: "Try Now",
        narration: "synced local quality platform",
      },
      LOOKS.midnight,
      SIZES["16:9"],
      2.5,
      6.0,
      cues,
      process.cwd()
    );
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /Headline/);
  }
});

test("CLI --help and doctor run cleanly", () => {
  const cli = path.resolve(import.meta.dirname, "../bin/shotflow.mjs");
  const helpOut = execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.match(helpOut, /ShotFlow Native Engine/);
  const docOut = execFileSync(process.execPath, [cli, "doctor"], { encoding: "utf8" });
  assert.match(docOut, /ShotFlow Engine Doctor/);
  assert.ok(Object.keys(FORMATS).length >= 3);
});
