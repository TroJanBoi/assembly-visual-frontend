import http from 'k6/http';
import { check, sleep } from 'k6';

// =========================================================================
// 8. รองรับผู้ใช้พร้อมกัน 50 คน (Simulate 50 Concurrent Users)
// =========================================================================
export const options = {
  // ตั้งค่า Virtual Users เป็น 50 คน และยิงพร้อมกันค้างไว้ 30 วินาที
  stages: [
    { duration: '5s', target: 50 },  // Ramp-up: เพิ่มจำนวนผู้ใช้ขึ้นเป็น 50 ภายใน 5 วินาที
    { duration: '20s', target: 50 }, // Sustain: ค้างจำนวนผู้ใช้ 50 คนเป็นเวลา 20 วินาที
    { duration: '5s', target: 0 },   // Ramp-down: ลดจำนวนลงเหลือ 0 ใน 5 วินาที
  ],
  thresholds: {
    // 95% ของ Request ต้องตอบกลับเร็วกว่า 2 วินาที
    http_req_duration: ['p(95)<2000'],
    // อัตรา Error ต้องไม่เกิน 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000'; // เปลี่ยนเป็น URL ของ Frontend จริง หรือ Backend API กรณีเทส Backend รับโหลด

export default function () {
  // จำลองการโหลดหน้า Login พร้อมกัน
  const loginPageRes = http.get(`${BASE_URL}/login`);
  
  check(loginPageRes, {
    'Login page loaded (status 200)': (r) => r.status === 200,
    // ตรวจสอบว่าโหลดหน้าได้เร็วกว่า 2 วิ หรือไม่ (เหมือนเทสข้อ 1 แบบ concurrent)
    'Login page load time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1); // ผู้ใช้ใช้เวลา 1 วินาทีบนหน้าเว็บ

  /* 
  ตัวอย่างการจำลองการยิง API หรือ OAuth Mock 
  (เนื่องจาก OAuth จริงติด Google CAPTCHA ปกติมักใช้ API ตรงเพื่อเทส Authentication)
  */
  const payload = JSON.stringify({
    email: `testuser_${__VU}@example.com`,
    password: 'password123',
  });

  const headers = { 'Content-Type': 'application/json' };
  
  // ยิงไปที่ Backend Auth ตรงๆ หรือ Next.js API Routes หรืองดเทสส่วนนี้ถ้าเป็น OAuth เต็มตัว
  // const authRes = http.post('http://localhost:5000/api/auth/login', payload, { headers });
  // check(authRes, {
  //   'Auth successful (status 200)': (r) => r.status === 200,
  // });

  // sleep(1);
}
