# StudyFlow — Student Study Planner

เว็บแอปช่วยจัดการการเรียน สร้างด้วย HTML, Tailwind CSS CDN, CSS และ JavaScript ไม่ต้องติดตั้ง Node.js

## ฟีเจอร์
- ตารางเรียน: เพิ่ม แก้ไข ลบวิชา เลือกวัน เวลา ห้อง และผู้สอน
- การบ้านและงาน: กำหนดวันส่ง ระดับความสำคัญ ค้นหา และกรองงานเสร็จ/ยังไม่เสร็จ
- กำหนดสอบ: วันเวลา สถานที่ ขอบเขตสอบ นับถอยหลัง และ Checklist อ่านหนังสือ
- Dark Mode / Light Mode
- Responsive สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์
- บันทึกข้อมูลใน LocalStorage ของเบราว์เซอร์

## โครงสร้างไฟล์
```text
student-study-planner/
├── index.html
├── README.md
├── assets/
│   ├── images/       # รูปโลโก้และภาพตัวอย่าง (เพิ่มไฟล์ได้)
│   └── icons/        # favicon.svg และ app-icon.svg
├── css/style.css
└── js/
    ├── storage.js
    ├── schedule.js
    ├── assignments.js
    ├── exams.js
    └── app.js
```

## ทดลองใช้งานในเครื่อง
1. ดาวน์โหลดหรือแตกไฟล์ ZIP
2. เปิด `index.html` ด้วยเบราว์เซอร์ หรือใช้ส่วนขยาย Live Server ใน VS Code
3. เพิ่มข้อมูลจากปุ่มในแต่ละหน้า ข้อมูลจะถูกเก็บไว้ในเบราว์เซอร์เครื่องนั้น

## นำขึ้น GitHub Pages
1. สร้าง repository ใหม่บน GitHub
2. อัปโหลดไฟล์และโฟลเดอร์ทั้งหมด โดยให้ `index.html` อยู่ที่ระดับบนสุด (root)
3. เปิด **Settings → Pages**
4. ใน **Build and deployment** เลือก **Deploy from a branch**
5. เลือก branch `main` และโฟลเดอร์ `/ (root)` แล้วกด Save
6. รอให้ GitHub แสดง URL เว็บไซต์ในหน้า Pages

## นำขึ้น Vercel
1. อัปโหลดโปรเจกต์ขึ้น GitHub
2. เข้า Vercel แล้วเลือก **Add New → Project**
3. Import repository ที่สร้างไว้
4. สำหรับเว็บแบบ static นี้ ไม่จำเป็นต้องกำหนด Build Command หรือ Output Directory พิเศษ ให้ใช้ค่าเริ่มต้นที่เหมาะกับ static site
5. กด Deploy

## หมายเหตุสำคัญ
- LocalStorage ผูกกับเบราว์เซอร์และอุปกรณ์ที่ใช้งาน ข้อมูลไม่ได้ซิงก์ไปยังเครื่องอื่น และอาจหายได้หากล้างข้อมูลเว็บไซต์หรือใช้โหมดไม่ระบุตัวตน
- CDN ของ Tailwind, Lucide และ Google Fonts ต้องใช้อินเทอร์เน็ตเพื่อโหลด หากออฟไลน์ แอปยังใช้ CSS/JavaScript หลักได้ แต่ไอคอนหรือฟอนต์ภายนอกอาจไม่แสดงครบ
- ห้ามนำข้อมูลส่วนตัวที่อ่อนไหวไปเก็บในเว็บสาธารณะโดยไม่จำเป็น
