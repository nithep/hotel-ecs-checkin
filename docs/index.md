---
title: Hotel ECS Knowledge Base
type: index
description: Central hub for all documentation related to the Hotel ECS Smart Check-in System.
tags: [hub, documentation, architecture]
timestamp: "2026-06-28T02:00:00+07:00"
---

# 📚 Hotel ECS Knowledge Base

ยินดีต้อนรับสู่ระบบฐานความรู้ของโปรเจ็ค **Hotel ECS Check-in** 
เอกสารทั้งหมดถูกจัดเก็บด้วยมาตรฐาน **OKF (Open Knowledge Format)** เพื่อให้ง่ายต่อการอ่านผ่านแอปพลิเคชัน Obsidian และเปิดให้ AI สามารถเข้ามาอ่านเพื่อทำความเข้าใจระบบได้อย่างเป็นระเบียบ

## 🗂️ หมวดหมู่ความรู้หลัก (Core Concepts)

- [[wiki/แนวทางออกแบบ agentic AI harness|Agent Harness Design for Hotel ECS]] - เอกสารสรุปองค์ความรู้จากการประมวลผลระบบ
- [[wiki/Code as Agent Harness|Codex Code as Agent Harness]] - เอกสารสรุปองค์ความรู้จากการประมวลผลระบบ
- [[wiki/2026-07-05T233255+0700 การบูรณาการและการนำไปใช้  infrastructure category|"การบูรณาการและการนำไปใช้"]] - เอกสารสรุปองค์ความรู้จากการประมวลผลระบบ
- [[wiki/2026-07-05T223922_digital_twin_harness|"digital twin, repository เป็น persistent world, multi-agent role specialization, และ test-gated convergence : arXiv 2605.18747 และ repo Awesome-Code-as-Agent-Harness-Papers --- อธิบายความหมายในบริบทเดียวกัน"]] - เอกสารสรุปองค์ความรู้จากการประมวลผลระบบ
- [[phonik-ecs]] - ข้อมูลระบบฮาร์ดแวร์รีเลย์ควบคุมไฟในห้องพัก
- [[pbx-integration]] - สถาปัตยกรรมการเชื่อมต่อตู้สาขาโทรศัพท์
- [[checkin-flow]] - โฟลว์การทำงาน (Business Logic) ของแอปพลิเคชัน
- [[frontend-architecture]] - โครงสร้างและเทคโนโลยีของหน้าเว็บ (UI)
- [[concepts/backend-architecture|backend-architecture]] - โครงสร้าง API และระบบจำลอง Mock PBX
- [[concepts/prototype-strategy|prototype-strategy]] - แผนการทำระบบจำลอง (Digital Twin) และการนำเสนอ
- [[concepts/agent-harness-design|agent-harness-design]] - สถาปัตยกรรม Code as Agent Harness (Multi-agent & Digital Twin)
- [[wiki/agent-harness-framework|agent-harness-framework]] - คู่มือแนวคิดทฤษฎีและโครงสร้าง Code as Agent Harness ในระบบ Hotel ECS
- [[wiki/smart-hotel-comparison|การเปรียบเทียบโมเดลระบบ Smart Hotel]] - การเปรียบเทียบสถาปัตยกรรมและโมเดลการบริการ (LINE LIFF, Kiosk Simulator, IoT)
- [[concepts/project-plan|project-plan]] - แผนงานหลัก (Master Plan) ของโครงการ


## ⚙️ การติดตั้งและการใช้งานฮาร์ดแวร์จริง (Implementation & Hardware Setup)

- [[wiki/raspberry-pi-setup|raspberry-pi-setup]] - คู่มือการติดตั้งระบบและเตรียมความพร้อม Raspberry Pi
- [[wiki/phonik-pbx-protocol|phonik-pbx-protocol]] - คู่มือจำลองและใช้งาน Protocol ของตู้สาขา Phonik PBX
- [[wiki/phase2-hardware-integration|phase2-hardware-integration]] - คู่มือ Roadmap เชื่อมต่อฮาร์ดแวร์จริง Phase 2
- [[wiki/milestones-and-testing|milestones-and-testing]] - สรุปการทดสอบจำลองระบบและการทดสอบบน Pi 4
- [[wiki/system_cost_and_maintenance|ทะเบียนค่าใช้จ่ายและการบำรุงรักษาระบบ]] - รายละเอียดค่าใช้จ่าย กำหนดชำระ และวิธีการแจ้งเตือน
- [[wiki/google_workspace_integration|คู่มือการบูรณาการ Google Workspace]] - ขั้นตอนการเชื่อมโยงระบบเข้ากับ Google Chat, AppSheet, Calendar และ Gmail
- [[wiki/troubleshooting|troubleshooting]] - วิธีแก้ไขปัญหาและบันทึกการซ่อมบำรุงระบบ

## 🧠 การตั้งค่าระบบความรู้ (Knowledge Management)

- [[wiki/obsidian-web-clipper-setup|obsidian-web-clipper-setup]] - คู่มือการตั้งค่า Obsidian Web Clipper และ Templates (OKF)
- [[wiki/obsidian-sync-and-graph-optimization|obsidian-sync-and-graph-optimization]] - คู่มือการตั้งค่า Obsidian Sync และการปรับแต่ง Graph View ให้สวยงาม

## 📝 บันทึกระบบ (System Logs)
- [[log]] - บันทึกการเปลี่ยนแปลงระบบและเอกสาร
- [[wiki/project_timeline|project_timeline]] - บันทึกไทม์ไลน์การก่อสร้างโครงการ

## ⚙️ เอกสารทางเทคนิคและคู่มือเพิ่มเติม
- [[wiki/PBX_Relay_Config|PBX_Relay_Config]]
- [[wiki/cloudflare_tunnel_setup|cloudflare_tunnel_setup]]
- [[wiki/google_apps_script_setup|google_apps_script_setup]]
- [[wiki/infrastructure_setup|infrastructure_setup]]
- [[wiki/liff-checkin-process|liff-checkin-process]]
- [[wiki/network-setup|network-setup]]
- [[wiki/new_site_commissioning_guide|new_site_commissioning_guide]]
- [[wiki/operational_scenarios|operational_scenarios]]
- [[wiki/phase5-line-integration|phase5-line-integration]]
- [[wiki/phase6-system-blueprint|phase6-system-blueprint]]
- [[wiki/simulation_report|simulation_report]]
- [[wiki/solo_dev_business_strategy|solo_dev_business_strategy]]
- [[wiki/squarespace-domain-verification|squarespace-domain-verification]]
- [[wiki/technician_pbx_manual|technician_pbx_manual]]
- [[wiki/wifi-only-guide|wifi-only-guide]]

---
*บันทึกโดย: Librarian Agent (Antigravity)*
