// Copy the pdf.js worker into public/ so it is served same-origin (CSP
// worker-src 'self') without webpack trying to bundle the ESM worker.
// Runs before build (prebuild) and dev — always matches the installed pdfjs
// version, so no stale binary is committed to git.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const pkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
const src = resolve(pkgDir, "build/pdf.worker.min.mjs");
const destDir = resolve(__dirname, "..", "public");
const dest = resolve(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.error(`[copy-pdf-worker] source not found: ${src}`);
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-pdf-worker] copied worker -> public/pdf.worker.min.mjs`);
