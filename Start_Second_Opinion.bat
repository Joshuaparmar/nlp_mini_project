@echo off
setlocal

REM Second Opinion - start backend and frontend servers
for %%I in ("%~dp0.") do set "PROJECT_DIR=%%~fI"

if not exist "%PROJECT_DIR%\backend\main.py" (
    echo ERROR: Project folder not found or backend\main.py is missing.
    echo Place this BAT file in the project folder and try again.
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\.venv\Scripts\activate.bat" (
    echo ERROR: Python virtual environment not found at "%PROJECT_DIR%\.venv"
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\package.json" (
    echo ERROR: Frontend package.json not found in the project root.
    pause
    exit /b 1
)

echo Starting Second Opinion backend...
start "Second Opinion - Backend" cmd /k "cd /d ""%PROJECT_DIR%"" && call .venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload"

echo Starting Second Opinion frontend...
start "Second Opinion - Frontend" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

echo Waiting for the development servers to start...
timeout /t 6 /nobreak >nul

echo Opening Second Opinion in your browser...
start "" "http://localhost:5173"

echo.
echo Both server windows have been opened.
echo Keep those windows running while you use the application.
echo Close them to stop the backend and frontend servers.
endlocal
