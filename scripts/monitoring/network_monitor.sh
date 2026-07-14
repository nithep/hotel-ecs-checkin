#!/bin/bash
# scripts/monitoring/network_monitor.sh
# ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและส่งแจ้งเตือนผ่าน Telegram เมื่อมีการเปลี่ยนแปลงสถานะ (Offline -> Online)

BOT_TOKEN="8609364556:AAFfHdFET-t3-_UEsyLV6pe7-muoJx3yuOs"
CHAT_ID="7346817215"
STATE_FILE="/tmp/pi_network_state"
TARGET="8.8.8.8"

send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="$message" \
        -d parse_mode="HTML" > /dev/null
}

if ping -c 1 -W 2 "$TARGET" > /dev/null 2>&1; then
    if [ ! -f "$STATE_FILE" ] || [ "$(cat "$STATE_FILE")" == "offline" ]; then
        echo "online" > "$STATE_FILE"
        TIME=$(date '+%Y-%m-%d %H:%M:%S')
        send_telegram "✅ <b>[Hotel ECS] Pi 4 is ONLINE</b>%0Aเครือข่ายกลับมาเชื่อมต่อได้ตามปกติแล้ว%0Aเวลา: $TIME"
    fi
else
    if [ ! -f "$STATE_FILE" ] || [ "$(cat "$STATE_FILE")" == "online" ]; then
        echo "offline" > "$STATE_FILE"
    fi
fi
