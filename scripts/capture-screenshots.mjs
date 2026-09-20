#!/usr/bin/env node
/**
 * PartGenie Help Center screenshot helper
 *
 *   node scripts/capture-screenshots.mjs --audit
 *   STORAGE_STATE=scripts/.auth.json node scripts/capture-screenshots.mjs --ids=homepage-public
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MAP = JSON.parse(
  fs.readFileSync(path.join(__dirname, "screenshot-assets.json"), "utf8")
);

const args = process.argv.slice(2);
const auditOnly = args.includes("--audit") || args.length === 0;
const allCapture = args.includes("--all-capture");
const idsArg = args.find((a) => a.startsWith("--ids="));
const ids = idsArg
  ? idsArg.replace("--ids=", "").split(",").map((s) => s.trim()).filter(Boolean)
  : [];

function audit() {
  console.log("Help Center screenshot asset audit\n");
  let missing = 0;
  let reuse = 0;
  for (const asset of MAP.assets) {
    const abs = path.join(ROOT, asset.file);
    const exists = fs.existsSync(abs);
    if (!exists) missing += 1;
    if (asset.source === "reuse") reuse += 1;
    console.log(
      `${exists ? "OK   " : "MISS "} ${asset.id.padEnd(24)} ${asset.source.padEnd(8)} ${asset.file}`
    );
    console.log(`      used by: ${asset.usedBy.join(", ")}`);
  }
  console.log(
    `\n${MAP.assets.length} assets | ${reuse} reuse | ${missing} missing files`
  );
  console.log(
    "\nReuse tip: changelog PNGs under images/ → register here with source=reuse, point MDX at them."
  );
  console.log(
    "Capture tip: npx playwright codegen https://app.partgenie.ai --save-storage=scripts/.auth.json"
  );
  console.log(
    "Then: STORAGE_STATE=scripts/.auth.json node scripts/capture-screenshots.mjs --ids=homepage-public"
  );
}

if (auditOnly && !allCapture && ids.length === 0) {
  audit();
  process.exit(0);
}

const { chromium } = await import("playwright").catch(() => {
  console.error(
    "playwright not installed. Run: npm i -D playwright && npx playwright install chromium"
  );
  process.exit(1);
});

const selected = MAP.assets.filter((a) => {
  if (allCapture) return Boolean(a.capture);
  return ids.includes(a.id);
});

if (!selected.length) {
  console.error("No matching assets");
  process.exit(1);
}

const storage = process.env.STORAGE_STATE
  ? path.resolve(process.env.STORAGE_STATE)
  : null;
if (storage && !fs.existsSync(storage)) {
  console.error(`STORAGE_STATE not found: ${storage}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(storage ? { storageState: storage } : {});
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

for (const asset of selected) {
  if (!asset.capture) {
    console.log(`skip ${asset.id} (reuse only)`);
    continue;
  }
  const url =
    asset.capture.url ||
    `${MAP.baseUrl.replace(/\/$/, "")}${asset.capture.path || ""}`;
  console.log(`capturing ${asset.id} ← ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  if (asset.capture.prompt) {
    const box = page.getByRole("textbox").first();
    if (await box.count()) {
      await box.fill(asset.capture.prompt);
      await page.keyboard.press("Enter");
      if (asset.capture.waitForText) {
        await page
          .getByText(asset.capture.waitForText, { exact: false })
          .first()
          .waitFor({ timeout: 90000 })
          .catch(() => {});
      } else {
        await page.waitForTimeout(5000);
      }
    }
  }
  const out = path.join(ROOT, asset.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  wrote ${asset.file}`);
}

await browser.close();
