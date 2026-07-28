# -*- coding: utf-8 -*-
"""Extract the EXACT TOC pages per manual (located via CUPRINS heading + dot-leader density)."""
import subprocess
import os
import re
import sys
sys.stdout.reconfigure(encoding="utf-8")
F = r"C:\Proiecte\Traduceri_Matematica\99_Roland_Work\Carti_descarcate_EDU"
OUT = r"C:\Proiecte\Traduceri_Matematica\scratchpad"

# code: (class, editura, (first_page, last_page)) 1-indexed TOC window
JOBS = {
    "A1254": ("V", "Booklet", (5, 8)),
    "A1259": ("V", "Litera", (8, 10)),
    "A1260": ("V", "Art Klett", (68, 71)),
    "A1497": ("VI", "Booklet", (5, 7)),
    "A1498": ("VI", "Litera", (5, 7)),
    "A1739": ("VII", "Booklet", (5, 7)),
    "A1740": ("VII", "Art Klett", (7, 9)),
    "A1742": ("VII", "Litera", (5, 7)),
    "A1983": ("VIII", "Booklet", (5, 7)),
    "A178": ("XI", "SIGMA M1", (241, 243)),
    "A196": ("XI", "Carminis", (335, 337)),
    "A197": ("XII", "Carminis M1", (327, 329)),
    "A264": ("XII", "SIGMA M1", (4, 6)),
}
LEGACY = {"A178", "A196", "A197", "A264"}
MOJI = {"ã": "ă", "Ã": "Ă", "º": "ș", "ª": "Ș", "þ": "ț", "Þ": "Ț"}
def demoji(s):
    for a, b in MOJI.items():
        s = s.replace(a, b)
    return s

for code, (cls, ed, (f, l)) in JOBS.items():
    txt = subprocess.run(
        ["pdftotext", "-layout", "-f", str(f), "-l", str(l), os.path.join(F, code + ".pdf"), "-"],
        capture_output=True).stdout.decode("utf-8", errors="replace")
    if code in LEGACY:
        txt = demoji(txt)
    txt = txt.replace("\f", "\n----\n")
    # tidy: collapse runs of dots, trim trailing spaces
    txt = re.sub(r"\.{3,}", " ... ", txt)
    txt = re.sub(r"[ \t]{2,}", "  ", txt)
    lines = [ln.rstrip() for ln in txt.splitlines() if ln.strip()]
    with open(os.path.join(OUT, f"toc_{code}.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"# {code} | clasa {cls} | {ed} | TOC pages {f}-{l}\n\n" + "\n".join(lines))
    print(f"{code}: {cls} {ed} -> {len(lines)} lines", flush=True)
print("DONE")
