@echo off
echo.
echo ========================================
echo    🧪 WAKAA TEST SUITE
echo    Tests des 12 Fonctionnalités Core
echo ========================================
echo.

node tests/run-all-tests.js

echo.
echo ========================================
echo Tests terminés. Consultez le rapport global :
echo tests/GLOBAL_TEST_REPORT.md
echo ========================================
pause