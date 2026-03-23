# TODO — Sistem Traduceri Matematica
# Actualizat: 2026-03-23

---

## AMANAT (de discutat/implementat ulterior)
- [ ] Decizie: limbi noi (maghiara, ceha) — doar JSON in config/languages.json
- [ ] Quiz generator din continutul tradus
- [ ] Rezolvare automata exercitii
- [ ] Batch processing > 10 pagini cu queue
- [x] ~~Export PDF direct~~ — REZOLVAT: PDF via Print dialog (buton in UI)
- [x] ~~PDF editing avansat~~ — REZOLVAT: rotire, stergere, reordonare, watermark, optimizare

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
- [ ] Loguri per device (localStorage) — nu sunt vizibile cross-device din /diagnostics
- [ ] DOCX download este HTML-based (nu native .docx cu formatare complexa)

## DECIZII DE LUAT
- [ ] Regenerare chei API — cheile au fost expuse in erori anterior (acum sanitizate)
