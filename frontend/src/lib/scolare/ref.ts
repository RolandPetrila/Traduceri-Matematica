/**
 * Maparea `regulament_ref` → nume de fișier asset, PARTAJATĂ între aplicație
 * (`ScolarePanel.loadRegulament`) și gate-ul de completitudine
 * (`regulament-files.test.ts`). Era o funcție privată în ScolarePanel — dacă testul
 * și-ar re-implementa maparea, testul ar putea trece în timp ce `fetch`-ul din app
 * dă 404 (drift între mapare și checker). O singură sursă => imposibil să dividă.
 *
 * Ex.: „gimnaziu/clasa-5/matematica" → „gimnaziu_clasa5_matematica.md".
 */
export function refToFile(ref: string): string {
  return ref.replace(/\//g, "_").replace(/clasa-/g, "clasa") + ".md";
}
