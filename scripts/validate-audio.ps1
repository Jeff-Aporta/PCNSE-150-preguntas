# validate-audio.ps1 - verify per-clip MP3 + manifest for all 150 questions.
$audioDir = Resolve-Path "$PSScriptRoot/../audio" -ErrorAction SilentlyContinue
if (-not $audioDir) {
    Write-Host ("No existe el directorio de audios: $PSScriptRoot/../audio") -ForegroundColor Red
    exit 1
}
$locales = @("es", "en")
$clipKeys = @("stmt", "A", "B", "C", "D", "ttip", "correct", "wrong", "EA", "EB", "EC", "ED")
$totalCount = 150
$missing = @()
foreach ($loc in $locales) {
    $locDir = Join-Path $audioDir $loc
    if (-not (Test-Path $locDir)) {
        Write-Host ("No existe locale: " + $locDir) -ForegroundColor Red
        exit 1
    }
    for ($i = 1; $i -le $totalCount; $i++) {
        $id = "q{0:D3}" -f $i
        foreach ($k in $clipKeys) {
            $file = Join-Path $locDir ("{0}-{1}.mp3" -f $id, $k)
            if (-not (Test-Path $file)) { $missing += "$loc/$id-$k.mp3" }
        }
        $manifest = Join-Path $locDir ("{0}.segments.json" -f $id)
        if (-not (Test-Path $manifest)) { $missing += "$loc/$id.segments.json" }
    }
}
$missingCount = $missing.Count
if ($missingCount -gt 0) {
    Write-Host ("Faltan " + $missingCount + " archivos:") -ForegroundColor Red
    foreach ($m in $missing) { Write-Host ("  - " + $m) }
    exit 1
} else {
    Write-Host ("OK - " + ($totalCount * ($locales.Count * ($clipKeys.Count + 1))) + " archivos presentes en " + $audioDir) -ForegroundColor Green
}
