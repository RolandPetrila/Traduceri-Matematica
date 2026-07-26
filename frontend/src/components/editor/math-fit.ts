/**
 * Auto-fit pentru formulele KaTeX de pe FOAIE (backlog #2, 2026-07-26).
 *
 * Problema (screenshot 232): o formulă lungă (matrice, sistem, limită cu fracție,
 * proză rătăcită în latex) randează la lățimea ei naturală și IESE din chenarul A4
 * — sparge layout-ul sau curge peste margine.
 *
 * Fix: micșorăm formula (`zoom`) cât să încapă pe lățimea conținutului. Alegem
 * `zoom` (nu `transform: scale`) pentru că `zoom` REFLOWEAZĂ — cutia formulei se
 * micșorează efectiv, deci nu mai împinge lățimea paginii (transform-scale lasă
 * cutia la mărimea naturală → tot ar sparge A4). Chrome/Edge (mediul Cristinei,
 * PWA) și Safari suportă `zoom`, inclusiv la print; Firefox din 2024. Nu mărim
 * niciodată peste 1 și nu coborâm sub MIN_ZOOM (formula rămâne lizibilă).
 *
 * `zoom` e aplicat pe `.katex`. Extensia Mathematics re-randează NodeView-ul la
 * fiecare schimbare → un MutationObserver (doar childList/subtree, NU attributes,
 * ca să nu se bucleze pe propriul `style.zoom`) reaplică fit-ul; plus ResizeObserver
 * pentru redimensionarea foii.
 */

const MIN_ZOOM = 0.4;

/** Micșorează formulele care depășesc lățimea conținutului din `root`. */
export function fitMathIn(root: HTMLElement): void {
  const avail = root.clientWidth;
  if (!avail) return;
  const nodes = root.querySelectorAll<HTMLElement>(
    '[data-type="inline-math"] .katex, [data-type="block-math"] .katex',
  );
  nodes.forEach((el) => {
    // Resetăm ca să măsurăm lățimea NATURALĂ (fără zoom-ul aplicat anterior).
    // NB: `.katex` e element `inline` → `scrollWidth` întoarce 0; folosim
    // `getBoundingClientRect().width` (corect pt inline). După reset `zoom=""`,
    // citirea forțează reflow → valoarea e cea naturală.
    el.style.zoom = "";
    const natural = el.getBoundingClientRect().width;
    if (natural > avail && natural > 0) {
      el.style.zoom = String(Math.max(avail / natural, MIN_ZOOM));
    }
  });
}

/**
 * Instalează auto-fit-ul pe elementul editorului (ProseMirror). Întoarce funcția
 * de curățare. `root` = `editor.view.dom`.
 */
export function installMathAutoFit(root: HTMLElement): () => void {
  let raf = 0;
  const schedule = () => {
    // Debounce: o singură pasă per „liniște" de mutații. Fallback la setTimeout
    // dacă tabul e ascuns (rAF nu rulează în tab de fundal — capcană cunoscută).
    if (raf) return;
    const run = () => {
      raf = 0;
      fitMathIn(root);
    };
    raf = 1;
    if (typeof document !== "undefined" && document.hidden) {
      window.setTimeout(run, 0);
    } else {
      raf = window.requestAnimationFrame(run);
    }
  };

  const mo = new MutationObserver(schedule);
  mo.observe(root, { childList: true, subtree: true });
  const ro = new ResizeObserver(schedule);
  ro.observe(root);

  fitMathIn(root); // pasă inițială

  return () => {
    mo.disconnect();
    ro.disconnect();
    if (raf && raf !== 1) cancelAnimationFrame(raf);
  };
}
