# -*- coding: utf-8 -*-
import fitz
import re
import sys
import os
sys.stdout.reconfigure(encoding="utf-8")
F = r"C:\Proiecte\Traduceri_Matematica\99_Roland_Work\Carti_descarcate_EDU"
KEYS = r"(?:Editura|EDITURA|Copyright|©|Grup Media|CD PRESS|Art Klett|Klett|Corint|Intuitext|Sigma|SIGMA|Litera|Booklet|ISBN)"
for fn in ["A1260.pdf", "A1740.pdf"]:
    d = fitz.open(os.path.join(F, fn))
    print("==== " + fn + " ====")
    for p in range(min(10, d.page_count)):
        t = d[p].get_text()
        for m in re.findall(r".{0,30}" + KEYS + r".{0,55}", t):
            print(f"  p{p+1}: " + m.strip().replace("\n", " "))
    d.close()
