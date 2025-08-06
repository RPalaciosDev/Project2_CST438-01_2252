@echo off
echo Loading environment variables from .env file...

REM Check if .env file exists
if exist "..\..\.env" (
    echo Environment variables will be loaded from .env file
    echo Note: On Windows, you may need to set environment variables manually
    echo or use a tool like dotenv-cli
) else (
    echo Warning: .env file not found at ..\..\.env
)

echo Starting Image Storage Service...
gradlew.bat bootRun 