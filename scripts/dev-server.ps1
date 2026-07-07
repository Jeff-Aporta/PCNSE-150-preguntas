# William Quest — dev server local
# Sirve el repo en localhost:8081 con MIME types correctos para TS/TSX.
$port = 8081
$root = Resolve-Path "$PSScriptRoot/.."
Write-Host "William Quest — sirviendo $root en http://localhost:$port" -ForegroundColor Cyan
Write-Host "Ctrl+C para detener" -ForegroundColor Yellow
Set-Location $root
python "$PSScriptRoot/dev-server.py"