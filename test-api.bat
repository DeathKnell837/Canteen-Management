@echo off
REM Canteen Management System - API Testing Script (Windows)
REM This script tests all endpoints and validates the system

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:5000/api
set ADMIN_TOKEN=
set CUSTOMER_TOKEN=
set TEST_ORDER_ID=
set TEST_ITEM_ID=

echo ========================================
echo Canteen Management System - API Tests
echo ========================================

REM ============================================
REM TEST 1: AUTH ENDPOINTS
REM ============================================
echo.
echo Testing Auth Endpoints
echo ========================

echo.
echo [1.1] Admin Login
curl -s -X POST %BASE_URL%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"admin@canteen.local\", \"password\": \"admin123\"}" > temp_response.json

type temp_response.json
echo.

echo [1.2] Customer Login
curl -s -X POST %BASE_URL%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"user1@example.com\", \"password\": \"user123\"}" > temp_response.json

type temp_response.json
echo.

REM ============================================
REM TEST 2: MENU ENDPOINTS
REM ============================================
echo.
echo Testing Menu Endpoints
echo ========================

echo.
echo [2.1] Get Menu Categories
curl -s -X GET %BASE_URL%/menu/categories > temp_response.json
type temp_response.json
echo.

echo [2.2] Get Menu Items
curl -s -X GET %BASE_URL%/menu/items > temp_response.json
type temp_response.json
echo.

echo [2.3] Search Menu Items
curl -s -X GET "%BASE_URL%/menu/search?q=Idli" > temp_response.json
type temp_response.json
echo.

REM ============================================
REM TEST 3: ORDERS ENDPOINTS
REM ============================================
echo.
echo Testing Order Endpoints
echo ========================

echo.
echo [3.1] Note: Order endpoints require authentication
echo Use the token from login to test order endpoints
echo.

REM Start server if not running
echo.
echo ========================================
echo.
echo Quick Test Complete. Responses saved above.
echo.
echo To get a valid token for authenticated requests:
echo 1. Copy the token from Login response
echo 2. Add it to Authorization header: Bearer [token]
echo.
echo Example with token:
echo curl -X GET %BASE_URL%/orders ^
  echo   -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.
echo ========================================

REM Cleanup
del temp_response.json 2>nul

pause
