const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API Routes
app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    rooms: [
      { id: 101, status: 'occupied', power: true },
      { id: 102, status: 'occupied', power: true },
      { id: 103, status: 'occupied', power: true },
      { id: 104, status: 'occupied', power: true },
      { id: 105, status: 'occupied', power: true },
      { id: 106, status: 'vacant', power: false }
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// React SPA Catch-All Fallback
app.get('*', (req, res) => {
  const indexFile = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Frontend Assets Not Built Yet');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hotel Backend] Server listening on port ${PORT}`);
});
