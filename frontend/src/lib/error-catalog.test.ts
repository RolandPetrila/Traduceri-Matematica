/**
 * Anti-drift: `error-catalog.ts` (oglinda din bundle) TREBUIE să fie identic cu
 * sursa canonică `config/error_codes.json` (rădăcina repo). Dacă editezi unul fără
 * celălalt, acest test pică — exact ca să nu ajungă /diagnostics să afișeze o
 * cauză/fix invechit(ă).
 */
import * as fs from "fs";
import * as path from "path";
import { ERROR_CATALOG } from "./error-catalog";

const CONFIG_PATH = path.resolve(__dirname, "../../../config/error_codes.json");

describe("error-catalog ↔ config/error_codes.json (anti-drift)", () => {
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const codes: Record<string, Record<string, string>> = raw.codes;

  it("acoperă exact aceleași coduri", () => {
    expect(Object.keys(ERROR_CATALOG).sort()).toEqual(
      Object.keys(codes).sort(),
    );
  });

  it("fiecare cod are message/cause/fix/severity/area identice", () => {
    for (const [code, info] of Object.entries(codes)) {
      const mirror = ERROR_CATALOG[code];
      expect(mirror).toBeDefined();
      expect(mirror.message).toBe(info.message);
      expect(mirror.cause).toBe(info.cause);
      expect(mirror.fix).toBe(info.fix);
      expect(mirror.severity).toBe(info.severity);
      expect(mirror.area).toBe(info.area);
    }
  });

  it("fiecare cod din config are cause + fix ne-goale (diagnostic util)", () => {
    const missing: string[] = [];
    for (const [code, info] of Object.entries(codes)) {
      if ((info.cause || "").length <= 10) missing.push(`${code}.cause`);
      if ((info.fix || "").length <= 10) missing.push(`${code}.fix`);
    }
    expect(missing).toEqual([]);
  });
});
