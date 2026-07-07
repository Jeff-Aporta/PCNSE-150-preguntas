# validate-audio.ps1 - validate that all 150 expected audios exist.
$audioDir = Resolve-Path "$PSScriptRoot/../audio" -ErrorAction SilentlyContinue
if (-not $audioDir) {
    Write-Host ("No existe el directorio de audios: $PSScriptRoot/../audio") -ForegroundColor Red
    exit 1
}
$missing = @()
$totalCount = 150
for ($i = 1; $i -le $totalCount; $i++) {
    $id = "q{0:D3}" -f $i
    $file = Join-Path $audioDir "$id.mp3"
    if (-not (Test-Path $file)) {
        $missing = $missing + @($id)
    }
}
$missingCount = $missing.Count
if ($missingCount -gt 0) {
    Write-Host ("Faltan " + $missingCount + " audios de " + $totalCount + ":") -ForegroundColor Red
    foreach ($m in $missing) {
        Write-Host ("  - " + $m + ".mp3")
    }
    exit 1
} else {
    Write-Host ("OK - " + $totalCount + " audios presentes en " + $audioDir) -ForegroundColor Green
}
