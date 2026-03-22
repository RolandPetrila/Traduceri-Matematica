---
name: Context proiect Sistem Traduceri
description: Decizii tehnice confirmate, provideri AI alesi, constrangeri
type: project
---

Sistem web (PWA) pt traducere documente matematica RO->SK/EN.
**Why:** Cristina (sotia lui Roland) preda matematica in Slovacia, are nevoie de manuale traduse cu figuri geometrice.
**How to apply:** Prioritizeaza calitatea traducerii matematice si fidelitatea figurilor geometrice.

Decizii confirmate 2026-03-22:
- AI primar: Google Gemini Free Tier (vision + traducere)
- Fallback: Groq (traducere), Mistral (vision)
- Stack: Next.js 14 + Tailwind + shadcn/ui + FastAPI Python
- Deploy: Vercel auto-deploy din GitHub
- UI: tema "tabla verde + creta"
- Extensibilitate: limbi noi + module functionale separate
- Istoric: complet cu detalii, preview, re-download
- Editor: Markdown + preview live
- Dictionar: panel pliabil in tab Traduceri
- Convertor: tab separat, toate formatele, merge/split/compress, PDF editing
- PWA: instalabil Windows/Android/iPhone cu iconita matematica
- Proiect originar CLI: C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex
