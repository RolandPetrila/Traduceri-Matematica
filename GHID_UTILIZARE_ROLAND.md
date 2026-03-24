# Ghid Utilizare — Roland

## Dupa fiecare sprint — ce testezi:

| Sprint | Ce testezi | Cum | Skill |
|---|---|---|---|
| 0 | Structura foldere | Explorer: Arhiva_Proiect_Vechi/ si docs/ exista | `/status` |
| 1 | DeepL + toggle limba | Vercel: traduce poza, apesi SK/EN, verifici diacritice | `/health` |
| 2 | Figuri crop pe alb | Upload JPEG, vezi figuri originale in HTML | `/test` |
| 3 | Editare inline | Click pe text, modifica, salveaza, exporta | manual |
| 4 | Export HTML+DOCX+PDF | Descarci toate 3, deschizi, verifici | manual |
| 5 | Istoric + Diagnostics | Cauta traducere, verifica DeepL usage | `/health` |
| 6 | Tot proiectul | Test complet Vercel + local | `/audit_full` |

## Comenzi /slash utile:

```
/status          — Vezi sprint curent, ce e complet
/health          — Dupa deploy: verifica Vercel
/review          — Dupa sprint: review cod
/test            — Genereaza teste automate
/audit_full      — Audit complet calitate
/checkpoint      — Salvare progres sesiune
```

## Cand ceva nu merge:

1. Pe Vercel: /diagnostics → "Copiaza loguri" → lipeste in chat
2. Local: DEV_LOCAL.bat → testeaza → "Citeste logul"
3. Vizual: scrie in ISSUES.md → spune-mi sa citesc

## Verificare rapida dupa deploy:

1. Deschide https://traduceri-matematica.vercel.app
2. Upload test_page_1.jpeg → asteapta traducere
3. Verifica: text SK, figuri vizibile, LaTeX randat
4. Toggle SK → EN → RO → verifici
5. HTML → descarci → deschizi → compara cu Exemplu_BUN
6. /diagnostics → toate verde? DeepL chars afisate?
