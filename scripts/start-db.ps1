# Starts the portable MariaDB used for local development.
# No admin / service required - runs mariadbd directly on port 3306.
# Data lives in C:\Users\<you>\.local\mariadb\data (persistent across restarts).
param(
  [int]$Port = 3306,
  [switch]$Stop
)

$base = Join-Path $env:USERPROFILE ".local\mariadb"
$dir  = Join-Path $base "mariadb-11.4.4-winx64"
$data = Join-Path $base "data"
$bin  = Join-Path $dir "bin"

if ($Stop) {
  Get-Process -Name "mariadbd" -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host "MariaDB stopped."
  exit 0
}

if (!(Test-Path "$bin\mariadbd.exe")) {
  Write-Host "MariaDB binaries not found at $dir" -ForegroundColor Red
  Write-Host "Re-run the setup (download + extract + install-db) before starting."
  exit 1
}

# Check if already listening on the port
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "Port $Port is already in use - MariaDB likely running." -ForegroundColor Yellow
  exit 0
}

Write-Host "Starting MariaDB on port $Port ..."
Start-Process -FilePath "$bin\mariadbd.exe" -ArgumentList @(
  "--no-defaults",
  "--basedir=$dir",
  "--datadir=$data",
  "--port=$Port",
  "--bind-address=127.0.0.1",
  "--console"
) -WindowStyle Hidden

# Wait for readiness
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "MariaDB is ready on port $Port." -ForegroundColor Green
    exit 0
  }
}
Write-Host "MariaDB did not become ready within 30s. Check the error log at $data\*.err" -ForegroundColor Red
exit 1
