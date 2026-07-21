// Sync the canonical tab registry (<repo>/config/tabs.json) into the frontend
// copy (frontend/config/tabs.json) that tab-config.ts imports. The frontend
// copy exists because Vercel builds with root=frontend/ and cannot import from
// ../config/ at the repo root. Editing only the canonical file and running this
// on dev/prebuild keeps the two in sync so tabs never drift.
//
// Defensive by design: if the canonical source is absent (e.g. a Vercel build
// that only checked out frontend/), this is a NO-OP — the committed frontend
// copy is already correct, so a missing source never breaks the build.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// scripts/ -> frontend/ -> <repo>/
const src = resolve(__dirname, "..", "..", "config", "tabs.json");
const destDir = resolve(__dirname, "..", "config");
const dest = resolve(destDir, "tabs.json");

if (!existsSync(src)) {
  console.log(`[copy-tabs] canonical source absent, keeping committed copy: ${dest}`);
  process.exit(0);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-tabs] synced canonical tabs -> frontend/config/tabs.json`);
