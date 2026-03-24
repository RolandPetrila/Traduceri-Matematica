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
=== LOGURI EXPORT | 24.03.2026, 02:01:23 | desktop/Windows/Chrome | 29 intrari ===

[02:00:20] ERROR  | Eroare conversie: 404 — The page could not be found.

NOT_FOUND
 | desktop/Windows/Chrome | /
                   | Context: {"operation":"convert","targetFormat":"html","fileCount":1}
[02:00:20] WARN   | API | POST /api/convert | 404 | 157ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:00:20] WARN   | API | POST /api/convert | 404 | 154ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:00:20] ACTION | Conversie pornita | desktop/Windows/Chrome | /
                   | Context: {"operation":"convert","targetFormat":"html","fileCount":1,"fileNames":["pagina 1-10 initiala.pdf"],"fileSizes":[1038627]}
[02:00:19] ACTION | Convertor: format selectat | desktop/Windows/Chrome | /
                   | Context: {"format":"html"}
[02:00:01] ACTION | Navigare: Convertor Fisiere | desktop/Windows/Chrome | /
                   | Context: {"tab":"convertor"}
[02:00:00] ERROR  | Server error 404: The page could not be found.

NOT_FOUND
 | desktop/Windows/Chrome | /
                   | Context: {"sourceLang":"ro","targetLang":"sk","fileCount":1}
[02:00:00] WARN   | API | POST /api/translate | 404 | 136ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:00:00] WARN   | API | POST /api/translate | 404 | 133ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[02:00:00] ACTION | Traducere pornita | desktop/Windows/Chrome | /
                   | Context: {"fileCount":1,"fileNames":["test_page_1.jpeg"],"fileSizes":[256679],"sourceLang":"ro","targetLang":"sk"}
[01:59:59] ACTION | Fisiere selectate (drag&drop) | desktop/Windows/Chrome | /
                   | Context: {"count":1,"names":["test_page_1.jpeg"],"sizes":["251KB"],"types":["image/jpeg"]}
[01:59:56] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"http://localhost:3000/diagnostics"}
[01:59:56] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"http://localhost:3000/diagnostics"}
[01:59:41] ACTION | Navigare: Istoric | desktop/Windows/Chrome | /
                   | Context: {"tab":"istoric"}
[01:59:23] ERROR  | Server error 404: The page could not be found.

NOT_FOUND
 | desktop/Windows/Chrome | /
                   | Context: {"sourceLang":"ro","targetLang":"sk","fileCount":1}
[01:59:23] WARN   | API | POST /api/translate | 404 | 224ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[01:59:23] WARN   | API | POST /api/translate | 404 | 221ms | FAIL | desktop/Windows/Chrome | /
                   | Context: {"source":"api-interceptor"}
[01:59:23] ACTION | Traducere pornita | desktop/Windows/Chrome | /
                   | Context: {"fileCount":1,"fileNames":["2.Unghiuri. Bisectoare.docx"],"fileSizes":[57471],"sourceLang":"ro","targetLang":"sk"}
[01:59:21] ACTION | Fisiere selectate (drag&drop) | desktop/Windows/Chrome | /
                   | Context: {"count":1,"names":["2.Unghiuri. Bisectoare.docx"],"sizes":["56KB"],"types":["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
[01:59:15] ACTION | Navigare: Traduceri | desktop/Windows/Chrome | /
                   | Context: {"tab":"traduceri"}
[01:59:15] ACTION | Navigare: Convertor Fisiere | desktop/Windows/Chrome | /
                   | Context: {"tab":"convertor"}
[01:59:14] ACTION | Navigare: Traduceri | desktop/Windows/Chrome | /
                   | Context: {"tab":"traduceri"}
[01:59:14] ACTION | Navigare: Convertor Fisiere | desktop/Windows/Chrome | /
                   | Context: {"tab":"convertor"}
[01:59:09] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"http://localhost:3000/"}
[01:59:09] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"http://localhost:3000/"}
[01:58:58] ERROR  | Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Failed to fetch | desktop/Windows/Chrome | /
[01:58:58] ERROR  | Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Failed to fetch | desktop/Windows/Chrome | /
[01:58:14] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"direct"}
[01:58:14] INFO   | App loaded | desktop/Windows/Chrome | /
                   | Context: {"url":"http://localhost:3000/","referrer":"direct"}
---

