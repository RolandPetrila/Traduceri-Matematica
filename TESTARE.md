# TESTARE — Sistem Traduceri Matematica
# Actualizat: 2026-03-23

---

## URL-uri LIVE

| Pagina | URL |
|--------|-----|
| Pagina principala | https://traduceri-matematica-7sh7.onrender.com |
| Tab Traduceri | https://traduceri-matematica-7sh7.onrender.com/traduceri |
| Tab Convertor | https://traduceri-matematica-7sh7.onrender.com/convertor |
| Diagnosticare erori | https://traduceri-matematica-7sh7.onrender.com/diagnostics |
| Python API Health | https://traduceri-matematica-7sh7.onrender.com/api/health |

## URL-uri LOCAL (dev)

| Serviciu | URL | Comanda pornire |
|----------|-----|-----------------|
| Frontend | http://localhost:3000 | `cd frontend && npx next dev --port 3000` |
| Backend API | http://localhost:8000 | `cd backend && python -m uvicorn app.main:app --reload --port 8000` |
| Swagger Docs | http://localhost:8000/docs | (se porneste cu backend-ul) |

---

## CHECKLIST TESTARE — Device-uri

### Laptop (Windows)
- [ ] Pagina principala se incarca cu tema verde (tabla + creta)
- [ ] Tab-urile Traduceri / Convertor functioneaza (click navigheaza corect)
- [ ] Dropdown limbi (RO -> SK / EN) se afiseaza si se poate schimba
- [ ] Upload fisier: drag & drop zona apare si accepta fisiere
- [ ] Upload fisier: click pe zona deschide file picker
- [ ] Preview panel: side-by-side original vs tradus se vede
- [ ] Bara progres apare in timpul traducerii
- [ ] Pagina /diagnostics se incarca si arata "Niciun log inregistrat"
- [ ] /api/health returneaza JSON cu status "ok"
- [ ] PWA: Chrome arata optiune "Install" in bara de adrese

### Android (telefon)
- [ ] Pagina se incarca responsive (nu se taie, nu overflow)
- [ ] Tab-urile sunt accesibile (touch functioneaza)
- [ ] Upload: butonul de upload deschide camera sau galeria
- [ ] Dropdown limbi functioneaza pe touch
- [ ] PWA: apare banner "Adauga pe ecranul principal"
- [ ] Dupa instalare PWA: se deschide standalone (fara bara browser)
- [ ] Pagina /diagnostics accesibila

### iPhone (Safari)
- [ ] Pagina se incarca responsive
- [ ] Tab-uri si butoane functioneaza pe touch
- [ ] Upload: deschide camera sau fisiere
- [ ] PWA: Share -> "Add to Home Screen" functioneaza
- [ ] Dupa instalare: se deschide standalone
- [ ] Pagina /diagnostics accesibila

---

## TEST TRADUCERE (end-to-end)

### Pas cu pas
1. Deschide tab-ul Traduceri
2. Selecteaza limba sursa: RO, limba tinta: SK
3. Incarca o poza cu pagina de manual de matematica
4. Apasa butonul de traducere
5. Asteapta procesarea (bara de progres)
6. Verifica rezultatul:

### Ce trebuie sa fie corect
- [ ] Textul romanesc e extras corect din imagine (OCR)
- [ ] Formulele LaTeX sunt pastrate ($...$, $$...$$)
- [ ] Figurile geometrice sunt prezente (SVG sau referinta)
- [ ] Traducerea in slovaca e corecta (terminologie matematica)
- [ ] Diacriticele slovace sunt corecte (a, c, d, e, i, l, n, o, r, s, t, u, y, z)
- [ ] Layout-ul respecta ordinea originala (text, figura, text)
- [ ] HTML-ul generat se poate printa pe A4

### Poze de test (din proiectul original)
Locatie: `C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex\input\photos\`

---

## TEST CONVERTOR

- [ ] PDF -> DOCX: incarca PDF, primeste DOCX
- [ ] IMG -> PDF: incarca imagine, primeste PDF
- [ ] Merge: incarca 2+ PDF, primeste PDF combinat
- [ ] Split: incarca PDF multi-pagina, primeste pagini separate
- [ ] Compress: incarca PDF, primeste PDF mai mic

---

## MONITORIZARE ERORI

### Cum functioneaza
1. Orice eroare client-side (React crash, API fail, unhandled error) se logheaza automat
2. Logurile se salveaza in `data/logs/errors_YYYY-MM-DD.jsonl`
3. Pagina /diagnostics afiseaza ultimele 100 de loguri din ultimele 3 zile
4. Fiecare log contine: device (laptop/Android/iPhone), browser, OS, pagina, stack trace

### Cum citesti logurile (pentru Claude Code)
```bash
# Ultimele 10 erori
cat data/logs/errors_2026-03-23.jsonl | tail -10

# Toate erorile de pe Android
cat data/logs/errors_*.jsonl | grep '"type":"mobile"'

# Toate erorile de tip "error" (nu warn/info)
cat data/logs/errors_*.jsonl | grep '"level":"error"'
```

### Ce face Claude Code cu logurile
Cand Roland raporteaza o eroare:
1. Citeste fisierele din data/logs/
2. Identifica eroarea dupa timestamp, device, si mesaj
3. Analizeaza stack trace-ul
4. Propune fix direct pe codul afectat

---

## DACA CEVA NU MERGE

| Simptom | Cauza probabila | Fix rapid |
|---------|-----------------|-----------|
| Pagina alba | Build esuat pe Render | Verifica Render dashboard > Deployments |
| Eroare 503 la traducere | Backend/Python function down | Verifica /api/health |
| "Backend unavailable" | BACKEND_URL gresit sau backend oprit | Local: porneste uvicorn |
| Traducere gresita | Prompt AI suboptimal | Ajusteaza prompt in gemini.py |
| Figuri lipsa | SVG nu a fost generat de OCR | Verifica prompt OCR in gemini.py |
| LaTeX rupt | Placeholders nu au fost restaurati | Verifica math_protect.py |
| PWA nu se instaleaza | manifest.json sau HTTPS lipsa | Render = HTTPS automat |
| Erori nu apar in /diagnostics | API /api/logs nu scrie | Verifica permisiuni data/logs/ |
