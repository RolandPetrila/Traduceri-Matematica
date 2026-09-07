/**
 * FAZA 1 — teste pentru pâlnia de eșecuri (`lib/failure.ts`).
 *
 * Ce apără concret aceste teste (toate sunt regresii REALE, nu ipotetice):
 *  1. „Verifică internetul" pe un eșec care n-a atins rețeaua — mesajul mincinos
 *     din bug-ul de traducere (20.08 → 06.09.2026).
 *  2. Eșecurile logate la nivel `action` → invizibile pe /diagnostics ȘI la
 *     verificarea automată de erori (care filtrează error/warn).
 *  3. Suprimarea click-urilor repetate: Roland a apăsat SK de 3 ori; dacă
 *     dedup-ul înghite 2 din 3, /diagnostics minte din nou, invers.
 */
import { logError, logWarn, __resetApiFailureTrace } from "./monitoring";
import {
  classify,
  classifyFailure,
  reportFailure,
  toSample,
  SAMPLE_MAX,
  __resetFailureDedup,
} from "./failure";

jest.mock("./monitoring", () => {
  const actual = jest.requireActual("./monitoring");
  return {
    ...actual,
    logError: jest.fn(),
    logWarn: jest.fn(),
  };
});

const mockedLogError = logError as jest.MockedFunction<typeof logError>;
const mockedLogWarn = logWarn as jest.MockedFunction<typeof logWarn>;

beforeEach(() => {
  jest.clearAllMocks();
  __resetFailureDedup();
  __resetApiFailureTrace();
});

describe("classify — mecanismul eșecului, nu presupunerea", () => {
  it("eroarea de fetch a browserului = network", () => {
    const e = new TypeError("Failed to fetch");
    expect(classify(e, false)).toBe("network");
  });

  it("Safari: 'Load failed' e tot rețea", () => {
    expect(classify(new TypeError("Load failed"), false)).toBe("network");
  });

  it("un status HTTP in mesaj = http", () => {
    expect(classify(new Error("OCR HTTP 413"), false)).toBe("http");
    expect(classify(new Error("Eroare conversie (500): ..."), false)).toBe(
      "http",
    );
  });

  it("AbortError = abort, nu eroare de retea", () => {
    const e = new Error("The operation was aborted");
    e.name = "AbortError";
    expect(classify(e, false)).toBe("abort");
  });

  it("timeout e distinct de abort simplu", () => {
    const e = new Error("Request timed out");
    e.name = "AbortError";
    expect(classify(e, false)).toBe("timeout");
  });

  it("REGRESIA CHEIE: o eroare de cod, fara apel de retea, = logic", () => {
    // Exact forma bug-ului de traducere: a crăpat în browser, nicio cerere n-a plecat.
    const e = new TypeError(
      "Cannot read properties of undefined (reading 'content')",
    );
    expect(classify(e, false)).toBe("logic");
  });

  it("aceeasi eroare, DUPA un apel API cazut, = http (consecinta, nu cauza)", () => {
    const e = new Error("raspuns invalid");
    expect(classify(e, true)).toBe("http");
  });

  it("DOVADA LIVE 08.09.2026: corp de raspuns corupt = badResponse, nu bug de cod", () => {
    // Eroarea exacta prinsa pe productie la primul click pe SK: runtime-ul Vercel
    // Python a scurs „x-vercel-internal-timing…" in corpul JSON al raspunsului.
    const e = new SyntaxError(
      "Unexpected token 'x', \"x-vercel-i\"... is not valid JSON",
    );
    expect(classify(e, false)).toBe("badResponse");
  });

  it("badResponse ii spune utilizatorului sa reincerce (a doua oara merge)", () => {
    const f = reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new SyntaxError("Unexpected token 'x' ... is not valid JSON"),
    });
    expect(f.kind).toBe("badResponse");
    expect(f.userMessage).toMatch(/apas[ăa] din nou/i);
    expect(f.userMessage).toContain("E-TRANS-005");
  });
});

describe("reportFailure — mesajul spus utilizatorului", () => {
  it("NU mai da vina pe internet cand nicio cerere n-a plecat", () => {
    const f = reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new TypeError("x.map is not a function"),
    });
    expect(f.kind).toBe("logic");
    // Mesajul vechi era „Traducerea a eșuat. Verifică internetul…" — ACUZA
    // internetul. Cel nou poate pomeni cuvântul, dar ca să NEGE explicit cauza.
    expect(f.userMessage).not.toMatch(/verific[ăa] internetul/i);
    expect(f.userMessage).toMatch(/nu e o problem[ăa] de internet/i);
    expect(f.userMessage).toMatch(/în aplicație/i);
  });

  it("(1b) codul e VIZIBIL in mesaj — Cristina il citeste la telefon", () => {
    const f = reportFailure({
      code: "E-CHAT-001",
      flow: "chat.send",
      error: new Error("niciun provider"),
    });
    expect(f.userMessage).toContain("E-CHAT-001");
  });

  it("pe anulare nu lipim cod (nu e o defectiune)", () => {
    const e = new Error("aborted");
    e.name = "AbortError";
    const f = reportFailure({ code: "E-EDIT-001", flow: "x", error: e });
    expect(f.userMessage).not.toContain("E-EDIT-001");
  });

  it("userHint tine locul mesajului derivat, dar codul ramane", () => {
    const f = reportFailure({
      code: "E-TEST-001",
      flow: "teste.generate",
      error: new Error("boom"),
      userHint: "Generarea testului nu a reusit.",
    });
    expect(f.userMessage).toBe(
      "Generarea testului nu a reusit. (cod E-TEST-001)",
    );
  });
});

describe("reportFailure — ce ajunge in log", () => {
  it("REGRESIA CHEIE: nivel `error` cu cod (nu `action` fara cod)", () => {
    reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new Error("nod necunoscut: table"),
      context: { to: "sk" },
    });
    expect(mockedLogError).toHaveBeenCalledTimes(1);
    const [message, opts] = mockedLogError.mock.calls[0];
    expect(message).toContain("editor.translate");
    expect(message).toContain("nod necunoscut: table");
    expect(opts?.errorCode).toBe("E-TRANS-005");
    expect(opts?.source).toBe("editor.translate");
    // cauza reală, nu un text hardcodat
    expect(opts?.context?.cause).toBe("nod necunoscut: table");
    expect(opts?.context?.kind).toBe("logic");
    expect(opts?.context?.to).toBe("sk");
  });

  it("noteaza EXPLICIT ca nicio cerere n-a plecat", () => {
    reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new Error("x"),
    });
    expect(mockedLogError.mock.calls[0][1]?.context?.netCallSeen).toBe(false);
  });

  it("pastreaza stack-ul (inainte era mereu null)", () => {
    reportFailure({
      code: "E-EDIT-001",
      flow: "editor.import",
      error: new Error("crapat"),
    });
    expect(mockedLogError.mock.calls[0][1]?.stack).toBeTruthy();
  });

  it("severity 'warn' merge pe logWarn", () => {
    reportFailure({
      code: "E-VALID-002",
      flow: "x.y",
      error: new Error("scurt"),
      severity: "warn",
    });
    expect(mockedLogWarn).toHaveBeenCalledTimes(1);
    expect(mockedLogError).not.toHaveBeenCalled();
  });

  it("nu arunca niciodata, chiar daca eroarea e un obiect ciudat", () => {
    expect(() =>
      reportFailure({
        code: "E-APP-001",
        flow: "x",
        error: { weird: true },
      }),
    ).not.toThrow();
  });
});

describe("(1c) fragmentul din continutul care a picat", () => {
  it("se taie la lungimea maxima", () => {
    const long = "a".repeat(SAMPLE_MAX + 200);
    const s = toSample(long);
    expect(s!.length).toBe(SAMPLE_MAX + 1); // + elipsa
    expect(s!.endsWith("…")).toBe(true);
  });

  it("normalizeaza spatiile (un rand in log, nu 40)", () => {
    expect(toSample("  a \n\n  b\t c ")).toBe("a b c");
  });

  it("accepta si obiecte (document TipTap serializat)", () => {
    expect(toSample({ type: "doc" })).toBe('{"type":"doc"}');
  });

  it("ajunge in context cand e dat", () => {
    reportFailure({
      code: "E-CONV-001",
      flow: "convertor.convert",
      error: new Error("x"),
      sample: "fisier.docx (application/vnd...)",
    });
    expect(mockedLogError.mock.calls[0][1]?.context?.sample).toContain(
      "fisier.docx",
    );
  });

  it("LIPSESTE cand fluxul atinge lucrarea unui elev (exceptie deliberata)", () => {
    reportFailure({
      code: "E-TEST-002",
      flow: "teste.correct",
      error: new Error("x"),
      context: { textLen: 812, hasMath: true },
      // fara `sample` — vezi E-TEST-002 in catalog
    });
    const ctx = mockedLogError.mock.calls[0][1]?.context;
    expect(ctx?.sample).toBeUndefined();
    expect(ctx?.textLen).toBe(812);
  });
});

describe("anti-dublura — suprima zgomotul, NU click-urile reale", () => {
  it("acelasi esec in acelasi tick se logheaza o data (StrictMode)", () => {
    const opts = {
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new Error("identic"),
    };
    reportFailure(opts);
    reportFailure(opts);
    expect(mockedLogError).toHaveBeenCalledTimes(1);
  });

  it("REGRESIA CHEIE: 3 click-uri la distanta reala = 3 randuri in log", () => {
    jest.useFakeTimers();
    try {
      const opts = {
        code: "E-TRANS-005",
        flow: "editor.translate",
        error: new Error("identic"),
      };
      reportFailure(opts);
      jest.advanceTimersByTime(2500);
      reportFailure(opts);
      jest.advanceTimersByTime(2500);
      reportFailure(opts);
      expect(mockedLogError).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it("cauze diferite = randuri diferite, chiar imediat", () => {
    reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new Error("cauza A"),
    });
    reportFailure({
      code: "E-TRANS-005",
      flow: "editor.translate",
      error: new Error("cauza B"),
    });
    expect(mockedLogError).toHaveBeenCalledTimes(2);
  });
});

describe("classifyFailure — folosit pt a alege codul corect", () => {
  it("fara apel de retea cazut, o eroare de cod ramane 'logic'", () => {
    expect(classifyFailure(new Error("bug intern"))).toBe("logic");
  });
});
