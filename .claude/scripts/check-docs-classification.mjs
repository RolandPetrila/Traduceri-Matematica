#!/usr/bin/env node
// Garda docs/ — Faza 6 (automatizarea procesului), 2026-09-11.
// Scop: numara fisierele NECLASIFICATE din docs/ (top-level, .md + .html) ca sa nu se
// repete sprawl-ul curatat la Faza 5. Regula: pattern/allowlist, NU manifest — un manifest
// ar deveni el insusi stale (vezi docs/arhiva/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md §2.1/§4.2 —
// planul a fost arhivat el insusi la inchiderea Fazei 6, dovada vie a regulii de mai sus).
//
// Rulare manuala:  node .claude/scripts/check-docs-classification.mjs
// Exit code: 0 daca nimic neclasificat, 1 daca exista fisiere de revizuit.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DOCS = join(ROOT, 'docs');
const PLAN_IN_LUCRU = join(DOCS, 'Plan_in_Lucru.md');

// Fisiere .md legitime la nivelul de sus al docs/ — nume stabile, actualizeaza doar cand
// se adauga/redenumeste un document „de sistem" real (nu un raport de sesiune).
const ALLOWED_MD = new Set([
  'Plan_in_Lucru.md',
  'Plan_Finalizat.md',
  'HANDOFF_SESIUNE.md',
  'Fazele.md',
  'completari_pt_reparatie.md',
  'caiet_de_sarcini.md',
  'PROMPT_SESIUNE_NOUA.md',
  'COMENZI_SLASH.md',
  'DEPLOY_VERCEL.md',
  'GHID_FEEDBACK_LOOP.md',
  'AI_PROVIDERS_FREE_INVENTORY.md',
  'MEDIU_CLAUDE_CODE.md',
]);

// Fisiere .html fara sibling .md alowlistat, dar legitime explicit — motiv scris, nu tacut.
const ALLOWED_HTML_STANDALONE = new Map([
  [
    'OPTIUNI_API_AI_2026-09-10.html',
    'harta furnizorilor AI — referinta activa din Faza 4.5c/4.5d (verificat 2026-09-11, gasit ca ' +
      'orfan real la prima rulare a acestei garzi, adaugat aici in loc de arhivat)',
  ],
]);

function readPlanInLucruText() {
  return existsSync(PLAN_IN_LUCRU) ? readFileSync(PLAN_IN_LUCRU, 'utf8') : '';
}

// Extrage identificatorii de faza DOAR din liniile de titlu H2 (## ...) din Plan_in_Lucru.md,
// NU din prozA de sub ele. Motiv gasit empiric la prima rulare: prozA unei faze inchise poate
// mentiona in treacat o faza DESCHISA (ex. "(arhivat la Faza 6, faza inchisa)" in sectiunea
// Faza 5) — scanarea intregului bloc confunda o simpla mentiune cu o declaratie de inchidere.
// Titlul e singurul loc unde starea (✅ inchis vs 🟡/⬜/🔴 deschis) e structurala, nu proza.
function phaseTokensByHeading(planText) {
  const closed = new Set();
  const open = new Set();
  // Ancorat la INCEPUTUL titlului (dupa emoji/spatii, inainte de orice litera) — nu oriunde in
  // text. Motiv gasit empiric: un titlu care doar MENTIONEAZA o faza in treacat (ex.
  // "⏸️ Amânat conștient (migrat ... la Faza 5, ...)") nu e o declaratie de stare a acelei faze.
  const HEADING_PHASE = /^[^A-Za-zĂÂÎȘȚăâîșț]*Faz[ae]\s+(\d+(?:\.\d+[a-z]?)?)\b/i;
  for (const line of planText.split('\n')) {
    const heading = line.match(/^##\s+(.*)$/);
    if (!heading) continue;
    const m = heading[1].match(HEADING_PHASE);
    if (!m) continue;
    const isClosed = heading[1].trimStart().startsWith('✅');
    (isClosed ? closed : open).add(m[1].toUpperCase());
  }
  return { closed, open };
}

function phaseTokenFromFilename(name) {
  const m = name.match(/^PLAN_FAZA(\d+(?:\.\d+[A-Z]?)?)_/i);
  return m ? m[1].toUpperCase() : null;
}

function classify(name, phaseTokens) {
  if (name.endsWith('.md')) {
    if (ALLOWED_MD.has(name)) return { status: 'legitim', motiv: 'allowlist' };
    const token = phaseTokenFromFilename(name);
    if (token) {
      if (phaseTokens.open.has(token)) {
        return { status: 'legitim', motiv: `plan de faza ${token}, titlu H2 marcat ca deschis` };
      }
      if (phaseTokens.closed.has(token)) {
        return {
          status: 'STALE',
          motiv: `plan de faza ${token}, titlu H2 marcat cu ✅ (inchis) in Plan_in_Lucru.md -> ar trebui in docs/arhiva/`,
        };
      }
      return { status: 'legitim', motiv: `plan de faza ${token}, nu apare in niciun titlu H2 (necunoscuta -> implicit legitim)` };
    }
    return { status: 'NECLASIFICAT', motiv: 'nu e pe allowlist si nu urmeaza pattern-ul PLAN_FAZA<n>_' };
  }
  if (name.endsWith('.html')) {
    const mdSibling = name.replace(/\.html$/, '.md');
    if (ALLOWED_MD.has(mdSibling)) return { status: 'legitim', motiv: `companion HTML al ${mdSibling}` };
    if (ALLOWED_HTML_STANDALONE.has(name)) {
      return { status: 'legitim', motiv: ALLOWED_HTML_STANDALONE.get(name) };
    }
    return { status: 'NECLASIFICAT', motiv: 'html fara sibling .md alowlistat si fara intrare explicita' };
  }
  return { status: 'ignorat', motiv: 'extensie neurmarita de garda (doar .md/.html)' };
}

function main() {
  if (!existsSync(DOCS)) {
    console.log(JSON.stringify({ eroare: `docs/ nu exista la ${DOCS}` }));
    process.exit(1);
  }
  const phaseTokens = phaseTokensByHeading(readPlanInLucruText());
  const entries = readdirSync(DOCS, { withFileTypes: true }).filter(
    (e) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.html'))
  );

  const results = entries.map((e) => ({ nume: e.name, ...classify(e.name, phaseTokens) }));
  const deRevizuit = results.filter((r) => r.status === 'NECLASIFICAT' || r.status === 'STALE');

  const summary = {
    scanate: results.length,
    de_revizuit: deRevizuit.length,
    detalii: deRevizuit,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(deRevizuit.length > 0 ? 1 : 0);
}

main();
