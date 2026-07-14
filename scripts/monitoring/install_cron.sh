#!/bin/bash
# scripts/monitoring/install_cron.sh
# สคริปต์สำหรับติดตั้ง Network Monitor ให้ทำงานทุกๆ 1 นาทีผ่าน cron

SCRIPT_PATH="$(pwd)/network_monitor.sh"

# ทำให้ script ทำงานได้
chmod +x "$SCRIPT_PATH"

# เพิ่มเข้า crontab (เช็คทุก 1 นาที)
(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "* * * * * $SCRIPT_PATH") | crontab -

echo "✅ ติดตั้ง Network Monitor เรียบร้อยแล้ว (จะตรวจสอบทุกๆ 1 นาที)"
