# Canteen Management System - Docker & Database Setup for PowerShell
# This script will verify Docker, start containers, and set up the database

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Docker & Database Setup" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

# ===== CHECK DOCKER =====
Write-Host "[1] Checking Docker installation..." -ForegroundColor Yellow

$dockerPath = & {
    $paths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "C:\Program Files (x86)\Docker\Docker\resources\bin\docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

if (-not $dockerPath) {
    Write-Host "[ERROR] Docker Desktop not found!" -ForegroundColor Red
    Write-Host "`nDocker Desktop needs to be installed. Visit: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "`nAlternatively, use local PostgreSQL setup instead.`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] Docker found at: $dockerPath`n" -ForegroundColor Green

# ===== NAVIGATE TO DOCKER FOLDER =====
Write-Host "[2] Starting Docker containers..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dockerDir = Join-Path $scriptDir "docker"

if (-not (Test-Path $dockerDir)) {
    Write-Host "[ERROR] Docker folder not found at $dockerDir" -ForegroundColor Red
    exit 1
}

Set-Location $dockerDir
Write-Host "[OK] Docker folder: $dockerDir`n" -ForegroundColor Green

# ===== START CONTAINERS =====
Write-Host "[3] Starting PostgreSQL, Redis, and pgAdmin..." -ForegroundColor Yellow
Write-Host "This may take 30-60 seconds on first run...`n" -ForegroundColor Gray

& $dockerPath compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start Docker containers!" -ForegroundColor Red
    Write-Host "Try these steps:" -ForegroundColor Yellow
    Write-Host "  1. Ensure Docker Desktop is running" -ForegroundColor Gray
    Write-Host "  2. Check: docker version" -ForegroundColor Gray
    Write-Host "  3. Check: docker compose version" -ForegroundColor Gray
    exit 1
}

Write-Host "[OK] Docker containers started!`n" -ForegroundColor Green

# ===== WAIT FOR DATABASE =====
Write-Host "[4] Waiting for PostgreSQL to be ready (max 45 seconds)..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "  Check $attempt/15..." -ForegroundColor Gray
    
    try {
        $output = & $dockerPath exec -it canteen_postgres pg_isready -U canteen_user 2>&1
        if ($output -like "*accepting*") {
            Write-Host "[OK] PostgreSQL is ready!`n" -ForegroundColor Green
            break
        }
    } catch {
        # Expected to fail at first
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 3
    }
}

if ($attempt -ge $maxAttempts) {
    Write-Host "[WARNING] PostgreSQL still starting, continuing anyway...`n" -ForegroundColor Yellow
}

# ===== RUN MIGRATIONS =====
Write-Host "[5] Running database migrations..." -ForegroundColor Yellow
$backendDir = Join-Path $scriptDir "backend"
Set-Location $backendDir

npm run migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Migrations failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Migrations completed!`n" -ForegroundColor Green

# ===== SEED DATABASE =====
Write-Host "[6] Seeding database with test data..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Seeding had issues but database is initialized`n" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Database seeded!`n" -ForegroundColor Green
}

# ===== SUCCESS =====
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Running Services:" -ForegroundColor Cyan
Write-Host "  • PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "  • Redis: localhost:6379" -ForegroundColor Gray
Write-Host "  • pgAdmin (DB UI): http://localhost:5050" -ForegroundColor Gray
Write-Host "  • API Server: http://localhost:5000" -ForegroundColor Gray
Write-Host ""

Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  • Email: admin@canteen.local" -ForegroundColor Gray
Write-Host "  • Password: admin123" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "  2. Test the API: curl http://localhost:5000/api/menu/items" -ForegroundColor Gray
Write-Host "  3. Login: curl -X POST http://localhost:5000/api/auth/login -d '{...}'" -ForegroundColor Gray
Write-Host ""

Write-Host "pgAdmin Access:" -ForegroundColor Cyan
Write-Host "  • URL: http://localhost:5050" -ForegroundColor Gray
Write-Host "  • Email: admin@canteen.local" -ForegroundColor Gray
Write-Host "  • Password: admin" -ForegroundColor Gray
Write-Host ""
