@echo off
cd /d "%~dp0\.."
"C:\Program Files\nodejs\node.exe" "%CD%\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5174
