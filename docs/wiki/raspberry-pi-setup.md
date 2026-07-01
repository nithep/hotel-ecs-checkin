---
title: การติดตั้ง Raspberry Pi สำหรับระบบ Smart Hotel
tags: [hardware, raspberry-pi, setup, pi4, pi-z2w]
type: evergreen
source: docs/pi_hardware_setup.md, docs/setup_pi4.md
created: 2026-07-02
---

# การติดตั้ง Raspberry Pi สำหรับระบบ Smart Hotel

## สรุปสาระสำคัญ
ระบบ Smart Hotel Self Check-in/Check-out ถูกออกแบบให้รันบน **Raspberry Pi Zero 2 W** (สำหรับ Production) หรือ **Raspberry Pi 4** (สำหรับ Dev/Test) โดยต้องการ MicroSD Card 8GB+, เครือข่าย Wi-Fi หรือ Ethernet และ OS แบบ Lite 64-bit (แนะนำ Bookworm)

## ขั้นตอนการติดตั้งหลัก
1. **อัปเดตระบบ**: `sudo apt update && sudo apt upgrade -y`
2. **ติดตั้งเครื่องมือพื้นฐาน**: git, curl, wget, build-essential, python3
3. **ติดตั้ง Node.js 20 LTS**: ผ่าน NodeSource (ARMv8/ARM64 รองรับได้เลย)
4. **ติดตั้ง PM2**: ตัวจัดการโปรเซสที่ช่วยให้ระบบรีสตาร์ทอัตโนมัติเมื่อไฟดับ (`pm2 startup`)

## การตั้งค่า Static IP
- แนะนำผ่าน **DHCP Reservation ของเร้าเตอร์** (ผูก MAC Address กับ IP คงที่)
- หรือตั้งค่าผ่าน `nmtui` บนตัว Pi โดยตรง
- สำคัญมากเพื่อให้ QR Code ยังใช้งานได้หลังไฟดับ

## การรันแอปพลิเคชัน
```bash
# ติดตั้ง Dependencies
cd backend && npm install
cd ../pbx-connector && npm install

# รันด้วย PM2
pm2 start server.js --name "hotel-backend"
pm2 start index.js --name "pbx-connector"
pm2 save
```

## ข้อควรรู้
- Pi Zero 2 W ใช้ OS 64-bit ได้ → รองรับ Node.js 20 เลย
- การคอมไพล์จากซอร์สโค้ดบน Pi Zero 2 W จะช้ามาก ควรใช้ pre-built binaries
