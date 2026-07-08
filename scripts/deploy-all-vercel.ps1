# =============================================================================
# deploy-all-vercel.ps1  -  Deploy v4 pe DOUA proiecte Vercel (din acelasi repo)
#
#   traduceri-api       = radacina `.`        (functii Python api/*.py, vercel.json)
#   traduceri-frontend  = folderul `frontend/`(Next.js 15, preset auto)
#
# Cheile se citesc din Windows User env vars (sistemul central .api-keys) si se
# trimit direct la Vercel prin stdin - NU se afiseaza nicaieri (nici in acest
# script, nici in log-uri). Supabase e AMANAT (logarea e fail-open; aplicatia
# merge fara ea). OCR/traducere Gemini au nevoie de o cheie GOOGLE_AI_API_KEY cu
# billing activ (vezi nota finala).
#
# GHIDAT: singurul pas interactiv e `vercel login` + confirmarile la `vercel link`
# (raspunzi in fereastra cand ti se cere). Restul e automat.
#
# RULARE: dublu-click pe DEPLOY_VERCEL.bat (din radacina repo-ului).
# =============================================================================

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot           # radacina repo-ului
$FrontDir = Join-Path $RepoRoot "frontend"
$ApiName  = "traduceri-api"
$FeName   = "traduceri-frontend"
$ApiUrl   = "https://$ApiName.vercel.app"              # domeniu stabil (predictibil)
$FeUrl    = "https://$FeName.vercel.app"
$targets  = @("production", "preview")

function Section($t) { Write-Host "`n==== $t ====" -ForegroundColor Cyan }
function Info($t)    { Write-Host $t -ForegroundColor Gray }
function Ok($t)      { Write-Host $t -ForegroundColor Green }
function Warn($t)    { Write-Host $t -ForegroundColor Yellow }

# Seteaza o variabila de env pe proiectul Vercel linkat in directorul curent.
# Valoarea vine prin stdin -> nu apare in linia de comanda / istoric / output.
function Set-Env([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { Warn ("  SKIP  {0,-24} (valoare goala)" -f $name); return }
  foreach ($t in $targets) {
    & vercel env rm $name $t --yes *> $null            # idempotent
    $value | & vercel env add $name $t *> $null
    if ($LASTEXITCODE -eq 0) { Ok ("  OK    {0,-24} -> {1}" -f $name, $t) }
    else { Warn ("  ESUAT {0,-24} -> {1} (adauga manual in dashboard)" -f $name, $t) }
  }
}

# Ca mai sus, dar citeste valoarea din Windows User env var (nu o vede scriptul).
function Set-EnvFromWin([string]$name) {
  $v = [Environment]::GetEnvironmentVariable($name, "User")
  if ([string]::IsNullOrWhiteSpace($v)) { Warn ("  SKIP  {0,-24} (lipsa in Windows env)" -f $name); return }
  Set-Env $name $v
}

# --- Preflight: Vercel CLI ---------------------------------------------------
Section "Preflight"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Warn "Vercel CLI negasit. Il instalez global (npm i -g vercel)..."
  & npm i -g vercel
  if ($LASTEXITCODE -ne 0) { throw "Instalarea Vercel CLI a esuat. Ruleaza manual: npm i -g vercel" }
}
Info ("Vercel CLI: " + (& vercel --version))

# --- Login (interactiv, o singura data) --------------------------------------
Section "Autentificare Vercel"
& vercel whoami *> $null
if ($LASTEXITCODE -ne 0) {
  Info "Nu esti autentificat. Se deschide 'vercel login' (alege GitHub / email in browser)."
  & vercel login
  if ($LASTEXITCODE -ne 0) { throw "vercel login a esuat." }
}
Ok ("Autentificat ca: " + (& vercel whoami))

# =============================================================================
# PROIECT 1 - API Python (radacina)
# =============================================================================
Section "Proiect API ($ApiName) - radacina"
Set-Location $RepoRoot
# Re-link curat (radacina e deja linkata la proiectul vechi 'traduceri-matematica').
if (Test-Path ".vercel") { Remove-Item ".vercel" -Recurse -Force; Info "Am scos link-ul vechi (.vercel)." }
Write-Host "La prompturile 'vercel link' raspunde:" -ForegroundColor Magenta
Write-Host "  - Set up and deploy? -> nu conteaza (folosim link)" -ForegroundColor Magenta
Write-Host "  - Which scope?       -> echipa ta" -ForegroundColor Magenta
Write-Host "  - Link to existing?  -> N (creezi nou)" -ForegroundColor Magenta
Write-Host "  - Project name?      -> $ApiName" -ForegroundColor Magenta
Write-Host "  - Directory?         -> ./  (radacina)" -ForegroundColor Magenta
& vercel link
if (-not (Test-Path ".vercel/project.json")) { throw "Link API esuat (fara .vercel/project.json)." }

Info "Setez env pe $ApiName (chei din Windows env + URL-uri):"
foreach ($k in @("GOOGLE_AI_API_KEY","DEEPL_API_KEY","DEEPL_API_KEY2","DEEPL_API_KEY_2",
                 "GROQ_API_KEY","MISTRAL_API_KEY","HF_TOKEN","OPENROUTER_API_KEY")) {
  Set-EnvFromWin $k
}
Set-Env "ALLOWED_ORIGIN" $FeUrl
Set-Env "APP_PUBLIC_URL" $FeUrl

Info "Deploy API in productie..."
& vercel --prod
Ok "API deployat -> $ApiUrl"

# =============================================================================
# PROIECT 2 - Frontend Next.js (frontend/)
# =============================================================================
Section "Proiect Frontend ($FeName) - frontend/"
Set-Location $FrontDir
if (Test-Path ".vercel") { Remove-Item ".vercel" -Recurse -Force }
Write-Host "La 'vercel link': Link existing -> N | name -> $FeName | Directory -> ./" -ForegroundColor Magenta
& vercel link
if (-not (Test-Path ".vercel/project.json")) { throw "Link frontend esuat." }

Info "Setez env pe $FeName (URL API + chei proxy /api/proxy):"
# NEXT_PUBLIC_API_URL e inlinuit la BUILD -> trebuie setat inainte de deploy.
Set-Env "NEXT_PUBLIC_API_URL" $ApiUrl
Set-Env "PYTHON_API_URL" $ApiUrl
foreach ($k in @("GROQ_API_KEY","GOOGLE_API_KEY","MISTRAL_API_KEY","DEEPL_API_KEY",
                 "TAVILY_API_KEY","CEREBRAS_API_KEY","OPENROUTER_API_KEY","BRAVE_SEARCH_API_KEY",
                 "GOOGLE_API_KEY_2","MISTRAL_API_KEY_2","DEEPL_API_KEY_2")) {
  Set-EnvFromWin $k
}

Info "Deploy Frontend in productie (build cu NEXT_PUBLIC_API_URL setat)..."
& vercel --prod
Ok "Frontend deployat -> $FeUrl"

# =============================================================================
# Verificare
# =============================================================================
Section "Verificare"
Set-Location $RepoRoot
try {
  $h = Invoke-RestMethod -Uri "$ApiUrl/api/health" -TimeoutSec 30
  Ok "API /api/health: $($h | ConvertTo-Json -Compress)"
} catch {
  Warn "API /api/health nu a raspuns inca (poate dura ~1 min dupa deploy). Verifica manual: $ApiUrl/api/health"
}

Section "GATA"
Ok  "Frontend:  $FeUrl"
Ok  "API:       $ApiUrl"
Write-Host ""
Warn "NOTE:"
Warn " - OCR + traducere Gemini merg DOAR daca GOOGLE_AI_API_KEY (pe proiectul API) e o cheie cu billing activ."
Warn "   Daca e blocata, seteaza alta cheie Gemini valida: vercel env rm GOOGLE_AI_API_KEY production --yes ; <cheie> | vercel env add GOOGLE_AI_API_KEY production ; vercel --prod"
Warn " - Supabase (log-uri /diagnostics) = AMANAT. Aplicatia merge fara el (fail-open). Se adauga ulterior."
Warn " - Editor (/editor) si Asistent (/asistent) merg independent de cheia Google."
