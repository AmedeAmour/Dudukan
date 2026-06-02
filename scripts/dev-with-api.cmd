@echo off
cd /d "%~dp0\.."
set LOG_FILE=%TEMP%\dudukan-admin-local.log
echo.
echo Demarrage de Dudukan avec l'API admin...
echo Dossier: %cd%
echo Journal: %LOG_FILE%
echo.
"C:\Program Files\nodejs\node.exe" scripts\dev-with-api.mjs 1>> "%LOG_FILE%" 2>>&1
set EXIT_CODE=%ERRORLEVEL%
echo.
echo Le serveur s'est arrete avec le code %EXIT_CODE%.
echo Le serveur s'est arrete. Copie l'erreur affichee ci-dessus si le lien ne marche pas.
echo Dernieres lignes du journal:
type "%LOG_FILE%"
pause
