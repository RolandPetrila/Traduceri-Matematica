# FAZA 1 — acoperirea reală (auditabilă, nu declarată)

> 2026-09-08. Varianta aleasă de Roland la punctul **(1a)** a fost „toate fluxurile din toate
> modulele". Acest fișier spune **exact** ce s-a instrumentat și ce **nu**, ca afirmația să
> poată fi verificată de oricine, nu crezută pe cuvânt. (Lecția din 07.09: „toate butoanele
> funcționează" a fost o afirmație neverificabilă — și falsă.)
>
> Cifra brută: `frontend/src/` are **102 blocuri `catch`**. Instrumentate: **21 de puncte de
> eșec de flux**. Restul sunt intenționat fail-open (vezi ultima secțiune) — nu sunt eșecuri
> de flux, ci degradări tăcute acceptabile.

## Fluxuri instrumentate

| #   | Modul     | Flux                                             | Fișier                          | Cod           |
| --- | --------- | ------------------------------------------------ | ------------------------------- | ------------- |
| 1   | Editor    | Traducere F8 (eșec în browser)                   | `editor-translate-state.tsx`    | `E-TRANS-005` |
| 2   | Editor    | Traducere F8 (eșec de rețea/HTTP)                | `editor-translate-state.tsx`    | `E-TRANS-001` |
| 3   | Editor    | Import fișier / OCR                              | `editor-import.tsx`             | `E-EDIT-001`  |
| 4   | Editor    | Import fără conținut (0 blocuri)                 | `editor-import.tsx`             | `E-EDIT-001`  |
| 5   | Editor    | Export PDF                                       | `EditorFileMenu.tsx`            | `E-CONV-002`  |
| 6   | Editor    | Export PDF — pop-up blocat + iframe indisponibil | `editor-export.ts`              | `E-CONV-002`  |
| 7   | Editor    | Export HTML                                      | `EditorFileMenu.tsx`            | `E-CONV-002`  |
| 8   | Editor    | Export DOCX                                      | `EditorFileMenu.tsx`            | `E-CONV-002`  |
| 9   | Editor    | Autosalvare document (cotă plină / mod privat)   | `editor-document.tsx`           | `E-EDIT-003`  |
| 10  | Editor    | Dictare — motor vocal oprit (5 coduri)           | `editor-dictation.tsx`          | `E-EDIT-002`  |
| 11  | Editor    | Dictare — pornire eșuată                         | `editor-dictation.tsx`          | `E-EDIT-002`  |
| 12  | Chat      | Trimitere mesaj (lanț provideri epuizat)         | `ChatPanel.tsx`                 | `E-CHAT-001`  |
| 13  | Chat      | Continuare răspuns                               | `ChatPanel.tsx`                 | `E-CHAT-001`  |
| 14  | Chat      | OCR poză atașată                                 | `ChatPanel.tsx`                 | `E-CHAT-002`  |
| 15  | Teste     | Generare test                                    | `TestePanel.tsx`                | `E-TEST-001`  |
| 16  | Teste     | Continuare generare                              | `TestePanel.tsx`                | `E-TEST-001`  |
| 17  | Teste     | Corectare lucrare                                | `TestePanel.tsx`                | `E-TEST-002`  |
| 18  | Teste     | OCR poză lucrare                                 | `TestePanel.tsx`                | `E-TEST-003`  |
| 19  | Școlare   | Generare fișă + continuare                       | `ScolarePanel.tsx`              | `E-SCOL-001`  |
| 20  | Convertor | Conversie fișier                                 | `convertor/page.tsx`            | `E-CONV-001`  |
| 21  | Istoric   | Re-descărcare DOCX                               | `HistoryDetail.tsx`             | `E-HIST-001`  |
| 22  | Planșe    | 6 generatoare — lot incomplet                    | `planse/app.js` + `lib/diag.js` | `E-PLAN-001`  |

Deja existente înainte de Faza 1 (neatinse): `E-NET-001/002` (interceptor fetch),
`E-APP-001` (ErrorBoundary), `E-VALID-001..003` (validator), backend Python
(`E-OCR-*`, `E-TRANS-001/003/004`, `E-CONV-001` prin `api/lib/exceptions.py`).

## Îngustări DELIBERATE ale variantei (1a) — spuse, nu ascunse

| Ce                                                                                                                       | De ce                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calculator** — erorile de sintaxă la evaluare                                                                          | Sunt greșeli de tastare ale utilizatorului, vizibile instant pe ecran, lângă cursor. Un log per tastă apăsată greșit ar fi zgomot care îngroapă erorile reale. |
| **Teste — corectare / OCR lucrare: fără `sample`**                                                                       | Conținutul e lucrarea unui elev. Se salvează doar `textLen` / `hasMath` / mărimea pozei. Vezi `E-TEST-002`, `E-TEST-003`.                                      |
| **Chat — OCR poză: fără `sample`**                                                                                       | Aceeași rațiune (tema unui elev).                                                                                                                              |
| **Blocuri `catch` fail-open** (localStorage indisponibil, cache-miss, `URL.revokeObjectURL`, cleanup, telemetrie ratată) | Nu sunt eșecuri de flux: aplicația livrează rezultatul oricum. Le-am lăsat mute intenționat.                                                                   |
| **Erori benigne de dictare** (`no-speech`, `aborted`)                                                                    | Motorul repornește singur; rămân la nivel `action`. Doar eșecurile care OPRESC dictarea urcă la `error`.                                                       |

## Ce NU e verificat live (onest)

- **Planșe** — cablat prin script (transformare mecanică, 6/6 potriviri impuse, `node --check`
  trecut), dar **niciun generator n-a fost pus să eșueze într-un browser**. Amprenta e mică și
  fail-open, dar verdictul „funcționează" nu e dat.
- **Fluxurile 3-21** — codul e cablat identic cu fluxul 1-2 (verificat live), dar fiecare are
  nevoie de propria probă în browser. Aia e **Faza 4**, nu Faza 1.
- Verificat live pe producție: fluxurile **1 și 2** (traducere), ambele ramuri
  (`logic` și `badResponse`), cu rândurile confirmate direct în Supabase.
