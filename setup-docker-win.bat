@echo off
REM Canteen Management System - Docker Setup Script for Windows

echo.
echo ========================================
echo  Docker Setup for Canteen Management
echo ========================================
echo.

REM Try to find Docker
echo [1] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not in PATH
    echo.
    echo [ACTION REQUIRED]
    echo If Docker Desktop is installed:
    echo 1. Close this window
    echo 2. Restart Docker Desktop or restart PowerShell
    echo 3. Run this script again
    echo.
    echo If Docker is NOT installed:
    echo 1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
    echo 2. Install Docker Desktop
    echo 3. Restart PowerShell/Command Prompt
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker found: 
docker --version
echo.

REM Navigate to docker folder
echo [2] Navigating to docker folder...
cd /d "%~dp0..\docker"
if errorlevel 1 (
    echo [ERROR] Could not navigate to docker folder
    pause
    exit /b 1
)

echo [OK] Current directory: %cd%
echo.

REM Start Docker containers
echo [3] Starting Docker containers (PostgreSQL, Redis, pgAdmin)...
echo This may take 30-60 seconds...
echo.

docker compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

echo [OK] Docker containers started!
echo.

REM Wait for database to be ready
echo [4] Waiting for PostgreSQL to be ready (max 30 seconds)...
timeout /t 10 /nobreak
echo.

REM Navigate to backend
echo [5] Running database migrations...
cd /d "%~dp0..\backend"
if errorlevel 1 (
    echo [ERROR] Could not navigate to backend folder
    pause
    exit /b 1
)

call npm run migrate
if errorlevel 1 (
    echo [ERROR] Migrations failed
    pause
    exit /b 1
)

echo [OK] Migrations completed!
echo.

REM Seed database
echo [6] Seeding database with test data...
call npm run seed
if errorlevel 1 (
    echo [ERROR] Seeding failed but migrations were successful
    echo You can try running 'npm run seed' again manually
)

echo [OK] Database setup complete!
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Services running:
echo  - PostgreSQL: localhost:5432
echo  - Redis: localhost:6379
echo  - pgAdmin: http://localhost:5050
echo  - API Server: http://localhost:5000
echo.
echo Test Credentials:
echo  - Email: admin@canteen.local
echo  - Password: admin123
echo.
echo Next step: 
echo  1. Run "npm run dev" to start the backend
echo  2. Test the API: curl http://localhost:5000/api/menu/items
echo.
pause
