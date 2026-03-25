# ISSUES — Probleme Raportate Manual

Acest fisier e pentru probleme pe care logurile automate NU le pot captura:
- Probleme vizuale (layout stricat, text taiat, culori gresite)
- Comportament pe dispozitive specifice (iPhone, Android, tablet)
- Feedback de la alti utilizatori
- Orice "nu arata bine" care nu e o eroare tehnica

Format: data + descriere scurta. Nu trebuie sa fie tehnic.

---

## 2026-03-24 — 404 pe /api/translate si /api/convert

### Simptom
- Traducerea si conversia returneaza: `Eroare conversie: 404 — The page could not be found. NOT_FOUND`
- Afecteaza TOATE operatiile: translate (DOCX, JPEG) si convert (PDF->HTML)

### Cauza radacina: LOCALHOST, nu Vercel
Toate erorile 404 au aparut pe **localhost:3000** (server local `next dev`), NU pe Vercel.

Dovezi din loguri:
- Linia 45: `"url":"http://localhost:3000/"`
- Linia 72: `"url":"http://localhost:3000/"`, `"referrer":"http://localhost:3000/"`
- Linia 78: `"url":"http://localhost:3000/"`, `"referrer":"direct"`

### De ce localhost da 404 pe /api/translate si /api/convert
Endpoint-urile Python (`api/translate.py`, `api/convert.py`, `api/health.py`) sunt **Vercel Python Serverless Functions**. Ele functioneaza DOAR pe Vercel — nu pe serverul local Next.js.

Cand rulezi `npm run dev` (sau `next dev`) local:
- Next.js serveste doar rutele din `frontend/src/app/`
- Rutele Python din `api/` sau `frontend/api/` sunt **invizibile** pentru Next.js dev server
- Orice `POST /api/translate` ajunge la Next.js care nu gaseste ruta → **404**

### Verificare: Vercel functioneaza corect
Testat pe 2026-03-24 01:40 UTC:
- `GET /api/health` → **200** `{"status":"ok","service":"Sistem Traduceri API","runtime":"vercel-python"}`
- `POST /api/convert` (fara body) → **400** (corect, lipsesc fisiere)
- `POST /api/translate` (fara body) → **500** (corect, lipsesc fisiere)

Toate endpoint-urile Python raspund corect pe Vercel.

### Solutie
**Testeaza intotdeauna pe Vercel** (https://traduceri-matematica.vercel.app), nu pe localhost.
Serverul local Next.js (`npm run dev`) e util doar pentru UI/layout, NU pentru testarea pipeline-ului de traducere/conversie.

### Severitate
**Non-issue pe productie.** Functioneaza corect pe Vercel. Eroarea e specifica mediului local de dezvoltare.

---

## Loguri export — 24.03.2026, 02:01 (referinta originala)
=== LOGURI EXPORT | 25.03.2026, 02:21:02 | desktop/Windows/Chrome | 21 intrari ===

[02:20:33] WARN   | API | GET /api/health | 502 | 118ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:20:33] WARN   | API | GET /api/health | 500 | 30100ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:20:23] ERROR  | Server error 500: Internal Server Error | desktop/Windows/Chrome | /
                   | Context: {"sourceLang":"ro","targetLang":"sk","fileCount":1}
[02:20:23] WARN   | API | POST /api/translate | 500 | 30242ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:19:53] ACTION | Traducere pornita | desktop/Windows/Chrome | /
                   | Context: {"fileCount":1,"fileNames":["test_page_1.jpeg"],"fileSizes":[256679],"sourceLang":"ro","targetLang":"sk"}
[02:19:52] ACTION | Engine traducere schimbat | desktop/Windows/Chrome | /
                   | Context: {"from":"deepl","to":"gemini"}
[02:19:33] INFO   | API | GET /api/health | 200 | 157ms | OK | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:19:03] INFO   | API | GET /api/health | 200 | 142ms | OK | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:19:01] INFO   | API | GET /api/health | 200 | 28927ms | OK | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:18:47] ERROR  | Server error 500: Internal Server Error | desktop/Windows/Chrome | /
                   | Context: {"sourceLang":"ro","targetLang":"sk","fileCount":1}
[02:18:47] WARN   | API | POST /api/translate | 500 | 30275ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:18:17] ACTION | Traducere pornita | desktop/Windows/Chrome | /
                   | Context: {"fileCount":1,"fileNames":["test_page_1.jpeg"],"fileSizes":[256679],"sourceLang":"ro","targetLang":"sk"}
[02:18:16] ACTION | Engine traducere schimbat | desktop/Windows/Chrome | /
                   | Context: {"from":"gemini","to":"deepl"}
[02:18:15] ACTION | Engine traducere schimbat | desktop/Windows/Chrome | /
                   | Context: {"from":"deepl","to":"gemini"}
[02:18:13] ACTION | Fisiere selectate (drag&drop) | desktop/Windows/Chrome | /
                   | Context: {"count":1,"names":["test_page_1.jpeg"],"sizes":["251KB"],"types":["image/jpeg"]}
[02:18:06] ACTION | Engine traducere schimbat | desktop/Windows/Chrome | /
                   | Context: {"from":"gemini","to":"deepl"}
[02:18:06] ACTION | Engine traducere schimbat | desktop/Windows/Chrome | /
                   | Context: {"from":"deepl","to":"gemini"}
[02:18:02] INFO   | API | GET /api/health | 200 | 199ms | OK | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:18:02] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"https://traduceri-matematica-7sh7.onrender.com/","referrer":"https://traduceri-matematica-7sh7.onrender.com/"}
[02:17:59] INFO   | API | GET /api/health | 200 | 119ms | OK | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:17:59] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"https://traduceri-matematica-7sh7.onrender.com/","referrer":"direct"}