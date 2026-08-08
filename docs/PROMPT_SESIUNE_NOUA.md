# PROMPT DE RELUARE SESIUNE — canonic (thin)

> **Un singur fișier canonic, fără dată în nume.** Modelul vechi „un prompt datat per sesiune"
> a produs 2 date greșite + un lanț de supersedare inversat în nume (08-09 = dată VIITOARE față
> de crearea reală) → cele 9 fișiere datate au fost consolidate aici (2026-08-08, audit doc).
> Acest canonic NU copiază starea (ar drifta de HANDOFF în aceeași sesiune) — doar TRIMITE la sursă.

## Reia de aici (orice sesiune nouă)

1. **`docs/HANDOFF_SESIUNE.md`** — blocul de SUS „▶️ REIA DE AICI" = starea curentă + următorul pas + context operațional (URL canonic, comanda deploy, testare mobil). **SURSA de reluare.**
2. **`docs/PLAN_MASTER.md`** — §CURENT (stare autoritară la zi) + §6b (coada A/B/C/D) + regulile de execuție §10. **SURSA UNICĂ de adevăr** pe cerințe/status.
3. **`.claude/memory/MEMORY.md`** + `.claude/rules/project_rules.md` — decizii, capcane, reguli proiect.
4. **`99_Plan_vs_Audit/PLAN_DECISIONS.md`** — log decizii tehnice ferme („nu re-litiga").

## Reguli de proces (nu le uita)

- **R-HANDOFF:** după fiecare fază → actualizează HANDOFF + PLAN_MASTER (bifă) + memoria + commit/push.
- **Deploy = DOAR cu confirmarea explicită a lui Roland** (outward-facing); bump `CACHE_VERSION` în `frontend/public/sw.js`, deploy din `frontend/`, apoi verifică ALIASUL.
- **Gate după fiecare item:** `tsc 0 · jest · build OK`; probă LIVE reală, nu presupusă.
- **Roland testează pe PROD** — nu amâna deploy-ul după gate verde.
- Capcane de mediu: `.claude/memory/finding_ops_capcane_2026_08_08.md` (build vs dev pe `.next`, pipe maschează exit code, Chrome nu atinge localhost).

## Coada curentă (2026-08-08)

C/F3 (Școlare Primar) livrat NEDEPLOYAT → **următorul = F2** (Gimnaziu materie nouă) → F4 → F5.
Vezi HANDOFF blocul de sus pentru detaliu.
