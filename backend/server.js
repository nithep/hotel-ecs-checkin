const express = require('express');
const cors = require('cors');
const pbx = require('../pbx-connector/mock_pbx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/checkin', (req, res) => {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-in Request for Room: ${roomNumber}`);
    
    // Call the Mock PBX (Digital Twin) to turn ON the relay
    const result = pbx.turnOnRelay(roomNumber);
    
    res.json({
        message: 'Check-in successful',
        hardware_status: result
    });
});

app.post('/api/checkout', (req, res) => {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-out Request for Room: ${roomNumber}`);
    
    // Call the Mock PBX (Digital Twin) to turn OFF the relay
    const result = pbx.turnOffRelay(roomNumber);
    
    res.json({
        message: 'Check-out successful',
        hardware_status: result
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Backend API Server running on port ${PORT}`);
    console.log(`🔧 Connected to Mock PBX Simulator`);
    console.log(`========================================\n`);
});
