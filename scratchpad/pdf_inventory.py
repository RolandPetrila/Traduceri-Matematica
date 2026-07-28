# -*- coding: utf-8 -*-
"""Inventory the official EDU math textbooks: page count, embedded TOC, cover text, locate 'Cuprins'."""
import fitz  # PyMuPDF
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
FOLDER = r"C:\Proiecte\Traduceri_Matematica\99_Roland_Work\Carti_descarcate_EDU"
OUT = r"C:\Proiecte\Traduceri_Matematica\scratchpad\pdf_inventory_out.txt"

buf = []
def emit(s=""):
    print(s, flush=True)
    buf.append(s)

files = sorted([f for f in os.listdir(FOLDER) if f.lower().endswith(".pdf")])
for fn in files:
    path = os.path.join(FOLDER, fn)
    doc = fitz.open(path)
    n = doc.page_count
    meta = doc.metadata or {}
    emit("=" * 70)
    emit(f"FILE: {fn}  | pages: {n}")
    emit(f"  meta.title  : {meta.get('title','')!r}")
    emit(f"  meta.author : {meta.get('author','')!r}")
    emit(f"  meta.subject: {meta.get('subject','')!r}")
    toc = doc.get_toc()
    emit(f"  embedded_bookmarks: {len(toc)}")
    cover = ""
    for p in range(min(4, n)):
        cover += doc[p].get_text() + "\n"
    cover = re.sub(r"[ \t]+", " ", cover)
    cover = re.sub(r"\n{2,}", "\n", cover).strip()
    midtext = doc[n // 2].get_text().strip()
    emit(f"  text_layer_midpage_chars: {len(midtext)}")
    emit("  --- COVER (first 4 pages, up to 1100 chars) ---")
    emit("  " + cover[:1100].replace("\n", "\n  "))
    # Cuprins only in first 60 pages (front matter) -- TOC is always near front
    cuprins_pages = []
    for p in range(min(60, n)):
        if re.search(r"cuprins", doc[p].get_text(), re.IGNORECASE):
            cuprins_pages.append(p + 1)
    emit(f"  CUPRINS pages in first 60 (1-indexed): {cuprins_pages}")
    doc.close()

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(buf))
emit("\nWROTE: " + OUT)
