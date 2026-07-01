---
title: บันทึกความสำเร็จและการทดสอบระบบ (Milestones & Testing)
tags: [milestones, testing, pbx, pi-z2w, simulation]
type: evergreen
source: docs/milestone_piz2w_success.md, docs/milestone_simulation_success.md
created: 2026-07-02
---

# บันทึกความสำเร็จและการทดสอบระบบ (Milestones & Testing)

## 🏆 ผลงานการจำลองระบบเสร็จสมบูรณ์ (End-to-End Simulation)
การเชื่อมต่อระหว่างระบบตั้งแต่หน้าเว็บ Frontend, API Backend บน Raspberry Pi ไปยังตู้สาขาจำลอง (PBX Simulator) บน Windows ทำงานร่วมกันได้สมบูรณ์:
1. **Frontend**: หน้า Dashboard สั่ง Check-in / Check-out และอัปเดตสถานะได้ถูกต้อง (`http://192.168.1.70:3000`)
2. **Backend**: รับคำสั่งผ่าน API, อ่าน `.env` ชี้ไปยัง PBX Host และแปลงคำสั่งส่งไปยัง Connector
3. **PBX Connector**: เชื่อมต่อผ่าน TCP ข้าม LAN และมี Heartbeat Ping ทุก 30 วินาที
4. **PBX Simulator**: รับคำสั่งตอบสนอง `..VERS=` และ `..ROOM` เปลี่ยนสถานะรีเลย์จำลองได้เสถียร

## 🏆 การใช้งานบนฮาร์ดแวร์จริง Pi Zero 2 W (Production Ready)
ย้ายระบบทั้งหมดไปทำงานบน **Raspberry Pi Zero 2 W (Pi Z2W)** สำเร็จอย่างสมบูรณ์แบบ (Standalone Mode):
- หน้าเว็บ Dashboard โหลดและใช้งานได้รวดเร็วที่ `http://192.168.1.20:3000`
- **Auto-Recovery**: เมื่อ Backend เปิดขึ้นมาระบบจะตรวจสอบและกู้คืนสถานะไฟตู้ PBX ให้ตรงกับฐานข้อมูลโดยอัตโนมัติ (เช่น แก้ไขห้องที่มีสถานะ Occupied แต่ไฟปิดอยู่ให้เปิดกลับคืน)
- **Hardware Gateway**: ส่งคำสั่งและตรวจเช็ค Heartbeat กับตู้สาขาได้เสถียรไร้ปัญหา Timeout
