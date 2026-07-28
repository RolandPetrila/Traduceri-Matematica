# -*- coding: utf-8 -*-
"""Extract real table-of-contents from each EDU manual -> scratchpad/toc_<code>.txt.
Strategy: pdftotext -layout on FRONT (1..18) and BACK (last 16) page ranges (fast, compiled),
split on form-feed, score each page by dot-leader/page-number density, keep TOC pages only.
Normalize legacy CP-mislabel mojibake for 2006-2007 SIGMA/Carminis books."""
import subprocess
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
F = r"C:\Proiecte\Traduceri_Matematica\99_Roland_Work\Carti_descarcate_EDU"
OUTDIR = r"C:\Proiecte\Traduceri_Matematica\scratchpad"

INFO = {  # code: (class, editura, pages)
    "A1254": ("V", "Booklet", 196), "A1259": ("V", "Litera", 244), "A1260": ("V", "Art Klett", 244),
    "A1497": ("VI", "Booklet", 228), "A1498": ("VI", "Litera", 228),
    "A1739": ("VII", "Booklet", 228), "A1740": ("VII", "Art Klett", 228), "A1742": ("VII", "Litera", 228),
    "A1983": ("VIII", "Booklet", 228),
    "A178": ("XI", "SIGMA M1", 242), "A196": ("XI", "Carminis", 336),
    "A197": ("XII", "Carminis M1", 328), "A264": ("XII", "SIGMA M1", 250),
}
LEGACY = {"A178", "A196", "A197", "A264"}
MOJI = {"ã": "ă", "Ã": "Ă", "º": "ș", "ª": "Ș", "þ": "ț", "Þ": "Ț"}

def demoji(s):
    for a, b in MOJI.items():
        s = s.replace(a, b)
    return s

def pdftotext(path, f, l):
    r = subprocess.run(["pdftotext", "-layout", "-f", str(f), "-l", str(l), path, "-"],
                       capture_output=True)
    return r.stdout.decode("utf-8", errors="replace")

def toc_score(page):
    # dot-leader TOC entries: "Title ...... 42"
    dl = len(re.findall(r"\.{3,}\s*\d{1,3}", page))
    # lines ending with a page number (no dot leaders, e.g. tabbed TOC)
    ends = len(re.findall(r"^\s*\S.{2,}?\s+\d{1,3}\s*$", page, re.MULTILINE))
    heading = 1 if re.search(r"^\s*cuprins\s*$", page, re.IGNORECASE | re.MULTILINE) else 0
    return dl, ends, heading

for code, (cls, ed, n) in INFO.items():
    ranges = [(1, min(18, n)), (max(1, n - 15), n)]
    pages = []  # (globalpageno, text, dl, ends, heading)
    seen = set()
    base = 0
    for (f, l) in ranges:
        txt = pdftotext(os.path.join(F, code + ".pdf"), f, l)
        parts = txt.split("\f")
        for i, pg in enumerate(parts):
            gp = f + i
            if gp in seen or gp > n:
                continue
            seen.add(gp)
            if code in LEGACY:
                pg = demoji(pg)
            dl, ends, heading = toc_score(pg)
            pages.append((gp, pg, dl, ends, heading))
    # select TOC pages: strong dot-leader density, OR heading page, OR high trailing-number density
    toc_pages = [p for p in pages if p[2] >= 5 or (p[4] and p[3] >= 5) or p[3] >= 12]
    toc_pages.sort(key=lambda x: x[0])
    lines = [f"# {code} | clasa {cls} | {ed} | {n} pagini",
             f"# selected TOC pages: {[p[0] for p in toc_pages]}", ""]
    for gp, pg, dl, ends, heading in toc_pages:
        clean = re.sub(r"[ \t]+", " ", pg)
        clean = re.sub(r"\n{2,}", "\n", clean).strip()
        lines.append(f"----- PAGE {gp} (dotleaders={dl}, endnum={ends}) -----")
        lines.append(clean)
        lines.append("")
    with open(os.path.join(OUTDIR, f"toc_{code}.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"{code}: {cls:4} {ed:12} TOC pages {[p[0] for p in toc_pages]}", flush=True)
print("DONE")
