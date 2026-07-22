/* render.js — compunere document de print (§9) + suprafață de print CURATĂ.
 *
 * Print-ul NU se face din iframe-ul modulului (window.print() din iframe e
 * inconsistent cross-browser — poate prinde shell-ul gazdă). În schimb, deschidem
 * o FEREASTRĂ nouă cu documentul A4 self-contained și tipărim de-acolo, unde
 * `@media print` + ascunderea paginilor de răspuns se aplică fără chrome-ul gazdei.
 *
 * `printDocument({title, css, puzzlePages, answerPages})` → HTML complet:
 *   toate paginile-puzzle, apoi toate paginile-răspuns (răspunsurile = .pagina-raspuns,
 *   ascunse automat la print). Ordinea = randeaza() din Python.
 */
(function (root) {
  "use strict";

  function printDocument(opts) {
    var title = opts.title || "Planșe";
    var css = opts.css || "";
    var puzzle = opts.puzzlePages || [];
    var answer = opts.answerPages || [];
    return (
      '<!doctype html>\n<html lang="ro">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      "<title>" +
      title +
      "</title>\n<style>\n" +
      css +
      "\n</style>\n</head>\n<body>\n\n" +
      puzzle.join("\n") +
      "\n\n" +
      answer.join("\n") +
      "\n\n</body>\n</html>"
    );
  }

  // Deschide documentul într-o fereastră nouă și declanșează print după load.
  // Returnează fereastra (sau null dacă blocată de popup-blocker → caller face fallback).
  function openPrintWindow(html) {
    var w = window.open("", "_blank");
    if (!w) return null;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // print după ce s-a randat (fonturi/layout). onload uneori nu se declanșează
    // pe document.write → folosim un mic delay ca plasă de siguranță.
    var printed = false;
    function doPrint() {
      if (printed) return;
      printed = true;
      try {
        w.focus();
        w.print();
      } catch (e) {
        /* utilizatorul poate tipări manual din fereastră */
      }
    }
    w.onload = doPrint;
    setTimeout(doPrint, 400);
    return w;
  }

  root.PlanseRender = {
    printDocument: printDocument,
    openPrintWindow: openPrintWindow,
  };
})(typeof window !== "undefined" ? window : globalThis);
