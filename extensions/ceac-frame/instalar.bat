@echo off
setlocal
set "EXT=%~dp0"
start "" explorer "%EXT%"
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
if errorlevel 1 start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
echo.
echo 1. Ative "Modo do desenvolvedor" no canto superior direito.
echo 2. Clique em "Carregar sem compactacao".
echo 3. Selecione esta pasta:
echo    %EXT%
echo.
pause
