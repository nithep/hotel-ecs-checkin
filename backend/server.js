const express = require('express');
const cors = require('cors');
const { createConnector } = require('../pbx-connector');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── PBX Connector Setup ──────────────────────────────────────────────────
// PBX_MODE: 'mock' (default), 'tcp' (simulator/real PBX), 'serial' (RS-232)
const PBX_MODE = process.env.PBX_MODE || 'mock';
const pbx = createConnector({
    mode: PBX_MODE,
    host: process.env.PBX_HOST || '127.0.0.1',
    port: parseInt(process.env.PBX_PORT || '10001', 10),
    serialPath: process.env.PBX_SERIAL || '',
    baudRate: parseInt(process.env.PBX_BAUD || '9600', 10),
    heartbeatInterval: PBX_MODE === 'mock' ? 0 : 30000,
});

// Log PBX events
pbx.on('checkin', (data) => console.log(`[PBX] ✅ Check-in:`, data));
pbx.on('checkout', (data) => console.log(`[PBX] 🔴 Check-out:`, data));
pbx.on('heartbeat', () => console.log(`[PBX] 💓 Heartbeat OK`));
pbx.on('connection_lost', () => console.log(`[PBX] ⚠️ Connection lost!`));
pbx.on('reconnecting', (d) => console.log(`[PBX] 🔄 Reconnecting (${d.attempt}/${d.maxAttempts})...`));
pbx.on('reconnected', () => {
    console.log(`[PBX] ✅ Reconnected!`);
    syncPbxStateWithDatabase();
});
pbx.on('error', (err) => console.error(`[PBX] ❌ Error:`, err.message));

// Middleware
app.use(cors());
app.use(express.json());

const db = require('./db');

// ─── State Synchronization ────────────────────────────────────────────────
function syncPbxStateWithDatabase() {
    console.log(`[SYNC] Starting State Synchronization...`);
    db.getAllRooms(async (err, rooms) => {
        if (err) {
            console.error(`[SYNC] Failed to get rooms from DB:`, err.message);
            return;
        }

        for (const room of rooms) {
            try {
                const isOccupied = room.status === 'occupied'; 
                const pbxStatus = await pbx.getRoomStatus(room.id);
                const isPbxOn = pbxStatus.status === 'ON';

                if (isOccupied && !isPbxOn) {
                    console.log(`[SYNC] Room ${room.id} is Occupied but PBX is OFF. Fixing (Auto-ON)...`);
                    await pbx.checkIn(room.id, 'SyncRecovery');
                } else if (!isOccupied && isPbxOn) {
                    console.log(`[SYNC] Room ${room.id} is Vacant but PBX is ON. Fixing (Auto-OFF)...`);
                    await pbx.checkOut(room.id);
                }
            } catch (syncErr) {
                console.warn(`[SYNC] Skipped syncing room ${room.id}:`, syncErr.message);
            }
        }
        console.log(`[SYNC] Synchronization Complete.`);
    });
}

// Get all rooms from Database
app.get('/api/rooms', (req, res) => {
    db.getAllRooms((err, rooms) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, rooms });
    });
});

app.post('/api/checkin', async (req, res) => {
    const { roomNumber, guestName } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-in Request for Room: ${roomNumber}`);
    
    try {
        // Send ON command to PBX (with retry logic built-in)
        const hardwareResult = await pbx.checkIn(roomNumber, guestName);
        
        // Persist to Database
        db.updateRoomState(roomNumber, 'occupied', true, (err) => {
            if (err) return res.status(500).json({ error: 'Database update failed' });
            
            res.json({
                message: 'Check-in successful',
                hardware_status: hardwareResult
            });
        });
    } catch (err) {
        console.error(`[API] Check-in failed for Room ${roomNumber}:`, err.message);
        res.status(500).json({ error: `PBX command failed: ${err.message}` });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-out Request for Room: ${roomNumber}`);
    
    try {
        // Send OFF command to PBX (with retry logic built-in)
        const hardwareResult = await pbx.checkOut(roomNumber);
        
        // Persist to Database
        db.updateRoomState(roomNumber, 'vacant', false, (err) => {
            if (err) return res.status(500).json({ error: 'Database update failed' });
            
            res.json({
                message: 'Check-out successful',
                hardware_status: hardwareResult
            });
        });
    } catch (err) {
        console.error(`[API] Check-out failed for Room ${roomNumber}:`, err.message);
        res.status(500).json({ error: `PBX command failed: ${err.message}` });
    }
});

// Get room status directly from PBX
app.get('/api/rooms/:id/status', async (req, res) => {
    try {
        const status = await pbx.getRoomStatus(req.params.id);
        res.json({ success: true, ...status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const fs = require('fs');
const path = require('path');

// API to serve OKF markdown documents
app.get('/api/docs', (req, res) => {
    // If the file parameter has no extension, append .md
    let filename = req.query.file || 'index.md';
    if (!filename.endsWith('.md')) {
        filename += '.md';
    }
    
    const safeFilename = path.basename(filename);
    let filePath = path.join(__dirname, '..', 'docs', safeFilename);
    
    // Check in root docs, if not found, check in docs/concepts
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '..', 'docs', 'concepts', safeFilename);
    }
    
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ success: true, content });
    } else {
        res.status(404).json({ error: 'Document not found' });
    }
});

// Start Server — connect PBX first, then listen
async function startServer() {
    try {
        await pbx.connect();
        console.log(`[PBX] ✅ Connected in ${PBX_MODE} mode`);
        // Trigger initial sync upon cold boot
        syncPbxStateWithDatabase();
    } catch (err) {
        console.warn(`[PBX] ⚠️ PBX connection failed: ${err.message} — server will start anyway`);
    }

    app.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`🚀 Backend API Server running on port ${PORT}`);
        console.log(`🔧 PBX Mode: ${PBX_MODE}`);
        console.log(`========================================\n`);
    });
}

startServer();
