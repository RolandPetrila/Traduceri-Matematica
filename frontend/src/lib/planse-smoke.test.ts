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

describe("PlanseDiag.notaLot — avertismentul de lot incomplet", () => {
  // Ramura asta NU e atinsă de testul de fum: acolo lotul iese complet, iar
  // `notaLot` se întoarce imediat. Fixul livrat (mesaj și ÎN AFARA barei ascunse,
  // plus ștergerea lui la lot complet) rămânea neexercitat de niciun test —
  // semnalat de auditorul de regresie.
  type Diag = {
    notaLot: (el: HTMLElement, requested: number, produced: number) => void;
  };

  function pregatesteDom() {
    document.body.innerHTML =
      '<section id="gazda">' +
      '  <div class="gen-actions" id="x-actions" style="display:none">' +
      '    <span id="x-meta">3 careuri</span>' +
      "  </div>" +
      "</section>";
    return {
      meta: document.getElementById("x-meta")!,
      gazda: document.getElementById("gazda")!,
    };
  }

  let diag: Diag;
  beforeAll(() => {
    window.eval(fs.readFileSync(path.join(PLANSE, "lib/diag.js"), "utf8"));
    diag = (window as unknown as { PlanseDiag: Diag }).PlanseDiag;
  });

  it("lot INCOMPLET: scrie și în afara barei ascunse — altfel la 0 din 5 mesajul e invizibil", () => {
    const { meta, gazda } = pregatesteDom();
    diag.notaLot(meta, 5, 0);

    const avertisment = gazda.querySelector(".lot-incomplet");
    expect(avertisment).toBeTruthy();
    expect(avertisment!.textContent).toContain("0 din 5");
    expect(avertisment!.getAttribute("role")).toBe("alert");
    // În AFARA barei ascunse, ca să fie vizibil chiar dacă bara rămâne `display:none`.
    expect(avertisment!.closest(".gen-actions")).toBeNull();
  });

  it("lot parțial: mesajul apare și în rezumatul din bară", () => {
    const { meta } = pregatesteDom();
    diag.notaLot(meta, 5, 3);
    expect(meta.textContent).toContain("3 din 5");
  });

  it("lot COMPLET după unul eșuat: avertismentul vechi dispare, nu rămâne agățat pe ecran", () => {
    const { meta, gazda } = pregatesteDom();

    diag.notaLot(meta, 5, 2); // prima rulare, eșuată parțial
    expect(gazda.querySelector(".lot-incomplet")).toBeTruthy();

    // A doua rulare, reușită. Generatorul rescrie rezumatul ÎNAINTE de `notaLot`
    // (`meta.textContent = ...` în `app.js`), deci simulăm exact asta.
    meta.textContent = "5 careuri";
    diag.notaLot(meta, 5, 5);

    expect(gazda.querySelector(".lot-incomplet")).toBeNull();
    expect(meta.textContent).toBe("5 careuri");
  });
});

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

/**
 * E-PLAN-001 (diagnosticat 2026-09-12) — `dictare`/`uneste` au un catalog FIX de
 * forme (23, respectiv 36 semnături posibile TOTAL — vezi config/error_codes.json).
 * Bucla din `generate()` e CORECTĂ (nu repetă o semnătură deja „văzută"); ce era
 * greșit era sfatul din avertisment ("Mai apasă o dată pentru altele noi.") —
 * înșelător când chiar TOATE variantele posibile la acea dificultate s-au epuizat,
 * caz în care reîncercarea nu poate produce nimic nou. Testele de mai jos verifică
 * mesajul corectat, nu doar citirea codului.
 */
describe("Planșe — avertisment corect la epuizarea catalogului (dictare/uneste)", () => {
  beforeAll(() => {
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
    incarcaModulul();
  });

  function montezaTab(id: string) {
    const buton = Array.from(
      document.querySelectorAll<HTMLElement>(".subtab"),
    ).find((b) => b.dataset.id === id)!;
    buton.click();
  }

  function selecteazaRadio(name: string, valoare: string) {
    const radios = Array.from(
      document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`),
    );
    radios.forEach((r) => {
      r.checked = r.value === valoare;
    });
  }

  it("dictare, Greu (DOAR 6 forme posibile TOTAL) + cerere de 8 → avertisment care spune adevărul, nu 'mai apasă o dată'", () => {
    montezaTab("dictare");
    selecteazaRadio("didif", "Greu");
    (document.getElementById("di-forma") as HTMLSelectElement).value =
      "aleator";
    (document.getElementById("di-np") as HTMLInputElement).value = "8";

    document
      .getElementById("di-form")!
      .dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );

    // pigeonhole: 8 cerute, DOAR 6 posibile TOTAL la "Greu" -> incomplet garantat,
    // indiferent de seed/random (nu depinde de istoricul localStorage).
    const meta = document.getElementById("di-meta")!;
    expect(meta.textContent).toContain("doar atâtea forme distincte");

    const avertisment = document.querySelector(".lot-incomplet");
    expect(avertisment).toBeTruthy();
    expect(avertisment!.textContent).toContain(
      "Există doar atâtea forme distincte la această dificultate",
    );
    expect(avertisment!.textContent).not.toContain("Mai apasă o dată");
  });

  it("uneste, catalog epuizat (toate cele 12 forme deja 'văzute' la Standard) + cerere de 2 → avertisment corect", () => {
    montezaTab("uneste");
    const uneste = (
      window as unknown as {
        PlanseGen: {
          uneste: {
            SHAPE_IDS: string[];
            buildOne: (
              params: { forma: string; dificultate: string },
              seed: number,
            ) => { semnatura: string };
          };
        };
      }
    ).PlanseGen.uneste;
    const istoric = (
      window as unknown as {
        PlanseHistory: { remember: (sig: string, tip: string) => void };
      }
    ).PlanseHistory;
    const dif = "Standard";

    // marcheaza TOATE cele 12 forme ca deja vazute la aceasta dificultate ->
    // 0 semnaturi noi posibile, indiferent de seed (deterministic, fara flake).
    uneste.SHAPE_IDS.forEach((forma) => {
      const it = uneste.buildOne({ forma, dificultate: dif }, 0);
      istoric.remember(it.semnatura, "uneste");
    });

    selecteazaRadio("undif", dif);
    (document.getElementById("un-forma") as HTMLSelectElement).value =
      "aleator";
    (document.getElementById("un-np") as HTMLInputElement).value = "2";

    document
      .getElementById("un-form")!
      .dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );

    const avertisment = document.querySelector(".lot-incomplet");
    expect(avertisment).toBeTruthy();
    expect(avertisment!.textContent).toContain("0 din 2");
    expect(avertisment!.textContent).toContain(
      "Există doar atâtea forme distincte la această dificultate",
    );
    expect(avertisment!.textContent).not.toContain("Mai apasă o dată");
  });

  it("lot COMPLET (labirint, generator neafectat) — avertismentul default rămâne neschimbat", () => {
    montezaTab("labirint");
    document
      .getElementById("lab-form")!
      .dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    // labirint nu are catalog fix -> lot complet, fara avertisment.
    expect(document.querySelector(".lot-incomplet")).toBeNull();
  });
});
