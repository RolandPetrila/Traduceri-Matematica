import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Flat config (Next 15 / create-next-app style, Next-16-ready). `next lint` is
// deprecated → the `lint` script runs the ESLint CLI directly against this file.
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**", // vendored assets: editor/, asistent/, pdf.worker — not our source
      // CommonJS build/tooling config — `require()` is legitimate here, not app code.
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "jest.setup.js",
      "scripts/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
