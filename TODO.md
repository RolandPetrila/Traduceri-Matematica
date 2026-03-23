# TODO — Sistem Traduceri Matematica
# Actualizat: 2026-03-24

---

## AMANAT (de discutat/implementat ulterior)
- [ ] Decizie: limbi noi (maghiara, ceha) — doar JSON in config/languages.json
- [ ] Quiz generator din continutul tradus
- [ ] Rezolvare automata exercitii
- [ ] Batch processing > 10 pagini cu queue
- [x] ~~Export PDF direct~~ — REZOLVAT: PDF via Print dialog (buton in UI)
- [x] ~~PDF editing avansat~~ — REZOLVAT 2026-03-24: rotire, stergere, reordonare, watermark, optimizare

## IDEI NOI
- [ ] Sincronizare loguri cross-device (Vercel KV / externa)
- [ ] Export istoric ca CSV/JSON
- [ ] Previzualizare PDF inainte de editare/conversie
- [ ] Comparatie doua traduceri side-by-side
- [ ] Batch conversie multiple fisiere simultan

## KNOWN ISSUES
- [x] ~~Groq API key newline~~ — REZOLVAT: .strip() pe toate cheile + sanitizare erori
- [x] ~~Conversie returneaza JSON~~ — REZOLVAT: sterse rute Next.js proxy conflictuale
- [x] ~~Cache vechi persista~~ — REZOLVAT: SW versioning dinamic, API calls nu se cache-uiesc
- [x] ~~DOCX download este HTML-based~~ — REZOLVAT 2026-03-24: DOCX real via python-docx server-side
- [x] ~~HTML triplicat la multi-file~~ — REZOLVAT 2026-03-24: unified HTML, nu join per result
- [x] ~~Dictionary ignorat~~ — REZOLVAT 2026-03-24: termeni trimisi in FormData + injectati in prompt
- [ ] Loguri per device (localStorage) — nu sunt vizibile cross-device din /diagnostics
- [ ] fpdf2 watermark: rotatie text poate sa nu functioneze perfect pe toate PDF-urile
- [ ] .env contine 19 variabile nefolosite — curatenie manuala necesara

## RAMASE DIN AUDIT (nerezolvate inca)
- [ ] Refactorizare translate.py in module (SEV2-14) — 647 linii monolith
- [ ] Teste unitare (SEV3-15) — zero unit tests, doar E2E
- [ ] Documentatie API formala (SEV3-16) — zero Swagger/OpenAPI
- [ ] SW cache auto-version la build (SEV3-17) — inca manual
- [ ] Upgrade Next.js 14 → 15 (SEV3-21)
- [ ] CHANGELOG.md formal (SEV3-23)

## DECIZII DE LUAT
- [ ] Regenerare chei API — cheile au fost expuse in erori anterior (acum sanitizate)
- [ ] MISTRAL_API_KEY trebuie configurat in Vercel dashboard pentru OCR fallback
