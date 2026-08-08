import asyncio
import sqlite3
import json
import logging
from datetime import datetime
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.gemini_direct_service import GeminiDirectService

# Setup Logging
logging.basicConfig(level=logging.INFO)

gemini_service = GeminiDirectService()
app = FastAPI(title="Smart Nurse Call (SNC) Backend API", version="1.0.0")

# Enable CORS for Frontend Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "nurse_call_events.db"

# Initialize SQLite Database
def init_db():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nurse_call_events (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            status TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            fhir_payload TEXT NOT NULL,
            acknowledged_at TEXT,
            resolved_at TEXT,
            ack_time_seconds INTEGER,
            resolution_time_seconds INTEGER,
            sla_breached BOOLEAN DEFAULT FALSE
        )
    """)
    conn.commit()
    conn.close()

init_db()

# WebSocket Manager for Real-time Nurse Station Broadcast
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info(f"Client connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logging.info(f"Client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logging.error(f"Error broadcasting to WebSocket: {e}")

manager = ConnectionManager()

# Data Model for Manual Triggering/Testing
class CallEventRequest(BaseModel):
    room_id: str
    event_type: str

def calculate_sla_metrics(created_at: str, acknowledged_at: str = None, resolved_at: str = None):
    """Calculate SLA metrics for nurse call events."""
    created_dt = datetime.fromisoformat(created_at)
    metrics = {
        "ack_time_seconds": None,
        "resolution_time_seconds": None,
        "sla_breached": False
    }
    
    if acknowledged_at:
        ack_dt = datetime.fromisoformat(acknowledged_at)
        ack_diff = (ack_dt - created_dt).total_seconds()
        metrics["ack_time_seconds"] = int(ack_diff)
        # SLA breach if ack time > 30 seconds
        if ack_diff > 30:
            metrics["sla_breached"] = True
    
    if resolved_at:
        res_dt = datetime.fromisoformat(resolved_at)
        res_diff = (res_dt - created_dt).total_seconds()
        metrics["resolution_time_seconds"] = int(res_diff)
        # SLA breach if resolution time > 180 seconds (3 minutes)
        if res_diff > 180:
            metrics["sla_breached"] = True
    
    return metrics

def save_event_to_db(event_data: dict):
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    room_id = event_data["extension"]["roomId"]
    event_type = event_data["payload"][0]["contentString"]
    
    cursor.execute("""
        INSERT OR REPLACE INTO nurse_call_events (id, room_id, event_type, status, timestamp, fhir_payload)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        event_data["id"],
        room_id,
        event_type,
        event_data["status"],
        event_data["extension"]["timestamp"],
        json.dumps(event_data, ensure_ascii=False)
    ))
    conn.commit()
    conn.close()

@app.get("/api/events")
def get_recent_events():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    cursor.execute("SELECT id, room_id, event_type, status, timestamp, acknowledged_at, resolved_at, ack_time_seconds, resolution_time_seconds, sla_breached FROM nurse_call_events ORDER BY timestamp DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    
    events = []
    for row in rows:
        events.append({
            "id": row[0],
            "room_id": row[1],
            "event_type": row[2],
            "status": row[3],
            "timestamp": row[4],
            "acknowledged_at": row[5],
            "resolved_at": row[6],
            "ack_time_seconds": row[7],
            "resolution_time_seconds": row[8],
            "sla_breached": row[9]
        })
    return {"events": events}

@app.post("/api/events/trigger")
async def trigger_event(req: CallEventRequest):
    """Simulate or trigger an event manually for testing or from PBX Listener."""
    formatted_room = req.room_id.zfill(4)
    now_iso = datetime.now().isoformat()
    
    # Handle Hardware PBX Event Logic directly for SLA tracking
    if req.event_type == "NURSE_TALKING":
        return await acknowledge_call(formatted_room)
    elif req.event_type == "CALL_CLEARED":
        return await clear_call(formatted_room)
    
    # Map event types from PBX listener to dashboard-compatible types
    event_type_mapping = {
        "CALL_BEDSIDE": "CALL_TRIGGERED",
        "CALL_BATHROOM_EMERGENCY": "CALL_TRIGGERED",
    }
    
    mapped_event_type = event_type_mapping.get(req.event_type, req.event_type)
    
    event_payload = {
        "resourceType": "CommunicationRequest",
        "id": f"snc-event-{formatted_room}-{int(datetime.now().timestamp())}",
        "status": "active" if mapped_event_type == "CALL_TRIGGERED" else "completed",
        "occurrenceDateTimeField": now_iso,
        "payload": [{"contentString": mapped_event_type}],
        "extension": {
            "roomId": formatted_room,
            "timestamp": now_iso
        }
    }
    
    save_event_to_db(event_payload)
    await manager.broadcast(event_payload)
    return {"status": "success", "event": event_payload}

@app.post("/api/events/acknowledge/{room_id}")
async def acknowledge_call(room_id: str):
    """Nurse acknowledges the call from Dashboard."""
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    formatted_room = room_id.zfill(4)
    
    # Get the original timestamp to calculate ack time
    cursor.execute("SELECT timestamp FROM nurse_call_events WHERE room_id = ? AND status = 'active' ORDER BY timestamp DESC LIMIT 1", (formatted_room,))
    row = cursor.fetchone()
    sla_metrics = None
    
    if row:
        created_at = row[0]
        sla_metrics = calculate_sla_metrics(created_at, acknowledged_at=now_iso)
        
        cursor.execute("""
            UPDATE nurse_call_events SET status = 'acknowledged', acknowledged_at = ?, 
            ack_time_seconds = ?, sla_breached = ?
            WHERE room_id = ? AND status = 'active'
        """, (now_iso, sla_metrics["ack_time_seconds"], sla_metrics["sla_breached"], formatted_room))
        conn.commit()
    
    conn.close()
    
    ack_event = {
        "resourceType": "CommunicationRequest",
        "id": f"ack-{formatted_room}-{int(datetime.now().timestamp())}",
        "status": "acknowledged",
        "payload": [{"contentString": "ACKNOWLEDGED"}],
        "extension": {"roomId": formatted_room, "timestamp": now_iso}
    }
    await manager.broadcast(ack_event)
    return {"status": "acknowledged", "room_id": formatted_room, "sla_metrics": sla_metrics if row else None}

@app.post("/api/events/clear/{room_id}")
async def clear_call(room_id: str):
    """Clear the call event when issue is resolved."""
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    formatted_room = room_id.zfill(4)
    
    # Get the original timestamp to calculate resolution time
    cursor.execute("SELECT timestamp FROM nurse_call_events WHERE room_id = ? AND status IN ('active', 'acknowledged') ORDER BY timestamp DESC LIMIT 1", (formatted_room,))
    row = cursor.fetchone()
    sla_metrics = None
    
    if row:
        created_at = row[0]
        sla_metrics = calculate_sla_metrics(created_at, resolved_at=now_iso)
        
        cursor.execute("""
            UPDATE nurse_call_events SET status = 'resolved', resolved_at = ?, 
            resolution_time_seconds = ?, sla_breached = ?
            WHERE room_id = ? AND status IN ('active', 'acknowledged')
        """, (now_iso, sla_metrics["resolution_time_seconds"], sla_metrics["sla_breached"], formatted_room))
        conn.commit()
    
    conn.close()
    
    clear_event = {
        "resourceType": "CommunicationRequest",
        "id": f"clear-{formatted_room}-{int(datetime.now().timestamp())}",
        "status": "resolved",
        "payload": [{"contentString": "CALL_CLEARED"}],
        "extension": {"roomId": formatted_room, "timestamp": now_iso}
    }
    await manager.broadcast(clear_event)
    return {"status": "cleared", "room_id": formatted_room, "sla_metrics": sla_metrics if row else None}

@app.get("/api/analytics/kpi")
def get_kpi_summary():
    """Get KPI analytics for nurse call performance."""
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    
    # Get average ack time
    cursor.execute("SELECT AVG(ack_time_seconds) FROM nurse_call_events WHERE ack_time_seconds IS NOT NULL")
    avg_ack_time = cursor.fetchone()[0] or 0
    
    # Get average resolution time
    cursor.execute("SELECT AVG(resolution_time_seconds) FROM nurse_call_events WHERE resolution_time_seconds IS NOT NULL")
    avg_resolution_time = cursor.fetchone()[0] or 0
    
    # Get total events by type
    cursor.execute("SELECT event_type, COUNT(*) FROM nurse_call_events GROUP BY event_type")
    events_by_type = dict(cursor.fetchall())
    
    # Get SLA compliance rate
    cursor.execute("SELECT COUNT(*) FROM nurse_call_events")
    total_events = cursor.fetchone()[0] or 1
    
    cursor.execute("SELECT COUNT(*) FROM nurse_call_events WHERE sla_breached = 0 OR sla_breached IS NULL")
    compliant_events = cursor.fetchone()[0]
    
    sla_compliance_rate = (compliant_events / total_events) * 100
    
    conn.close()
    
    return {
        "avg_ack_time_seconds": round(avg_ack_time, 2),
        "avg_resolution_time_seconds": round(avg_resolution_time, 2),
        "total_events": total_events,
        "events_by_type": events_by_type,
        "sla_compliance_rate": round(sla_compliance_rate, 2)
    }

@app.get("/api/ai/daily-summary")
async def get_daily_ai_summary():
    """Generate daily executive AI summary using Gemini Direct REST API (฿0/month)."""
    kpi_summary = get_kpi_summary()
    recent_events_res = get_recent_events()
    recent_events = recent_events_res.get("events", [])
    
    summary_text = await gemini_service.generate_daily_executive_summary(kpi_summary, recent_events)
    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "kpi_metrics": kpi_summary,
        "ai_summary": summary_text
    }

@app.post("/api/ai/analyze-anomaly/{room_id}")
async def analyze_room_anomaly(room_id: str):
    """Analyze room emergency call patterns for anomalies using Gemini Direct REST API."""
    formatted_room = room_id.zfill(4)
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    cursor = conn.cursor()
    cursor.execute("SELECT id, room_id, event_type, status, timestamp, ack_time_seconds, resolution_time_seconds, sla_breached FROM nurse_call_events WHERE room_id = ? ORDER BY timestamp DESC LIMIT 20", (formatted_room,))
    rows = cursor.fetchall()
    conn.close()
    
    room_events = []
    for row in rows:
        room_events.append({
            "id": row[0], "room_id": row[1], "event_type": row[2], "status": row[3],
            "timestamp": row[4], "ack_time_seconds": row[5], "resolution_time_seconds": row[6], "sla_breached": row[7]
        })
        
    analysis = await gemini_service.analyze_emergency_anomaly(formatted_room, room_events)
    return {
        "status": "success",
        "room_id": formatted_room,
        "event_count": len(room_events),
        "ai_analysis": analysis
    }

@app.post("/api/ai/send-daily-summary")
async def send_daily_summary_to_chat(webhook_url: str = None):
    """Generate and send daily AI executive summary card to Google Chat."""
    kpi_summary = get_kpi_summary()
    recent_events_res = get_recent_events()
    recent_events = recent_events_res.get("events", [])
    
    summary_text = await gemini_service.generate_daily_executive_summary(kpi_summary, recent_events)
    sent_success = await gemini_service.send_google_chat_summary(webhook_url, summary_text, kpi_summary)
    
    return {
        "status": "sent" if sent_success else "failed",
        "chat_webhook_delivered": sent_success,
        "ai_summary": summary_text
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "snc-backend",
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws/nurse-station")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logging.info(f"Received WS message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
