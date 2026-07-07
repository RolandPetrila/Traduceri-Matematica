import { defineConfig } from "vitest/config";

// Tooling de test la radacina — NU se deployeaza (Vercel root = pwa/).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["pwa/api/**/*.js", "pwa/lib/**/*.js"], // proxy + logica AI extrasa
      reporter: ["text", "json-summary"],
    },
  },
});
