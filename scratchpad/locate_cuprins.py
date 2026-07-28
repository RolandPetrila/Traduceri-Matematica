# -*- coding: utf-8 -*-
"""Locate the real 'Cuprins' TOC heading page(s) in each manual (whole-book pdftotext scan)."""
import subprocess
import os
import re
import sys
sys.stdout.reconfigure(encoding="utf-8")
F = r"C:\Proiecte\Traduceri_Matematica\99_Roland_Work\Carti_descarcate_EDU"
CODES = ["A1254","A1259","A1260","A1497","A1498","A1739","A1740","A1742","A1983","A178","A196","A197","A264"]

for code in CODES:
    txt = subprocess.run(["pdftotext","-layout",os.path.join(F,code+".pdf"),"-"],
                         capture_output=True).stdout.decode("utf-8", errors="replace")
    pages = txt.split("\f")
    heading = []   # pages where a standalone CUPRINS heading line appears
    dense = []     # pages with many dot-leader entries
    for i, pg in enumerate(pages):
        if re.search(r"^\s*cuprins\s*$", pg, re.IGNORECASE | re.MULTILINE):
            heading.append(i+1)
        dl = len(re.findall(r"\.{3,}\s*\d{1,3}", pg))
        if dl >= 6:
            dense.append((i+1, dl))
    print(f"{code:6} pages={len(pages):4} | CUPRINS-heading={heading} | dotleader-dense={dense}", flush=True)
