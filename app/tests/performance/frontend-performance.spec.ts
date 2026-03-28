import { test, expect } from '@playwright/test';

// =========================================================================
// 1. การโหลดหน้าเว็บหลัก (Login Page)
// =========================================================================
test('1. Load Login Page - should load in under 2.00 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/login'); // เปลี่ยนเป็น URL หน้าเข้าสู่ระบบจริงถ้าไม่ใช่ /login
  
  // รอให้หน้าโหลดเสร็จ (เช่น โหลดปุ่ม login หรือ element หลัก)
  await page.waitForLoadState('networkidle');
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`⏱️ Page Load Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(2.00);
});

// =========================================================================
// 2. การเข้าสู่ระบบด้วย Google OAuth
// =========================================================================
test('2. Google OAuth Login - should complete in under 3.00 seconds', async ({ page }) => {
  await page.goto('/login');
  
  const startTime = Date.now();
  
  // คลิกปุ่ม Google Login (อาจต้องเปลี่ยน Selector ให้ตรงกับของจริง)
  await page.click('text="Sign in with Google"');
  
  // รอการ Redirect กลับมาหน้า Home หรือรอ Token
  // หมายเหตุ: การเทส OAuth จริงใน CI/CD มักจะ mock return กลับ หรือใช้ session/cookie ตรงๆ
  await page.waitForURL('/home', { timeout: 10000 }); 
  await page.waitForLoadState('networkidle');
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`⏱️ Google Login Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(3.00);
});

// =========================================================================
// 3. การสร้าง Flowchart 20 Node
// =========================================================================
test('3. Create 20 Node Flowchart - should render in under 1.50 seconds', async ({ page }) => {
  // สมมติว่าหน้าเพลย์กราวด์อยู่ที่ /playground
  await page.goto('/playground');
  await page.waitForLoadState('networkidle');
  
  const startTime = Date.now();

  // จำลองลากวาง 20 node
  // เนื่องจากนี้เป็น Automation script อาจจะใช้วิธียิง event หรือ click & drag 20 ครั้ง
  for (let i = 0; i < 20; i++) {
    // ลากจาก Toolbar (สมมติ id="#toolbar-node") ไปยัง Canvas (สมมติ id="#canvas")
    await page.dragAndDrop('#toolbar-node', '#canvas', {
      targetPosition: { x: 100 + (i * 20), y: 100 + (i * 20) }
    });
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`⏱️ Drag-Drop 20 Nodes Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(1.50);
});

// =========================================================================
// 4. การบันทึก Flowchart ลงฐานข้อมูล
// =========================================================================
test('4. Save Flowchart to DB - API response under 1.00 seconds', async ({ page }) => {
  await page.goto('/playground');
  await page.waitForLoadState('networkidle');

  // ดักรอ API Request ก่อนคลิกปุ่ม
  const defaultRequestPromise = page.waitForResponse(response => 
    response.url().includes('/api/flowchart/save') && response.status() === 200
  );

  const startTime = Date.now();
  // กดปุ่ม Save
  await page.click('button:has-text("Save")'); 

  // รอให้ API ตอบกลับสำเร็จ
  await defaultRequestPromise;

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`⏱️ Save Flowchart Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(1.00);
});

// =========================================================================
// 5. การโหลด Flowchart เดิมกลับมา
// =========================================================================
test('5. Load Flowchart from DB - should render in under 1.50 seconds', async ({ page }) => {
  const flowchartId = 'test-id-123'; // สมมติว่ามีโปรเจคที่เซฟไว้แล้ว
  
  const startTime = Date.now();
  
  await page.goto(`/playground/${flowchartId}`);
  
  // รอให้ Canvas เรนเดอร์ Node ทั้งหมดเรียบร้อย
  await page.waitForSelector('.react-flow__node', { state: 'visible' });

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`⏱️ Load Flowchart Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(1.50);
});

// =========================================================================
// 6. การรันโปรแกรม Step-by-Step (10 Steps)
// =========================================================================
test('6. Run Step-by-Step (10 Steps) - should complete in under 3.00 seconds', async ({ page }) => {
  await page.goto('/playground/test-id-123');
  await page.waitForSelector('.react-flow__node');

  const startTime = Date.now();

  // กดปุ่ม "Step Forward" 10 ครั้ง
  for (let i = 0; i < 10; i++) {
    await page.click('button[aria-label="Step"]');
    // อัปเดต UI register ให้เสร็จ
    await page.waitForTimeout(50); // เพิ่ม delay จำลองหรือรอ event
  }
  
  // สมมติว่ามีช่องแสดงผล Register ที่มีการเปลี่ยนค่า
  await page.waitForSelector('.register-panel');

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`⏱️ Step-by-Step (10 Steps) Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(3.00);
});

// =========================================================================
// 7. การเชื่อมต่อ Google Classroom API
// =========================================================================
test('7. Connect Google Classroom API - sync in under 0.50 seconds', async ({ page }) => {
  await page.goto('/class'); // สมมติว่าหน้า sync อยู่หน้านี้
  await page.waitForLoadState('networkidle');

  // ดักรอ API Sync
  const syncPromise = page.waitForResponse(response => 
    response.url().includes('/api/classroom/sync') && response.status() === 200
  );

  const startTime = Date.now();
  // กดปุ่ม Sync Assignments
  await page.click('button:has-text("Sync Classroom")');

  await syncPromise;

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`⏱️ Sync Google Classroom Time: ${duration}s`);
  expect(duration).toBeLessThanOrEqual(0.50);
});
