@echo off
echo.
echo === DESPLEGANDO CAMBIOS EN NETLIFY ===
echo.

cd /d d:\antigra

echo [1/3] Preparando cambios...
git add .

set /p msg="Descripcion del cambio (Enter para 'Update'): "
if "%msg%"=="" set msg=Update

echo [2/3] Guardando cambios...
git commit -m "%msg%"

echo [3/3] Subiendo a GitHub (Netlify se actualizara automaticamente)...
git push

echo.
echo === LISTO! Netlify desplegara en 2-3 minutos ===
echo Puedes ver el progreso en: https://app.netlify.com
echo.
pause
