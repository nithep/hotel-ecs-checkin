# Smart Nurse Call (SNC) PoC Project Specification

## 🏥 Overview
โปรเจกต์ Smart Nurse Call (SNC) PoC พัฒนาขึ้นเพื่อเปลี่ยนตู้สาขา Phonik PBX เดิมที่ติดตั้งในสถานพยาบาล/หอพัก ให้กลายเป็นระบบ Nurse Call ดิจิทัลอัจฉริยะแบบ Real-time โดยส่งสัญญาณแจ้งเตือนเข้าเคาน์เตอร์พยาบาลผ่าน Web Dashboard และเก็บบันทึกสถิติเพื่อนำไปทำ Predictive Analytics บน GCP ในอนาคต

---

## 🏗️ Architecture & Component Layers

1. **Hardware & Event Layer**:
   * Phonik PBX Main Control (DX-32C/80C/144C)
   * IP Interface: `192.168.1.91`, Port `23` (Telnet Stream)
   * Room Hardware: NCX-STA (Call Station), NCX-PULL (Emergency Switch), NCX-LED (Corridor Lamp)

2. **Connector & Parser Layer (`snc-poc/pbx-connector`)**:
   * `snc_pbx_listener.py`: ดักจับบรรทัด `==SMDX...` ทาง Telnet Socket
   * แปลง Event:
     * `e.{room_id}` -> `CALL_TRIGGERED`
     * `onM` / `onto` -> `NURSE_TALKING`
     * `offM` / `offx` -> `CALL_CLEARED`

3. **Backend & Data Pipeline (`snc-poc/backend`)**:
   * Framework: FastAPI (Python 3.10+) / Node.js
   * Database: SQLite (`nurse_call_events.db`)
   * Data Format: HL7 FHIR Standard JSON (`CommunicationRequest` & `Observation`)
   * Communication: WebSocket Server กระจาย Event ล่าสุดไปยัง Dashboard

4. **Nurse Station Dashboard (`snc-poc/frontend`)**:
   * Framework: React + Vite + Tailwind/Vanilla CSS (Dark Mode Premium Aesthetic)
   * UI Features:
     * Room Status Grid (เขียว=ปกติ, แดงกะพริบ=ฉุกเฉิน, เหลือง=รับเรื่องแล้ว)
     * Audio Alarm Alert (เสียงไซเรนเตือน)
     * Acknowledge & Response Time Stopwatch
