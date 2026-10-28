# MeetSync - ระบบจองห้องประชุม & Google Workspace Sync
### (Smart Meeting Room Booking System with Real-Time SSE & Google Sheets/Drive Integration)

ระบบเว็บแอปพลิเคชันบริหารจัดการและจองห้องประชุม รองรับการป้องกันปัญหาเวลาจองชนกัน (Anti-Overlap / Prevent Double Booking) แสดงผลตารางการใช้งานผ่านปฏิทิน FullCalendar แบบ Real-Time พร้อมซิงค์ข้อมูลลง **Google Sheets** และจัดเก็บไฟล์เอกสารการประชุมขึ้น **Google Drive** โดยอัตโนมัติ

---

## 🚀 ฟีเจอร์หลัก (Core Features)

1. **Dashboard & Interactive FullCalendar**:
   - สรุปสถิติห้องประชุมประจำวัน (ห้องว่าง, กำลังใช้งาน, จำนวนการจองวันนี้)
   - ปฏิทินแสดงตารางการใช้ห้องประชุม (มุมมอง Month, Week, Day) แยกสีตามห้อง
   - คลิกที่ช่องว่างของปฏิทินเพื่อเปิดฟอร์มจองด่วน หรือคลิกที่แถบการจองเพื่อดูรายละเอียด
2. **Anti-Overlap Engine (ป้องกันการจองเวลาซ้อนทับ)**:
   - ตรวจสอบความขัดแย้งของช่วงเวลาแบบเข้มงวด `existing.startTime < newEnd && existing.endTime > newStart`
   - ทำงานภายใต้ Database Transaction ป้องกันปัญหา Race Condition กรณีมีผู้จองพร้อมกัน
   - แจ้งเตือน 409 Conflict พร้อมระบุชื่อผู้จองและเวลาที่ชนกันทันที
3. **Google Workspace Sync (Sheets & Drive)**:
   - **Google Sheets Sync**: Auto-sync บันทึกรายการจองลง Google Sheets ทันทีที่จองสำเร็จ และมีปุ่ม Export ประวัติทั้งหมดลงแท็บ Sheet ใหม่
   - **Google Drive Integration**: อัปโหลดไฟล์เอกสารการประชุม (PDF, Slide PPTX, Word, รูปภาพ) ขึ้น Google Drive Folder และสร้างลิงก์สำหรับคลิกเปิดดูได้ทันที
   - **Mock Fallback Mode**: ระบบสามารถทำงานและทดสอบได้อย่างสมบูรณ์แม้ยังไม่ได้ระบุ GCP Credentials
4. **Real-time Notifications (Server-Sent Events)**:
   - ใช้ SSE (`/api/realtime`) อัปเดตข้อมูลบนปฏิทินของทุกหน้าจอทันทีที่มีการจองหรือยกเลิก โดยไม่ต้องรีเฟรชหน้าเว็บ
5. **Reporting & Exporting**:
   - กรองประวัติการจองตามช่วงวันที่และตามห้องประชุม
   - ส่งออกข้อมูลเป็นไฟล์ Excel (`.xlsx`) และส่งออกไปยัง Google Sheets

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14+ (App Router, TypeScript), Tailwind CSS, Lucide React, FullCalendar
* **Backend**: Next.js Route Handlers (Node.js runtime)
* **Database & ORM**: Prisma ORM + SQLite (เริ่มต้นใช้งานได้ทันทีโดยไม่ต้องตั้งค่า Server เสริม) / รองรับ PostgreSQL
* **Real-time Layer**: Server-Sent Events (SSE) + Event-driven Architecture
* **Google APIs**: `googleapis` (Sheets API v4 & Drive API v3) ผ่าน Google Service Account
* **Testing**: Vitest (Unit & Integration tests)

---

## 📦 การติดตั้งและการรันระบบ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าฐานข้อมูลและสร้างข้อมูลจำลอง (Seed Data)
```bash
# Push Prisma Schema ไปยังฐานข้อมูล SQLite (dev.db)
npx prisma db push

# ใส่ข้อมูลจำลองเริ่มต้น (ห้องประชุม 4 ห้อง, ผู้ใช้, รายการจองตัวอย่าง)
npm run seed
```

### 3. เริ่มต้นรันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### 4. รันการทดสอบ Unit & Integration Tests
```bash
npm run test
```

---

## 🔑 คู่มือการตั้งค่า Google Cloud Platform (GCP) Credentials

หากต้องการเชื่อมต่อระบบเข้ากับ **Google Sheets** และ **Google Drive** ของจริง ให้ทำตามขั้นตอนต่อไปนี้:

### ขั้นตอนที่ 1: สร้าง Service Account บน Google Cloud Console
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/) แล้วเลือกหรือสร้างโปรเจกต์ใหม่
2. ไปที่ **APIs & Services > Library** แล้วค้นหาและกด **Enable** ทั้ง 2 APIs:
   - **Google Sheets API**
   - **Google Drive API**
3. ไปที่ **IAM & Admin > Service Accounts** แล้วคลิก **Create Service Account**
   - ตั้งชื่อ เช่น `meeting-room-sync`
   - สิทธิ์ (Role): เลือก `Editor` หรือปล่อยว่างไว้
   - กด **Done**
4. คลิกที่ Service Account ที่สร้างขึ้น > ไปที่แท็บ **Keys** > กด **Add Key > Create new key > JSON**
5. เบราว์เซอร์จะดาวน์โหลดไฟล์ JSON Key มา ให้เปิดไฟล์ขึ้นมาดู จะพบ `client_email` และ `private_key`

### ขั้นตอนที่ 2: เตรียม Google Sheets และ Google Drive Folder
1. **Google Sheets**:
   - สร้าง Google Sheet ใหม่ขึ้นมา 1 ไฟล์
   - คัดลอก Spreadsheet ID จาก URL:
     `https://docs.google.com/spreadsheets/d/`**`<GOOGLE_SHEET_ID>`**`/edit`
   - คลิกปุ่ม **Share (แชร์)** แล้วใส่อีเมลของ Service Account (`...iam.gserviceaccount.com`) ให้สิทธิ์เป็น **Editor**
2. **Google Drive Folder**:
   - สร้าง Folder ใหม่ใน Google Drive สำหรับเก็บเอกสารประชุม
   - คัดลอก Folder ID จาก URL:
     `https://drive.google.com/drive/folders/`**`<GOOGLE_DRIVE_FOLDER_ID>`**
   - คลิกปุ่ม **Share (แชร์)** แล้วใส่อีเมลของ Service Account ให้สิทธิ์เป็น **Editor** (หรือ **Content Manager** กรณีแชร์ไดรฟ์)

### ขั้นตอนที่ 3: ระบุค่าลงในไฟล์ `.env`
เปิดไฟล์ `.env` แล้วระบุค่าดังนี้:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

GOOGLE_SERVICE_ACCOUNT_EMAIL="meeting-room-sync@your-project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID="your-project-id"

GOOGLE_SHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
GOOGLE_DRIVE_FOLDER_ID="1a2b3c4d5e6f7g8h9i0j_folder_id"
```

> [!NOTE]
> หากยังไม่ได้ใส่ค่า GCP Credentials ระบบจะทำงานใน **Mock Fallback Mode** โดยอัตโนมัติ ซึ่งยังสามารถทดสอบการจอง การอัปโหลดไฟล์ และดูปฏิทินได้ตามปกติ

---

## 🗄️ การสลับไปใช้งาน PostgreSQL (Production Database)

หากต้องการเปลี่ยนจาก SQLite เป็น PostgreSQL สำหรับใช้งานจริง:
1. เปิดไฟล์ `prisma/schema.prisma` แล้วแก้ไข:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. แก้ไขค่าใน `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/meeting_db?schema=public"
   ```
3. รันคำสั่งอัปเดต:
   ```bash
   npx prisma db push
   npm run seed
   ```
