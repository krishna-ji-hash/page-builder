@echo off
:: Double-click this file (or run from Admin CMD) to allow other devices on Wi-Fi to reach port 3000.
netsh advfirewall firewall delete rule name="Builder Custom Dev 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Builder Custom Dev 3000" dir=in action=allow protocol=TCP localport=3000 enable=yes profile=any
if %ERRORLEVEL% EQU 0 (
  echo.
  echo OK - port 3000 is open for LAN devices.
  echo On Mac Mini browser open: http://192.168.1.21:3000/admin/login
  echo.
) else (
  echo.
  echo FAILED - right-click this file and choose "Run as administrator"
  echo.
)
pause
