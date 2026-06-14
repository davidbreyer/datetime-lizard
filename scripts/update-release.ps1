param(
  [string]$Release
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDirectory

if (-not $Release) {
  $Release = Get-Date -Format "yyyyMMdd-HHmm"
}

$scriptPath = Join-Path $repoRoot "script.js"
$indexPath = Join-Path $repoRoot "index.html"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$scriptContent = [System.IO.File]::ReadAllText($scriptPath)
$scriptContent = [regex]::Replace(
  $scriptContent,
  'const appRelease = "[^"]+";',
  "const appRelease = `"$Release`";"
)
[System.IO.File]::WriteAllText($scriptPath, $scriptContent, $utf8NoBom)

$indexContent = [System.IO.File]::ReadAllText($indexPath)
$indexContent = [regex]::Replace($indexContent, '\?v=[^"''\s>]+', "?v=$Release")
$indexContent = [regex]::Replace(
  $indexContent,
  '(<span id="releaseStamp" data-version>Version: )[^<]+(</span>)',
  "`${1}$Release`${2}"
)
[System.IO.File]::WriteAllText($indexPath, $indexContent, $utf8NoBom)

Write-Host "Updated DateTime Lizard release to $Release"
