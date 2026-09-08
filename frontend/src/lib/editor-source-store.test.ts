/**
 * FAZA 2 (2.A) — dovada că originalul supraviețuiește.
 *
 * Regresia pe care o păzește: Cristina traduce o fișă RO→SK, închide aplicația,
 * revine a doua zi. Înainte, varianta românească nu mai exista nicăieri.
 */

import {
  saveSourceSnapshot,
  readSourceSnapshot,
  clearSourceSnapshot,
} from "./editor-source-store";

jest.mock("./failure", () => ({ reportFailure: jest.fn() }));
import { reportFailure } from "./failure";

const DOC_RO = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Unghiuri. Bisectoare." }],
    },
  ],
};

describe("magazia documentului-sursă", () => {
  beforeEach(() => {
    localStorage.clear();
    (reportFailure as jest.Mock).mockClear();
  });

  it("fără nimic salvat, întoarce null (nu aruncă, nu blochează editorul)", () => {
    expect(readSourceSnapshot()).toBeNull();
  });

  it("salvează și recuperează originalul împreună cu limba lui", () => {
    saveSourceSnapshot("ro", DOC_RO);
    const s = readSourceSnapshot();
    expect(s).not.toBeNull();
    expect(s!.lang).toBe("ro");
    expect(s!.doc).toEqual(DOC_RO);
    expect(s!.savedAt).toBeGreaterThan(0);
  });

  it("SCENARIUL REAL: după traducere, originalul rămâne recuperabil chiar dacă documentul afișat e slovac", () => {
    // Ce se întâmplă la apăsarea pe SK: originalul e pus la adăpost…
    saveSourceSnapshot("ro", DOC_RO);
    // …iar autosalvarea documentului scrie varianta AFIȘATĂ, în slovacă.
    localStorage.setItem(
      "editor_nou_v1",
      JSON.stringify({
        html: "<p>Uhly. Osi uhlov.</p>",
        name: "fisa",
        savedAt: 1,
      }),
    );
    localStorage.setItem("editor_nou_lang_v1", "sk");

    // Reload: documentul afișat e slovac, DAR originalul există și e românesc.
    const s = readSourceSnapshot();
    expect(s!.lang).toBe("ro");
    expect(JSON.stringify(s!.doc)).toContain("Unghiuri. Bisectoare.");
  });

  it("ștergerea îl scoate definitiv (document nou / document înlocuit)", () => {
    saveSourceSnapshot("ro", DOC_RO);
    clearSourceSnapshot();
    expect(readSourceSnapshot()).toBeNull();
  });

  it("o intrare coruptă nu dărâmă editorul — se comportă ca „nimic salvat”", () => {
    localStorage.setItem("editor_nou_source_v1", "{ nu e json");
    expect(readSourceSnapshot()).toBeNull();
  });

  it("o intrare fără document e respinsă (nu întoarce ceva pe jumătate)", () => {
    localStorage.setItem(
      "editor_nou_source_v1",
      JSON.stringify({ lang: "ro" }),
    );
    expect(readSourceSnapshot()).toBeNull();
  });

  it("dacă scrierea eșuează (cotă plină), NU tace — raportează E-EDIT-003", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      const e = new Error("quota");
      e.name = "QuotaExceededError";
      throw e;
    };
    try {
      saveSourceSnapshot("ro", DOC_RO);
    } finally {
      Storage.prototype.setItem = orig;
    }
    expect(reportFailure).toHaveBeenCalledTimes(1);
    const arg = (reportFailure as jest.Mock).mock.calls[0][0];
    expect(arg.code).toBe("E-EDIT-003");
    expect(arg.context.quotaLikely).toBe(true);
  });
});
