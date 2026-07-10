/**
 * Insert the translation-engine marker into an export base filename:
 * `D` for DeepL, `G` for Gemini (any non-"deepl" engine). Matches the
 * test-output convention where a leading numeric prefix (e.g. "1.0_", "2.1_")
 * keeps its place and the marker goes right after it; without such a prefix the
 * marker is prepended.
 *
 *   markEngine("1.0_Analyse CettaClear 2026", "deepl") -> "1.0_D_Analyse CettaClear 2026"
 *   markEngine("2.1_romana", "gemini")                 -> "2.1_G_romana"
 *   markEngine("raport", "deepl")                      -> "D_raport"
 *
 * Note: the browser controls the download FOLDER (not the app) and appends
 * " (1)", " (2)" to same-named files automatically — this helper only shapes the
 * base name.
 */
export function markEngine(base: string, engine: string): string {
  const marker = engine === "deepl" ? "D" : "G";
  const prefix = base.match(/^(\d+(?:\.\d+)*_)/);
  return prefix
    ? `${prefix[1]}${marker}_${base.slice(prefix[1].length)}`
    : `${marker}_${base}`;
}
