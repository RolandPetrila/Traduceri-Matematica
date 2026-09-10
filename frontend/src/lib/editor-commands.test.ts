/**
 * Faza 4.5a — riscul „→ Editor" (no-op tăcut la inserare cross-tab).
 *
 * Înainte: dacă `EditorTiptap` nu se înregistrase încă la momentul apelului,
 * `insertEditorText`/`insertEditorImage` renunțau tăcut (`fn?.(...)`) — conținutul
 * dispărea fără eroare, fără log. Acum apelul intră într-o coadă care se golește
 * la înregistrare, sau raportează vizibil (E-EDIT-004) dacă editorul nu se
 * montează în fereastra de așteptare.
 */

jest.mock("./failure", () => ({ reportFailure: jest.fn() }));
import { reportFailure } from "./failure";
import {
  setEditorTextInserter,
  insertEditorText,
  setEditorImageInserter,
  insertEditorImage,
} from "./editor-commands";

describe("editor-commands — coada defensivă de inserare", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (reportFailure as jest.Mock).mockClear();
    // curăță orice handler rămas din alt test
    setEditorTextInserter(null);
    setEditorImageInserter(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("text: apel cu inserter deja înregistrat se aplică imediat, fără coadă", () => {
    const fn = jest.fn();
    setEditorTextInserter(fn);
    insertEditorText("salut");
    expect(fn).toHaveBeenCalledWith("salut");
    jest.advanceTimersByTime(10_000);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("text: apel ÎNAINTE de înregistrare se golește la înregistrare (nu se pierde)", () => {
    insertEditorText("test generat");
    const fn = jest.fn();
    setEditorTextInserter(fn);
    expect(fn).toHaveBeenCalledWith("test generat");
    jest.advanceTimersByTime(10_000);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("text: dacă editorul nu se montează niciodată, raportează E-EDIT-004 vizibil", () => {
    insertEditorText("pierdut?");
    jest.advanceTimersByTime(4000);
    expect(reportFailure).toHaveBeenCalledTimes(1);
    expect(reportFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "E-EDIT-004",
        flow: "editor.insert.text",
      }),
    );
    // dacă editorul se montează abia acum, itemul expirat NU mai apare
    const fn = jest.fn();
    setEditorTextInserter(fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it("imagine: apel ÎNAINTE de înregistrare se golește la înregistrare", () => {
    insertEditorImage("data:image/svg+xml,...", "desen");
    const fn = jest.fn();
    setEditorImageInserter(fn);
    expect(fn).toHaveBeenCalledWith("data:image/svg+xml,...", "desen");
    jest.advanceTimersByTime(10_000);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("imagine: dacă editorul nu se montează niciodată, raportează E-EDIT-004 vizibil", () => {
    insertEditorImage("data:image/png,...", "grafic");
    jest.advanceTimersByTime(4000);
    expect(reportFailure).toHaveBeenCalledTimes(1);
    expect(reportFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "E-EDIT-004",
        flow: "editor.insert.image",
      }),
    );
  });
});
