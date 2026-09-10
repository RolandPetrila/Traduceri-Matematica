// Regenerează frontend/src/lib/error-catalog.ts din config/error_codes.json
// (sursa canonică). Referit din header-ul error-catalog.ts ("vezi
// scratchpad/gen-error-catalog.mjs") dar lipsea fizic din scratchpad-ul
// PROIECTULUI — recreat Faza 4.5c (2026-09-10), la editarea E-NET-001/
// E-TEST-001/E-SCOL-001, ca sursa/oglinda să rămână regenerate, nu editate
// manual (regula scrisă chiar în header-ul fișierului generat).
//
// Rulare: node scratchpad/gen-error-catalog.mjs (din rădăcina repo)
// Verificare: npx jest src/lib/error-catalog.test.ts (din frontend/)
import fs from "fs";
import path from "path";

const ROOT = "C:/Proiecte/Traduceri_Matematica";
const SRC = path.join(ROOT, "config/error_codes.json");
const OUT = path.join(ROOT, "frontend/src/lib/error-catalog.ts");

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
const codes = raw.codes;

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** O linie dacă intră confortabil sub ~78 caractere de conținut, altfel pe linia proprie
 * (același stil ca fișierul scris manual anterior — nu contează pt anti-drift, doar lizibilitate). */
function field(name, value, indent) {
  const oneLine = `${indent}${name}: "${esc(value)}",`;
  if (oneLine.length <= 88) return oneLine;
  return `${indent}${name}:\n${indent}  "${esc(value)}",`;
}

const entries = Object.entries(codes)
  .map(([code, info]) => {
    const indent = "    ";
    const lines = [
      `  "${code}": {`,
      field("message", info.message, indent),
      field("cause", info.cause, indent),
      field("fix", info.fix, indent),
      `${indent}severity: "${esc(info.severity)}",`,
      `${indent}area: "${esc(info.area)}",`,
      `  },`,
    ];
    return lines.join("\n");
  })
  .join("\n");

const header = `/**
 * Catalog de erori — OGLINDĂ a \`config/error_codes.json\` (rădăcina repo), pt uz în
 * bundle-ul frontend (diagnostics). Sursa canonică rămâne \`config/error_codes.json\`
 * (citit și de backend + folosit ca documentație). Un test anti-drift
 * (\`error-catalog.test.ts\`) verifică la fiecare \`jest\` că cele două sunt IDENTICE —
 * dacă editezi unul, editează-l pe celălalt sau testul pică.
 *
 * GENERAT — nu edita manual acest fișier. Editează \`config/error_codes.json\` și
 * regenerează (vezi scratchpad/gen-error-catalog.mjs).
 *
 * Scop (cerut 2026-08-20): /diagnostics nu mai arată doar codul seac, ci și
 * „cauză probabilă" + „ce faci" → problema exactă, remediabilă instant.
 *
 * Convenție (Faza 1, 2026-09-08): câmpul \`cause\` descrie CATEGORIA de eșec, nu
 * incidentul. Cauza reală a unei erori anume stă pe rândul de log, în
 * \`context.cause\` / \`context.kind\` / \`stack\` — scrise de \`lib/failure.ts\`.
 */
export interface ErrorInfo {
  message: string;
  cause: string;
  fix: string;
  severity: "error" | "warn" | "info";
  area: string;
}

export const ERROR_CATALOG: Record<string, ErrorInfo> = {
`;

const footer = `};

export function getErrorInfo(code?: string): ErrorInfo | undefined {
  if (!code) return undefined;
  return ERROR_CATALOG[code];
}
`;

fs.writeFileSync(OUT, header + entries + "\n" + footer, "utf8");
console.log(`Regenerat: ${OUT} (${Object.keys(codes).length} coduri)`);
