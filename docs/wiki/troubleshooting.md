---
title: การแก้ไขปัญหาและการกู้คืนระบบ (Troubleshooting & Recovery)
tags: [troubleshooting, bugs, fixes, logs]
type: evergreen
source: docs/troubleshooting_log.md
created: 2026-07-02
---

# การแก้ไขปัญหาและการกู้คืนระบบ (Troubleshooting & Recovery)

## 📌 ปัญหาสัญญาณ Wi-Fi ของ Raspberry Pi 4 ไม่เสถียร
- **อาการ**: SSH หลุด (Connection timed out), IP เปลี่ยนสลับระหว่างการทดสอบ (เช่น `.109` เป็น `.70`), เกิด `ERR_NETWORK_CHANGED` บนหน้าเว็บ
- **การแก้ไข**: 
  - **เปลี่ยนมาเชื่อมต่อด้วยสาย LAN (Ethernet) แทน Wi-Fi** เพื่อความเสถียรสูงสุด
  - ตั้งค่า Static IP ใน DHCP Server หรือตั้งค่าบอร์ดตรงด้วย `nmtui` เพื่อความแน่นอน

## 📌 ปัญหาตู้จำลอง PBX Simulator ไม่ได้รับสัญญาณ (Connections: 0)
- **อาการ**: หน้าเว็บสั่ง Check-in สำเร็จและขึ้นสถานะใน Frontend แต่ไฟรีเลย์จำลองบน Windows (Simulator) ไม่เปลี่ยนแปลงและขึ้น Connection เป็น 0
- **สาเหตุ**: backend รันอยู่ในโหมด `Mock` ภายในตัวเนื่องจากหาไฟล์ `.env` ที่ระบุที่อยู่ของเครื่อง Simulator ไม่พบ
- **การแก้ไข**:
  1. สร้างไฟล์ `.env` ในโฟลเดอร์ของ backend (เช่น `C:\Users\Nithep\Documents\antigravity\RelaySync\backend\.env`)
  2. ระบุค่า IP ให้ถูกต้อง:
     ```env
     PBX_MODE=tcp
     PBX_HOST=192.168.1.8
     PBX_PORT=10001
     ```
  3. สั่งรีสตาร์ทโปรเซสด้วย `pm2 restart hotel-backend` เพื่อโหลด config ใหม่

## 📌 ปัญหา NPM Conflict และ TypeScript Compiler หายบน Pi Z2W
- **อาการ**: `npm install` มีปัญหา ERESOLVE จากความขัดแย้งของแพ็กเกจ `@zxing` ทำให้ไม่สามารถรันตัวคอมไพเลอร์ได้
- **การแก้ไข**:
  - ใช้คำสั่ง `npm install --legacy-peer-deps` เพื่อแก้ปัญหาความไม่เข้ากันแบบเด็ดขาด
  - ตรวจสอบความถูกต้องโดยการใช้ `npm run build` อีกครั้ง
