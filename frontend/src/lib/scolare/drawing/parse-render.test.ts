import { renderScolareContent } from "./parse-render";
import { renderMathText } from "@/lib/math-html";

describe("renderScolareContent — regresie 0 pe text fără markere", () => {
  test("text fără [[DESEN]] = byte-identic cu renderMathText (garda celor 112 noduri existente)", () => {
    const t = "**Fișă**\n1. Cât e $2+2$?\n\nBarem\n1. 4";
    expect(renderScolareContent(t)).toBe(renderMathText(t));
  });
});

describe("renderScolareContent — markere valide", () => {
  test("coloreaza: obiect+culoare valide → SVG randat, marker dispărut", () => {
    const t =
      "1. Colorează mărul.\n[[DESEN tip=coloreaza obiect=mar culoare=rosu]]";
    const out = renderScolareContent(t);
    expect(out).not.toContain("[[DESEN");
    expect(out).toContain("<svg");
    expect(out).toContain("#e74c3c");
  });

  test("uneste: forma validă → puncte numerotate", () => {
    const out = renderScolareContent("[[DESEN tip=uneste forma=stea]]");
    expect(out).toContain("<svg");
    expect(out).toContain(">1<");
    expect(out).toContain(">5<");
  });

  test("baloane: listă de culori valide → un card per culoare", () => {
    const out = renderScolareContent(
      "[[DESEN tip=baloane culori=rosu,albastru]]",
    );
    expect((out.match(/<svg/g) || []).length).toBe(2);
    expect(out).toContain("ROSU");
    expect(out).toContain("ALBASTRU");
  });

  test("traseu fără start/final → markere generice, nu crapă", () => {
    const out = renderScolareContent("[[DESEN tip=traseu]]");
    expect(out).toContain("<svg");
  });

  test("simetrie: doar fluture e acceptat", () => {
    expect(
      renderScolareContent("[[DESEN tip=simetrie obiect=fluture]]"),
    ).toContain("<svg");
  });
});

describe("renderScolareContent — fallback pe marker invalid (fără crash)", () => {
  test("obiect necunoscut → fallback la text simplu (escaped), nu crapă", () => {
    const out = renderScolareContent(
      "[[DESEN tip=coloreaza obiect=dinozaur culoare=rosu]]",
    );
    expect(out).toContain("[[DESEN");
    expect(out).not.toContain("<svg");
  });

  test("tip necunoscut → fallback la text", () => {
    const out = renderScolareContent("[[DESEN tip=nu-exista]]");
    expect(out).toContain("[[DESEN");
  });

  test("simetrie cu alt obiect decât fluture → fallback", () => {
    const out = renderScolareContent("[[DESEN tip=simetrie obiect=mar]]");
    expect(out).not.toContain("<svg");
  });

  test("text din jurul markerului tot trece prin escape/KaTeX (nu doar markerul)", () => {
    const t =
      "1. Cât e $2+2$? [[DESEN tip=coloreaza obiect=mar culoare=rosu]] Scrie <b>aici</b>.";
    const out = renderScolareContent(t);
    expect(out).toContain("katex");
    expect(out).toContain("&lt;b&gt;");
    expect(out).not.toContain("<b>aici</b>");
  });
});
