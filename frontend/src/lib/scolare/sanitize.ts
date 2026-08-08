/**
 * Curăță răspunsul AI de „linii de completat" runaway pe care modelul le generează
 * uneori la materiile cu zonă de scriere (Comunicare, Limba Română): șiruri lungi de
 * „_____", „\_\_\_" sau „_ _ _" care ating plafonul de tokeni (fișa se trunchiază,
 * baremul dispare) și umplu previzualizarea cu un zid de sublinieri. DETERMINIST — nu
 * depinde ca modelul să respecte instrucția din prompt (dovedit insuficientă la proba
 * LIVE F3: Limba Română Cl.4 a generat 93.178 de „_" într-un singur șir).
 *
 * Aplicat în ScolarePanel pe răspuns ÎNAINTE de randare / verificare / „în editor" /
 * istoric, deci protejează toate consumatoarele deodată.
 */
export function sanitizeFisa(text: string): string {
  if (!text) return text;
  return (
    text
      // Marcaje de completat repetate (unitatea = „_" opțional prefixat de „\" și
      // urmat de spațiu), de ≥8 ori la rând → un marcaj scurt. Blank-urile scurte
      // (ex. „\_ \_ \_" de 3 unități) rămân neatinse.
      .replace(/(?:\\?_[ \t]?){8,}/g, "______")
      // Alte caractere de umplere repetate absurd (. - · ‾ – —) de ≥10 ori → 6.
      .replace(/([.\-·‾–—])\1{9,}/g, (_m, c: string) => c.repeat(6))
  );
}
