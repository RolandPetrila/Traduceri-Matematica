// Data Validator — checks API responses for completeness
// Logs VALIDATE entries for missing, empty, or suspicious data

import { logInfo, logWarn, logCoded } from "./monitoring";

export function validateTranslationOutput(data: {
  html?: string;
  results?: Array<{ markdown?: string }>;
  pages?: number;
  duration_ms?: number;
  structured_pages?: unknown[];
}): void {
  if (!data.html) {
    // Hard "did not deliver": OCR/translate returned no usable HTML → error code.
    logCoded(
      "E-VALID-001",
      "VALIDATE | Traducere output: HTML gol sau lipseste",
      { source: "validator" },
    );
    return;
  }

  const html = data.html;
  const latexInline = (html.match(/\$[^$\n]+?\$/g) || []).length;
  const latexDisplay = (html.match(/\$\$[\s\S]+?\$\$/g) || []).length;
  const latexCount = latexInline + latexDisplay;
  const svgCount = (html.match(/<svg/gi) || []).length;
  const headingCount = (html.match(/<h[1-6]/gi) || []).length;
  const textLength = html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim().length;

  logInfo(
    `VALIDATE | Traducere output: LaTeX=${latexCount} | SVG=${svgCount} | Headings=${headingCount} | Text=${textLength} chars`,
    { source: "validator" },
  );

  if (textLength < 50) {
    logWarn(
      "VALIDATE | Text foarte scurt (<50 chars) — posibil OCR esuat sau imagine goala",
      {
        source: "validator",
        errorCode: "E-VALID-002",
      },
    );
  }
  if (headingCount === 0 && textLength > 200) {
    logWarn("VALIDATE | Niciun heading detectat — structura posibil pierduta", {
      source: "validator",
      errorCode: "E-VALID-002",
    });
  }
  if (latexCount === 0 && textLength > 100) {
    // R-MATH: math elements may have been lost — flag distinctly.
    logWarn("VALIDATE | Nicio formula LaTeX detectata — posibil math pierdut", {
      source: "validator",
      errorCode: "E-VALID-003",
    });
  }
}

export function validateConversionOutput(
  blob: Blob,
  operation: string,
  filename: string,
): void {
  if (blob.size === 0) {
    // Conversion produced nothing → error code (execution did not deliver).
    logCoded(
      "E-VALID-001",
      `VALIDATE | Conversie ${operation}: fisier gol (0 bytes) — ${filename}`,
      { source: "validator" },
    );
    return;
  }

  logInfo(
    `VALIDATE | Conversie ${operation}: ${filename} | ${(blob.size / 1024).toFixed(0)} KB | OK`,
    {
      source: "validator",
    },
  );
}
