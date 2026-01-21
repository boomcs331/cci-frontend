# คู่มือการตั้งค่าใช้งานในวง LAN

## 1. หา IP Address ของเครื่อง Server

### Windows:
```cmd
ipconfig
```
ดูที่ `IPv4 Address` จะได้เลขประมาณ `192.168.1.100` หรือ `10.0.0.50`

### Mac/Linux:
```bash
ifconfig
# หรือ
ip addr show
```

---

## 2. แก้ไขไฟล์ .env.local

เปลี่ยนจาก:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3006
```

เป็น:
```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:3006
```
(เปลี่ยน `192.168.1.100` เป็น IP ของเครื่อง Server จริง)

---

## 3. รัน Backend API (Port 3006)

ตรวจสอบว่า Backend API ของคุณรันที่ Port 3006 และ **อนุญาตให้เข้าถึงจาก IP อื่นๆ ในวง LAN**

### ตัวอย่าง Backend (Node.js/Express):
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// อนุญาตให้เข้าถึงจากทุก IP ในวง LAN
app.use(cors({
  origin: '*', // หรือระบุ IP เฉพาะ
  credentials: true
}));

app.listen(3006, '0.0.0.0', () => {
  console.log('Backend API running on http://0.0.0.0:3006');
});
```

**สำคัญ:** ต้องใช้ `0.0.0.0` แทน `localhost` เพื่อให้เครื่องอื่นเข้าถึงได้

---

## 4. รัน Frontend (Port 3000)

```cmd
npm run dev -- -H 0.0.0.0
```

หรือแก้ไข `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0"
  }
}
```

---

## 5. เปิด Firewall (Windows)

### Windows Firewall:
1. เปิด **Windows Defender Firewall**
2. คลิก **Advanced settings**
3. คลิก **Inbound Rules** > **New Rule**
4. เลือก **Port** > Next
5. เลือก **TCP** และใส่ Port: `3000,3006`
6. เลือก **Allow the connection**
7. ตั้งชื่อ: "Next.js LAN Access"

### หรือใช้คำสั่ง (Run as Administrator):
```cmd
netsh advfirewall firewall add rule name="Next.js Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3006
```

---

## 6. เข้าใช้งานจากเครื่อง Client

เปิด Browser บนเครื่องอื่นๆ ในวง LAN:
```
http://192.168.1.100:3000
```
(เปลี่ยน `192.168.1.100` เป็น IP ของเครื่อง Server)

---

## 7. ทดสอบการเชื่อมต่อ

### จากเครื่อง Client ลอง ping:
```cmd
ping 192.168.1.100
```

### ทดสอบเข้า API:
```
http://192.168.1.100:3006/materials/all
```

---

## 🔒 ความปลอดภัย (ถ้าต้องการ)

### 1. จำกัด IP ที่เข้าถึงได้
แก้ไข CORS ใน Backend:
```javascript
app.use(cors({
  origin: [
    'http://192.168.1.100:3000',
    'http://192.168.1.101:3000',
    'http://192.168.1.102:3000'
  ],
  credentials: true
}));
```

### 2. ใช้ Authentication
- ใช้ระบบ Login ที่มีอยู่แล้ว
- เพิ่ม JWT Token

### 3. ใช้ HTTPS (ถ้าต้องการ)
- สร้าง Self-signed Certificate
- ใช้ Reverse Proxy (nginx)

---

## 📱 เข้าใช้งานจากมือถือ

เชื่อมต่อ WiFi เดียวกัน แล้วเปิด Browser:
```
http://192.168.1.100:3000
```

---

## ⚠️ ปัญหาที่อาจพบ

### 1. เข้าไม่ได้จากเครื่องอื่น
- ✅ ตรวจสอบ Firewall
- ✅ ตรวจสอบว่ารันด้วย `0.0.0.0` แทน `localhost`
- ✅ ตรวจสอบว่าอยู่ WiFi/LAN เดียวกัน

### 2. API ไม่ทำงาน
- ✅ ตรวจสอบ CORS settings
- ✅ ตรวจสอบ Backend รันที่ `0.0.0.0:3006`
- ✅ แก้ไข `.env.local` ให้ใช้ IP แทน localhost

### 3. ช้า
- ✅ ใช้ Production build: `npm run build && npm start`
- ✅ ตรวจสอบ Network speed

---

## 🚀 Production Mode (แนะนำ)

สำหรับใช้งานจริงในวง LAN:

```cmd
# Build
npm run build

# Run Production
npm start -- -H 0.0.0.0 -p 3000
```

Production mode จะเร็วกว่า Development mode มาก!

---

## 📊 สรุป

| เครื่อง | ทำอะไร | URL |
|---------|--------|-----|
| Server | รัน Backend + Frontend | - |
| Client 1 | เปิด Browser | http://192.168.1.100:3000 |
| Client 2 | เปิด Browser | http://192.168.1.100:3000 |
| Client 3 | เปิด Browser | http://192.168.1.100:3000 |
| มือถือ | เปิด Browser | http://192.168.1.100:3000 |

**ข้อดี:**
- ✅ ไม่ต้องอัพ Server ภายนอก
- ✅ ไม่เสียค่าใช้จ่าย
- ✅ ข้อมูลอยู่ในวง LAN ปลอดภัย
- ✅ เร็ว (ไม่ต้องผ่าน Internet)

**ข้อจำกัด:**
- ❌ ต้องอยู่ในวง LAN เดียวกัน
- ❌ เครื่อง Server ต้องเปิดตลอด
- ❌ เข้าจากภายนอกไม่ได้ (ยกเว้นใช้ VPN)
