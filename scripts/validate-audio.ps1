# validate-audio.ps1 — valida que existan los 50 audios esperados.
$audioDir = Resolve-Path "$PSScriptRoot/../public/audio"
$missing = @()
for ($i = 1; $i -le 50; $i++) {
    $id = "q{0:D3}" -f $i
    $file = Join-Path $audioDir "$id.mp3"
    if (-not (Test-Path $file)) {
        $missing += $id
    }
}
if ($missing.Count -gt 0) {
    Write-Host "Faltan $($missing.Count) audios:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_.mp3" }
    exit 1
} else {
    Write-Host "OK — 50 audios presentes en $audioDir" -ForegroundColor Green
}