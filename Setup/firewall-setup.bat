@echo off
echo ========================================
echo   ตั้งค่า Windows Firewall
echo   (ต้องรันด้วยสิทธิ์ Administrator)
echo ========================================
echo.

echo กำลังเพิ่ม Firewall Rules...
echo.

netsh advfirewall firewall add rule name="Next.js Frontend (Port 3000)" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Backend API (Port 3006)" dir=in action=allow protocol=TCP localport=3006

echo.
echo ✅ ตั้งค่า Firewall เรียบร้อยแล้ว!
echo.
echo Port ที่เปิด:
echo - Port 3000 (Frontend)
echo - Port 3006 (Backend API)
echo.

pause
