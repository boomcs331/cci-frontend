@echo off
echo ========================================
echo   เริ่มต้นระบบ (Production Mode)
echo ========================================
echo.

echo [1/4] กำลังตรวจสอบ IP Address...
ipconfig | findstr /i "IPv4"
echo.

echo [2/4] กำลัง Build โปรเจค...
call npm run build
echo.

echo [3/4] Build เสร็จสิ้น!
echo เปิด Browser แล้วเข้า: http://[IP-ADDRESS]:3000
echo.

echo [4/4] กำลังรัน Production Server...
npm run start:lan

pause
