import {
  fileListSample,
  redactFileListSample,
  redactLogContext,
} from "./log-redact";

describe("redactLogContext — fără nume de documente/fișiere în Supabase", () => {
  it("elimină titlul documentului de la editor:export, păstrează restul", () => {
    expect(
      redactLogContext({
        format: "pdf",
        name: "Lucrare Popescu Ion",
        hasTable: true,
      }),
    ).toEqual({ format: "pdf", hasTable: true });
  });

  it("elimină docName (autosave) și filename (import)", () => {
    expect(
      redactLogContext({
        htmlLen: 4939603,
        docName: "Document",
        quotaLikely: true,
      }),
    ).toEqual({ htmlLen: 4939603, quotaLikely: true });
    expect(
      redactLogContext({ files: 1, filename: "elev.jpg", sizeKb: 812 }),
    ).toEqual({ files: 1, sizeKb: 812 });
  });

  it("elimină fileNames + outputFile (Convertor), păstrează dimensiunile", () => {
    expect(
      redactLogContext({
        operation: "convert",
        fileNames: ["a.docx", "b.docx"],
        fileSizes: [10, 20],
        outputFile: "a.pdf",
      }),
    ).toEqual({ operation: "convert", fileSizes: [10, 20] });
  });

  it("păstrează `name` când e clasa unei erori (context de diagnostic)", () => {
    expect(
      redactLogContext({ name: "TypeError", message: "x", elapsed_ms: 3 }),
    ).toEqual({ name: "TypeError", message: "x", elapsed_ms: 3 });
    expect(redactLogContext({ name: "Error" })).toEqual({ name: "Error" });
  });

  it("sample = lista fișierelor (import Editor / Convertor) → doar extensii + tip", () => {
    expect(
      redactLogContext({
        flow: "editor.import",
        sample: "Lucrare Popescu.pdf (application/pdf), poza elev (?)",
        sizeKb: 812,
      }),
    ).toEqual({
      flow: "editor.import",
      sample: ".pdf (application/pdf), ? (?)",
      sizeKb: 812,
    });
    expect(
      redactLogContext({
        flow: "convertor.convert",
        sample: "CARACTERIZARE ANGAJAT.docx (application/vnd.openxmlformats)",
      }),
    ).toEqual({
      flow: "convertor.convert",
      sample: ".docx (application/vnd.openxmlformats)",
    });
  });

  it("sample din alte fluxuri (fragment de răspuns) rămâne neatins", () => {
    const ctx = {
      flow: "editor.deeplQuota",
      sample: "x-vercel-internal-timing: bootstrap;dur=154 (a), b",
    };
    expect(redactLogContext(ctx)).toEqual(ctx);
  });

  it("fileListSample la sursă e idempotent față de redactarea de pe server", () => {
    const s = fileListSample([
      { name: "Ionescu Maria - teza.PDF", type: "application/pdf" },
      { name: "fara extensie", type: "" },
    ]);
    expect(s).toBe(".pdf (application/pdf), ? (?)");
    expect(redactFileListSample(s)).toBe(s);
  });

  it("lasă neatinse valorile care nu sunt obiecte simple", () => {
    expect(redactLogContext(null)).toBeNull();
    expect(redactLogContext(undefined)).toBeUndefined();
    expect(redactLogContext("text")).toBe("text");
    expect(redactLogContext([1, 2])).toEqual([1, 2]);
  });
});
