/**
 * FAZA 2 — poarta vede acum și modulul Planșe.
 *
 * DE CE EXISTĂ. Pe 08.09.2026 am modificat `public/planse/app.js` cu un script
 * care a inserat aceeași linie în toate cele 6 generatoare, folosind variabila
 * `nr`. Dar `nr` există DOAR în labirint; celelalte cinci folosesc `np`. Rezultat:
 * `ReferenceError` în 5 din 6 generatoare — planșele apăreau pe ecran, dar bara cu
 * „Print / PDF" și „Adaugă în coș" rămânea ascunsă, deci erau inutilizabile.
 *
 * Poarta a rămas VERDE peste tot: `tsc` nu vede `public/**`, `jest` nu îl vedea,
 * iar `eslint.config.mjs` îl ignoră explicit. Patru comenzi verzi peste un modul
 * rupt, livrat în producție. Auditorul de regresie l-a prins rulând el însuși
 * generatoarele — testul de aici face asta automat, de acum înainte.
 *
 * Nu verifică frumusețea planșelor (aia e treaba lui `selftest.html`). Verifică
 * exact ce a lipsit: că apăsarea pe „Generează" nu aruncă și că butoanele de
 * acțiune devin utilizabile.
 */

import fs from "fs";
import path from "path";

const PLANSE = path.join(process.cwd(), "public", "planse");

/** Ordinea din `index.html` — infra, apoi generatoarele, apoi controllerul. */
const SCRIPTS = [
  "lib/prng.js",
  "lib/signature.js",
  "lib/render.js",
  "lib/history.js",
  "lib/diag.js",
  "generators/labirint.js",
  "generators/cautare.js",
  "generators/uneste.js",
  "generators/dictare.js",
  "generators/numere.js",
  "generators/integrama.js",
  "app.js",
];

/** Sub-tabul → prefixul id-urilor lui din DOM. */
const GENERATOARE: { id: string; prefix: string }[] = [
  { id: "labirint", prefix: "lab" },
  { id: "cautare", prefix: "ca" },
  { id: "uneste", prefix: "un" },
  { id: "dictare", prefix: "di" },
  { id: "numere", prefix: "nm" },
  { id: "integrama", prefix: "ig" },
];

function incarcaModulul(): Error[] {
  document.body.innerHTML = '<nav id="subtabs"></nav><main id="panel"></main>';

  const erori: Error[] = [];
  const onError = (e: ErrorEvent) => {
    erori.push(e.error || new Error(e.message));
  };
  window.addEventListener("error", onError);

  for (const rel of SCRIPTS) {
    const cod = fs.readFileSync(path.join(PLANSE, rel), "utf8");
    try {
      // Rulat în contextul ferestrei jsdom, exact ca un <script> clasic.
      window.eval(cod);
    } catch (e) {
      erori.push(e as Error);
    }
  }
  window.removeEventListener("error", onError);
  return erori;
}

describe("Planșe — fiecare generator răspunde la „Generează” fără să crape", () => {
  let eroriIncarcare: Error[] = [];

  beforeAll(() => {
    // jsdom nu are canvas; generatoarele desenează SVG, dar unele biblioteci
    // ating `matchMedia` la încărcare.
    if (!window.matchMedia) {
      // @ts-expect-error — completăm doar ce lipsește din jsdom
      window.matchMedia = () => ({
        matches: false,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      });
    }
    eroriIncarcare = incarcaModulul();
  });

  it("modulul se încarcă fără excepții", () => {
    expect(eroriIncarcare.map((e) => e.message)).toEqual([]);
  });

  it.each(GENERATOARE)(
    "«$id» generează fără ReferenceError, iar butoanele devin utilizabile",
    ({ id, prefix }) => {
      // `Array.from`, nu spread: proiectul compilează pe target es5, unde
      // iterarea unui NodeList cere `downlevelIteration` (capcană cunoscută).
      const buton = Array.from(
        document.querySelectorAll<HTMLElement>(".subtab"),
      ).find((b) => b.dataset.id === id);
      expect(buton).toBeDefined();

      const erori: Error[] = [];
      const onError = (e: ErrorEvent) =>
        erori.push(e.error || new Error(e.message));
      window.addEventListener("error", onError);

      buton!.click(); // montează panoul generatorului

      const form = document.querySelector<HTMLFormElement>(
        `#${prefix}-form, #panel form`,
      );
      expect(form).toBeTruthy();

      // „Generează" e submit-ul formularului.
      form!.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );

      window.removeEventListener("error", onError);

      // REGRESIA PĂZITĂ: `nr is not defined` în 5 din 6 generatoare.
      expect(erori.map((e) => e.message)).toEqual([]);

      // Bara de acțiuni (Print / PDF, Adaugă în coș) trebuie să fie utilizabilă
      // — exact ce se pierdea când excepția oprea execuția înainte de ea.
      const actions = document.getElementById(`${prefix}-actions`);
      expect(actions).toBeTruthy();
      expect(actions!.style.display).toBe("flex");
    },
  );
});
