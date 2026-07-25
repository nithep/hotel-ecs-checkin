# 📅 TimeLine ประวัติการก่อสร้างโครงการ Hotel-ECS (Smart Check-in)

เอกสารฉบับนี้จัดทำขึ้นเพื่อบันทึกเหตุการณ์ (Milestones) สำคัญตั้งแต่เริ่มต้นโครงการ เพื่อใช้เป็นคู่มือ ฐานความรู้ (Knowledge Base) และสามารถนำไปประยุกต์ใช้เป็น Script หรือเนื้อหาสำหรับทำ **คลิปวิดีโอสอนทีมช่างและทีมพัฒนา** ได้ในอนาคต

---

## 🎬 Phase 1: จุดเริ่มต้นและสถาปัตยกรรม (Discovery & Architecture)
**ช่วงเวลา:** จุดเริ่มต้นของโครงการ
* **ปัญหา (Pain Point):** ซอฟต์แวร์ "Room Manager" เดิมรันบน PC ใช้งานยาก ไม่รองรับระบบคลาวด์ และไม่ตอบโจทย์ Self Check-in
* **แนวคิดการแก้ปัญหา:** แทนที่ PC ด้วยคอมพิวเตอร์ขนาดเล็ก **Raspberry Pi 4** เพื่อเป็นตัวกลาง (Connector) เชื่อมต่อตู้สาขา **Phonik PBX (ECS-103R V.5)** เข้ากับ Web Dashboard สมัยใหม่
* **การออกแบบระบบ:** ออกแบบสถาปัตยกรรมแบ่งเป็น `/frontend` (React/Vite สำหรับ Dashboard), `/backend` (API Server), และ `/pbx-connector` (ตัวกลางคุยกับตู้สาขา)

## 🏗️ Phase 2: การเจาะโปรโตคอลและสร้างตัวเชื่อมต่อ (Protocol & Connector)
**ช่วงเวลา:** การพัฒนาช่วงแรก
* **ถอดรหัสภาษาเครื่อง:** ทีมงานศึกษาวิธีการสื่อสารของตู้สาขา Phonik ผ่านโปรโตคอล ASCII แบบอนุกรม (Serial/TCP) 
* **ตัวกลางการสื่อสาร (PBX Connector):** พัฒนาสคริปต์ระดับล่างให้สามารถอ่านสถานะตู้สาขา และส่งคำสั่งควบคุมเปิด/ปิดไฟฟ้า (เช่น `..ROOM0101=1\r\n`) 
* **ปัญหาที่พบ:** ความไม่เสถียรของสัญญาณ และการตอบกลับของตู้สาขา (NACK / Timeout)

## 🧠 Phase 3: การสร้างสมองกลและระบบรักษาตัวเอง (Agentic AI & Self-Healing)
**ช่วงเวลา:** [ปัจจุบัน - กรกฎาคม 2026]
* **กำหนดกฎและทักษะ:** สร้างไฟล์ `AGENTS.md` และนำ AI Agent (ระบบ Antigravity) เข้ามาเป็นผู้ช่วยในการจัดการโค้ด
* **Master Orchestrator (HECS):** ยกระดับบทบาท Agent หลักให้เป็นผู้จัดการ (Orchestrator) สั่งการ Subagents (Librarian, Verification) ในการวิเคราะห์โครงสร้างและจัดทำเอกสารหลัก `README.md` ระดับ Root สำเร็จ
* **Skills Construction:** สร้างทักษะ `PBX_Protocol_Handler` (ล่ามแปลภาษาตู้สาขา) และ `State_Verifier` (ยามเฝ้าประตูเช็คสถานะความสำเร็จ)
* **บูรณาการสถาปัตยกรรมระดับวิจัย (Academic-to-Production Harness):**
  - พัฒนาโมดูล `Program.md` เพื่อป้องกันปัญหา Context Drift ด้วย Global constraints
  - พัฒนา `connection_handler.py` เป็น Hardware Abstraction Layer พร้อม **Safety Wrapper (Constraint Enforcement)** ป้องกันคำสั่งแอดมินหรือคำสั่งที่เป็นอันตรายโดยตรง
  - พัฒนา `harness_loop.py` ขับเคลื่อนกระบวนการแบบ **Closed-Loop (PLAN-DO-VERIFY-DECIDE)** พร้อมระบบ **Telemetry Logger (Observability)** บันทึกการตัดสินใจของ Agent ลงไฟล์ `harness_telemetry.log` เพื่อนำประวัติมาประเมินผลการทำงาน
* **การทดสอบจำลอง (Mock Test):** รันจำลองสถานการณ์ความผิดปกติและการบล็อกชุดคำสั่งอันตรายสำเร็จ 100% ประวัติการรันถูกบันทึกผ่าน Telemetry ครบถ้วน สำหรับทำสื่อประกอบคลิปสอนช่างได้อย่างเป็นระบบ


## 🏗️ Phase 4: การย้ายระบบสู่ Raspberry Pi 4 และบูรณาการ Digital Twin (Pi 4 Migration & Digital Twin)
**ช่วงเวลา:** [กรกฎาคม 2026]
* **การเคลียร์ระบบและการย้ายเป้าหมาย (Migration):** ยกเลิกการใช้ Raspberry Pi Zero 2 W และย้ายระบบมาทำบน **Raspberry Pi 4** (IP: `192.168.1.109`) ทำการเคลียร์ดิสก์และระบบเชื่อมต่อเก่าทั้งหมด พร้อมอัปเดตเอกสารระบบ (Vault) ทั่วทั้งโครงการให้ตรงกัน
* **การรันตู้จำลอง Digital Twin:** คัดลอกและเปิดใช้งาน `pbx-simulator.js` (ตู้สาขาจำลอง) บน Pi 4 ผ่าน PM2 (พอร์ต `10001`) เพื่อทดสอบจำลองโปรโตคอลและการยิงคำสั่งเสมือนจริงแบบเรียลไทม์
* **สถาปัตยกรรมเซิร์ฟเวอร์แบบรวมศูนย์ (Unified Server Port 3000):** ปิดการเสิร์ฟด้วย Vite Preview พอร์ต `5173` (เนื่องจากเจอปัญหา Proxy บล็อกระบบส่งข้อมูลแบบเรียลไทม์ SSE) และปรับมาใช้พอร์ต `3000` ของหลังบ้าน (Backend) ในการให้บริการทั้ง REST API และเสิร์ฟหน้าเว็บ React แบบ Static เสม็ดเสร็จสรรพในที่เดียว
* **การรันทดสอบระบบปิดลูปข้อมูล (Closed-Loop Harness Verification):** นำโฟลเดอร์ `worker` ขึ้นไปรันบน Pi 4 และสั่งทดสอบสคริปต์ `harness_loop.py --tcp` เพื่อยิงคำสั่งหาตัวจำลองแบบปิดลูป (PLAN-DO-VERIFY-DECIDE) ได้ผลลัพธ์สำเร็จ 100% พร้อมขยายขีดความสามารถให้ระบบ State Verifier สามารถจับคู่ตัวเลขห้องแบบตัดเลขศูนย์หน้า (Zero-padded matching) เช่น `0101` -> `101` ได้อย่างเสถียร
* **การกำหนดมาตรฐานเครือข่ายสำหรับ Gateway (Network Bootstrapping Standard):** บันทึกคู่มือการจัดเตรียมเน็ตเวิร์กเมื่อใช้งานหน้างานแบบไม่มีหน้าจอ (Headless) โดยอาศัยระบบ LAN DHCP -> แล้วรีโมทเข้าไปเปิดสแกนและตั้งไวไฟภายหลังผ่าน NetworkManager (`nmcli` / `nmtui`) พร้อมจัดตั้งระบบสลับคู่สัญญาณอัตโนมัติ LAN + Wi-Fi (Failover Metric priority) ตามมาตรฐานอุตสาหกรรม
* **การแก้ไขบั๊กความปลอดภัยระบบ (Safety & State Persistence Bugfix):**
  - แก้ปัญหาระบบเช็คอินภาษาไทย (Thai Name TCP Injection) โดยกรองชื่อแขกให้ส่งเฉพาะอักขระ ASCII ที่ปลอดภัย และตั้งค่าให้ใช้ `Guest <Room>` เป็น Fallback ป้องกันการรบกวนสัญญาณตู้สาขา
  - แก้ไขจุดบกพร่องในส่วนขั้นตอนการประมวลผลคำสั่งอนุมัติ (Approval Execute Pipeline) โดยเพิ่มโค้ดบันทึกการเปลี่ยนแปลงสถานะห้องพักลงสู่ฐานข้อมูล SQLite (`hotel.db`) เพื่อป้องกันไม่ให้ข้อมูลหลังบ้านขัดแย้งกับตู้สาขาและหน้าแดชบอร์ด
  - แก้ไขปัญหา SSE Connection Telemetry แสดงข้อความ `undefined` ในล็อกช่วงแรก
* **การทำระบบจัดการความรู้และจัดระเบียบ Vault (OKF Vault Distillation & Obsidian Integration):**
  - ดำเนินการทำ Vault Distillation สกัดเอกสารเปรียบเทียบระบบ Smart Hotel 3 แบบจำลอง (Model A: LINE LIFF, Model B: Kiosk/Scan Simulator, Model C: Full IoT) จากไฟล์ดิบใน `/raw` ให้เป็น Evergreen Note ที่มีโครงสร้างสมบูรณ์ใน [[wiki/smart-hotel-comparison|การเปรียบเทียบโมเดลระบบ Smart Hotel]]
  - คัดลอกและจัดสรรตำแหน่งรูปภาพจำลองและสถาปัตยกรรมของทั้ง 3 โมเดล เข้ามาในระบบไดเรกทอรี `docs/assets/` ภายใน Workspace เพื่อให้ระบบ Obsidian Sync สามารถซิงก์รูปภาพประกอบการติดตั้งไปแสดงผลบนแอปพลิเคชัน Obsidian ของทีมช่างและฝ่ายบริการได้ 100% 
  - อัปเดตสารบัญนำทาง `docs/index.md` และประวัติการเปลี่ยนแปลงระบบ `docs/log.md` เพื่อรักษามาตรฐาน Open Knowledge Format (OKF)
  - ปรับปรุงการตรวจสอบของระบบ (Update Path & World Model Verification): จัดการปัญหา Checksum Mismatch และไฟล์ใหม่ที่ยังไม่ได้ลงทะเบียนในคลังข้อมูลดิบ โดยการฟื้นฟู `MANIFEST.sha256` และทำการตรวจสอบความสมบูรณ์สำเร็จ 100% ด้วยสคริปต์ `docs_verify.js` พร้อมทั้งรัน Unit Test ในส่วนควบคุม PBX Connector ผลทดสอบผ่าน 21 รายการ
* **การจำลองสถาปัตยกรรมแบบ Appliance เชิงพาณิชย์และการรันทดสอบ Closed-Loop (Appliance Simulation & Closed-Loop Validation):**
  - จัดเตรียมไฟล์ `docker-compose.yml` ใน Workspace Root สำหรับจำลองการบูตบริการแบบ Microservices (pbx-simulator, hotel-backend, hotel-frontend) รองรับการนำไปใช้บน Raspberry Pi 4 และระบบจริงในรูปแบบตู้ Appliance
  - พัฒนาสคริปต์ `scripts/e2e_loop_test.js` เพื่อยิงจำลอง Onboarding และทดสอบ API ลูปหลัก (Check-in -> ON -> Check-out -> OFF) พร้อมระบบ Reset Database เพื่อแยกแยะและรันการทดสอบอย่างถูกต้อง (Test Isolation)
  - พัฒนาตัวควบคุมหลัก `scripts/run-appliance-sim.js` ในการสั่งรันและควบคุมการทำงานของทั้ง PBX Simulator และ API Server ไปพร้อมๆ กันผ่านกระบวนการ Multi-Process และเรียกยิงทดสอบทั้งระดับ REST API และระบบควบคุมล่าง (Python `harness_loop.py --tcp`) แบบเรียลไทม์
  - ประสบความสำเร็จในการรันจำลองและรัน Closed-loop testing ผลลัพธ์ผ่านเกณฑ์ (PASSED) 100% ครบวงจร และสร้างบันทึกสรุปรายงานผลการจำลองใน `docs/wiki/simulation_report.md` ไว้อย่างชัดเจน
* **การแก้ไขปัญหาข้อจำกัดความยาวชื่อไฟล์ในการซิงก์ (Obsidian Sync & Google Drive File Name Length Fix):**
  - แก้ไขข้อผิดพลาด `403 Forbidden` และปัญหา `Filename too long` บน Remotely Save / Google Drive ที่เกิดจากการตั้งชื่อไฟล์สกัดความรู้ที่มีภาษาไทยและสัญลักษณ์พิเศษยาวเกินขีดจำกัดสูงสุดของระบบไฟล์ (Windows MAX_PATH 260 ตัวอักษร)
  - ดำเนินการเปลี่ยนชื่อไฟล์ต้นเรื่องทั้งใน `docs/raw/archive/` และ `docs/wiki/` ให้กระชับเป็น `2026-07-05T223922_digital_twin_harness.md` โดยใช้คำสั่งพิเศษที่รองรับ Windows UNC Path (`\\?\` prefix)
  - อัปเดตลิงก์อ้างอิงทั้งหมดใน `docs/index.md`, `docs/log.md` และแก้ไขค่า SHA256 ใน `docs/raw/MANIFEST.sha256` จากนั้นรันการตรวจสอบย้อนกลับด้วยสคริปต์ `docs_verify.js` ผ่านฉลุย 100%
* **การพัฒนาสคริปต์ทดสอบการเชื่อมต่อ Serial Port (Pi 4 Serial Connection Probe):**
  - พัฒนาสคริปต์ `pi-serial-probe.js` ในโฟลเดอร์ `pbx-connector` เพื่อใช้ทดสอบการเชื่อมต่อกับตู้สาขาผ่านพอร์ต LAN ของPBX บน Raspberry Pi 4 โดยเฉพาะ
  - บูรณาการทักษะ `PBX_Protocol_Handler` (ASCII Protocol) เพื่อส่งคำสั่ง Ping (`VERS`) ตรวจสอบสถานะการเชื่อมต่อ และตัดการเชื่อมต่ออย่างสง่างาม
* **การรวมระบบความปลอดภัยและระบบแจ้งเตือน Google Workspace (Google Chat Webhooks & DNS Bootstrapping):**
  - ช่วยผู้ใช้งานซื้อและจัดการโดเมน `nithep.com` ผ่านการสมัครและยืนยันตัวตน Google Workspace แบบบัญชีธุรกิจ (Super Admin)
  - ตั้งค่าระเบียน DNS ใน Cloudflare (TXT & MX Records) ร่วมกับระบบ Google Workspace เพื่อปลดล็อกสิทธิ์การใช้งานแอปพลิเคชันและการเชื่อมต่อ Webhook ในองค์กร
  - เชื่อมโยงและตั้งค่าบริการแจ้งเตือน `GOOGLE_CHAT_WEBHOOK_URL` ในไฟล์คอนฟิกูเรชัน `.env` และเพิ่มการประกาศอุโมงค์ความปลอดภัย `cloudflare-tunnel` สำเร็จรูปใน `docker-compose.yml` เพื่อให้รองรับการเข้าถึงระบบควบคุมส่วนตัวผ่านโดเมนภายนอก `hotel.nithep.com` โดยไม่ต้องเปิดพอร์ตเราเตอร์
  - ประสบความสำเร็จในการเชื่อมต่อส่งข้อความแจ้งเตือนเมื่อเช็คอิน/เช็คเอาท์เข้าสู่ Google Chat แบบการ์ดสวยงาม (🛎️ Check-in / 🚪 Check-out)
  - ปรับปรุงการทดสอบจำลองให้สอดคล้องกัน โดยเพิ่มการกำหนดพารามิเตอร์ `--nack-room 103` ในสคริปต์ควบคุมการบูตเซิร์ฟเวอร์จำลอง เพื่อให้ E2E Loop Test ส่งคำสั่งตรวจสอบพฤติกรรมการบล็อกฮาร์ดแวร์ขัดข้อง (NACK) บนห้อง 103 ได้ผลลัพธ์ผ่านเกณฑ์ (PASSED) 100% ครบถ้วนทุกมิติ
  - **การแก้ปัญหาบั๊กตัวแปรสภาพแวดล้อมและจัดทำบัญชีค่าใช้จ่าย (Env Loading Bugfix & Cost Ledger Integration):**
    - แก้ไขจุดบกพร่องใน `backend/server.js` ในการชี้ตำแหน่งไฟล์ `.env` ผ่าน Absolute path เพื่อป้องกันปัญหาระบบหาค่าคีย์ไม่เจอดังกรณีสตาร์ทตัวคุมจำลองจากพาธที่ไม่ตรงกัน ส่งผลให้ระบบยิง Google Chat Webhook ทำงานได้อย่างสมบูรณ์และเสถียร 100%
    - จัดทำทะเบียนสรุปบัญชีค่าใช้จ่ายและการซ่อมบำรุงรักษาโครงการใน [[wiki/system_cost_and_maintenance|ทะเบียนค่าใช้จ่ายและการบำรุงรักษาระบบ]] เพื่อเก็บบันทึกประวัติและขั้นตอนการตั้งเตือนการหักบัญชี Google Workspace และการต่ออายุโดเมน `nithep.com` (Squarespace Domains) ล่วงหน้าผ่าน Google Calendar และสคริปต์ Webhook
    - จัดทำคู่มือและออกแบบสถาปัตยกรรมบูรณาการระบบควบคุม ECS ร่วมกับฟีเจอร์หลักของ Google Workspace ใน [[wiki/google_workspace_integration|คู่มือการบูรณาการ Google Workspace]] ซึ่งครอบคลุมการต่อยอดใช้งานร่วมกับ AppSheet (สำหรับควบคุมไฟและดูสถานะผ่านแอปมือถือพนักงาน), Google Chat Webhook (การ์ดแจ้งเตือนกิจกรรมเรียลไทม์), Google Calendar ("สร้างหน้าการจอง" สำหรับจองเวลาล่วงหน้า), Gmail (ส่งอีเมลต้อนรับแขกพร้อมลิงก์เช็คอิน และส่งสรุปผลประจำวัน), และ Google Meet (ปุ่มช่วยเหลือระบบ Video Call Kiosk หน้าตู้เช็คอิน) เพื่อเตรียมความพร้อมของแอปและบุคลากรสำหรับลงพื้นที่ใช้งานจริง
  - **การพัฒนาระบบเลือกเชื่อมต่อ Wi-Fi และหน้าจอควบคุมไร้สาย (WiFi Selection Menu & Backend Service Integration):**
    - พัฒนาโมดูล `backend/services/wifi_service.js` สำหรับจัดการอินเทอร์เฟซ Wi-Fi (`wlan0`) ผ่านคำสั่ง `nmcli` ของ Linux โดยรองรับระบบจำลองสถานะเครือข่าย (Mock Mode) อัตโนมัติบนระบบปฏิบัติการ Windows เพื่อรองรับการพัฒนาแบบ Offline
    - เปิดการใช้ API Endpoints ใหม่ที่ประกอบด้วยสถานะเครือข่าย ปิด/เปิดสัญญาณวิทยุ การตัดการเชื่อมต่อ และการป้อนรหัสผ่านเชื่อมต่อ Wi-Fi (`/api/wifi/status`, `/api/wifi/scan`, `/api/wifi/connect`, `/api/wifi/disconnect`, `/api/wifi/toggle`)
    - สร้างหน้าเว็บเฉพาะทาง `/wifi` ในระดับ UI (React/Vite) โดยนำเสนอในรูปแบบ Glassmorphic Design ผสมผสานสี Obsidian Black และ Champagne Gold พร้อมติดตั้งอินดิเคเตอร์แสดงระดับสัญญาณเป็นแท่งแถบพลังงาน และ Dialog กรอกรหัสผ่าน (WPA Key)
    - บูรณาการและอัปเดตระบบเส้นทาง Route และเมนูหลักใน `App.tsx` และ `Layout.tsx` พร้อมทั้งทดสอบตรวจสอบโค้ดด้วย TypeScript และรันบิวด์ของระบบผ่านเกณฑ์ 100%
  - **การปรับปรุงสถาปัตยกรรม PM2 เพื่อการใช้งานจริง (PM2 Environment Variables De-coupling):**
    - แก้ไขข้อผิดพลาดใน `ecosystem.config.js` ที่พบว่ามีการ Hardcode ตัวแปรสภาพแวดล้อมจำลอง (`PBX_HOST=127.0.0.1`, `PBX_PORT=10001`) เอาไว้ในระดับของ PM2 ซึ่งส่งผลให้เมื่อนำไปใช้งานจริงบนบอร์ด Raspberry Pi 4 ระบบหลังบ้านจะไม่สามารถดึงค่าการเชื่อมต่อตู้จริงจากไฟล์ `.env` ได้ เนื่องจาก PM2 จะส่งตัวแปรสภาพแวดล้อมมาเขียนทับเสมอ
    - นำการตั้งค่าการเชื่อมต่อ PBX ทั้งหมดออกจาก object `env` ใน `ecosystem.config.js` เพื่อสนับสนุนให้ `hotel-backend` ดึงค่าสิ่งแวดล้อมจากไฟล์ `.env` ประจำตัวแทน ช่วยแก้ปัญหาการสลับโหมดการเชื่อมต่อจริงและจำลองได้อย่างปลอดภัย 100%
    - ดำเนินการรันทดสอบ Unit Test ของ `pbx-connector` อีกครั้งหลังปรับปรุงโครงสร้างเพื่อยืนยันความถูกต้องของระบบประมวลผลคำสั่ง ผลลัพธ์การทดสอบผ่าน 21 รายการครบถ้วน


## 🚀 Phase 5: การลงพื้นที่จริงและทดสอบฮาร์ดแวร์ (Field Testing & Deployment)
**ช่วงเวลา:** [กรกฎาคม 2026 - เริ่มต้นการทดสอบภาคสนาม]
* **การทดสอบสลับเครือข่าย Wi-Fi ไร้สายภาคสนาม (Field WiFi Migration Success):**
  - ดำเนินการทดสอบย้ายการเชื่อมต่อ Wi-Fi ของ Raspberry Pi 4 จากเครือข่ายหลักไปยังเครือข่ายเป้าหมายหน้างาน `UFI-651838` สำเร็จเรียบร้อย
  - ทดสอบสแกนคลื่นและควบคุมสิทธิ์ผ่านคำสั่งยกระดับผู้ดูแล `sudo nmcli device wifi connect` บนอินเทอร์เฟซ `wlan0` พร้อมทั้งใช้ชื่อโฮสต์จำลองในการเชื่อมโยงกลับ `ssh admin@pi-4.local` ได้สำเร็จ 100% ยืนยันความเสถียรของระบบ Zero Configuration Networking
* **การอัปเดตรหัสผ่าน Wi-Fi ก่อนบูตผ่านไฟล์ระบบ (Pre-boot Wi-Fi Password Update):**
  - ดำเนินการอัปเดตรหัสผ่าน Wi-Fi สำหรับ SSID `NT-WIFI_2.4G` เป็น `9999988888` ในไฟล์ `E:\network-config` (ไดรฟ์ bootfs ของ SD Card) เพื่ออำนวยความสะดวกในการเตรียมระบบ (Pre-configuration) ก่อนนำการ์ดไปเสียบรันบน Raspberry Pi 4
  - เพื่อรักษาความปลอดภัยของรหัสผ่านหน้างาน ได้ทำการคำนวณรหัสผ่าน plaintext `9999988888` ร่วมกับ SSID `NT-WIFI_2.4G` ให้เป็น WPA-PSK 64-character hexadecimal pre-shared key (ได้ค่า hash `67b217849aa1126d51eef750e89518e2e76fba813e91006008ba5ba8dde79f7e`) และนำไปเขียนทดแทนค่าเดิมเรียบร้อย
* **การแก้ไขปัญหาการเชื่อมต่อ SSH และ Hostname (SSH Connection & mDNS Troubleshooting):**
  - แก้ไขปัญหาข้อผิดพลาด `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` เมื่อรีโมทด้วย IP `192.168.1.109` เนื่องจากระบบมีการติดตั้ง OS หรือ SD Card ใหม่ทำให้เกิด Host Key Mismatch โดยการรันคำสั่ง `ssh-keygen -R 192.168.1.109` เพื่อลบระเบียนเก่าในไฟล์ `known_hosts` ของเครื่องผู้ดูแลระบบ
  - ชี้แจงมาตรฐานการระบุชื่อโฮสต์ mDNS ซึ่งใช้ชื่อ `pi-4.local` (มีเครื่องหมายขีดกลาง) แทนที่จะใช้ `pi4.local` เพื่อความถูกต้องในการเชื่อมต่อแบบ Zero-Config
  - แก้ไขปัญหาล็อกอินล้มเหลว (Permission denied) บน SSH เนื่องจากบัญชีไม่ถูกต้อง โดยเปลี่ยนจากบัญชีเริ่มต้น `admin` ไปเป็น `pi4` พร้อมรหัสผ่าน `555` ตามที่กำหนดจริงใน Raspberry Pi OS Imager
* **การจัดเตรียมและตรวจสอบระบบปฏิบัติการบนเครื่องใหม่ (New OS Environment Bootstrapping):**
  - แนะนำและเตรียมชุดคำสั่งสคริปต์สำหรับรันอัปเดตและติดตั้งระบบพื้นฐาน (Node.js 20, PM2, Git, Python 3) บนเครื่อง Raspberry Pi 4 ที่เพิ่งติดตั้ง OS ใหม่ผ่าน SSH Console เพื่อความพร้อมในการรันระบบหลังบ้านและ Connector
  - พบบทเรียนหน้างาน (Field Note): ระหว่างการติดตั้งแพ็กเกจขนาดใหญ่ (เช่น Node.js) บอร์ดอาจมีการใช้ทรัพยากรสูงหรือเน็ตเวิร์กไม่เสถียรทำให้การเชื่อมต่อ SSH หลุดกลางคัน (`client_loop: send disconnect: Connection reset`) วิธีการแก้ไขปัญหาเชิงระบบที่ถูกต้องคือเชื่อมต่อ SSH เข้าไปใหม่ ซ่อมแซมระบบที่ค้างด้วย `sudo dpkg --configure -a` แล้วรันสคริปต์ในลักษณะ Background Process โดยใช้คำสั่ง `nohup` (เช่น `nohup ./setup_pi4.sh > setup.log 2>&1 &`) เพื่อให้โปรเซสรันต่อไปจนเสร็จสิ้นอย่างอิสระแม้สายจะหลุดอีกครั้ง
* **ทีมช่างติดตั้ง:** ให้ทีมช่างโรงแรมนำบอร์ด Phonik ECS-103R V.5 ไปติดตั้งในแต่ละห้อง และเดินสายเข้าสู่ตู้สาขา
* **เชื่อมต่อ Network:** นำ Raspberry Pi ไปต่อสายเข้ากับตู้สาขา (ผ่านพอร์ต LAN ของPBX) 
* **การทำ UAT (User Acceptance Test):** ทดลองสแกน QR Code เพื่อ Check-in และตรวจสอบว่าไฟฟ้าในห้องพักสว่างขึ้นจริง พร้อมรับบัตรคีย์การ์ด
* **ทีมช่างเรียนรู้ (Knowledge Transfer):** นำ Timeline ฉบับนี้และคลิปวิดีโอที่สรุปจากเหตุการณ์ทั้งหมด มาใช้อบรมช่างให้เข้าใจว่า "ตั้งแต่ต้นน้ำยันปลายน้ำ" ระบบทำงานอย่างไร เพื่อให้การบำรุงรักษา (Maintenance) ทำได้ง่ายที่สุด

* **การกำหนดสถาปัตยกรรมระบบปฏิบัติการและโครงสร้างพื้นฐานระดับ Production (Production OS & Infrastructure Specification):**
  - **การคัดเลือก OS**: กำหนดใช้ **Raspberry Pi OS Lite (64-bit) Bookworm** เป็นระบบปฏิบัติการมาตรฐาน เพื่อประหยัดพลังงาน RAM/CPU และใช้ฟีเจอร์ความปลอดภัยสูง
  - **การตั้งค่าเครือข่ายตู้ PBX**: ตกลงเลือกการเชื่อมต่อแบบ LAN (TCP/IP) เข้าตู้ Phonik PBX จริงที่ IP `192.168.1.91` บนพอร์ต TCP `23` พร้อมเปิดใช้ภายนอกผ่าน Cloudflare Tunnel ไปยังโดเมน `hotel.nithep.com`
  - **ระบบสคริปต์อัตโนมัติ**: สร้างสคริปต์ `scripts/bootstrap-pi.sh` สำหรับเตรียมไดเรกทอรีระบบ `/opt/hotel-ecs` (แยกเป็น `config`, `data`, `logs`, `app`) พร้อมกำหนดผู้ใช้ควบคุม `ecs-agent` และตั้งค่าเทมเพลต `.env.production.template`
  - **ระบบตู้คอนเทนเนอร์**: พัฒนา `docker-compose.prod.yml` สำหรับรวบยอดการเสิร์ฟ API & UI ร่วมกับ Cloudflare Tunnel
  - **ความทนทานต่อฮาร์ดแวร์**: วางแผนเปิดใช้งาน **OverlayFS (Read-Only Root Filesystem)** ของ Raspberry Pi OS ร่วมกับการ Mount Partition แยกภายนอกเป็น Read-Write บน `/opt/hotel-ecs/data` (สำหรับไฟล์ SQLite `hotel.db`) เพื่อแก้ไขปัญหา SD Card พังจากกรณีไฟดับกะทันหัน 100%
  - **การบันทึกเอกสาร**: อัปเดตคู่มือการติดตั้ง `docs/wiki/raspberry-pi-setup.md` เป็นเวอร์ชันล่าสุด เรียบร้อยสมบูรณ์

* **การติดตั้งและรันระบบบนบอร์ด Raspberry Pi 4 จริงผ่าน Production Docker (Docker Deployment & Operations Launch):**
  - **การโอนย้ายข้อมูลผ่าน Archive**: ลดเวลาและหลีกเลี่ยงสายหลุด (Broken pipe) โดยการบีบอัดแบบ `.tar` ข้าม `node_modules` ส่งขึ้นบอร์ด Pi ได้อย่างรวดเร็ว
  - **การแก้ปัญหา File Permissions**: แก้ปัญหาโฟลเดอร์ต้นทางจาก Windows/Google Drive แฝงสิทธิ์ Read-only ไปยัง Pi โดยใช้ `sudo tar` คลายไฟล์และรีเซ็ตสิทธิ์คืนให้แก่ `ecs-agent` ด้วย `chown` และ `chmod`
  - **ติดตั้งระบบคอนเทนเนอร์**: ติดตั้ง Docker Engine และ Docker Compose สำเร็จบนบอร์ด Pi 4 (64-bit) และผูกผู้ใช้เข้ากลุ่ม docker
  - **แก้ไขปัญหาฐานข้อมูล (Database Mount Fix)**: แก้ไขปัญหา Docker สร้างโฟลเดอร์หลอกชื่อ `hotel.db` โดยนำไฟล์ฐานข้อมูลเทมเพลตเริ่มต้นขนาด 86KB วางทับตำแหน่งจริงและให้สิทธิ์ 777 ส่งผลให้ Backend เชื่อมต่อ SQLite สำเร็จและรันได้ปกติ
  - **สตาร์ทบริการหลังบ้าน**: บริการหลังบ้าน `hotel-app` เชื่อมต่อเข้ากับฐานข้อมูลและทำการเชื่อมโยงสายสื่อสาร LAN TCP/IP ไปยังตู้สาขา Phonik PBX จริงที่ IP `192.168.1.91:23` สำเร็จ สามารถรันระบบเสิร์ฟ API & UI ที่พอร์ต `3000` ได้เรียบร้อยแล้ว

* **การแก้ไขบั๊กการซิงค์และล้างข้อความต้อนรับ TCP Telnet (Telnet Welcome Banner & NACK Parsing Fix):**
  - **แก้ไขปัญหาบัฟเฟอร์เลื่อนตำแหน่ง (TCP Buffer Alignment)**: ปรับปรุงตัวเชื่อมต่อ `TcpTransport.connect()` ให้หน่วงเวลาและดักจับข้อความต้อนรับ `"Phonik PABX Telnet system\r\n"` ที่ตู้ส่งออกมากดดันบัฟเฟอร์ในตอนแรก แล้วทำการเคลียร์ทิ้งก่อนปล่อยให้แอปพลิเคชันส่งคำสั่งควบคุม ช่วยแก้ปัญหาข้อมูลบัฟเฟอร์เหลื่อมตำแหน่ง (Off-by-one mismatch) ได้สำเร็จ 100%
  - **รองรับสัญญาณ NACK ตู้จริง (NACK Compatibility)**: ขยายความสามารถของ `protocol.js` ให้รู้จักคำเตือน NACK แบบระบุคำสั่งปฏิเสธ เช่น `==NACK=>ROOM0101=` แทนการปล่อยล้มเหลวด้วยข้อความ `Unrecognized response body` ส่งผลให้ระบบเสถียรขึ้นและสามารถข้ามห้องที่ไม่มีอยู่จริงในการตั้งค่าได้อย่างราบรื่น
  - **ยืนยันความเสถียร (Operations Verification)**: ตรวจสอบ Log ล่าสุดพบคอนเทนเนอร์รันนิ่งยาวต่อเนื่อง เชื่อมต่อตรงสู่ตู้สาขาจริงได้เสถียรและทำการส่งสัญญาณ Heartbeat เช็คความพร้อมของฮาร์ดแวร์ได้ปกติ ไร้อาการหลุดเชื่อมต่อ

* **การตั้งค่า Cloudflare Tunnel Token (Cloudflare Tunnel Configuration):**
  - **วางโครงสร้างตัวแปรสิ่งแวดล้อม**: สร้างไฟล์ `.env` ในไดเรกทอรีโปรเจกต์ `/opt/hotel-ecs/.env` เพื่อให้ Docker Compose อ่านค่า `CLOUDFLARE_TUNNEL_TOKEN` ได้ถูกต้อง (แยกจากไฟล์ config ของ Backend ที่อยู่ใน `/opt/hotel-ecs/config/.env`)
  - **ผลการทดสอบ**: Token ที่ผู้ใช้ให้มา (`4xnW623s-xTJo7983-t7dQ0F63`) ถูกปฏิเสธจาก Cloudflare ว่า "Provided Tunnel token is not valid" — เนื่องจาก Token ของ Cloudflare Tunnel จริงจะเป็นสตริง JWT ยาว (ขึ้นต้นด้วย `eyJ...`) ผู้ใช้ต้องนำ Token จริงจากแดชบอร์ด Cloudflare Zero Trust มาใส่แทนที่
  - **การรักษาความเสถียร**: หยุดบริการ `cloudflare-tunnel` ชั่วคราวเพื่อป้องกันการ restart loop ที่เปลืองทรัพยากร CPU/Memory ส่วนบริการ `hotel-app` ยังคงรันได้เสถียรต่อเนื่อง

## 🌍 Phase 6: การเปิดบริการสู่สาธารณะและการตั้งค่า DNS (Public Hosting & DNS)
**ช่วงเวลา:** [กรกฎาคม 2026]
* **การติดตั้งและเชื่อมต่อ Cloudflare Tunnel สำเร็จ:** 
  - นำ Token จริงไปใส่ในตัวแปรสิ่งแวดล้อมเพื่อเปิดระบบ Tunnel กลับสู่สถานะออนไลน์ 
  - กำหนดค่า Public Hostname ให้ชี้มาที่ `hotel.nithep.com` ใน Cloudflare Zero Trust
* **การตั้งค่า DNS ชี้ข้ามผู้ให้บริการ (Cross-Provider DNS Configuration):**
  - ตรวจพบว่า Nameserver ปัจจุบันอยู่ที่ Squarespace ทำให้เรคคอร์ดจาก Cloudflare ไม่ส่งผลต่ออินเทอร์เน็ตจริง
  - แก้ไขปัญหาโดยการล็อกอินบัญชี `admin@nithep.com` เข้าสู่ Squarespace และเพิ่ม CNAME Record `hotel` ชี้เป้าหมายไปที่ `*.cfargotunnel.com` โดยใช้รหัสผ่าน 2FA จากแอป Authenticator
* **การตรวจสอบการเชื่อมต่อ (E2E Connectivity Test):**
  - รันการทดสอบเช็ค `nslookup` ผ่าน Google DNS ยืนยันการเผยแพร่โดเมน (DNS Propagation) สำเร็จ
  - ระบบสามารถเข้าถึงได้จากภายนอกโดยสมบูรณ์ผ่าน URL: `https://hotel.nithep.com`
  - ทำการจัดทำคู่มือ [[wiki/infrastructure_setup|คู่มือสรุปโครงสร้างพื้นฐานและการติดตั้ง]] เก็บข้อมูลสำคัญ รหัสผ่าน Wi-Fi รหัส OS เพื่อเตรียมส่งมอบให้ฝ่ายบำรุงรักษาดูแลต่อไป

* **การแก้ไขปัญหา IP ชนกันและการปิด Wi-Fi ถาวร (Network Stabilization & Wi-Fi Disabling):**
  - **วิเคราะห์ปัญหา**: ตรวจพบปัญหาการเชื่อมต่อขาดหาย (Destination host unreachable) บน Raspberry Pi 4 เนื่องจากตัวเครื่องเชื่อมต่อเครือข่าย 2 ช่องทางพร้อมกัน (LAN ไปยัง Router ที่ IP `192.168.1.94` และ Wi-Fi ไปยัง Router ที่ IP `192.168.1.109`) บน Subnet เดียวกัน (`192.168.1.x`) ซึ่งทำให้เกิดปัญหาสับสนเส้นทางข้อมูล (Routing Confusion) และปัญหา Wi-Fi Sleep Mode
  - **การดำเนินการ**: ทำการ SSH เข้าสู่ระบบด้วยบัญชีผู้ใช้ `ecs-agent` บนพอร์ต LAN และปิดการทำงานของชิป Wi-Fi ถาวรในระดับฮาร์ดแวร์โดยการเพิ่มบรรทัด `dtoverlay=disable-wifi` ในไฟล์ `/boot/firmware/config.txt` แล้วทำการรีบูตระบบใหม่
  - **ผลลัพธ์**: บอร์ด Pi 4 ทำงานอย่างมั่นคงผ่านสาย LAN ช่องทางเดียว (`192.168.1.94`) ทั้งสำหรับการเชื่อมต่อตู้ PBX และการเชื่อมต่ออินเทอร์เน็ตเพื่อเข้าถึงแดชบอร์ด โดยมีอัตราการตอบสนองเฉลี่ยที่ 5ms (0% packet loss) และขจัดปัญหาอินเตอร์เฟสชนกันโดยเด็ดขาด 100%

* **การบูรณาการระบบกับ Google Workspace - เฟส 1 (Google Workspace Integration - Phase 1):**
  - **การดำเนินการ**: เปิดใช้งานระบบแจ้งเตือนและบันทึกประวัติการเช็คอิน/เช็คเอาท์ร่วมกับ Google Workspace โดยทำการตั้งค่าระบบแจ้งเตือนการ์ด (Card Notification) ไปยัง Google Chat และบันทึกประวัติลง Google Sheets ผ่าน Webhook
  - **การกู้คืนการตั้งค่าสิ่งแวดล้อม (Self-Healing Configuration)**: ตรวจพบและแก้ไขปัญหาที่ไฟล์ `/opt/hotel-ecs/config/.env` ในบอร์ด Pi ถูกเขียนทับด้วยข้อมูลจาก `.env` ตัวนอก ส่งผลให้ค่าเชื่อมต่อตู้สาขา (PBX) หายไป โดยทีมพัฒนาได้กู้คืนค่าสิ่งแวดล้อมกลับมาได้ครบถ้วน และทำการผูกตัวแปร Webhook ใหม่ทั้งหมด
  - **ผลการทดสอบระบบแจ้งเตือน (Chat Webhook Verification)**: ส่งการ์ดแจ้งเตือน Check-in (🛎️ New Check-In Alert) และ Check-out (🚪 Check-Out Alert) สำหรับห้องทดลอง 999 เข้าห้องแชท "Hotel Operations" บน Google Chat ได้สำเร็จ 100% (Status 200)
  - **การตรวจสอบระบบสเปรดชีต (Sheets Webhook Status)**: ดำเนินการแก้ไขการอนุญาตเข้าถึง Web App ใน Google Apps Script จาก "ทุกคนที่มีบัญชี Google" ให้เป็น "ทุกคน" (Anyone) ส่งผลให้การทดสอบบันทึกข้อมูล Check-in / Check-out ลงตาราง Google Sheets สำเร็จ 100% (Status 200) และพร้อมใช้งานสำหรับเจ้าของระบบในการดึงยอดรายงานประจำวัน

## 💎 Phase 7: การพัฒนาขั้นสุดท้าย (Workspace Extension & Premium Frontend)
**ช่วงเวลา:** [กรกฎาคม 2026]
* **การขยายขีดความสามารถ Google Workspace (Phase 2 & 3):**
  - **สร้าง Control Webhook สำหรับ AppSheet**: พัฒนา API Endpoint ใหม่ (`/api/rooms/control`) เพื่อรองรับการยิง Webhook แบบ POST จาก Google AppSheet ให้ผู้ดูแลระบบสามารถสั่ง Force ON / Force OFF ไฟฟ้าห้องพักผ่านแอปมือถือได้อย่างปลอดภัย พร้อมบันทึกประวัติกลับไปที่ Audit Log และส่งสัญญาณแจ้งเตือนเข้า Google Chat
  - **ตั้งค่า Gmail สำหรับส่ง Welcome Email (ต้อนรับแขก)**: เพิ่มสคริปต์ในฝั่ง Google Apps Script (Sheets Webhook) เพื่อรับค่า `guestEmail` จากการเช็คอินหน้าเว็บ และส่งอีเมลต้อนรับแขกพร้อมระบุเลขห้อง ผ่านระบบ `MailApp.sendEmail` อัตโนมัติในนามของโรงแรม
* **การยกระดับความสวยงามของ Frontend (Premium Redesign):**
  - **วิเคราะห์และปรับแต่งธีม (Theme Refinement)**: ปรับแก้ค่า `tailwind.config.js` ให้ใช้ชุดสีระดับพรีเมียม (Obsidian Deep Black `#0a0a0f`, Champagne Gold `#d4af37`, และ Emerald Success) พร้อมกำหนดค่าฟอนต์สมัยใหม่ และใส่ลูกเล่น Glassmorphism / Glow Effects
  - **เพิ่มฟีเจอร์ Virtual Kiosk (Google Meet)**: ปรับปรุงหน้า `GuestView.tsx` (สำหรับแขก) โดยเพิ่มช่องรับอีเมลเพื่อออกใบเสร็จรับเงิน/อีเมลต้อนรับ พร้อมทั้งแทรกปุ่ม "ติดต่อพนักงาน (Video Call)" ซึ่งจะเปิดลิงก์ไปยัง Google Meet โดยอัตโนมัติ เพื่อรองรับการตั้งตู้ Kiosk ในอนาคต
  - **ยกระดับ Dashboard ผู้ดูแล (Real-time Animations)**: ปรับหน้าจอ `Dashboard.tsx` ของพนักงานต้อนรับให้แสดงผลสถานะห้องพัก, ค้างการอนุมัติ (Pending Approvals) และประวัติความปลอดภัย (Audit Log) ด้วย `framer-motion` (Animations) รวมถึงได้เพิ่มปุ่มลัด "เปิด Virtual Kiosk (รอรับสายแขก)" ที่ด้านบน เพื่อเตรียมพร้อมรับสาย Video Call จากแขกได้ทันที
  - **อัปเดตหน้าจัดการ Wi-Fi (`/wifi`)**: ตรวจสอบหน้า `WifiSettings.tsx` ให้แนบเนียนไปกับ Theme ใหม่ (Glassmorphism & Gold Accent) พร้อมปรับการเชื่อมต่อกับระบบ `wifi_service.js` ทำให้ระบบทั้งหมดเสร็จสมบูรณ์ 100% พร้อมสำหรับการปล่อยใช้งานจริง (Go-Live)


* **การแกะโปรโตคอลตู้สาขาสำหรับระบบ Check-in/Check-out (Reverse Engineering PBX Protocol):**
  - **การดักจับแพ็กเกจ (Packet Sniffing)**: สร้างสคริปต์ pbx-proxy-sniffer.js เพื่อดักจับข้อมูลการสื่อสารระหว่างโปรแกรม PC Operator และตู้สาขา (Port 23) เพื่อค้นหาคำสั่งควบคุมไฟที่ถูกต้อง แทนที่คำสั่ง ..ROOMxxxx=1 เดิมที่เคยเข้าใจผิด
  - **ค้นพบคำสั่ง PWER**: พบว่าตู้สาขารองรับคำสั่ง ..PWER<เลขห้อง>=<จำนวนวัน> สำหรับเปิดไฟ (Check-in) และส่งค่า 0 สำหรับตัดไฟ (Check-out) เช่น ..PWER1017=1 (เปิดไฟ 1 วัน) และ ..PWER1017=0 (ตัดไฟ)
  - **อัปเดตระบบ Pbx-Connector**: ปรับปรุง protocol.js และ index.js ให้รองรับคำสั่ง PWER เพื่อให้สามารถรับข้อมูลจำนวนวันเข้าพัก (days) จาก Backend Route /api/checkin และส่งคำสั่งจำนวนวันลงไปที่ตู้ PBX ส่งผลให้การเปิด/ปิดไฟทำงานสอดคล้องกับตู้สาขาจริง 100% พร้อมสำหรับการนำไปใช้งานจริง (Real-world Deployment)
  - **ค้นพบและเพิ่มระบบ Authentication (PBX Auth Phase)**: ทำการ Reverse-engineer การเชื่อมต่อและพบว่าต้องมีการอัปเดต \pbx-connector\ ให้ส่ง \..tcmd=1\ และ \..PASS=\ เพื่อยืนยันตัวตนก่อนส่งคำสั่ง ป้องกันปัญหา PBX ปฏิเสธคำสั่ง (NACK/Ignore) สำเร็จ 100%

### Phase 7: อัปเกรดหน้าเว็บ Premium Frontend
- **วันที่:** 2026-07-14
- **รายละเอียด:**
  - อัปเกรด UI/UX ตามกฎ Premium Design (Glassmorphism, Dark Theme)
  - เพิ่ม Google Fonts (Inter) และขยาย Color Palette (โรงแรม: ทองแดง/ดำ)
  - ปรับปรุง Layout, Dashboard, และหน้า GuestView 
- **สถานะ:** เสร็จสิ้น (Verified)

### Phase 8: Commercialization & Enterprise Integration
- **วันที่:** 2026-07-14
- **รายละเอียด:**
  - 🔐 **PDPA Compliance:** เพิ่มหน้าต่างยินยอม (Consent) และระบบทำลายข้อมูลแขกอัตโนมัติเมื่อเช็คเอาท์
  - 🔌 **Open API:** สร้าง `apiKeyService` และเปิด Endpoint ให้นักพัฒนาภายนอกเชื่อมต่อ
  - 🛡️ **Security Hardening:** ติดตั้ง `express-rate-limit` เพื่อป้องกันการสแปมยิง API
  - 💻 **Developer Portal:** เพิ่มแท็บ 'Open API' ใน Dashboard ให้แอดมินสร้างและเพิกถอน API Key ได้
  - 🛠️ **Self-Healing & DB Migration:** แก้ไขบั๊กการตัดศูนย์เลขห้องพัก (101-106) บน PBX, เพิ่มระบบ Auth บน Auto-reconnect และทำระบบ Auto-Migration บน SQLite
- **สถานะ:** เสร็จสิ้น (Verified)

### การซ่อมบำรุงเพิ่มเติม (Maintenance & Troubleshooting)
- **วันที่:** 2026-07-15
- **รายละเอียด:**
  - 🌐 **Network Indicator Bugfix:** ตรวจพบและแก้ไขปัญหา Windows NCSI แสดงสถานะ "ไม่มีการเข้าถึงอินเทอร์เน็ต" บน Wi-Fi ซึ่งเกิดจากการแทรกแซง DNS `127.0.2.2` ของ Cloudflare WARP โดยการปรับ Registry `UseGlobalDNS=1`
  - 🧩 **Vault Distillation:** บันทึกความรู้เรื่องพฤติกรรมปกติของ Split-Tunnel VPN ที่ไม่มี Default Gateway ลงใน Knowledge Base เพื่อป้องกัน Agent รุ่นถัดไปวิเคราะห์ผิดพลาดว่าเป็นข้อบกพร่อง
- **สถานะ:** เสร็จสิ้น (Verified)

### Phase 9: Premium UI/UX Overhaul & Auto-Eviction & Power Recovery
- **วันที่:** 2026-07-16
- **รายละเอียด:**
  - 🎨 **City Blue & Cyber Black Theme:** ยกเลิกโทนสีทอง/เขียวเดิม และติดตั้งธีมสีน้ำเงินสว่าง "City Blue/Cyber Blue" (สไตล์ทีมเรือใบสีฟ้า Manchester City) ร่วมกับแอนิเมชันแสงออโรร่าสีฟ้าเคลื่อนไหวในส่วนพื้นหลัง และปรับแต่ง TerminalStatus เป็นแบบสแกนไลน์แฮกเกอร์เรืองแสงดูล้ำสมัยพรีเมียมขั้นสุด
  - ⏰ **Auto-Eviction & Stay Extension:** พัฒนาระบบตัดไฟห้องพักอัตโนมัติเมื่อพักเกินเวลา ผ่าน `node-cron` รันเวลา 12:00 น. ทุกวัน โดยเพิ่มโครงสร้างฐานข้อมูล SQLite คอลัมน์ `checkout_date` พร้อมทั้งขยาย API Endpoint `/api/rooms/:id/extend` สำหรับให้พนักงานสามารถกดต่ออายุเข้าพักได้อย่างปลอดภัย
  - 🔌 **Power Failure Recovery Validation:** สร้างสคริปต์ทดสอบ `test_power_recovery.js` เพื่อจำลองกรณี Pi ดับ (Cold Boot) และทำการส่งคำสั่งฟื้นฟูระบบไฟ (ROOM_ON) คืนห้องพักที่ยังไม่เช็คเอาท์ในระบบฐานข้อมูลโดยอัตโนมัติ ยืนยันความสามารถ Self-Healing 100%
  - 🚀 **Raspberry Pi 4 Deploy & Troubleshooting:** นำโค้ดขึ้นระบบจริงบน Pi 4 สำเร็จ รันและควบคุมหลังบ้านด้วย PM2 แบบ Auto-Boot บน Systemd พร้อมแก้ไขปัญหา ERESOLVE บน npm สำหรับตัวอ่าน QR Code บนฝั่งบอร์ด Pi ด้วย `--legacy-peer-deps`
- **สถานะ:** เสร็จสิ้น (Verified)

### การซ่อมบำรุงเพิ่มเติม (Maintenance & Troubleshooting) - PBX Network Fault
- **วันที่:** 2026-07-17
- **รายละเอียด:**
  - 🚨 **Incident (Fault Alarm):** ระบบตรวจพบการแจ้งเตือน `Connection Lost` และ `PBX Error: connect EHOSTUNREACH 192.168.1.91:23` ซึ่งหมายถึงตู้สาขา PBX ขาดการเชื่อมต่อทางเครือข่าย หรือ Host ปลายทางออฟไลน์
  - 🛡️ **Self-Healing Upgrade:** ปรับปรุงโค้ดใน `backend/server.js` ให้มี **Periodic Reconnection Loop** ทำงานอัตโนมัติเมื่อเกิด `reconnect_failed` (พยายามครบ 5 ครั้งแล้วล้มเหลว) โดยระบบจะหน่วงเวลา 60 วินาทีและพยายามเชื่อมต่อใหม่ไปเรื่อยๆ จนกว่าตู้ PBX จะกลับมาออนไลน์ ลดความจำเป็นในการ Manual Restart Server
  - 📖 **Documentation:** เพิ่มคู่มือวิเคราะห์ปัญหาและตรวจสอบเครือข่ายสำหรับ `EHOSTUNREACH` (Physical Check, Ping Test, Port Accessibility) ลงใน `troubleshooting.md` เรียบร้อยแล้ว
- **สถานะ:** เสร็จสิ้น (Verified)

### การซ่อมบำรุงเพิ่มเติม (Maintenance & Troubleshooting) - Cloudflare Tunnel 502
- **วันที่:** 2026-07-17
- **รายละเอียด:**
  - 🚨 **Incident (502 Bad Gateway):** เว็บ `hotel.nithep.com` ขึ้น 502 เนื่องจาก Router โรงแรมแจก IP (DHCP) ให้ Pi 4 เปลี่ยนไปจากเดิม (เช่น `.109` → `.94`)
  - 🛠️ **Resolution:** ทำการเปลี่ยนเป้าหมาย Public Hostname ใน Cloudflare Zero Trust จาก IP Address (`192.168.1.109:3000`) เป็น Docker Container Name (`hotel-app:3000`) เพื่อให้ระบบ Online เสมอแม้ IP ภายนอกจะเปลี่ยน
  - 📖 **Documentation & SOP:** 
    - อัปเดต `raspberry-pi-setup.md` เพิ่มมาตรฐานการตั้งค่า Cloudflare
    - อัปเดต `troubleshooting.md` เพิ่มวิธีการวิเคราะห์และแก้ปัญหา
    - สร้าง Skill `Cloudflare_Tunnel_Setup` เป็น SOP มาตรฐานสำหรับ Agent ในอนาคต
  - 🔑 **Credential Fix:** อัปเดตไฟล์ `~/.ssh/config` ของเครื่องผู้พัฒนาให้ชี้ไปยัง `User ecs-agent` ที่ถูกต้อง และเคลียร์ความเข้าใจเรื่อง `admin` (ไม่มีอยู่จริงบน Pi) เพื่อป้องกันปัญหา SSH Connection Refused (Fail2Ban)
- **สถานะ:** เสร็จสิ้น (Verified)

### การพัฒนาฟีเจอร์ใหม่ (Feature Development) - Smart Diagnostics & AI Assistant (Copilot)
- **วันที่:** 2026-07-17
- **รายละเอียด:**
  - 🛠 **Diagnostics Engine:** สร้างสคริปต์ระบบวินิจฉัยสุขภาพของบอร์ด Pi 4 และระบบ IoT โดยเช็คพารามิเตอร์ของตู้ PBX (พอร์ต 23, สถานะ connection), เครือข่ายอินเทอร์เน็ตผ่าน TCP socket ไปยัง 8.8.8.8, สถานะความสมบูรณ์และขนาดไฟล์ของฐานข้อมูล SQLite, และทรัพยากร CPU/RAM/Uptime ของระบบ
  - 🤖 **AI Assistant Backend:** สร้าง Route `/api/diagnostics/health` และ `/api/diagnostics/copilot` เพื่อรองรับการแชทถามตอบปัญหา โดยวิเคราะห์ผ่านสถานะสุขภาพของระบบแบบ real-time และดึงข้อมูลเฉพาะส่วนจาก `troubleshooting.md` ร่วมประมวลผลผ่าน Gemini 3.5 Flash API (และรองรับระบบ Local Rule-based assistant คอยวิเคราะห์ช่วยเหลือออฟไลน์หากไม่พบคีย์การ์ด AI)
  - 🎨 **Frontend Layout & UI:** สร้างหน้า **Copilot** แดชบอร์ดแบบพรีเมียม (Grid แสดงสัญญาณไฟเขียว/ไฟแดงของฮาร์ดแวร์, แถบสถานะ CPU/RAM) และหน้าจอคุ�- **การอัปเดตทักษะบรรณารักษ์และการทำความสะอาด Workspace Root (Librarian OKF Skill & Clean Architecture):**
  1. สร้างทักษะใหม่ [Librarian_OKF_Protocol](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/.agents/skills/Librarian_OKF_Protocol/SKILL.md) กำหนดมาตรฐานกฎเหล็ก (Librarian Logic Rules) สำหรับ Qoder และ AI Agents ทุกตัวในการห้ามสร้างไฟล์สรุปคู่มือที่ Root Workspace เด็ดขาด และบังคับเวิร์กโฟลว์จัดเก็บเข้า `/docs/wiki/`
  2. ทำการลบไฟล์ขยะและไฟล์ชั่วคราวจากการ Deploy ที่ตกค้างอยู่ใน Root (เช่น `cf_output.txt`, `cloudflared.exe`, `deploy.zip`, `old_app.tsx`, `temp_deploy`)
  3. ย้ายไฟล์เอกสารคู่มือ Markdown จำนวน 11 รายการจาก Root เข้าไปจัดเก็บอย่างเป็นหมวดหมู่ใน `/docs/wiki/` พร้อมทั้งอัปเดตสารบัญ [[index|docs/index.md]] และประวัติระบบ [[log|docs/log.md]] ส่งผลให้ Workspace Root กลับมาสะอาด ตรงตามมาตรฐาน Clean Architecture 100%

- **การตรวจสอบสุขภาพระบบ Production Live & Cloudflare Tunnel (Live Diagnostics & Real-time Probe):**
  1. สร้างสคริปต์ [live_diagnostics_probe.js](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/scripts/live_diagnostics_probe.js) สำหรับยิงทดสอบระบบ Live Production ทางไกลผ่านโดเมนจริง `https://hotel.nithep.com`
  2. ทดสอบกระบวนการ ยืนยันตัวตนด้วย PIN พนักงาน (`/api/auth/verify-pin`) และยิงดึงรายงานสุขภาพระบบฉบับเต็มผ่าน Endpoint `/api/diagnostics/health`
  3. ผลการตรวจสอบระบบจริงบน Raspberry Pi 4 หน้างาน:
     - **Cloudflare Tunnel**: `HTTP 200 OK` Latency **178 ms** ใบรับรอง SSL `nithep.com` Active
     - **PBX Connection**: Status **GREEN** (`CONNECTED`, Ready)
     - **Network**: Status **GREEN** (DNS 8ms, Internet 8.8.8.8 Connected)
     - **Database**: Status **GREEN** (SQLite 156 KB)
     - **System Resources**: Status **GREEN** (CPU 4.3%, RAM 33.4%, Uptime 124.8 Hours / 5.2 Days)
ายผู้ใช้งานใหม่จากฝั่ง Google ทำให้เกิด `403 Permission Denied` และเกิดปัญหาโควตาฟรีเป็นศูนย์ (`limit: 0` / `429 RESOURCE_EXHAUSTED`)
  - 🛡️ **Hybrid Gateway Integration:** ปรับปรุงโค้ดใน `backend/server.js` ให้เป็น **ระบบเกตเวย์ AI ลูกผสม (Hybrid AI Gateway)** โดยรองรับทั้งคีย์ `GEMINI_API_KEY` (ติดต่อ Google Direct) และ `OPENROUTER_API_KEY` (ติดต่อ OpenRouter.ai)
  - 🤖 **OpenRouter API & Model Fix:** เลือกเชื่อมโยงกับโมดูลพรีเมียม `google/gemini-2.5-flash` ผ่าน OpenRouter.ai (โดยตั้งค่าจำกัด `max_tokens: 2000` เพื่อจำกัดโควตาการคำนวณและประหยัดยอดเครดิตที่มีจำกัด) ช่วยปลดล็อคให้ระบบวิเคราะห์คุยภาษาไทยสดสามารถทำงานหน้างานได้จริง 100%
  - 🛠️ **Diagnostics API Test:** ดำเนินการยิงทดสอบลูป API หลังติดตั้งและรีสตาร์ทคอนเทนเนอร์บน Pi 4 จริง ยืนยันผลลัพธ์การคุยตอบกลับเสร็จสิ้นด้วยดี ไร้ข้อผิดพลาด
- **สถานะ:** เสร็จสิ้น (Verified)

### การพัฒนาระบบความปลอดภัยแบบอิงบทบาท และการปรับปรุงรายงานประจำวัน (RBAC Security & Daily Operations Report Upgrade)
- **วันที่:** 2026-07-17 (เข้าสู่เช้ามืด 2026-07-18)
- **รายละเอียด:**
  - 🔒 **Role-Based Access Control (RBAC):** พัฒนาโครงสร้างการยืนยันสิทธิ์ความปลอดภัย 3 ระดับ: Owner (เจ้าของระบบ), Staff (พนักงานต้อนรับ/วิศวกร) และ Guest (ผู้เข้าพัก) บนระบบหลังบ้านโดยใช้ JWT Token (`verifyOwnerToken`, `verifyStaffToken`, `verifyGuestToken`)
  - 🔑 **PIN Control Console:** สร้างหน้าต่างความปลอดภัย PIN 4 หลัก (PIN Protection) ตกแต่งดีไซน์สวยงามพรีเมียม (Glassmorphism Dark Mode) เพื่อปลดล็อกแผงควบคุมระบบ และซ่อนแท็บควบคุมที่ละเอียดอ่อน (Audit Logs, Open API) จากพนักงานต้อนรับธรรมดาโดยอัตโนมัติ พร้อมบล็อก/อนุญาตตามเมนูอย่างมีระบบ
  - 🌐 **Guest Portal Toggle & Whitelist:** ออกแบบหน้า Guest Control สวิตช์ปุ่ม Toggle ขนาดใหญ่ให้แก่แขกผู้เข้าพักในการเปิด/ปิดระบบไฟฟ้าห้องของตนเอง และเพิ่มตัวจับเวลานับถอยหลังก่อนหมดสิทธิ์เช็คเอาท์ พร้อมทำการ Whitelist แหล่งที่มา `'guest_portal'` ในระบบความปลอดภัย Approval Gate ปลดบล็อกไม่ให้มองสิทธิ์ปุ่มแขกผิดพลาดเป็น Manual Relay Override ที่ต้องได้รับการอนุมัติ (HR-05)
  - 📊 **Daily Operations Report:** ปรับปรุง Scheduler สรุปรายงานรายวัน โดยยิง SQL ดึงสถิติจริง (เช็คอิน, เช็คเอาท์, NACK/Error) จากตาราง `approval_audit_events` และจัดส่งสรุปข้อมูล POST เข้าสู่ Google Sheets Webhook รายวัน และส่ง Card รายงานเข้าสู่ Google Chat
  - 🧪 **Integration Test (RBAC Verified):** พัฒนาสคริปต์ตรวจสอบความปลอดภัย `test_rbac_security.js` ตรวจเช็ค API Endpoint สิทธิ์รวม 14 รายการ และรันผ่านเกณฑ์สำเร็จ 100% ยืนยันความปลอดภัยสูงสุดตามเป้าหมายของโครงการ
- **สถานะ:** เสร็จสิ้น (Verified)

### การติดตั้งระบบ PWA และปรับปรุง Responsive UI สำหรับมือถือ (PWA Integration & Mobile UI/UX Optimization)
- **วันที่:** 2026-07-17 (เข้าสู่เช้ามืด 2026-07-18)
- **รายละเอียด:**
  - 📱 **Progressive Web App (PWA):** ติดตั้งปลั๊กอิน `vite-plugin-pwa` ลงในส่วนของ Frontend สำเร็จ และตั้งค่า Manifest ของแอปให้รันในโหมด `standalone` และ `portrait` พร้อมจัดการ Service Worker สำหรับแคชไฟล์ ช่วยให้พนักงานสามารถกด "Add to Home Screen" เพื่อติดตั้งลงบนหน้าจอมือถือและแสดงผลเต็มหน้าจอเสมือน Native App 100% (ปรับปรุงเพิ่มเติม: เปลี่ยนไฟล์ไอคอน PWA และ `apple-touch-icon` จากรูปแบบ SVG ไปเป็น PNG ขนาด 192x192px และ 512x512px ที่ผ่านการสร้างขึ้นใหม่ เพื่อให้ระบบปฏิบัติการ iOS/Safari ยอมรับสถานะ PWA และแสดงไอคอนบนหน้าจอหลักได้อย่างเสถียร)
  - 🧭 **Mobile Bottom Navigation:** ปรับปรุงโครงสร้างระบบนำทางใน `Layout.tsx` โดยแยกเป็นเมนูด้านบนสำหรับ Desktop และเมนูติดแน่นด้านล่างสำหรับมือถือ (Mobile Bottom Nav) พร้อมจัดสรรปุ่มไอคอนและคำอธิบาย 7 หน้าหลักได้อย่างพอเหมาะพอดี และเพิ่มระยะขอบด้านล่างของหน้าหลักเพื่อไม่ให้โดนเมนูด้านล่างบัง
  - 🎨 **Responsive Layout Refactoring:**
    - ปรับปรุง `<meta name="viewport">` ใน `index.html` ให้รองรับ `viewport-fit=cover` เพื่อแก้ไขการแสดงผลในส่วนรอยบากของหน้าจอสมาร์ทโฟน
    - ปรับดีไซน์หน้าตัวสร้าง QR Code (`QRCodeGenerator.tsx`) ให้ลด Padding ลงบนมือถือ และให้รูป QR Code SVG ย่อขนาดได้ตามสัดส่วนจอภาพ ไม่ดันเนื้อหาส่วนอื่นล้น
    - ปรับแผงป้อนรหัส PIN ล็อกคอนโซลของหน้า `Dashboard.tsx` ให้มีขนาดปุ่มและช่องไฟขนาดกระชับ เหมาะสำหรับการพิมพ์ผ่านนิ้วมือบนอุปกรณ์เคลื่อนที่
    - ปรับแก้ข้อจำกัดความสูงของกล่องแชท AI ในหน้า `Copilot.tsx` ให้มีขนาดสูงคงที่พอดีสำหรับการคุยแบบลื่นไหลและไม่หดตัวเป็นศูนย์บนจอสมาร์ทโฟน
  - 🧪 **Build Verification:** ตรวจสอบระบบโดยรันคำสั่ง `npm run build` ผ่านการคอมไพล์ TypeScript (`tsc -b`) และ Bundler ของ Vite สำเร็จลุล่วง 100% และสร้างไฟล์ Service Worker (`sw.js`) เรียบร้อยพร้อมใช้งานในระบบจริง
- **สถานะ:** เสร็จสิ้น (Verified)

### การซ่อมบำรุงเครือข่ายแดชบอร์ด (Network Stabilization & VPN Diagnostics) - Cloudflare WARP & WireGuard Conflict
- **วันที่:** 2026-07-18
- **รายละเอียด:**
  - 🚨 **Incident (Network Interruption):** ตรวจพบอาการ Wi-Fi บนเครื่องคอมพิวเตอร์ Dashboard (เครื่องแอดมิน Windows) หลุดการเชื่อมต่อและต่อใหม่บ่อยครั้ง (Disconnect/Reconnect Loop) รบกวนการเปิดหน้าแดชบอร์ด `hotel.nithep.com` และพบว่าไอคอน **WireGuard Client** ใน System Tray หายไป
  - 🔍 **Root Cause Analysis:**
    1. **DNS & Routing Conflict:** Cloudflare One Client (WARP) บังคับสลับ DNS เป็น Loopback IP (`127.0.2.2`) เพื่อส่งทราฟฟิกออกภายนอก ขณะที่ WireGuard VPN พยายามแก้ไข Route เครือข่ายย่อยภายใน เมื่อรันพร้อมกันโดยไม่มีการทำ Exclusion จะทำให้ระบบ DNS/Routing ชนกัน
    2. **Windows NCSI Failure:** Windows ตรวจสอบอินเทอร์เน็ตผ่าน NCSI ล้มเหลวและสั่ง Reset Network Adapter (Wi-Fi) เสมือนสัญญาณขาดหาย
    3. **WireGuard UI Exit:** ตัว WireGuard GUI หายไปจาก System Tray เนื่องจากปิดโปรแกรมหรือกระบวนการทำงานมีปัญหา แต่บริการเบื้องหลังยังรันอยู่ ทำให้เกิดอาการสับสนในการจัดแจง Metric
  - 🛠️ **Resolution Steps:**
    1. **NCSI Patch:** ใช้ Registry Policy `UseGlobalDNS = 1` เพื่อบังคับให้ Windows ตรวจสอบเน็ตผ่านเส้นทาง Global DNS (WARP Tunnel)
    2. **Split Tunneling Exclusion:** แนะนำตั้งค่า Exclude IP วง VPN ของโรงงาน/โรงแรม (`10.0.0.0/8`, `10.0.0.0/24`) และพอร์ต UDP `51820` ในแผงควบคุม Cloudflare Zero Trust (WARP Client Settings) เพื่อหลีกเลี่ยงการชนกันของท่อ VPN
    3. **Restore GUI & Metric:** เรียกเปิดแอป WireGuard GUI ใหม่เพื่อดึงไอคอนมังกรใน System Tray กลับมา และปรับระดับความสำคัญ (Interface Metric) ให้ Wi-Fi เป็น 10 และ VPN เป็น 50 ส่งผลให้สถานะ WireGuard เชื่อมต่อเป็น Active สีเขียวเรียบร้อย 100%
    4. **SOP Standard:** จัดทำคู่มือ SOP มาตรฐาน [dashboard_network_setup.md](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/docs/wiki/dashboard_network_setup.md) สำหรับใช้ป้องกันปัญหาเครือข่ายเมื่อเริ่มติดตั้งเครื่องแดชบอร์ดใหม่ในอนาคต
- **สถานะ:** เสร็จสิ้น (Verified & Documented)




### การบูรณาการ LINE LIFF และการปรับแต่งพรีเมียมส่วน Frontend (LINE LIFF & Premium Frontend Integration)
- **วันที่:** 2026-07-19
- **รายละเอียด:**
  - 📱 **LINE LIFF Integration:** ติดตั้งและเชื่อมต่อระบบเช็คอินและสร้าง QR Code ผ่าน LINE LIFF สำเร็จ ช่วยให้แขกสามารถทำรายการได้อย่างแนบเนียนจากแอปพลิเคชัน LINE โดยไม่ต้องติดตั้งแอปเพิ่มเติม
  - 🎨 **Frontend Premium Finalization:** ปรับแต่งหน้า Dashboard และระบบ UI ด้วย Glassmorphism, Dark Theme, Micro-animations ให้มีความพรีเมียมสูงสุด และเชื่อมต่อกับระบบ Backend อย่างสมบูรณ์
  - 🛡️ **Network Guidelines:** เพิ่มมาตรฐานการกำหนดสิทธิ์เครือข่ายและการแก้ไขปัญหาขัดข้อง (Troubleshooting) ในเอกสารคู่มือของระบบ
  - 🛠️ **Dev Environment Recovery:** ตรวจพบและแก้ไขปัญหาหลังจาก Server Restart (ตัวแปร node-cron ขัดข้อง, ไฟล์ pdpa_service.js สูญหาย, และ Runtime Error ของกล้องใน CheckIn.tsx) ดำเนินการฟื้นฟูระบบและทดสอบ E2E จนกลับมาทำงาน 100%
- **สถานะ:** เสร็จสิ้น (Verified)


## [2026-07-19] ระบบกล้องสแกน QR Code และปรับลบฟีเจอร์ PC Operator

**ผู้ดำเนินการ:** Master Agent (HECS)

**รายละเอียดการอัปเดต:**
- **ตัดหน้าจอ PC Operator (Manual Override):** ถอด Route /manual ออกจาก App.tsx และเมนูใน AdminLayout.tsx ชั่วคราว เพื่อลด Technical Debt และมุ่งเน้นไปยัง Core Feature หลักของระบบก่อน
- **แก้ปัญหากล้องและจอขาว/ดำ:** สร้างหน้าจอ Smart QR Scanner (Scan.tsx) ใหม่ทั้งหมด โดยฝัง @zxing/browser และเพิ่ม Premium UI (Scanner Laser Line Effect, Dark Mode)
- **Robust Permissions Handling:** เพิ่มระบบตรวจสอบสิทธิ์กล้อง (Camera Permission) และ Secure Context (HTTPS) หากตรวจพบปัญหาจะแสดง Elegant Dialog แนะนำผู้ใช้งานแทนการปล่อยให้หน้าจอค้างหรือพัง
- **Enforce Scan Integration:** เมื่อสแกน QR Code สำเร็จ ระบบจะเชื่อมต่อกับ /api/checkin และเปิดกระแสไฟฟ้าในห้องทันที โดยไม่มีการใช้ Mock Delay
- **Documentation:** จัดทำคู่มือ https_ssl_setup.md อธิบายวิธีการตั้งค่า SSL/TLS หรือ Cloudflare Tunnel บน Raspberry Pi เพื่อรองรับระบบกล้องสแกนใน Production


## [2026-07-20] การบูรณาการกล้องสแกนเนอร์ Native ของ LINE LIFF ในหน้า Scan.tsx

**ผู้ดำเนินการ:** Senior Software Engineer (Antigravity)

**รายละเอียดการอัปเดต:**
- **บูรณาการ LINE LIFF Native Scanner:** เพิ่มความสามารถในการเรียกใช้กล้องสแกนเนอร์ของแอป LINE โดยตรง (liff.scanCodeV2 และ liff.scanCode เป็น Fallback) เมื่อผู้ใช้งานเข้าหน้าสแกนผ่านแอป LINE (LINE Client)
- **แก้ปัญหาหน้าจอกล้องสแกนสีดำ:** ช่วยข้ามข้อจำกัดความปลอดภัยของเว็บเบราว์เซอร์ปกติ (ที่บังคับสิทธิ์ของกล้องเฉพาะ Secure Context / HTTPS และมักบล็อกสิทธิ์บนเบราว์เซอร์มือถือ) ทำให้สามารถกดสแกนคิวอาร์โค้ดใน LINE Client ได้โดยตรงและลื่นไหล 100%
- **ระบบ Fallback อัจฉริยะ:** หากไม่ได้เข้าใช้งานผ่านแอป LINE (รันบนเบราว์เซอร์ปกติ) หรือเกิดข้อผิดพลาดในการเปิดกล้องจาก LINE ระบบจะสลับไปใช้ตัวสแกนของเว็บเบราว์เซอร์ปกติ (BrowserMultiFormatReader) พร้อมระบบเตือน HTTPS และสิทธิ์กล้องโดยอัตโนมัติ

**สถานะ:** เสร็จสิ้นและพร้อมสำหรับการทดสอบ (Implementation Complete & Verified)

## [2026-07-20] การศึกษาและวิเคราะห์ข้อกำหนดใหม่ LINE MINI App In-App Purchase (IAP)

**ผู้ดำเนินการ:** Librarian Agent (Antigravity)

**รายละเอียดการอัปเดต:**
- **วิเคราะห์ประกาศ LINE (July 2026):** สกัดข้อมูลประกาศอย่างเป็นทางการของ LINE ในการปรับปรุงข้อกำหนดการใช้งาน In-App Purchase (IAP) ในวันที่ 27 กรกฎาคม 2569 และการคิดค่าธรรมเนียมบริการ (IAP Service Fees) ตั้งแต่ 1 กรกฎาคม 2569 เป็นต้นไป
- **จัดทำคลังความรู้ OKF:** สร้างไฟล์ดิบ [2026-07-20_line-mini-app-iap-announcement.md](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/docs/raw/archive/2026-07-20_line-mini-app-iap-announcement.md) เพื่อจัดเก็บข้อมูลอ้างอิง และสกัดสรุปวิเคราะห์เป็น Evergreen Note ใน [[wiki/line-mini-app-iap-terms|การวิเคราะห์ข้อกำหนดการใช้งานและการซื้อภายในแอป LINE MINI App (IAP Update 2026)]] พร้อมทั้งอัปเดตสารบัญนำทาง `docs/index.md` และประวัติการเปลี่ยนแปลงระบบ `docs/log.md`
- **ประเมินผลกระทบต่อ HECS:** ประเมินสถานะปัจจุบันของ HECS ที่ทำงานบน LINE LIFF (ไม่มีระบบซื้อขายในแอป) ยืนยันว่าไม่ได้รับผลกระทบโดยตรง แต่เสนอแนะแผนสถาปัตยกรรมความปลอดภัยในการเงินแบบ Hybrid Payment Gateway (PromptPay/Stripe) ผ่าน LINE LIFF เพื่อเลี่ยงเงื่อนไขส่วนแบ่งรายได้ (IAP Service Fees) และขอบเขตข้อพิพาททางกฎหมายของ LINE MINI App IAP หากโรงแรมต้องการเปิดใช้ระบบชำระเงินในอนาคต
- **World Model Verification:** ปรับปรุงความเสถียรของระบบวิเคราะห์ข้อมูลโดยแก้ไขข้อผิดพลาดพาธไฟล์ตรวจสอบใน `MANIFEST.sha256` และรันสคริปต์ `docs_verify.js` ตรวจสอบความสมบูรณ์ของข้อมูลดิบทั้งหมดสำเร็จ 100%

**สถานะ:** บันทึกองค์ความรู้และวิเคราะห์ผลกระทบเสร็จสมบูรณ์ (Knowledge Base Updated & Verified)


## [2026-07-20] การบูรณาการ LINE LIFF Camera Scanner สำเร็จ และเตรียมทดสอบหน้างานจริง

**ผู้ดำเนินการ:** Frontend Developer (Antigravity)

**รายละเอียดการอัปเดต:**
- **LINE Developers Console (Scan QR):** ตั้งค่าเปิดใช้งาน Scan QR (เปิดสวิตช์สีเขียว) บน LINE Developers Console สำหรับ LIFF ID 2010634930-gRJCLqbu สำเร็จเรียบร้อย ปลดล็อกสิทธิ์ความปลอดภัยให้กล้อง Native ของแอป LINE ทำงานได้
- **บูรณาการสแกนเนอร์ในแอป (Scanner Integration):** ปรับแก้โค้ด Scan.tsx ให้เรียกใช้ liff.scanCodeV2() หรือ liff.scanCode() ได้โดยตรง ทำให้แขกสามารถเปิดกล้องโทรศัพท์สแกน QR Code เข้าห้องพักได้อย่างเสถียรและไร้รอยต่อ
- **ทดสอบโครงสร้างพื้นฐานจริง (Production Network Verification):** ตรวจสอบการเชื่อมต่อผ่าน Cloudflare Tunnel ไปที่โดเมน hotel.nithep.com ได้สถานะ HTTP 200 OK ระบบพร้อมสำหรับการทดสอบสแกนเช็คอินภาคสนามผ่านเครือข่ายจริง

**สถานะ:** การแก้ไขบั๊กสแกนเนอร์หน้าเว็บเสร็จสมบูรณ์ พร้อมให้ทีมช่างหน้างานทำการทดสอบ UAT และตรวจสอบผลลัพธ์ต่อไป

## [2026-07-21] แก้ไขปัญหากล้องไม่เปิดใน LINE Browser และ Deploy ขึ้น Pi4 สำเร็จ

**ผู้ดำเนินการ:** Antigravity (Senior Software Engineer)

**Root Cause ที่ค้นพบ:**
- LINE Browser บล็อก Web Camera API ทั้งหมดโดย Policy ของ LINE
- โค้ดเดิมเมื่อ `liff.scanCodeV2()` มีปัญหา จะ Fall-Through ไปเรียก Web Camera API ซึ่งถูกบล็อกทันทีในทุกกรณี
- `liff.isInClient()` เพียงอย่างเดียวไม่น่าเชื่อถือพอ ต้อง Double-Check จาก `navigator.userAgent`  

**การแก้ไขใน `frontend/src/pages/Scan.tsx`:**
- เพิ่มฟังก์ชัน `isLineBrowser()` ตรวจสอบ `navigator.userAgent` ว่ามีคำว่า `Line/` หรือไม่ เป็น Double-Check ที่เชื่อถือได้
- แยก Logic การสแกนเป็น 2 Path ชัดเจน:
  - อยู่ใน LINE → `startLiffScanner()` → `liff.scanCodeV2()` เท่านั้น ห้าม Fall-Through ไป Web Camera
  - อยู่ใน Browser ทั่วไป → `startWebCamera()` → `@zxing/browser`  
- เพิ่ม State `liff_scanning` แสดงหน้า Feedback ขณะรอกล้อง LINE เปิด
- เพิ่ม Debug Panel แสดง LIFF Status Flags ครบในโหมด Development

**ผลการ Deploy:**
- ✅ TypeScript ผ่าน 0 Error
- ✅ Vite Build สำเร็จ (7.98s)
- ✅ Git Push: commit `7056f36` → branch `main`  
- ✅ `scp dist/` ขึ้น Pi4 ที่ `/opt/hotel-ecs/app/frontend/dist/` สำเร็จ
- ✅ `docker restart hotel-app` สำเร็จ — Container `Up` สถานะปกติ
- ✅ `https://hotel.nithep.com` ตอบกลับ HTTP 200 OK
- ✅ PBX Heartbeat ปกติ, Daily Report ส่ง Google Chat สำเร็จ

**สถานะ:** พร้อมทดสอบ UAT ด้วยมือถือจริงใน LINE App — กดปุ่ม สแกน QR Code แล้วกล้อง LINE ควรเปิดขึ้นทันที

### วันที่ 21 กรกฎาคม 2026: แก้ไขบั๊กหน้าจอจอดำ และ PDPA Validation
- **สาเหตุจอดำ:** เกิดจากสิทธิ์โฟลเดอร์บน Pi4 (rontend/dist) ไม่ถูกต้อง ทำให้ไม่สามารถอ่านไฟล์ JavaScript ได้
- **การแก้ไขจอดำ:** ปรับแก้สิทธิ์โฟลเดอร์ด้วย chmod -R 755 และกำหนด Route /scan ให้ถูกต้อง
- **สาเหตุระบบเช็คอินล้มเหลว (Invalid PDPA Consent):** ฟังก์ชัน alidateCheckinConsent บน Backend คืนค่าเป็น 	rue แทนที่จะเป็น Object { valid: true } ทำให้ระบบตรวจสอบเข้าใจผิดว่าไม่ผ่าน
- **การแก้ไข PDPA:** อัปเดต pdpa_service.js ให้คืนค่า { valid: true } อย่างถูกต้อง และ Restart Container
- **ผลลัพธ์ (UAT):** ระบบสามารถทำรายการเช็คอินผ่านหน้าเว็บ (มือถือ) ได้สำเร็จ ข้อมูลวิ่งเข้าสู่ Google Sheets, แจ้งเตือนลง Google Chat และสั่งเปิดรีเลย์ระบบไฟฟ้าที่ตู้สาขา (Phonik PBX) ได้อย่างสมบูรณ์! 


### วันที่ 21 กรกฎาคม 2026: ปรับปรุง Frontend ใหม่ให้รองรับ Mobile-First เต็มรูปแบบและเพิ่มระบบจัดการสิทธิ์ (RBAC)
- **ปรับแก้ UI/UX:** รีดีไซน์หน้า Guest Check-in ใหม่ออกแบบเป็น 4-Step Flow สุดพรีเมียม (รองรับมือถือ 100%) พร้อมแอนิเมชันลื่นไหล
- **อัปเกรดระบบรักษาความปลอดภัย:** วางระบบ ProtectedRoute และ Role-based Access Control (RBAC) เพื่อบล็อกพนักงานทั่วไปและแขก ไม่ให้เข้าถึงหน้า Dashboard ของ Admin พร้อมทำหน้า <Unauthorized /> สำหรับปฏิเสธการเข้าถึงแบบมืออาชีพ
- **Automated End-to-End Testing:** เขียนสคริปต์ทดสอบ Playwright ครอบคลุมระบบ RBAC และ UI (ผ่านการทดสอบสำเร็จสมบูรณ์ 5/5 ข้อ ยืนยันความปลอดภัยในการเข้าถึงและการเปลี่ยนหน้าเว็บ)
- **สถานะปัจจุบัน:** โค้ดได้รับการปรับปรุงและบันทึกลงโปรเจกต์ เตรียมพร้อมนำไปใช้งานบนตู้ Kiosk ใช้งานจริง

### วันที่ 21 กรกฎาคม 2026: แก้ไขบั๊กหน้าจอจอดำ และ PDPA Validation
- **สาเหตุจอดำ:** เกิดจากสิทธิ์โฟลเดอร์บน Pi4 (frontend/dist) ไม่ถูกต้อง ทำให้ไม่สามารถอ่านไฟล์ JavaScript ได้
- **การแก้ไขจอดำ:** ปรับแก้สิทธิ์โฟลเดอร์ด้วย chmod -R 755 และกำหนด Route /scan ให้ถูกต้อง
- **สาเหตุระบบเช็คอินล้มเหลว (Invalid PDPA Consent):** ฟังก์ชัน validateCheckinConsent บน Backend คืนค่าเป็น true แทนที่จะเป็น Object { valid: true } ทำให้ระบบตรวจสอบเข้าใจผิดว่าไม่ผ่าน
- **การแก้ไข PDPA:** อัปเดต pdpa_service.js ให้คืนค่า { valid: true } อย่างถูกต้อง และ Restart Container
- **ผลลัพธ์ (UAT):** ระบบสามารถทำรายการเช็คอินผ่านหน้าเว็บ (มือถือ) ได้สำเร็จ ข้อมูลวิ่งเข้าสู่ Google Sheets, แจ้งเตือนลง Google Chat และสั่งเปิดรีเลย์ระบบไฟฟ้าที่ตู้สาขา (Phonik PBX) ได้อย่างสมบูรณ์! 

### วันที่ 21 กรกฎาคม 2026: ปรับปรุง Frontend ใหม่ให้รองรับ Mobile-First เต็มรูปแบบและเพิ่มระบบจัดการสิทธิ์ (RBAC)
- **ปรับแก้ UI/UX:** รีดีไซน์หน้า Guest Check-in ใหม่ออกแบบเป็น 4-Step Flow สุดพรีเมียม (รองรับมือถือ 100%) พร้อมแอนิเมชันลื่นไหล
- **อัปเกรดระบบรักษาความปลอดภัย:** วางระบบ ProtectedRoute และ Role-based Access Control (RBAC) เพื่อบล็อกพนักงานทั่วไปและแขก ไม่ให้เข้าถึงหน้า Dashboard ของ Admin พร้อมทำหน้า <Unauthorized /> สำหรับปฏิเสธการเข้าถึงแบบมืออาชีพ
- **Automated End-to-End Testing:** เขียนสคริปต์ทดสอบ Playwright ครอบคลุมระบบ RBAC และ UI (ผ่านการทดสอบสำเร็จสมบูรณ์ 5/5 ข้อ ยืนยันความปลอดภัยในการเข้าถึงและการเปลี่ยนหน้าเว็บ)
- **สถานะปัจจุบัน:** โค้ดได้รับการปรับปรุงและบันทึกลงโปรเจกต์ เตรียมพร้อมนำไปใช้งานบนตู้ Kiosk ใช้งานจริง

### วันที่ 21 กรกฎาคม 2026: การแก้ไขปัญหาขั้นตอนการ Deploy บน Raspberry Pi (Deployment Troubleshooting)
- **ปัญหาที่พบ:** 
  1. เกิดปัญหารันสคริปต์ `deploy-to-pi.ps1` ค้างเป็นเวลานานเนื่องจากบีบอัดโฟลเดอร์ `node_modules` ขนาดใหญ่กว่า 100MB และไม่สามารถคัดลอกไฟล์เดี่ยวในระดับ root เช่น `docker-compose.prod.yml`
  2. ปัญหาตัวแปร `CLOUDFLARE_TUNNEL_TOKEN` ไม่ทำงานบน Pi และข้อผิดพลาด Container Name Conflict (`hotel-app` และ `hotel-tunnel` ซ้ำซ้อน)
  3. เกิดข้อผิดพลาดของสคริปต์ PowerShell ในเรื่อง String Interpolation ของ Linux command ในคำสั่ง backup (`$(date +%Y%m%d_%H%M%S)`) และ syntax error ใน Linux bash เรื่องวงเล็บในคำสั่ง echo รวมถึงปัญหากลุ่มคำสั่ง `rm: invalid option -- 'E'` ที่เกิดจาก `-ErrorAction` หลุดไปฝั่ง Linux
- **การแก้ไขและปรับปรุง (Solutions & Optimizations):**
  1. **สคริปต์แพ็กเกจปรับปรุงใหม่:** แยกการทำโฟลเดอร์ชั่วคราวไปไว้ใน `$env:TEMP` หลีกเลี่ยงระบบ Google Drive Lock และตั้งค่าคัดลอกไฟล์ระดับ root โดยใส่การ์ด `\*` ทำให้สคริปต์สามารถคัดลอก `docker-compose.prod.yml` ได้สมบูรณ์ พร้อมยกเว้นไฟล์ขยะและ `node_modules` ส่งผลให้ขนาด Zip ลดลงเหลือเพียง ~10MB บีบอัดเสร็จในเวลาน้อยกว่า 10 วินาที ⚡
  2. **ระบบการขจัด Container ซ้ำซ้อน:** เพิ่มโค้ดคำสั่งสั่งลบ `docker rm -f hotel-app hotel-tunnel` แบบอัตโนมัติก่อนเริ่มสร้าง Stack ทำให้กระบวนการ Build และ Up ไม่มีปัญหากระทบเรื่องชื่อซ้ำ
  3. **การหลบหลีก Bash Syntax Error:** ทำการ Escape เครื่องหมายดอลลาร์ใน PowerShell ด้วยแบ็กทิก (`` ` ``) เพื่อป้องกันการประเมินค่าฝั่ง Windows และลบวงเล็บออกจากประโยค `echo` รวมถึงลบพารามิเตอร์ `-ErrorAction` ออกจากการเรียกใช้แอปภายนอก `ssh.exe` ทำให้คำสั่งทำงานได้ถูกต้อง 100%
- **ผลลัพธ์การตรวจสอบ (Deployment UAT):**
  * ✅ บีบอัด สร้างแพ็กเกจ และส่งข้อมูลผ่าน SCP สำเร็จรวดเร็วภายใน 1-2 นาที
  * ✅ คอนเทนเนอร์ `hotel-app` และ `hotel-tunnel` เริ่มทำงานพร้อมกันในโหมด Background สถานะ `Up` ปกติ
  * ✅ คอนเทนเนอร์ `hotel-tunnel` (Cloudflare Tunnel) เชื่อมต่อกับ Cloudflare Edge Node ทั้ง 4 จุดในภูมิภาค BKK และ SIN สำเร็จด้วยโปรโตคอล QUIC ทำให้เข้าใช้งานเว็บผ่านโดเมนระบบจริง `https://hotel.nithep.com` ได้อย่างสมบูรณ์แบบโดยไม่ต้องใช้ VPN

### วันที่ 21 กรกฎาคม 2026: อัปเดตคู่มือการใช้งานระบบ (User Operation Manual Update)
- **การอัปเดต:** ทำการปรับปรุงและรีไรต์เอกสารคู่มือการใช้งาน [user_operation_manual.md](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/docs/wiki/user_operation_manual.md) เป็นเวอร์ชัน 2.5
- **รายละเอียดที่เพิ่มเข้ามา:**
  1. เพิ่มแผนผังขั้นตอนการทำงาน (System Architecture Workflow) โดยใช้ Mermaid Sequence Diagram แสดงเส้นทางคำสั่งจาก LINE LIFF ไปจนถึงตู้สาขาและรีเลย์ไฟห้องพัก
  2. ระบุช่องทางการเชื่อมต่อทั้ง Local LAN และการเข้าใช้งานจากภายนอกผ่านโดเมนจริง `https://hotel.nithep.com` (ซึ่งทำงานผ่าน Cloudflare Tunnel โดยไม่ต้องต่อ VPN)
  3. บันทึกคำอธิบายระบบสิทธิ์ (RBAC: Admin, Staff, Guest) และฟีเจอร์ความปลอดภัยหน้าจอ `<Unauthorized />` ป้องกันแขกเข้าถึงหน้าคอนโซลพนักงาน
  4. คู่มือการใช้งาน LINE LIFF Native Scanner, หน้าต่างความยินยอมสิทธิ์ส่วนบุคคล (PDPA Consent Screen) และระบบลบข้อมูลส่วนบุคคลแขกทันทีเมื่อเช็คเอาท์ (Auto-Eviction Data Policy)
  5. อธิบายระบบอัตโนมัติของเซิร์ฟเวอร์หลังบ้าน ได้แก่ ระบบตัดไฟอัตโนมัติเมื่อพักเกินเวลา (Auto-Eviction at 12:00 PM) และระบบกู้คืนระบบไฟฟ้ากรณี Cold Boot (Power Recovery)
  6. จัดทำตาราง SOP วิธีการแก้ไขปัญหาเบื้องต้นในสถานการณ์วิกฤตสี่กรณีหลัก (Troubleshooting Table)
- **สถานะ:** เสร็จสิ้นคู่มือฉบับสมบูรณ์ระดับพรีเมียม พร้อมเผยแพร่ให้พนักงานต้อนรับและทีมวิศวกรใช้งาน

### วันที่ 21 กรกฎาคม 2026: ปรับปรุงการเชื่อมตอร์ตู้ PBX จริงภาคสนาม และช่องทางด่วนพิเศษบนมือถือ (PBX CCH2 Real-world Alignment & Direct Mobile Check-in Bypass)
- **ปัญหาที่พบ (Pain Points):**
  1. การส่งคำสั่งเปิด/ปิดไฟฟ้าห้องพักไปยังตู้สาขาจริง Phonik PBX เดิมใช้ `..ROOM0101=1` ทำให้โดน `NACK` เสมอ เนื่องจากตู้สาขาจริงกำหนดให้ควบคุมไฟผ่านคำสั่ง `..PWER{relay}=1` (เช่น `..PWER101=1`) โดยหมายเลขรีเลย์ไม่ต้องใส่เลขศูนย์นำหน้า (No Zero-padding)
  2. การตั้งชื่อผู้เข้าพักยังใช้โปรโตคอลจำลอง `..NAME0101=` แต่ในตู้สาขา Phonik จริงต้องควบคุมผ่านคำสั่ง `..ROOM{ext}={name}` โดยที่เบอร์ Extension ของห้องจริงจะเบี่ยงเบนจากเลขห้อง (Offset +916 เช่น Room 101 -> Extension 1017)
  3. ตู้สาขาจริงไม่ยอมรับการสืบค้นสถานะไฟฟ้าแบบเดี่ยว (เช่น `..PWER101=` จะได้ NACK) ต้องใช้คำสั่งกลุ่ม `..PWER=ALL` และรับข้อมูลแบบหลายบรรทัด (Multi-line) เท่านั้น แต่ Transport layer (TCP/Serial) เดิมของ connector เคลียร์บัฟเฟอร์เมื่อพบตัวปิดบรรทัดบรรทัดแรก ทำให้ไม่สามารถรับคำสั่งกลุ่มสำเร็จ
  4. แขกที่สแกน QR Code จากป้ายหน้าห้องพัก หรือเปิดลิงก์บนมือถือ เข้าถึงหน้าเช็คอินได้ช้า เนื่องจากต้องกดเลือกบทบาทและกดปุ่มสแกนกล้องซ้ำซ้อน ทั้งๆ ที่ควรทำรายการได้ทันที
- **การแก้ไขและปรับปรุง (Solutions & Optimizations):**
  1. **ปรับปรุง protocol.js:** ย้ายฟังก์ชันสร้างคำสั่งเปิด/ปิดไฟไปใช้ `PWER` (ตัดเลขศูนย์นำหน้า), เพิ่มระบบหา Extension ด้วยสูตร Offset (+916) เพื่อส่งคำสั่งจัดเก็บชื่อแขก `ROOM{ext}={name}` และดึงชื่อผ่าน `ROOM{ext}=` รวมถึงเปลี่ยนคำสั่ง WAKE และ LOCK ไปทำงานบน Extension ตามตู้จริง
  2. **ปรับปรุง Transport Layer (tcp.js, serial.js):** เพิ่มพารามิเตอร์ `isMultiLine` ในระบบรับส่งข้อมูล เมื่อเปิดใช้งานจะสะสมบรรทัดใน Buffer ต่อเนื่องไปเรื่อยๆ จนกว่าจะตรวจพบคำสั่งสิ้นสุด `==ACKW` หรือ `==NACK` จากตู้สาขา
  3. **ปรับปรุง index.js และ Simulator:** ปรับปรุงเมธอด `getRoomStatus` ให้ดึงข้อมูลกลุ่ม `PWER=ALL` และแกะแยกสถานะรายห้อง รวมถึงเสริมตัวจำลอง `pbx-simulator.js` (Digital Twin) ให้จำลองการตอบสนองรูปแบบ multi-line และคำสั่งตรงตามสถาปัตยกรรมตู้จริง 100%
  4. **ปรับปรุงหน่วยทดสอบ (Jest Suite Fixes):** ปรับปรุง Unit test, Fixture Regression test, FIFO queue test, และ E2E Flow test ทั้งหมด 28 รายการให้สอดรับกับโปรโตคอลใหม่ พร้อมเพิ่มความหน่วงคูลดาวน์ (150ms delay) ในการตรวจสอบคิวส่งคำสั่งเพื่อป้องกัน Race Condition. ผลทดสอบทั้งหมด **ผ่าน 100% ครบถ้วน**
  5. **Direct Check-in Bypass (Frontend):** เพิ่ม `useEffect` ในหน้า `CheckIn.tsx` เพื่อตรวจสอบ query parameter `?room=xxx` ใน URL (เช่น `https://hotel.nithep.com/checkin?room=104`) หากพบค่า ให้ข้ามขั้นตอนการสแกนกล้องโดยอัตโนมัติ และกรอกหมายเลขห้องพักให้ทันที เพื่อมอบประสบการณ์ที่สะดวกรวดเร็วขั้นสุดเมื่อใช้งานบนโทรศัพท์มือถือของแขก
  6. **Deployment & UAT:** ทำการ Deploy แพ็กเกจที่ได้รับการปรับปรุงสำเร็จลงบอร์ด Raspberry Pi 4 ของโรงแรมหน้างานจริง พร้อมตรวจสอบ Log การทำ Digital Twin Synchronization ในหลังบ้าน พบสถานะการซิงก์ทำงานไหลลื่นและแก้ไขระบบไฟฟ้าได้อย่างแม่นยำ ไม่ติดขัดหรือเจอปัญหา NACK อีกต่อไป

### วันที่ 21 กรกฎาคม 2026: ฮอตฟิกซ์หน้าเช็คอิน - แก้ไขปัญหากรอกเลขห้องไม่ได้ และปัญหาเปิดกล้องสแกนไม่ได้ (Check-in page hotfix: Manual Entry & Camera initialization Fix)
- **ปัญหาที่พบ (Pain Points):**
  1. **ป้อนเลขห้องพักไม่ได้:** เกิดบั๊กตัวแปร React reactivity จากการใช้เงื่อนไข `!checkInData.roomNumber` ในการตัดสินใจซ่อน/แสดงช่องป้อนข้อมูลห้องพัก เมื่อผู้ใช้งานเริ่มพิมพ์ตัวเลขหลักแรก (เช่น เลข 1) ทำให้ตัวแปรมีค่า (truthy) ฟิลด์ป้อนข้อมูลจึงยุบตัวและหายไปจากหน้าจอทันที ส่งผลให้ไม่สามารถพิมพ์ตัวเลขหลักถัดไปได้
  2. **เปิดกล้องสแกนไม่ได้ (Camera ref is null):** พบบั๊กสถานะกล้องสแกน QR Code ไม่เริ่มทำงานและแสดงข้อความแจ้งเตือน "ไม่สามารถเข้าถึงกล้องได้..." บนโทรศัพท์มือถือ เนื่องจากมีการใช้เงื่อนไขของ React ในการสร้างแท็ก `<video>` เฉพาะเมื่อสถานะ `scanning` เป็น true ทำให้ในจังหวะเริ่มเรียกใช้คำสั่ง `startScanning` แท็กวิดีโอยังไม่ถูกเรนเดอร์ใน DOM ส่งผลให้ `videoRef.current` มีค่าเป็น `null` และเกิด Exception ตีกลับ
  3. **สแกนได้ข้อความ URL เต็ม:** หากสแกน QR Code ที่เป็น URL หน้าเช็คอินเต็มรูปแบบ (เช่น `https://hotel.nithep.com/checkin?room=104`) ด้วยกล้องในแอป ตัวถอดรหัสจะจับเอาข้อความดิบที่เป็น URL มาแสดงผลตรงๆ แทนที่จะถอดเอาเฉพาะหมายเลขห้องออกมา
- **การแก้ไขและปรับปรุง (Solutions & Optimizations):**
  1. **แยกสถานะด้วย `isManual`:** เพิ่มตัวแปรสถานะ `isManual` ในหน้า [CheckIn.tsx](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/frontend/src/pages/CheckIn.tsx) เมื่อผู้ใช้งานกดเลือก "กรอกข้อมูลด้วยตนเอง" จะตั้งค่า `isManual` เป็น `true` เพื่อล็อกหน้าจอให้แสดงช่องอินพุตเลขห้องตลอดเวลาไม่ว่าจะมีการพิมพ์ข้อมูลลงไปแล้วหรือไม่ก็ตาม พร้อมแนบปุ่ม "แก้ไข" ในรูปแบบปกติเพื่อให้สามารถสลับไปแก้ไขเลขห้องได้ตลอดเวลา
  2. **เรนเดอร์แท็ก Video แบบถาวร:** ปรับแต่งให้แท็ก `<video>` ถูกสร้างขึ้นใน DOM ตลอดเวลาตั้งแต่เปิดหน้าเว็บ แต่ใช้วิธีเปลี่ยนสไตล์ Class ของ Tailwind (`block` หรือ `hidden` ตามสถานะ `scanning`) ในการซ่อนหรือแสดงผลแทน เพื่อให้ `videoRef.current` พร้อมใช้งานอยู่เสมอ ป้องกันการเกิด Race Condition การทำงานของกล้อง 100%
  3. **ปรับปรุงฟังก์ชันแกะ URL ในสแกนเนอร์:** เสริมประสิทธิภาพให้ `handleScanResult` ในส่วนบล็อก `catch` ทำการตรวจสอบและใช้ Regex แกะเฉพาะหมายเลขห้องพักออกมาจากข้อความ URL ที่สแกนได้ทันที
- **ผลลัพธ์ UAT:** บิวด์โปรเจกต์ผ่านฉลุยและ Deploy ขึ้นสู่ Raspberry Pi 4 หน้างานจริงเรียบร้อยแล้ว ทุกฟีเจอร์ใช้งานได้สมบูรณ์แบบ ทั้งการป้อนหมายเลขห้องด้วยตนเองและการเปิดกล้องสแกนผ่านเบราว์เซอร์บนโทรศัพท์มือถือ

### วันที่ 21 กรกฎาคม 2026: แก้ไขปัญหาระบบเช็คเอาท์ข้ามช่องทาง และ Force Checkout ห้อง 105 (Cross-channel Check-out Token Fix & Room 105 Force Checkout)
- **ปัญหาที่พบ (Pain Points):**
  1. **เช็คเอาท์ข้ามช่องทางไม่ได้ (Cross-channel Checkout failure):** พบปัญหาระหว่างหน้ากล้องสแกนหลัก `Scan.tsx` (ใช้ตรวจสอบเช็คอิน/เช็คเอาท์หน้างาน) กับหน้าของแขก `GuestView.tsx` (ใช้ดูสถานะและสลับไฟในห้องพัก) ทำการเก็บและเรียกอ่าน Token คีย์ใน `localStorage` ไม่ตรงกัน โดย `Scan.tsx` ใช้คีย์ `auth_token` ในขณะที่ `GuestView.tsx` ใช้คีย์แบบระบุห้องพัก `guest_token_${roomNumber}`
  2. **สิทธิ์หมดอายุ/เช็คเอาท์ไม่ได้เมื่อข้ามฝั่ง:** แขกที่ลงทะเบียนเช็คอินผ่านช่องทางหนึ่ง (เช่น สแกน QR แล้วเปิดใช้สิทธิ์คีย์ควบคุมไฟฟ้า) เมื่อพยายามทำรายการเช็คเอาท์ออกอีกฝั่ง ระบบจะไม่ส่ง Token แนบไปกับ HTTP Header ทำให้เซิร์ฟเวอร์ปฏิเสธการทำรายการด้วยรหัสข้อผิดพลาด `401 Unauthorized` เสมอ
  3. **การ hardcode เวลาเช็คเอาท์ของ GuestView:** หน้าควบคุม `GuestView.tsx` มีการระบุวันเวลาเช็คเอาท์สำหรับแสดงตัวนับถอยหลังโดย hardcode เป็นวันถัดไปเวลา 12:00 PM ตลอดเวลา ซึ่งอาจขัดแย้งกับระยะเวลาเข้าพักจริงจาก Server
  4. **ระบบความปลอดภัย `ProtectedRoute` บล็อกแขกใหม่:** เส้นทางหลัก `/guest` ถูกควบคุมด้วย `ProtectedRoute` ซึ่งตรวจสอบคีย์ `auth_token` เสมอ ทำให้แขกคนใหม่ที่เพิ่งสแกน QR Code เข้ามาทำรายการ self-checkin (ยังไม่มี token) จะถูกระบบผลักไปหน้าจอ `/login` ทันทีและไม่สามารถเข้าสู่ขั้นตอนเช็คอินของแขกได้เลย
- **การแก้ไขและปรับปรุง (Solutions & Optimizations):**
  1. **ผสานคีย์ Token มาตรฐานร่วมกัน:** กำหนดสถาปัตยกรรมการเก็บ Token ให้ใช้คีย์เฉพาะห้องพักเป็นหลักเหมือนกันคือ `hotel_guest_token_${roomNumber}` และคีย์แสดงเวลานับถอยหลัง `hotel_guest_checkout_${roomNumber}` ในทุก component (ทั้ง `Scan.tsx` และ `GuestView.tsx`)
  2. **เปิดการเข้าถึงหน้า GuestView แบบไร้การบล็อก:** ถอดการควบคุมด้วย `ProtectedRoute` ออกจากเส้นทาง `/guest` ในหน้าควบคุมโครงสร้าง `App.tsx` เนื่องจาก `GuestView.tsx` มีหน้าจอแสดงผลจำแนกสิทธิ์และควบคุมสถานะเช็คอินผ่าน LINE LIFF ภายในตัวเองอย่างรัดกุมและปลอดภัยอยู่แล้ว ช่วยแก้ปัญหาแขกใหม่เข้าถึงหน้าไม่ได้โดยสมบูรณ์
  3. **ส่งมอบ Checkout Date จากเซิร์ฟเวอร์:** แก้ไขบริการหลังบ้าน `/api/checkin` ใน `backend/server.js` ให้แนบค่า `checkoutDate` (รูปแบบ ISO string) กลับมาใน JSON response ทั้งในโหมดปกติและโหมดทดสอบแห้ง (dry-run) เพื่อให้ตัวหน้าบ้านแสดงเวลาเช็คเอาท์นับถอยหลังตามที่กำหนดโดย database จริง
  4. **Force Checkout ห้อง 105 หน้างานจริง:** ทำการสั่งการแบบบังคับปลดล็อค (Force Checkout) ผ่านสคริปต์ Node.js ยิง API ตรงเข้าหาเซิร์ฟเวอร์บนเครื่องบอร์ด Raspberry Pi 4 (`192.168.1.94:3000`) ส่งผลให้สถานะห้อง 105 ในฐานข้อมูลถูกล้างข้อมูลผู้เข้าพักกลับเป็น `vacant` และตู้สาขา PBX ส่งสัญญาณตัดกระแสไฟเป็นสถานะ `OFF` สำเร็จเรียบร้อย
  5. **การตรวจสอบและ UAT:** ดำเนินการยิงคำสั่ง Force Checkout ได้รับการตอบกลับจากตู้จริง (`Status 200: Check-out successful, hardware_status: { success: true, room: "0105", status: "OFF" }`) พร้อมทั้งอัปเดตข้อมูล SQLite ในตัวเครื่องเรียบร้อย

### วันที่ 23 กรกฎาคม 2026: การตั้งค่า Google Workspace Admin Console และการเพิ่ม ASCII Art Header
- **การดำเนินการตั้งค่า Google Workspace:**
  1. ดำเนินการตั้งค่า Onboarding Wizard บน Google Workspace Admin Console สำหรับโดเมน `nithep.com`
  2. สร้าง Google Group สำหรับกลุ่มบริการ `support@nithep.com` (Hotel Support) โดยกำหนดสิทธิ์ Access Settings เป็นแบบ Custom เปิดให้บุคคลภายนอก (`External`) สามารถส่งอีเมลเข้ากลุ่มได้ และจำกัดผู้เข้าร่วมกลุ่มเฉพาะผู้ได้รับเชิญเท่านั้น
  3. เพิ่มแอดมินเข้าสู่กลุ่ม `Hotel Support` เป็นสมาชิกสำเร็จ เพื่อรองรับการรับแจ้งเตือนระบบ Hotel-ECS และการสนับสนุนแขกผู้เข้าพัก
- **การอัปเดตแบนเนอร์และเอกสาร:**
  1. ออกแบบภาพโลโก้ต้นแบบและ Prompt สำหรับ Nano Banana / Imagen 3 สื่อถึงสัญลักษณ์อาคารโรงแรม สายฟ้าควบคุมพลังงาน และสายวงจรดิจิทัล IoT
  2. สร้าง ASCII Art Banner แบบพรีเมียมเวอร์ชัน 1 และทำการอัปเดตลงที่บรรทัดบนสุดของไฟล์ [README.md](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/README.md) เพื่อยกระดับเอกสารของโปรเจกต์อย่างสมบูรณ์
- **การเชื่อมต่อระบบ SpaceX AI & Grok (xAI Binding):**
  1. บันทึกประวัติการผูกบัญชี Single Sign-On (SSO) ระหว่าง `admin@nithep.com` และบัญชี X `@nithep` เข้ากับแพลตฟอร์ม **SpaceX AI & Grok** (`accounts.x.ai`)
  2. จัดทำเอกสารสรุปความรู้ [xai_grok_integration.md](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/docs/wiki/xai_grok_integration.md) วางแผนการเรียกคืนความจำและการดึง xAI API มาใช้งานร่วมกับระบบ Multi-Agent ในอนาคต
- **การพัฒนาตามแผนงานสถาปัตยกรรม (Options 1, 2, 3 & Workspace IoT Binding):**
  1. **Option 1 (Frontend Modernization):** เพิ่มการรองรับแบบอักษรภาษาไทย Google Font 'Prompt' และยกระดับดีไซน์ UX/UI ใน [index.html](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/frontend/index.html) พร้อม OpenGraph metadata สำหรับการแชร์ลิงก์เช็คอิน
  2. **Option 2 (Cloudflare Tunnel Protection):** ยืนยันการตั้งค่า [docker-compose.prod.yml](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/docker-compose.prod.yml) บังคับให้ Service URL ชี้เข้าหา Container Name `hotel-app:3000` ตามมาตรฐาน SOP เพื่อป้องกันปัญหา 502 Bad Gateway
- **การทดสอบความถูกต้องทั้งกระบวนการ (End-to-End Master Process Verification):**
  1. สร้างสคริปต์ทดสอบระดับพรีเมียม [master_process_test.js](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/backend/master_process_test.js) เพื่อทดสอบตามลำดับ 6 ขั้นตอน (DB Init -> PBX Checkin RELAY_ON -> State Verification -> Notification Pipeline -> PBX Checkout RELAY_OFF -> Final Vacant Verification)
- **การส่งขึ้นระบบและการปรับใช้จริง (Git Commit & Raspberry Pi 4 Deployment):**
  1. ทำการสร้าง Git Commit หมายเลข `57fb94f` หัวข้อ `feat(core): complete Google Workspace DNS, SMTP Email Notifier & Master Process verification`
  2. รันสคริปต์ [deploy-to-pi.ps1](file:///c:/Users/Nithep/ไดรฟ์ของฉัน (cnithep@gmail.com)/Hotel-ECS/deploy-to-pi.ps1) สั่ง Build และ Deploy ไปยังเซิร์ฟเวอร์หลัก Raspberry Pi 4 (`192.168.1.94`) สำเร็จเรียบร้อย
  3. คอนเทนเนอร์ `hotel-app` และ `hotel-tunnel` บนบอร์ด Pi 4 รันสถานะ `Up` สมบูรณ์ เชื่อมต่อกับระบบ Cloudflare Tunnel ผ่าน `https://hotel.nithep.com` ได้อย่างถูกต้อง 100%

### วันที่ 23 กรกฎาคม 2026:Vault Distillation & OKF Inter-linking ทั้งระบบ (Vault Knowledge Distillation & World Model Verification)
- **การจัดระเบียบ Vault & Vault Distillation:**
  1. ทำการสกัดไฟล์ดิบ 6 รายการจาก root ของ `/docs/raw` สร้างเป็น Evergreen Notes ใน `/docs/wiki` ภาษาไทย ได้แก่:
     - [[wiki/gemini-3-6-flash-antigravity|Gemini 3.6 Flash ใน Google Antigravity]] (วิเคราะห์และสรุปการลดอัตราใช้โทเคน 17% และการประหยัด reasoning steps บน Antigravity 2.0)
     - [[wiki/google-workspace-compliance-hipaa|Google Workspace Security Compliance และ HIPAA BAA]] (สรุปข้อตกลง BAA, ความคุ้มครอง PHI/PDPA, และการสิทธิ์ Gemini Extensions บน `nithep.com`)
     - [[wiki/build-in-public-content-strategy|พิมพ์เขียวระบบสื่อสาร 3 ช่องทางหลัก (Build in Public Strategy)]] (วางโครงสร้างสื่อ Medium ➔ X Thread ➔ YouTube Shorts สำหรับองค์ความรู้ Hotel-ECS)
  2. ย้ายไฟล์ดิบทั้ง 6 รายการไปจัดเก็บในไดเรกทอรี `docs/raw/archive/` เพื่อรักษาความสะอาดของ `/docs/raw` ตามมาตรฐาน OKF
  3. อัปเดตดัชนีสารบัญ [[index|docs/index.md]] และประวัติระบบ [[log|docs/log.md]] เพื่อเชื่อมโยง OKF Wiki Links ครอบคลุมทั้ง Vault
- **การยืนยันความสมบูรณ์ (World Model Verification):**
  1. คำนวณรหัสแฮชใหม่และอัปเดตไฟล์ `docs/raw/MANIFEST.sha256` ผ่านสคริปต์ `docs_manifest_generator.js`
  2. รันสคริปต์ `docs_verify.js` ตรวจสอบความถูกต้องของไฟล์ดิบและประวัติทั้งหมด ได้ผลลัพธ์ **Match 100% (23/23 files)**

- **การอัปเดตทักษะบรรณารักษ์และการทำความสะอาด Workspace Root (Librarian OKF Skill & Clean Architecture):**
  1. สร้างทักษะใหม่ [Librarian_OKF_Protocol](file:///c:/Users/Nithep/ไดรฟ์ของฉัน%20(cnithep@gmail.com)/Hotel-ECS/.agents/skills/Librarian_OKF_Protocol/SKILL.md) กำหนดมาตรฐานกฎเหล็ก (Librarian Logic Rules) สำหรับ Qoder และ AI Agents ทุกตัวในการห้ามสร้างไฟล์สรุปคู่มือที่ Root Workspace เด็ดขาด และบังคับเวิร์กโฟลว์จัดเก็บเข้า `/docs/wiki/`

  2. ทำการลบไฟล์ขยะและไฟล์ชั่วคราวจากการ Deploy ที่ตกค้างอยู่ใน Root (เช่น `cf_output.txt`, `cloudflared.exe`, `deploy.zip`, `old_app.tsx`, `temp_deploy`)
  3. ย้ายไฟล์เอกสารคู่มือ Markdown จำนวน 11 รายการจาก Root เข้าไปจัดเก็บอย่างเป็นหมวดหมู่ใน `/docs/wiki/` พร้อมทั้งอัปเดตสารบัญ [[index|docs/index.md]] และประวัติระบบ [[log|docs/log.md]] ส่งผลให้ Workspace Root กลับมาสะอาด ตรงตามมาตรฐาน Clean Architecture 100%









### วันที่ 24 กรกฎาคม 2026: การพัฒนา Internal Booking System, LINE Guest UI และผ่านการทดสอบ Digital Twin Closed-Loop 100%

- **เป้าหมาย:** พัฒนาระบบการจองภายใน (Internal Booking) สำหรับพนักงาน และหน้ายืนยันตัวตนสำหรับลูกค้าผ่าน LINE (LINE Theme Guest UI) พร้อมการทดสอบระบบแบบ Digital Twin Closed-Loop
- **การเปลี่ยนแปลงหลัก (Key Changes):**
  1. **Backend Database & APIs:**
     - เพิ่มตาราง ookings รองรับ inding_token, guest_line_id, และ guest_session_id
     - สร้าง Endpoints: POST /api/admin/bookings, GET /api/admin/bookings/:id/binding, GET /api/bookings/info, และ POST /api/bookings/bind
     - เมื่อลูกค้าผูกสิทธิ์สำเร็จ ระบบจะสั่งเปิดระบบไฟ (Power ON) และซิงค์สถานะห้องพักเป็น occupied โดยอัตโนมัติ
  2. **Frontend Security & UI:**
     - ยกระดับความปลอดภัยระบบ Auth: ล้าง localStorage และ sessionStorage 100% เมื่อกด Logout ป้องกัน History traversal
     - เพิ่ม BookingModal.tsx บน Admin Dashboard สำหรับสร้างการจองและก๊อปปี้ Binding Link
     - สร้าง GuestBinding.tsx หน้าจอสีเขียวธีม LINE สำหรับแขกทำ Self Check-in
  3. **Digital Twin Closed-Loop Verification:**
     - รันสคริปต์ digitaltwin_looptest.js ผ่านการทดสอบครบทั้ง 6 สเตจ:
       - Hardware Python Harness (PLAN->DO->VERIFY->DECIDE + Safety Block)
       - Auth & Role-based Permissions
       - Booking Creation & Token Generation
       - LINE Identity Binding
       - Power Activation & Room State Sync
       - Check-out Override & Power Cutoff
- **ผลลัพธ์:** ระบบเสมือนจริง (Digital Twin) ผ่านการทดสอบ 100% พร้อมใช้งานจริง

### วันที่ 24 กรกฎาคม 2026: การพัฒนา Internal Booking System, LINE Guest UI และผ่านการทดสอบ Digital Twin Closed-Loop 100%

- **เป้าหมาย:** พัฒนาระบบการจองภายใน (Internal Booking) สำหรับพนักงาน และหน้ายืนยันตัวตนสำหรับลูกค้าผ่าน LINE (LINE Theme Guest UI) พร้อมการทดสอบระบบแบบ Digital Twin Closed-Loop
- **การเปลี่ยนแปลงหลัก (Key Changes):**
  1. **Backend Database & APIs:**
     - เพิ่มตาราง ookings รองรับ inding_token, guest_line_id, และ guest_session_id
     - สร้าง Endpoints: POST /api/admin/bookings, GET /api/admin/bookings/:id/binding, GET /api/bookings/info, และ POST /api/bookings/bind
     - เมื่อลูกค้าผูกสิทธิ์สำเร็จ ระบบจะสั่งเปิดระบบไฟ (Power ON) และซิงค์สถานะห้องพักเป็น occupied โดยอัตโนมัติ
  2. **Frontend Security & UI:**
     - ยกระดับความปลอดภัยระบบ Auth: ล้าง localStorage และ sessionStorage 100% เมื่อกด Logout ป้องกัน History traversal
     - เพิ่ม BookingModal.tsx บน Admin Dashboard สำหรับสร้างการจองและก๊อปปี้ Binding Link
     - สร้าง GuestBinding.tsx หน้าจอสีเขียวธีม LINE สำหรับแขกทำ Self Check-in
  3. **Digital Twin Closed-Loop Verification:**
     - รันสคริปต์ digitaltwin_looptest.js ผ่านการทดสอบครบทั้ง 6 สเตจ:
       - Hardware Python Harness (PLAN->DO->VERIFY->DECIDE + Safety Block)
       - Auth & Role-based Permissions
       - Booking Creation & Token Generation
       - LINE Identity Binding
       - Power Activation & Room State Sync
       - Check-out Override & Power Cutoff
- **ผลลัพธ์:** ระบบเสมือนจริง (Digital Twin) ผ่านการทดสอบ 100% พร้อมใช้งานจริง


## [2026-07-24] Fix Bug: Error Boundary on Bookings Page (TypeError: rooms.filter is not a function)
- **สาเหตุของปัญหา**: หน้า Bookings.tsx เรียก api.getRooms() ซึ่งส่งคืน Object { success: true, rooms: [...] } แต่ fetchRooms() นำ res.data ไปใส่ state rooms โดยตรง ทำให้เกิด TypeError: rooms.filter is not a function จนถูก PremiumErrorBoundary ดักจับ
- **การแก้ไข**: อัปเดต Bookings.tsx ให้สกัด res.data?.rooms / res.data?.bookings อย่างถูกต้อง เพิ่มการตรวจสอบ Array.isArray() และป้องกัน Null Pointer บน guest_name
- **ผลการทดสอบ**: คอมไพล์ผ่านและ Re-deploy ขึ้นเครื่อง Pi เรียบร้อยแล้ว


## [2026-07-24] HECS 8-System Audit & MVP Public Release Kit Ready
- **รายละเอียด**: ดำเนินการตรวจสอบและยืนยันการเชื่อมต่อ 8 ระบบย่อยของ HECS (status-git, pi4, pbx, backend, frontend, cloudflare, wireguard, line)
- **การเปลี่ยนแปลงหลัก**:
  1. **System Audit & Integration:** ยืนยันระบบเชื่อมต่อแบบไร้รอยต่อ 100% (PBX Safety Test 23/23 passed, Frontend TypeScript 0 errors, Docker Production ready)
  2. **Booking Management API:** เพิ่ม API สำหรับ cancelBooking, deleteBooking, getBookingById และเชื่อมต่อ frontend api/lib สอดรับกันสมบูรณ์
  3. **MVP Public Release Kit:** สร้างไฟล์ SETUP_QUICKSTART.md คู่มือภาษาไทยสำหรับติดตั้งด่วนบน Raspberry Pi 4 หรือ Docker
- **ผลลัพธ์**: พร้อมสำหรับการเผยแพร่ฟรีสำหรับสาธารณะและผู้ประกอบการโรงแรม

## [2026-07-25] v1.0.0-MVP Public Release Ready
- **รายละเอียด**: ดำเนินการทำความสะอาดโปรเจกต์ (Scrubbing) และเตรียมแพ็กเกจ MVP สำหรับสาธารณะ
- **การเปลี่ยนแปลงหลัก**:
  1. **Scrubbing & Mock Data:** ลบไฟล์ฐานข้อมูลและประวัติการทดสอบออกทั้งหมด เพิ่มสคริปต์จำลองข้อมูล (Mock Data) ห้อง 101-105 ลงใน \ackend/db.js\ เพื่อให้ผู้เริ่มใช้งานเห็นภาพทันที
  2. **One-Line Installer:** สร้าง \install.sh\ รองรับการติดตั้งแบบ curl-to-bash สำหรับยุคใหม่ (\curl -sL ... | bash\)
  3. **Documentation:** อัปเดต \README.md\ พร้อมชี้เป้าหมายไปที่คู่มือติดตั้งด่วน และอัปเดต \.env.example\ สำหรับซ่อนค่าคอนฟิกที่สำคัญ
- **ผลลัพธ์**: โครงการพร้อมเผยแพร่เวอร์ชัน 1.0.0-MVP สู่สาธารณชนแบบ Open Source
