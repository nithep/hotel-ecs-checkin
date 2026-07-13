---
title: การติดตั้ง Raspberry Pi สำหรับระบบ Smart Hotel (Production Docker)
tags: [hardware, raspberry-pi, setup, pi4, docker, production]
type: evergreen
source: docs/pi_hardware_setup.md, docs/setup_pi4.md
created: 2026-07-13
---

# 🏨 การติดตั้ง Raspberry Pi สำหรับระบบ Smart Hotel (Production Docker)

คู่มือฉบับนี้กำหนดมาตรฐานการติดตั้งระบบปฏิบัติการและสถาปัตยกรรมแอปพลิเคชันสำหรับบอร์ด **Raspberry Pi 4** เพื่อใช้งานในสภาพแวดล้อมจริง (Production) โดยเน้นความเสถียรสูงสุด (24/7), ป้องกันระบบล่มจากการ์ดหน่วยความจำพัง (Card Corruption) และสนับสนุนการจัดการจากระยะไกลผ่านระบบ AI Agent

---

## 🏗️ สถาปัตยกรรมระบบโดยสรุป (System Architecture)

ระบบถูกออกแบบให้ทำงานแบบ Containerization ผ่าน Docker เพื่อลดปัญหาเวอร์ชันซอฟต์แวร์ไม่ตรงกันและแยกส่วนการเก็บข้อมูลที่สำคัญออกจากตัวแอปพลิเคชันหลัก

* **Host OS**: Raspberry Pi OS Lite (64-bit) Bookworm
* **Container Orchestration**: Docker Compose
* **แอปพลิเคชันหลัก (`hotel-app`)**: เสิร์ฟทั้ง REST API (Node.js) และหน้าเว็บ Dashboard/Check-in (React) บนพอร์ต `3000`
* **ตัวแปลงและคุยกับตู้สาขา (`pbx-connector`)**: รวบยอดอยู่ภายในบริการหลัก โดยเชื่อมต่อผ่านเครือข่าย LAN (TCP/IP)
* **อุโมงค์ความปลอดภัย (`cloudflare-tunnel`)**: ชี้โดเมนสาธารณะ `hotel.nithep.com` กลับมายังตัวเครื่องโดยไม่ต้องเปิดพอร์ตเราเตอร์

---

## 🛠️ ขั้นตอนการติดตั้งทีละขั้นตอน (Step-by-Step Installation)

### 1. การแฟลชระบบปฏิบัติการ (OS Flashing)
ใช้โปรแกรม **Raspberry Pi Imager** บนเครื่องคอมพิวเตอร์หลัก:
1. เลือก OS: **Raspberry Pi OS (Other) -> Raspberry Pi OS Lite (64-bit)** (ไม่มี GUI ประหยัดทรัพยากร)
2. เลือก Storage: **MicroSD Card (Class A2)** หรือ **USB 3.0 External SSD**
3. กดรูปเฟือง (OS Customization) เพื่อตั้งค่าก่อนบูต:
   - Hostname: `hotel-gateway`
   - ตั้งรหัสผ่านหรือใส่ Public SSH Key ของเครื่องผู้พัฒนา (และ Agent) เพื่อล็อกอินด้วยบัญชี **`ecs-agent`**
   - ตรวจสอบให้แน่ใจว่าได้เลือก **Allow SSH key authentication only** (ปิด Password Login)

---

### 2. รันสคริปต์เตรียมโครงสร้างระบบ (Bootstrap Infrastructure)
หลังจากรีโมท SSH เข้าตัว Pi 4 ด้วยสิทธิ์ผู้ใช้ `ecs-agent` เรียบร้อยแล้ว ให้ดาวน์โหลดหรือดึงสคริปต์ [bootstrap-pi.sh](file:///c:/Users/Nithep/%E0%B9%84%E0%B8%94%E0%B8%A3%E0%B8%9F%E0%B9%8C%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%89%E0%B8%B1%E0%B8%99%20%28cnithep@gmail.com%29/Hotel-ECS/scripts/bootstrap-pi.sh) มารันบนตัวเครื่อง:

```bash
# รันสคริปต์เตรียมโฟลเดอร์ระบบและสิทธิ์การใช้งาน
sudo bash scripts/bootstrap-pi.sh
```

**สิ่งที่สคริปต์ดำเนินการ:**
* ตรวจสอบ/สร้างผู้ใช้ `ecs-agent` และจัดตั้งสิทธิ์ไดเรกทอรี
* สร้างโฟลเดอร์หลักสำหรับระบบ: `/opt/hotel-ecs/`
* แยกโฟลเดอร์ย่อย: `config/`, `data/` (เก็บไฟล์ SQLite db), `logs/`, `app/` (เก็บ source code)
* สร้างเทมเพลตไฟล์ตั้งค่าสิ่งแวดล้อม `/opt/hotel-ecs/config/.env`

---

### 3. จัดสรรซอร์สโค้ดและคอนฟิกูเรชัน (Deployment & Configuration)

1. **คัดลอกซอร์สโค้ด**:
   คัดลอกโฟลเดอร์โปรเจกต์ทั้งหมด (ยกเว้น `node_modules` และโฟลเดอร์ `.git`) ไปวางไว้ที่ `/opt/hotel-ecs/app` บนบอร์ด Pi 4

2. **แก้ไขตัวแปรระบบหน้างาน**:
   เปิดไฟล์ `/opt/hotel-ecs/config/.env` และตรวจสอบค่าตัวแปร:
   ```env
   PORT=3000
   NODE_ENV=production
   
   # การเชื่อมต่อตู้สาขาจริงผ่านเครือข่าย LAN (TCP/IP)
   PBX_MODE=tcp
   PBX_HOST=192.168.1.91        # IP จริงของตู้ PBX 
   PBX_PORT=23                  # พอร์ต TCP สื่อสาร (Telnet)
   
   DATABASE_PATH=/app/backend/hotel.db
   
   CLOUDFLARE_TUNNEL_TOKEN=your_real_cloudflare_tunnel_token
   GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook_url
   ```

3. **ติดตั้งไฟล์ Docker Compose**:
   คัดลอก [docker-compose.prod.yml](file:///c:/Users/Nithep/%E0%B9%84%E0%B8%94%E0%B8%A3%E0%B8%9F%E0%B9%8C%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%89%E0%B8%B1%E0%B8%99%20%28cnithep@gmail.com%29/Hotel-ECS/docker-compose.prod.yml) ไปวางเป็น `/opt/hotel-ecs/docker-compose.yml`

---

### 4. รันระบบผ่าน Docker Compose
จากห้องสั่งการหลักของเครื่อง Pi 4 ให้รันคำสั่ง:

```bash
cd /opt/hotel-ecs
docker compose up -d
```

ตรวจสอบสถานะการทำงานด้วยคำสั่ง:
```bash
docker compose ps
docker compose logs -f hotel-app
```

---

## 🔒 การเสริมความทนทานต่อฮาร์ดแวร์และไฟฟ้าขัดข้อง (System Hardening)

เพื่อป้องกันปัญหา SD Card เสื่อมสภาพจากการเปิดเครื่องรัน 24 ชั่วโมง และป้องกันระบบปฏิบัติการพังเนื่องจากไฟตก/ไฟดับ (Power Outage) ทางโครงการได้ใช้ระบบ **OverlayFS (Read-Only Root Filesystem)**

### 1. วิธีเปิดใช้งาน OverlayFS
บน Raspberry Pi OS Lite สามารถเปิดใช้งานผ่านคำสั่งแบบอัตโนมัติได้ทันที:

```bash
# เปิดใช้งาน OverlayFS ระบบปฏิบัติการหลักจะรันบนแรมชั่วคราว
sudo raspi-config nonint do_overlayfs 0
```
หลังจากรันแล้วให้ทำตามขั้นตอนในระบบปฏิบัติการและสั่งรีบูตเครื่อง (`sudo reboot`)

### 2. การสร้างและ Mount Partition แยกเฉพาะสำหรับเขียนข้อมูลคงทน (Persistence Partition)
เนื่องจากระบบหลักถูกล็อกเป็น Read-Only ข้อมูลฐานข้อมูล SQLite `hotel.db` จะหายไปเมื่อปิดเครื่องเพื่อเปิดใหม่ วิธีแก้ไขคือต้องสร้างพาร์ทิชันที่สามหรือเมาท์แฟลชไดรฟ์แยกต่างหากเพื่อใช้เขียนข้อมูลในโฟลเดอร์ `/opt/hotel-ecs/data/` เท่านั้น:

1. **สร้าง Directory Mount Point สำหรับ Partition ข้อมูล**:
   (ในขณะที่ระบบยังอยู่ในโหมด Read-Write หรือปิด OverlayFS ก่อนปรับเปลี่ยน)
2. **แก้ไข `/etc/fstab`** เพื่อให้ระบบเมาท์ Partition เขียนข้อมูลไปที่โฟลเดอร์เก็บบันทึกอัตโนมัติ:
   ```text
   /dev/mmcblk0p3  /opt/hotel-ecs/data  ext4  defaults,noatime,rw  0  2
   ```

---

## 🧪 ขั้นตอนการทดสอบรับมอบระบบ (UAT Checklists)

1. **ตรวจสอบความพร้อมของ Container**:
   ตรวจสอบว่าสถานะบริการทั่งหมดขึ้นเขียว `Up`
2. **ตรวจสอบการคุยกับตู้สาขา (LAN TCP/IP)**:
   ดู Log ของ `hotel-app` ว่าสามารถสถาปนาการเชื่อมต่อ TCP กับตู้ PBX ที่ IP `192.168.1.91` บนพอร์ต `23` ได้สำเร็จ:
   `[PBX] ✅ Connected in tcp mode`
3. **ทดสอบควบคุมคำสั่ง (E2E API Test)**:
   ยิง API เช็คอินห้องพักและเช็คเอาท์เพื่อส่งสัญญาณ ON/OFF ระบบไฟ แล้วตรวจดูการสะท้อนข้อมูลกลับบนฐานข้อมูล SQLite ใน Host OS `/opt/hotel-ecs/data/hotel.db`
4. **ทดสอบระบบความปลอดภัยหลังไฟดับ**:
   ทดสอบถอดปลั๊ก Raspberry Pi 4 ออกโดยไม่มีการ Shutdown แล้วเสียบกลับเข้าไปใหม่ ตรวจสอบว่าระบบบูตขึ้นมาทำงานอัตโนมัติ และข้อมูลสถานะเช็คอินเดิมของห้องพักไม่สูญหายหรือเสียหาย
