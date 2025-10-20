import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RTLPreviewPage from "../../src/dev/rtl-preview";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.resolve(CURRENT_DIR, "__snapshots__");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "rtl-preview.html");

function normalizeMarkup(markup: string) {
  return markup
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function main() {
  ensureSnapshotDir();
  const markup = renderToStaticMarkup(<RTLPreviewPage />);
  const normalizedMarkup = normalizeMarkup(markup);

  if (!fs.existsSync(SNAPSHOT_FILE)) {
    fs.writeFileSync(SNAPSHOT_FILE, `${normalizedMarkup}\n`, "utf8");
    console.log("Created baseline RTL preview snapshot at", path.relative(process.cwd(), SNAPSHOT_FILE));
    return;
  }

  const expected = normalizeMarkup(fs.readFileSync(SNAPSHOT_FILE, "utf8"));

  if (expected !== normalizedMarkup) {
    console.error("RTL preview markup has changed. Regenerate the snapshot if the change is intentional using npm run test:visual");
    console.error("\n--- Expected ------------------------------\n");
    console.error(expected);
    console.error("\n--- Received ------------------------------\n");
    console.error(normalizedMarkup);
    process.exitCode = 1;
    return;
  }

  console.log("RTL preview markup matches stored snapshot.");
}

main();
