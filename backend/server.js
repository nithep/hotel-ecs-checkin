const express = require('express');
const cors = require('cors');
const pbx = require('../pbx-connector/mock_pbx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const db = require('./db');

// Get all rooms from Database
app.get('/api/rooms', (req, res) => {
    db.getAllRooms((err, rooms) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, rooms });
    });
});

app.post('/api/checkin', (req, res) => {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-in Request for Room: ${roomNumber}`);
    
    // Call the Mock PBX (Digital Twin) to turn ON the relay
    const hardwareResult = pbx.turnOnRelay(roomNumber);
    
    // Persist to Database
    db.updateRoomState(roomNumber, 'occupied', true, (err) => {
        if (err) return res.status(500).json({ error: 'Database update failed' });
        
        res.json({
            message: 'Check-in successful',
            hardware_status: hardwareResult
        });
    });
});

app.post('/api/checkout', (req, res) => {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-out Request for Room: ${roomNumber}`);
    
    // Call the Mock PBX (Digital Twin) to turn OFF the relay
    const hardwareResult = pbx.turnOffRelay(roomNumber);
    
    // Persist to Database
    db.updateRoomState(roomNumber, 'vacant', false, (err) => {
        if (err) return res.status(500).json({ error: 'Database update failed' });
        
        res.json({
            message: 'Check-out successful',
            hardware_status: hardwareResult
        });
    });
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

// Start Server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Backend API Server running on port ${PORT}`);
    console.log(`🔧 Connected to Mock PBX Simulator`);
    console.log(`========================================\n`);
});
