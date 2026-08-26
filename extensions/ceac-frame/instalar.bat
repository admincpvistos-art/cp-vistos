@echo off
setlocal
set "EXT=%~dp0"
start "" explorer "%EXT%"
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
if errorlevel 1 start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "chrome://extensions"
if errorlevel 1 start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "edge://extensions"
echo.
echo ========================================
echo  CP Vistos — CEAC Transferir (v1.5.1)
echo ========================================
echo.
echo 1. Ative "Modo do desenvolvedor" (canto superior direito).
echo 2. Remova a versao antiga da extensao CP Vistos, se houver.
echo 3. Clique em "Carregar sem compactacao".
echo 4. Selecione ESTA pasta:
echo    %EXT%
echo.
echo Depois: recarregue Preencher DS-160 no site e use
echo "Transferir para o CEAC" no painel esquerdo.
echo.
pause
