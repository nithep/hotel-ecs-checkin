import asyncio
import re
import json
import logging
import aiohttp
from datetime import datetime

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Phonik PBX Telnet Configuration
PBX_IP = "192.168.1.91"
PBX_PORT = 23

# Backend API Configuration
BACKEND_API_URL = "http://localhost:8000"

# Regular Expression pattern for Phonik SMDR Logs
# Example: ==SMDX2005=03/08/26 18:59 401 e.400 EC 0:00'09 0 #1
# รองรับเว้นวรรคไม่จำกัดและเครื่องหมายเท่ากับ (ถ้ามี)
SMDR_PATTERN = re.compile(r"==SMDX\s*\d*\s*=?\s*\d{2}/\d{2}/\d{2}\s+\d{2}:\d{2}\s+(\d+)\s+(\S+)")

class PhonikSNCListener:
    def __init__(self, host=PBX_IP, port=PBX_PORT, backend_url=BACKEND_API_URL):
        self.host = host
        self.port = port
        self.backend_url = backend_url
        self.is_running = False
        # Buffer สำหรับเก็บบันทึกประวัติการเรียกย้อนหลัง (Temporal Event Memory)
        # Structure: { "0400": timestamp }
        self.recent_call_memory = {}
        # HTTP Session สำหรับส่ง events ไปยัง Backend
        self.http_session = None

    def parse_smdr_line(self, line: str):
        """Parse raw SMDR line into structured FHIR-like JSON event."""
        line = line.strip()
        match = SMDR_PATTERN.search(line)
        if not match:
            if "e." in line:
                room_match = re.search(r"e\.(\d+)", line)
                if room_match:
                    room_id = room_match.group(1)
                    return self._create_event_payload(room_id, "CALL_BEDSIDE", line)
            return None

        station_ext = match.group(1)
        event_code = match.group(2)

        # Determine Event Status & Hardware Origin via Temporal Pattern
        if event_code.startswith("e."):
            room_id = event_code.replace("e.", "")
            now_ts = datetime.now().timestamp()
            
            # ตรวจสอบประวัติการกดเรียกจากห้องเดียวกันย้อนหลัง (Temporal Analysis Window = 90 วินาที)
            last_call_time = self.recent_call_memory.get(room_id, 0)
            time_diff = now_ts - last_call_time
            
            # อัปเดตประวัติเวลาล่าสุด
            self.recent_call_memory[room_id] = now_ts
            
            # สังเคราะห์: หากมีการพ่นสัญญาณเรียกซ้ำจากห้องเดิมภายใน 90 วินาที (ลักษณะสวิทช์ดึงค้างในห้องน้ำ)
            if 0 < time_diff <= 90:
                event_type = "CALL_BATHROOM_EMERGENCY"
                logging.warning(f"🚨 Temporal Pattern Detected: Room {room_id} repeating call ({time_diff:.1f}s) -> Re-classified to BATHROOM EMERGENCY!")
            else:
                event_type = "CALL_BEDSIDE"

        elif "onM" in event_code or "onto" in event_code:
            room_id = station_ext
            event_type = "NURSE_TALKING"
        elif "offM" in event_code or "offx" in event_code:
            room_id = station_ext
            event_type = "CALL_CLEARED"
            # ล้างประวัติเพื่อรีเซ็ต State
            if room_id in self.recent_call_memory:
                del self.recent_call_memory[room_id]
        else:
            room_id = station_ext
            event_type = "INFO_UPDATE"

        return self._create_event_payload(room_id, event_type, line)

    def _create_event_payload(self, room_id: str, event_type: str, raw_line: str):
        """Create HL7 FHIR-compliant CommunicationRequest / Observation JSON Payload."""
        # Zero-pad Room ID to 4 digits (e.g., '400' -> '0400')
        formatted_room = room_id.zfill(4)
        now_iso = datetime.now().isoformat()

        is_active_call = event_type in ["CALL_BEDSIDE", "CALL_BATHROOM_EMERGENCY", "CALL_TRIGGERED"]
        is_bathroom = event_type == "CALL_BATHROOM_EMERGENCY"

        return {
            "resourceType": "CommunicationRequest",
            "id": f"snc-event-{formatted_room}-{int(datetime.now().timestamp())}",
            "status": "active" if is_active_call else "completed",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/communication-category",
                    "code": "alert",
                    "display": "Bathroom Emergency Pull" if is_bathroom else "Bedside Nurse Call"
                }]
            }],
            "priority": "stat" if is_bathroom else ("urgent" if is_active_call else "routine"),
            "occurrenceDateTimeField": now_iso,
            "payload": [{
                "contentString": event_type
            }],
            "extension": {
                "roomId": formatted_room,
                "originDevice": "BATHROOM_PULL_SWITCH" if is_bathroom else "BEDSIDE_STA",
                "rawSmdrLog": raw_line,
                "timestamp": now_iso
            }
        }


    async def init_http_session(self):
        """Initialize persistent HTTP session for better performance."""
        if self.http_session is None or self.http_session.closed:
            self.http_session = aiohttp.ClientSession()
            logging.info("HTTP session initialized for Backend API communication")

    async def send_event_to_backend(self, event_data: dict):
        """Send parsed event to Backend API via HTTP POST."""
        try:
            await self.init_http_session()
            
            # ส่งไปยัง endpoint /api/events/trigger
            url = f"{self.backend_url}/api/events/trigger"
            
            payload = {
                "room_id": event_data["extension"]["roomId"],
                "event_type": event_data["payload"][0]["contentString"]
            }
            
            async with self.http_session.post(url, json=payload) as response:
                if response.status == 200:
                    logging.info(f"✅ Event sent to Backend: Room {payload['room_id']} - {payload['event_type']}")
                else:
                    logging.error(f"❌ Failed to send event. Status: {response.status}")
                    
        except Exception as e:
            logging.error(f"Error sending event to Backend: {e}")

    async def start_listening(self):
        """Connect to Phonik PBX Telnet Server and stream real-time events."""
        self.is_running = True
        
        # Initialize HTTP session
        await self.init_http_session()
        
        while self.is_running:
            try:
                logging.info(f"Connecting to Phonik PBX Telnet at {self.host}:{self.port}...")
                reader, writer = await asyncio.open_connection(self.host, self.port)
                logging.info("Connected successfully to Phonik PBX!")

                while self.is_running:
                    line_bytes = await reader.readline()
                    if not line_bytes:
                        logging.warning("Connection closed by PBX server.")
                        break

                    raw_line = line_bytes.decode("utf-8", errors="ignore")
                    logging.debug(f"RAW SMDR: {raw_line.strip()}")

                    event_data = self.parse_smdr_line(raw_line)
                    if event_data:
                        logging.info(f"🚨 SNC Event Detected: Room {event_data['extension']['roomId']} -> {event_data['payload'][0]['contentString']}")
                        
                        # Send event to Backend API
                        await self.send_event_to_backend(event_data)

            except Exception as e:
                logging.error(f"Error in PBX Telnet listener: {e}. Retrying in 5 seconds...")
                await asyncio.sleep(5)
            finally:
                # Cleanup resources on disconnect
                if self.http_session and not self.http_session.closed:
                    await self.http_session.close()

    async def stop_listening(self):
        """Stop the listener gracefully."""
        self.is_running = False
        if self.http_session and not self.http_session.closed:
            await self.http_session.close()
            logging.info("HTTP session closed")

if __name__ == "__main__":
    listener = PhonikSNCListener()
    try:
        asyncio.run(listener.start_listening())
    except KeyboardInterrupt:
        logging.info("Listener stopped by user")
        asyncio.run(listener.stop_listening())
