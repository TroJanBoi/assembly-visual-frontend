# Mock API Server

## การติดตั้ง

```bash
npm install --save-dev json-server
```

## การใช้งาน

### 1. เริ่ม Mock Server

```bash
npm run mock
```

Server จะรันที่ `http://localhost:3001`

### 2. เริ่ม Frontend (Terminal ใหม่)

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_API_URL="http://localhost:3001"; npm run dev

# Windows CMD
set NEXT_PUBLIC_API_URL=http://localhost:3001 && npm run dev

# Linux/Mac
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## โครงสร้างไฟล์

```
mock/
├── db.json       - ข้อมูลจำลอง (assignment, playground, user, class)
└── server.js     - Custom server logic
```

## API Endpoints ที่รองรับ

### Standard REST
- `GET /api/v2/class/:classId/assignment` - ดึงรายการ assignment
- `GET /api/v2/class/:classId/assignment/:id` - ดึง assignment ตาม ID
- `POST /api/v2/class/:classId/assignment` - สร้าง assignment ใหม่

### Custom Endpoints
- `POST /api/v2/playground/me` - ค้นหา playground ตาม assignment_id
- `PUT /api/v2/playground/me` - อัปเดต playground
- `POST /api/v2/playground/:id/execute` - รัน execution (คืนข้อมูล mock)

## แก้ไขข้อมูล

แก้ไขไฟล์ `mock/db.json` เพื่อเพิ่ม/ลด/แก้ไขข้อมูลตัวอย่าง Server จะ reload อัตโนมัติ

## การทดสอบ API Format

1. แก้ไข `db.json` ให้ตรงกับ format ที่ต้องการทดสอบ
2. รัน frontend ดูว่าทำงานได้ไหม
3. ถ้า OK ก็ส่ง format นี้ให้ Backend เพื่อนคุณ implement
4. ถ้ายังไม่ OK แก้ `db.json` ใหม่และทดสอบอีกครั้ง

## ตัวอย่างการเพิ่มข้อมูล

เพิ่ม assignment ใหม่ใน `db.json`:

```json
{
  "assignment": [
    ...existing assignments,
    {
      "id": 3,
      "class_id": 101,
      "title": "Your New Assignment",
      "description": "...",
      ...
    }
  ]
}
```

บันทึกไฟล์แล้ว refresh หน้าเว็บ จะเห็นข้อมูลใหม่ทันที!
