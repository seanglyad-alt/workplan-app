@echo off
setlocal
echo ==================================================
echo Launching Facebook Video Scheduler ^& Analytics...
echo ==================================================

echo [INFO] Checking for node_modules...
if not exist "node_modules\tsx\dist\cli.mjs" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Setting up environment variables...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
    ) else (
        echo # Environment variables > .env
    )
)

echo [INFO] Updating database schema...
node node_modules\drizzle-kit\bin.cjs push --config=src/db/drizzle.config.ts
if %errorlevel% neq 0 (
    echo [WARN] Could not automatically push database schema ^(e.g., indexes already exist^). Ignoring and continuing...
)

echo [INFO] Starting application server...
node node_modules\tsx\dist\cli.mjs server.ts
if %errorlevel% neq 0 (
    echo [ERROR] The application server crashed or failed to start.
    pause
    exit /b %errorlevel%
)
