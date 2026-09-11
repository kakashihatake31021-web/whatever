@echo off
title TriGuide AI - Local Server
echo =======================================================
echo          TriGuide AI - Hackathon Launch Server
echo    "One Chatbot. Three Domains. Open Platform."
echo =======================================================
echo.
echo Starting local web server on http://localhost:8000 ...
echo Press Ctrl+C in this terminal to stop the server.
echo.

py -m http.server 8000
if %ERRORLEVEL% NEQ 0 (
    echo Python 'py' command not found, trying python...
    python -m http.server 8000
)
pause
