# Development Mode - Authentication Bypass

## Mock Authentication Enabled! 🔓

ตอนนี้สามารถ login ด้วย **email อะไรก็ได้** โดยไม่ต้องกังวลเรื่อง password หรือ BE

## การใช้งาน

### Login
- **Email**: พิมพ์อะไรก็ได้ (เช่น `test@test.com`)
- **Password**: พิมพ์อะไรก็ได้
- ระบบจะคืน token ปลอมที่ใช้งานได้ทันที

### ที่เปลี่ยนไป

1. **mock/server.js** - เพิ่ม endpoint `/api/v2/auth/login` และ `/api/v2/auth/sign-up`
2. **lib/auth/token.ts** - รองรับ mock token (prefix: `mock_jwt_`)

## การทำงาน

```
1. Login → Mock Server ส่ง fake JWT token
2. Frontend เก็บ token ใน localStorage
3. API calls ส่ง token ไปกับ Authorization header
4. ทำงานได้ปกติ แม้ว่า token จะไม่ใช่ JWT จริง
```

## กลับไปใช้ BE จริง

เมื่อพร้อมใช้ BE จริง:
```bash
# ลบ NEXT_PUBLIC_API_URL ออก หรือชี้ไปที่ BE จริง
npm run dev
```

Frontend จะใช้ `http://localhost:9090` (default) และ token จริงจาก BE
