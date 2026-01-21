@echo off
echo ========================================
echo   เริ่มต้นระบบสำหรับใช้งานในวง LAN
echo ========================================
echo.

echo [1/3] กำลังตรวจสอบ IP Address...
ipconfig | findstr /i "IPv4"
echo.

echo [2/3] กำลังเริ่มต้น Frontend...
echo เปิด Browser แล้วเข้า: http://[IP-ADDRESS]:3000
echo.

echo [3/3] กำลังรัน Next.js...
npm run dev:lan

pause
