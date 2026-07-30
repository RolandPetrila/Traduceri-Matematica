/**
 * R3 — Parser OMML (Office Math Markup Language) → LaTeX. PUR (fără fetch/React/TipTap),
 * primește un `Element` DOM `<m:oMath>` (sau string XML) și întoarce LaTeX curat,
 * unit-testabil în jsdom (DOMParser disponibil). Sursa: matematica nativă din `.docx`
 * (Word/LibreOffice o scriu ca OMML, NU ca imagine) — vezi R3 în `docs/PLAN_MASTER.md`.
 *
 * De ce NU refolosim `parseInlineToNodes` (deviere motivată de la R3.4): acela parsează
 * STRING-ul `$latex$` emis de Gemini (OCR). DOCX-ul poartă matematica STRUCTURAT (noduri
 * OMML), niciodată ca `$…$` în `<w:t>`. Un round-trip prin string ar fabrica exact capcana
 * `$`-injection pe care R3.4 o avertizează. Construim nodul `inlineMath` DIRECT din LaTeX-ul
 * de aici (vezi `docx-to-blocks.ts`), păstrând doar garda „latex gol → text literal".
 *
 * Fidelitate (Roland): ETAPA A = formula apare la locul ei, randabilă KaTeX, editabilă.
 * Capcane acoperite (advisor + verificat la sursă pe fixture-uri reale):
 *  - simboluri Unicode din `<m:t>` (∈ ⊂ ⊄ ∉ ≤ ∪ ∩ ∢ ° ·) → comenzi LaTeX (KaTeX le vrea
 *    explicite; harta e VALIDATĂ în test cu `katex.renderToString`, nu din memorie);
 *  - diacritice RO în interiorul formulei („și") → transliterate ș→s (în `\text{}` NU
 *    randează curat — cf. finding_katex_authoring_pitfalls; declarat onest în raport);
 *  - `<m:d>` cu `begChr`/`endChr` INDEPENDENTE (văzut `{`…`|`) + `sepChr` + N×`<m:e>`;
 *  - `m:scr="double-struck"` aplicat DOAR pe spanul de litere ASCII (`∈N`→`\in\mathbb{N}`,
 *    nu `\mathbb{∈N}`);
 *  - caractere LaTeX-speciale tastate literal (`{ } $ % # & _`) → escapate;
 *  - element OMML necunoscut → recursăm copiii (emit text), NICIODATĂ drop tăcut (raportat).
 */

/** Namespace-ul OMML (informativ — traversăm după `localName`, robust la prefix). */
export const OMML_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/math";

/** Colector pentru elementele OMML necunoscute (→ banner onest R3.5). */
export interface OmmlResult {
  latex: string;
  unknown: string[];
}

/** Simboluri Unicode din `<m:t>` → comenzi LaTeX. Spațiu final = anti-greedy (`\inN`). */
const SYMBOL_MAP: Record<string, string> = {
  "∈": "\\in ",
  "∉": "\\notin ",
  "⊂": "\\subset ",
  "⊃": "\\supset ",
  "⊄": "\\not\\subset ",
  "⊅": "\\not\\supset ",
  "⊆": "\\subseteq ",
  "⊇": "\\supseteq ",
  "⊈": "\\nsubseteq ",
  "∪": "\\cup ",
  "∩": "\\cap ",
  "∅": "\\emptyset ",
  "∖": "\\setminus ",
  "≤": "\\le ",
  "≥": "\\ge ",
  "≠": "\\neq ",
  "≈": "\\approx ",
  "≡": "\\equiv ",
  "±": "\\pm ",
  "∓": "\\mp ",
  "×": "\\times ",
  "÷": "\\div ",
  "·": "\\cdot ",
  "∙": "\\cdot ",
  "°": "^{\\circ}",
  "∞": "\\infty ",
  "→": "\\to ",
  "←": "\\leftarrow ",
  "↔": "\\leftrightarrow ",
  "⇒": "\\Rightarrow ",
  "⇐": "\\Leftarrow ",
  "⇔": "\\Leftrightarrow ",
  "∀": "\\forall ",
  "∃": "\\exists ",
  "∄": "\\nexists ",
  "∠": "\\angle ",
  "∡": "\\measuredangle ",
  "∢": "\\sphericalangle ",
  "⊥": "\\perp ",
  "∥": "\\parallel ",
  "△": "\\triangle ",
  "√": "\\surd ",
  "∆": "\\Delta ",
  "∑": "\\sum ",
  "∏": "\\prod ",
  "∫": "\\int ",
  "⋮": "\\vdots ",
  "…": "\\ldots ",
  "⋅": "\\cdot ",
  "′": "'",
  "″": "''",
  α: "\\alpha ",
  β: "\\beta ",
  γ: "\\gamma ",
  δ: "\\delta ",
  ε: "\\varepsilon ",
  θ: "\\theta ",
  λ: "\\lambda ",
  μ: "\\mu ",
  π: "\\pi ",
  σ: "\\sigma ",
  φ: "\\varphi ",
  ω: "\\omega ",
  Ω: "\\Omega ",
  Σ: "\\Sigma ",
  Π: "\\Pi ",
};

/** Delimitatori `<m:d>` (begChr/endChr) → forma LaTeX pt `\left…\right…`. */
const DELIM_MAP: Record<string, string> = {
  "{": "\\{",
  "}": "\\}",
  "(": "(",
  ")": ")",
  "[": "[",
  "]": "]",
  "|": "|",
  "‖": "\\|",
  "⟨": "\\langle",
  "⟩": "\\rangle",
  "⌊": "\\lfloor",
  "⌋": "\\rfloor",
  "⌈": "\\lceil",
  "⌉": "\\rceil",
  "": ".",
};

/** Char accent combinat (`m:acc`) → comandă LaTeX. */
const ACCENT_MAP: Record<string, string> = {
  "̅": "\\overline", // combining overline
  "¯": "\\overline", // macron
  "̄": "\\bar",
  "̂": "\\hat", // combining circumflex (default OMML)
  "̃": "\\tilde",
  "̇": "\\dot",
  "̈": "\\ddot",
  "⃗": "\\vec", // combining right arrow above
  "→": "\\vec",
  "̀": "\\grave",
  "́": "\\acute",
  "̌": "\\check",
  "̆": "\\breve",
};

/** Operatori n-ari (`m:nary`) → comandă LaTeX (default `\int` per ECMA-376). */
const NARY_MAP: Record<string, string> = {
  "∑": "\\sum",
  "∏": "\\prod",
  "∐": "\\coprod",
  "∫": "\\int",
  "∬": "\\iint",
  "∭": "\\iiint",
  "∮": "\\oint",
  "⋃": "\\bigcup",
  "⋂": "\\bigcap",
  "⋁": "\\bigvee",
  "⋀": "\\bigwedge",
};

/** Escapează caracterele LaTeX-speciale TASTATE literal (ordine: backslash întâi). */
function escapeLiteral(s: string): string {
  return s
    .replace(/\\/g, "\\backslash ")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\$/g, "\\$")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/&/g, "\\&")
    .replace(/_/g, "\\_");
}

/** Transliterează diacriticele RO (nu randează curat în math/\text) → ASCII. */
function translitDiacritics(s: string): string {
  return s.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, (c) => {
    switch (c) {
      case "ă":
      case "â":
        return "a";
      case "î":
        return "i";
      case "ș":
      case "ş":
        return "s";
      case "ț":
      case "ţ":
        return "t";
      case "Ă":
      case "Â":
        return "A";
      case "Î":
        return "I";
      case "Ș":
      case "Ş":
        return "S";
      case "Ț":
      case "Ţ":
        return "T";
      default:
        return c;
    }
  });
}

/** Aplică harta de simboluri Unicode → LaTeX (rulează ULTIMA: nu atinge `\mathbb{}`). */
function mapSymbols(s: string): string {
  let out = "";
  for (const ch of s) out += SYMBOL_MAP[ch] ?? ch;
  return out;
}

/**
 * Textul unui `<m:t>` → LaTeX. `doubleStruck` înfășoară DOAR literele ASCII în `\mathbb{}`
 * (înainte de `mapSymbols`, ca să nu prindă comenzile emise). Ordine fără suprapuneri:
 * escape (ASCII specials) → translit (diacritice) → mathbb (litere ASCII) → simboluri (Unicode).
 */
function textToLatex(raw: string, doubleStruck: boolean): string {
  let t = translitDiacritics(escapeLiteral(raw));
  if (doubleStruck) t = t.replace(/[A-Za-z]+/g, (m) => `\\mathbb{${m}}`);
  return mapSymbols(t);
}

/** Citește un atribut după `localName` (robust la prefix `m:`/`w:`, fără getAttributeNS). */
function attrLocal(el: Element, local: string): string | null {
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (
      a.localName === local ||
      a.name === local ||
      a.name.endsWith(":" + local)
    ) {
      return a.value;
    }
  }
  return null;
}

/** Primul copil-element cu `localName` dat (nu descinde recursiv). */
function child(el: Element, local: string): Element | null {
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName === local) return el.children[i];
  }
  return null;
}

/** Toți copiii-element cu `localName` dat. */
function children(el: Element, local: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName === local) out.push(el.children[i]);
  }
  return out;
}

/** `m:val` de pe primul copil `local` din `pr` (proprietăți), sau null. */
function propVal(pr: Element | null, local: string): string | null {
  if (!pr) return null;
  const c = child(pr, local);
  return c ? attrLocal(c, "val") : null;
}

/** Un run `m:r`: concatenează `<m:t>`, aplică double-struck din `m:rPr/m:scr`. */
function renderRun(el: Element): string {
  const rPr = child(el, "rPr");
  const doubleStruck = propVal(rPr, "scr") === "double-struck";
  let out = "";
  for (const t of children(el, "t")) {
    out += textToLatex(t.textContent ?? "", doubleStruck);
  }
  return out;
}

/** Concatenează render-ul copiilor-element (pt containere: e/num/den/sup/sub/deg/lim…). */
function renderChildren(el: Element, ctx: string[]): string {
  let out = "";
  for (let i = 0; i < el.children.length; i++) {
    out += renderNode(el.children[i], ctx);
  }
  return out;
}

/** Conținutul unui sub-argument (`m:e`, `m:num`…) — gol → `{}` gestionat de apelant. */
function renderArg(el: Element | null, ctx: string[]): string {
  return el ? renderChildren(el, ctx) : "";
}

/** Delimitator LaTeX pt un char (begChr/endChr); null/absent → default furnizat. */
function delim(chr: string | null, dflt: string): string {
  if (chr === null) return dflt;
  if (chr === "") return ".";
  return DELIM_MAP[chr] ?? chr;
}

/**
 * Un nod OMML → LaTeX (recursiv). `ctx` acumulează `localName`-urile necunoscute.
 * Necunoscut ⇒ recursăm copiii (nu pierdem text) + înregistrăm în `ctx` (R3.5).
 */
function renderNode(el: Element, ctx: string[]): string {
  switch (el.localName) {
    // Containere: doar concatenează copiii.
    case "oMath":
    case "oMathPara":
    case "e":
      return renderChildren(el, ctx);

    case "r":
      return renderRun(el);

    case "t":
      return textToLatex(el.textContent ?? "", false);

    // Delimitatori: \left<beg> arg1 [sep arg2 …] \right<end>.
    case "d": {
      const dPr = child(el, "dPr");
      const beg = delim(propVal(dPr, "begChr"), "(");
      const end = delim(propVal(dPr, "endChr"), ")");
      const sepRaw = propVal(dPr, "sepChr");
      const sep = sepRaw === null ? "|" : (DELIM_MAP[sepRaw] ?? sepRaw);
      const args = children(el, "e").map((e) => renderChildren(e, ctx));
      const inner = args.length ? args.join(` ${sep} `) : "";
      return `\\left${beg} ${inner} \\right${end}`;
    }

    // Fracție.
    case "f": {
      const fPr = child(el, "fPr");
      const type = propVal(fPr, "type");
      const num = renderArg(child(el, "num"), ctx);
      const den = renderArg(child(el, "den"), ctx);
      if (type === "lin") return `${num}/${den}`;
      return `\\frac{${num}}{${den}}`;
    }

    // Radical: cu/ fără grad.
    case "rad": {
      const radPr = child(el, "radPr");
      const degHide = propVal(radPr, "degHide") === "1";
      const deg = renderArg(child(el, "deg"), ctx);
      const e = renderArg(child(el, "e"), ctx);
      if (degHide || deg.trim() === "") return `\\sqrt{${e}}`;
      return `\\sqrt[${deg}]{${e}}`;
    }

    // Indici / exponenți.
    case "sSup": {
      const base = renderArg(child(el, "e"), ctx);
      const sup = renderArg(child(el, "sup"), ctx);
      return `{${base}}^{${sup}}`;
    }
    case "sSub": {
      const base = renderArg(child(el, "e"), ctx);
      const sub = renderArg(child(el, "sub"), ctx);
      return `{${base}}_{${sub}}`;
    }
    case "sSubSup": {
      const base = renderArg(child(el, "e"), ctx);
      const sub = renderArg(child(el, "sub"), ctx);
      const sup = renderArg(child(el, "sup"), ctx);
      return `{${base}}_{${sub}}^{${sup}}`;
    }
    case "sPre": {
      // Pre-sub/sup: {}_{sub}^{sup} base.
      const base = renderArg(child(el, "e"), ctx);
      const sub = renderArg(child(el, "sub"), ctx);
      const sup = renderArg(child(el, "sup"), ctx);
      return `{}_{${sub}}^{${sup}}{${base}}`;
    }

    // Operator n-ar (Σ Π ∫ cu limite).
    case "nary": {
      const naryPr = child(el, "naryPr");
      const chr = propVal(naryPr, "chr");
      const op = chr === null ? "\\int" : (NARY_MAP[chr] ?? chr);
      const subHide = propVal(naryPr, "subHide") === "1";
      const supHide = propVal(naryPr, "supHide") === "1";
      const sub = subHide ? "" : renderArg(child(el, "sub"), ctx);
      const sup = supHide ? "" : renderArg(child(el, "sup"), ctx);
      const e = renderArg(child(el, "e"), ctx);
      let out = op;
      if (sub.trim()) out += `_{${sub}}`;
      if (sup.trim()) out += `^{${sup}}`;
      return `${out} ${e}`;
    }

    // Accent (bară, căciulă, vector…).
    case "acc": {
      const accPr = child(el, "accPr");
      const chr = propVal(accPr, "chr") ?? "̂";
      const cmd = ACCENT_MAP[chr] ?? "\\hat";
      return `${cmd}{${renderArg(child(el, "e"), ctx)}}`;
    }

    // Bară deasupra/dedesubt.
    case "bar": {
      const barPr = child(el, "barPr");
      const pos = propVal(barPr, "pos");
      const cmd = pos === "bot" ? "\\underline" : "\\overline";
      return `${cmd}{${renderArg(child(el, "e"), ctx)}}`;
    }

    // Grupare cu acoladă (over/underbrace).
    case "groupChr": {
      const gPr = child(el, "groupChrPr");
      const pos = propVal(gPr, "pos");
      const cmd = pos === "top" ? "\\overbrace" : "\\underbrace";
      return `${cmd}{${renderArg(child(el, "e"), ctx)}}`;
    }

    // Limite sub/deasupra (ex. lim_{x→0}).
    case "limLow": {
      const base = renderArg(child(el, "e"), ctx);
      const lim = renderArg(child(el, "lim"), ctx);
      return `\\underset{${lim}}{${base}}`;
    }
    case "limUpp": {
      const base = renderArg(child(el, "e"), ctx);
      const lim = renderArg(child(el, "lim"), ctx);
      return `\\overset{${lim}}{${base}}`;
    }

    // Funcție (sin, cos, lim…): nume + argument.
    case "func": {
      const name = renderArg(child(el, "fName"), ctx);
      const e = renderArg(child(el, "e"), ctx);
      return `${name} ${e}`;
    }

    // Matrice.
    case "m": {
      const rows = children(el, "mr").map((mr) =>
        children(mr, "e")
          .map((e) => renderChildren(e, ctx))
          .join(" & "),
      );
      return `\\begin{matrix} ${rows.join(" \\\\ ")} \\end{matrix}`;
    }

    // Casetă / box: transparent.
    case "box":
    case "borderBox":
      return renderArg(child(el, "e"), ctx);

    // Matrice de ecuații aliniate.
    case "eqArr": {
      const rows = children(el, "e").map((e) => renderChildren(e, ctx));
      return `\\begin{aligned} ${rows.join(" \\\\ ")} \\end{aligned}`;
    }

    // Proprietăți & control: se ignoră (nu produc conținut).
    case "rPr":
    case "dPr":
    case "fPr":
    case "radPr":
    case "naryPr":
    case "accPr":
    case "barPr":
    case "groupChrPr":
    case "sSupPr":
    case "sSubPr":
    case "sSubSupPr":
    case "sPrePr":
    case "limLowPr":
    case "limUppPr":
    case "funcPr":
    case "mPr":
    case "boxPr":
    case "ctrlPr":
      return "";

    default:
      // Necunoscut → recursăm (nu pierdem text) + raportăm o singură dată.
      if (el.localName && !ctx.includes(el.localName)) ctx.push(el.localName);
      return renderChildren(el, ctx);
  }
}

/** Normalizează spațiile multiple (nu în interiorul comenzilor). */
function tidy(latex: string): string {
  return latex.replace(/[ \t]+/g, " ").trim();
}

/** `<m:oMath>` Element → LaTeX + lista elementelor necunoscute. */
export function ommlElementToLatex(math: Element): OmmlResult {
  const ctx: string[] = [];
  const latex = tidy(renderNode(math, ctx));
  return { latex, unknown: ctx };
}

/**
 * String XML (`<m:oMath>…</m:oMath>`) → LaTeX. Pt unit-teste: înfășoară cu declarațiile
 * de namespace ca prefixul `m:` să fie valid, apoi găsește primul `oMath`.
 */
export function ommlStringToLatex(xml: string): OmmlResult {
  const wrapped =
    `<root xmlns:m="${OMML_NS}" ` +
    `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `${xml}</root>`;
  const doc = new DOMParser().parseFromString(wrapped, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    return { latex: "", unknown: ["parsererror"] };
  }
  const root = doc.documentElement;
  let math: Element | null = null;
  const walk = (el: Element) => {
    if (math) return;
    if (el.localName === "oMath") {
      math = el;
      return;
    }
    for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
  };
  walk(root);
  return math ? ommlElementToLatex(math) : { latex: "", unknown: ["no-oMath"] };
}
