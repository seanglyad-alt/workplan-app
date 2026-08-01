@echo off
setlocal
echo ==================================================
echo Building Standalone Executable (No Node.js Required)
echo ==================================================

echo [INFO] Checking for node_modules...
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Running build script to generate executable...
node build_exe.mjs
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Check the logs above.
    pause
    exit /b %errorlevel%
)

echo ==================================================
echo [SUCCESS] Build complete!
echo Your fully standalone application is located at:
echo release\facebook-app.exe
echo ==================================================
pause
