// Sonda ONESTA a limitei Mistral OCR (datorie tehnica #1, docs/Plan_in_Lucru.md).
//
// CAPCANA DE EVITAT (4.5c): sonda anterioara a tras 6 cereri in ~20s, a primit 429
// si a raportat "Mistral e mort" -- 429-urile veneau de la sonda, nu de la cont.
// Limita documentata (~/.api-keys/catalog.md): "1 MILIARD tokens/luna, 2 req/min".
// Aceasta sonda respecta limita: spatiere FIXA intre cereri (>30s), nu o incalca.
//
// Testeaza fiecare cheie SEPARAT (ferestre de timp distincte, nu suprapuse), ca sa
// nu amestecam eventuale 429 intre cele doua conturi.
//
// Foloseste DOAR endpoint-ul real din productie (api/lib/ocr_structured.py
// _ocr_with_mistral_structured): POST https://api.mistral.ai/v1/ocr,
// model "mistral-ocr-latest", imagine ca image_url data-URI.

import { readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const IMAGE_PATH = '99_Roland_Work/Teste_Input/limite_matematica.jpeg';
const SPACING_MS = 35_000; // >30s intre cereri (documentat: 2 req/min == 30s/cerere)
const REQUESTS_PER_KEY = 6; // 6 cereri x 35s spacing = ~3min30s per cheie

const image = readFileSync(IMAGE_PATH);
const b64 = image.toString('base64');
const payload = JSON.stringify({
  model: 'mistral-ocr-latest',
  document: { type: 'image_url', image_url: `data:image/jpeg;base64,${b64}` },
  include_image_base64: false,
});

async function callMistral(apiKey) {
  const start = Date.now();
  let status = null;
  let durationMs = null;
  let bodySnippet = '';
  let ok = false;
  try {
    const resp = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
    });
    durationMs = Date.now() - start;
    status = resp.status;
    ok = resp.ok;
    const text = await resp.text();
    if (ok) {
      // nu logam continutul OCR (irelevant pt sonda) -- doar dovada ca a raspuns 2xx
      let pageCount = null;
      try {
        pageCount = JSON.parse(text)?.pages?.length ?? null;
      } catch {
        // ignorat -- doar diagnostic
      }
      bodySnippet = `OK, pages=${pageCount}`;
    } else {
      bodySnippet = text.slice(0, 200);
    }
  } catch (e) {
    durationMs = Date.now() - start;
    bodySnippet = `EXCEPTION: ${String(e).slice(0, 200)}`;
  }
  return { status, durationMs, ok, bodySnippet };
}

async function probeKey(label, envVar) {
  const apiKey = process.env[envVar];
  if (!apiKey) {
    return { label, envVar, error: `${envVar} not set in env`, results: [] };
  }
  const results = [];
  for (let i = 0; i < REQUESTS_PER_KEY; i++) {
    const ts = new Date().toISOString();
    const r = await callMistral(apiKey);
    results.push({ n: i + 1, ts, ...r });
    console.log(
      `[${label}] req ${i + 1}/${REQUESTS_PER_KEY} ts=${ts} status=${r.status} ` +
        `durationMs=${r.durationMs} body="${r.bodySnippet}"`,
    );
    if (i < REQUESTS_PER_KEY - 1) {
      await sleep(SPACING_MS);
    }
  }
  return { label, envVar, results };
}

async function main() {
  console.log('=== Sonda Mistral OCR — spatiere 35s (>30s), 6 cereri/cheie ===');
  const out = { startedAt: new Date().toISOString(), spacingMs: SPACING_MS, keys: [] };

  console.log('\n--- Testez MISTRAL_API_KEY ---');
  out.keys.push(await probeKey('MISTRAL_API_KEY', 'MISTRAL_API_KEY'));

  console.log('\n--- Pauza 60s intre chei (ferestre de timp separate) ---');
  await sleep(60_000);

  console.log('\n--- Testez MISTRAL_API_KEY_2 ---');
  out.keys.push(await probeKey('MISTRAL_API_KEY_2', 'MISTRAL_API_KEY_2'));

  out.finishedAt = new Date().toISOString();
  const outPath = 'scratchpad/mistral_rate_limit_probe_output_2026-09-12.json';
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\n=== Rezultate scrise in ${outPath} ===`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
