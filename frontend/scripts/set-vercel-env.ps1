# =============================================================================
# set-vercel-env.ps1
# Impinge cheile AI din Windows User env vars in proiectul Vercel `traduceri-matematica`
# (frontend), pentru ruta /api/proxy a modulului Asistent Text AI.
#
# Valorile sunt citite LOCAL din env vars si trimise direct la Vercel prin CLI.
# NU sunt afisate nicaieri (script-ul nu tipareste valori).
#
# PREREQUISITE (o singura data):
#   npm i -g vercel        # daca nu ai CLI-ul
#   cd C:\Proiecte\Traduceri_Matematica\frontend
#   vercel login           # autentificare interactiva (browser)
#   vercel link            # doar daca nu e deja linkat (are deja .vercel/project.json)
#
# RULARE (din folderul frontend/):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\set-vercel-env.ps1
#
# Dupa rulare: redeploy ca sa preia cheile:  vercel --prod
# =============================================================================

$ErrorActionPreference = "Continue"

# Medii Vercel tinta. 'production' + 'preview' acopera deploy-urile reale + PR-urile.
$targets = @("production", "preview")

# Nume env var asteptate de api/proxy.js (primari + failover _2).
$keys = @(
  "GROQ_API_KEY",
  "GOOGLE_API_KEY",
  "MISTRAL_API_KEY",
  "DEEPL_API_KEY",
  "TAVILY_API_KEY",
  "CEREBRAS_API_KEY",
  "OPENROUTER_API_KEY",
  "BRAVE_SEARCH_API_KEY",
  "GOOGLE_API_KEY_2",
  "MISTRAL_API_KEY_2",
  "DEEPL_API_KEY_2"
  # Optional (rate-limit persistent). Decomenteaza daca le adaugi in env:
  # ,"UPSTASH_REDIS_REST_URL"
  # ,"UPSTASH_REDIS_REST_TOKEN"
)

# Verificare rapida ca suntem in proiectul corect.
if (-not (Test-Path ".vercel/project.json")) {
  Write-Host "EROARE: ruleaza din folderul 'frontend/' (nu gasesc .vercel/project.json)." -ForegroundColor Red
  Write-Host "        cd C:\Proiecte\Traduceri_Matematica\frontend" -ForegroundColor Red
  exit 1
}
$proj = (Get-Content ".vercel/project.json" | ConvertFrom-Json).projectName
Write-Host "Proiect Vercel linkat: $proj`n" -ForegroundColor Cyan

$okCount = 0; $skipCount = 0; $failCount = 0

foreach ($k in $keys) {
  $v = [Environment]::GetEnvironmentVariable($k, "User")
  if ([string]::IsNullOrWhiteSpace($v)) {
    Write-Host ("SKIP  {0,-22} (lipsa in Windows env)" -f $k) -ForegroundColor Yellow
    $skipCount++
    continue
  }
  foreach ($t in $targets) {
    # Sterge varianta existenta (idempotent) — ignora eroarea daca nu exista.
    & vercel env rm $k $t --yes *> $null
    # Adauga valoarea din stdin (nu apare in linia de comanda / istoric).
    $v | & vercel env add $k $t *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host ("OK    {0,-22} -> {1}" -f $k, $t) -ForegroundColor Green
      $okCount++
    } else {
      Write-Host ("ESUAT {0,-22} -> {1}  (adauga manual in dashboard)" -f $k, $t) -ForegroundColor Red
      $failCount++
    }
  }
}

Write-Host ("`nGata: {0} setate, {1} sarite, {2} esuate." -f $okCount, $skipCount, $failCount) -ForegroundColor Cyan
Write-Host "Redeploy ca sa preia cheile:  vercel --prod" -ForegroundColor Cyan
