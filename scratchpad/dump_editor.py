# -*- coding: utf-8 -*-
"""Dump math-data.json grouped by class -> readable file for the audit."""
import json
import sys
sys.stdout.reconfigure(encoding="utf-8")
P = r"C:\Proiecte\Traduceri_Matematica\frontend\src\components\editor\math-data.json"
OUT = r"C:\Proiecte\Traduceri_Matematica\scratchpad\editor_dump.txt"
data = json.load(open(P, encoding="utf-8"))
formule = data["formule"]
lines = []
total = 0
for cls in sorted(formule.keys(), key=lambda x: int(x)):
    items = formule[cls]
    total += len(items)
    # group by grup preserving order
    groups = {}
    for f in items:
        groups.setdefault(f["grup"], []).append(f)
    lines.append(f"\n===== CLASA {cls}  ({len(items)} formule, {len(groups)} grupuri) =====")
    for g, fs in groups.items():
        lines.append(f"  [{g}] ({len(fs)})")
        for f in fs:
            latex = f.get("latex", "")
            lines.append(f"    - {f['nume']}  |  latex: {latex}")
open(OUT, "w", encoding="utf-8").write(f"TOTAL formule: {total}\n" + "\n".join(lines))
print(f"TOTAL {total} formule; per clasa:", {c: len(formule[c]) for c in sorted(formule, key=lambda x:int(x))})
print("WROTE", OUT)
