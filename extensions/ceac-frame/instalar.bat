@echo off
setlocal
set "EXT=%~dp0"
start "" explorer "%EXT%"
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
if errorlevel 1 start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
if errorlevel 1 start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "edge://extensions"
echo.
echo ========================================
echo  CP Vistos — CEAC Transferir (v1.5.4)
echo ========================================
echo.
echo RECOMENDADO: instalar pela Chrome Web Store
echo   https://www.cpvistos.com.br/extensao-ceac
echo   (atualiza automaticamente nos PCs)
echo.
echo Fallback (sem auto-update):
echo 1. Ative "Modo do desenvolvedor".
echo 2. Remova a versao antiga, se houver.
echo 3. "Carregar sem compactacao" e selecione:
echo    %EXT%
echo 4. Ctrl+F5 em Preencher DS-160.
echo.
pause
