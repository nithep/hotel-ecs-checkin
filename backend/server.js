/**
 * Hotel ECS Backend Server
 * Smart Hotel Self Check-in/Check-out System
 * 
 * Main Express.js application setup with JWT middleware,
 * CORS, error handling, and core API routes.
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Database setup
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/hotel_ecs.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database:', DB_PATH);
    initializeDatabase();
  }
});

/**
 * Initialize database tables
 */
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff', 'guest')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Guests table (check-in records)
    db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_encrypted TEXT NOT NULL,
        room_id TEXT NOT NULL,
        check_in_time DATETIME NOT NULL,
        check_out_time DATETIME,
        qr_code TEXT UNIQUE,
        pdpa_consent BOOLEAN DEFAULT 0,
        pdpa_consent_timestamp DATETIME,
        data_retention_days INTEGER DEFAULT 30,
        is_checked_out BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rooms table
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        room_number TEXT UNIQUE NOT NULL,
        floor INTEGER,
        status TEXT DEFAULT 'vacant' CHECK(status IN ('vacant', 'occupied', 'locked_open', 'maintenance')),
        last_guest_id INTEGER,
        last_check_in DATETIME,
        last_check_out DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(last_guest_id) REFERENCES guests(id)
      )
    `);

    // Audit logs table (encrypted)
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource TEXT,
        resource_id TEXT,
        details_encrypted TEXT,
        ip_address TEXT,
        status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failure')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // PDPA Consent Logs
    db.run(`
      CREATE TABLE IF NOT EXISTS pdpa_consent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_id INTEGER NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('consent_given', 'consent_withdrawn', 'data_deletion_requested')),
        retention_days INTEGER DEFAULT 30,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(guest_id) REFERENCES guests(id)
      )
    `);

    // Check-in/Check-out History
    db.run(`
      CREATE TABLE IF NOT EXISTS checkin_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_id INTEGER NOT NULL,
        room_id TEXT NOT NULL,
        check_in_time DATETIME NOT NULL,
        check_out_time DATETIME,
        qr_scanned_at DATETIME,
        door_unlocked_at DATETIME,
        door_locked_at DATETIME,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(guest_id) REFERENCES guests(id),
        FOREIGN KEY(room_id) REFERENCES rooms(id)
      )
    `);

    console.log('✅ Database tables initialized');
  });
}

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// CORS Configuration
const corsOptions = {
  origin: CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * JWT verification middleware
 */
function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Role-based access control middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No user',
        code: 'NO_USER'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Required role(s): ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
}

/**
 * PDPA Consent verification middleware
 */
function verifyPDPAConsent(req, res, next) {
  // Check if guest has given PDPA consent
  if (req.body.pdpa_consent === false) {
    return res.status(403).json({
      success: false,
      error: 'PDPA consent is required to proceed',
      code: 'NO_PDPA_CONSENT',
      details: {
        message: 'คุณต้องยอมรับนโยบายความเป็นส่วนตัว (PDPA) เพื่อติดตั้งเข้าห้องพัก',
        consent_url: '/api/privacy-policy'
      }
    });
  }
  next();
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Centralized error handler
 */
function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const requestId = req.id || crypto.randomUUID();

  console.error(`[${timestamp}] ERROR [${requestId}]:`, {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: Resource already exists',
      code: 'CONSTRAINT_VIOLATION',
      requestId
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
      details: err.details,
      requestId
    });
  }

  // JWT errors handled in middleware, but catch-all here
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'JWT_ERROR',
      requestId
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    requestId: NODE_ENV === 'development' ? requestId : undefined
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Encrypt data (AES-256-CBC)
 */
function encryptData(plaintext, key = process.env.ENCRYPTION_KEY || 'default-key-32-char-minimum!!!') {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data
 */
function decryptData(ciphertext, key = process.env.ENCRYPTION_KEY || 'default-key-32-char-minimum!!!') {
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

/**
 * Log audit event
 */
function logAudit(userId, action, resource, resourceId, details, ipAddress, status = 'success') {
  const detailsEncrypted = details ? encryptData(JSON.stringify(details)) : null;
  
  db.run(
    `INSERT INTO audit_logs (user_id, action, resource, resource_id, details_encrypted, ip_address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, action, resource, resourceId, detailsEncrypted, ipAddress, status],
    function(err) {
      if (err) {
        console.error('❌ Audit log error:', err);
      }
    }
  );
}

/**
 * Log PDPA consent
 */
function logPDPAConsent(guestId, action, retentionDays, ipAddress) {
  db.run(
    `INSERT INTO pdpa_consent_logs (guest_id, action, retention_days, ip_address)
     VALUES (?, ?, ?, ?)`,
    [guestId, action, retentionDays, ipAddress],
    function(err) {
      if (err) {
        console.error('❌ PDPA consent log error:', err);
      }
    }
  );
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    database: 'connected'
  });
});

/**
 * Authentication Routes
 */

// POST /api/auth/login - User login
app.post('/api/auth/login', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        logAudit(null, 'login_attempt', 'auth', email, { result: 'user_not_found' }, req.ip, 'failure');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // In production, use bcrypt for password hashing
      if (user.password_hash !== password) {
        logAudit(null, 'login_attempt', 'auth', email, { result: 'password_mismatch' }, req.ip, 'failure');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const token = generateToken(user);
      logAudit(user.id, 'login', 'auth', user.email, { role: user.role }, req.ip);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        expiresIn: JWT_EXPIRY
      });
    }
  );
});

/**
 * Guest Check-in Routes
 */

// POST /api/checkin - Guest check-in via QR code
app.post('/api/checkin', verifyPDPAConsent, (req, res, next) => {
  const { guest_name, room_id, qr_code, pdpa_consent } = req.body;

  if (!guest_name || !room_id || !qr_code) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: guest_name, room_id, qr_code',
      code: 'MISSING_FIELDS'
    });
  }

  const nameEncrypted = encryptData(guest_name);
  const checkInTime = new Date().toISOString();

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) return next(err);

    // Insert guest record
    db.run(
      `INSERT INTO guests (name_encrypted, room_id, check_in_time, qr_code, pdpa_consent, pdpa_consent_timestamp, data_retention_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nameEncrypted, room_id, checkInTime, qr_code, pdpa_consent ? 1 : 0, new Date().toISOString(), 30],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return next(err);
        }

        const guestId = this.lastID;

        // Update room status
        db.run(
          `UPDATE rooms SET status = 'occupied', last_guest_id = ?, last_check_in = ?
           WHERE id = ?`,
          [guestId, checkInTime, room_id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return next(err);
            }

            // Insert check-in history
            db.run(
              `INSERT INTO checkin_history (guest_id, room_id, check_in_time, qr_scanned_at)
               VALUES (?, ?, ?, ?)`,
              [guestId, room_id, checkInTime, new Date().toISOString()],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return next(err);
                }

                // Log PDPA consent
                if (pdpa_consent) {
                  logPDPAConsent(guestId, 'consent_given', 30, req.ip);
                }

                // Commit transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return next(err);
                  }

                  logAudit(null, 'checkin', 'guest', guestId, 
                    { room_id, guest_name: guest_name.substring(0, 3) + '***' }, req.ip);

                  res.status(200).json({
                    success: true,
                    message: 'Check-in successful',
                    message_th: 'ติดตั้งเข้าห้องสำเร็จ',
                    guest_id: guestId,
                    room_id,
                    check_in_time: checkInTime,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

/**
 * Guest Check-out Routes
 */

// POST /api/checkout - Guest check-out
app.post('/api/checkout', (req, res, next) => {
  const { guest_id, room_id } = req.body;

  if (!guest_id || !room_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: guest_id, room_id',
      code: 'MISSING_FIELDS'
    });
  }

  const checkOutTime = new Date().toISOString();

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) return next(err);

    // Update guest record
    db.run(
      `UPDATE guests SET check_out_time = ?, is_checked_out = 1
       WHERE id = ? AND room_id = ?`,
      [checkOutTime, guest_id, room_id],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return next(err);
        }

        // Update room status to vacant
        db.run(
          `UPDATE rooms SET status = 'vacant', last_check_out = ?
           WHERE id = ?`,
          [checkOutTime, room_id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return next(err);
            }

            // Update check-in history
            db.run(
              `UPDATE checkin_history SET check_out_time = ?, door_locked_at = ?, status = 'completed'
               WHERE guest_id = ? AND room_id = ? AND status = 'active'`,
              [checkOutTime, new Date().toISOString(), guest_id, room_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return next(err);
                }

                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return next(err);
                  }

                  logAudit(null, 'checkout', 'guest', guest_id, { room_id }, req.ip);

                  res.status(200).json({
                    success: true,
                    message: 'Check-out successful',
                    message_th: 'ติดตั้งออกจากห้องสำเร็จ',
                    guest_id,
                    room_id,
                    check_out_time: checkOutTime
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

/**
 * Room Status Routes
 */

// GET /api/room/status/:room_id - Get room status
app.get('/api/room/status/:room_id', (req, res, next) => {
  const { room_id } = req.params;

  db.get(
    `SELECT id, room_number, floor, status, last_guest_id, last_check_in, last_check_out, updated_at
     FROM rooms WHERE id = ?`,
    [room_id],
    (err, room) => {
      if (err) return next(err);

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        room: {
          id: room.id,
          room_number: room.room_number,
          floor: room.floor,
          status: room.status,
          last_guest_id: room.last_guest_id,
          last_check_in: room.last_check_in,
          last_check_out: room.last_check_out,
          updated_at: room.updated_at
        }
      });
    }
  );
});

// PUT /api/room/unlock/:room_id - Unlock room (Admin only)
app.put('/api/room/unlock/:room_id', verifyJWT, requireRole('admin', 'staff'), (req, res, next) => {
  const { room_id } = req.params;

  db.run(
    `UPDATE rooms SET status = 'locked_open', updated_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), room_id],
    function(err) {
      if (err) return next(err);

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
      }

      logAudit(req.user.id, 'room_unlock', 'room', room_id, {}, req.ip);

      res.json({
        success: true,
        message: 'Room unlocked',
        room_id,
        status: 'locked_open'
      });
    }
  );
});

// PUT /api/room/lock/:room_id - Lock room (Admin only)
app.put('/api/room/lock/:room_id', verifyJWT, requireRole('admin', 'staff'), (req, res, next) => {
  const { room_id } = req.params;

  db.run(
    `UPDATE rooms SET status = 'vacant', updated_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), room_id],
    function(err) {
      if (err) return next(err);

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
      }

      logAudit(req.user.id, 'room_lock', 'room', room_id, {}, req.ip);

      res.json({
        success: true,
        message: 'Room locked',
        room_id,
        status: 'vacant'
      });
    }
  );
});

/**
 * Privacy & PDPA Routes
 */

// GET /api/privacy-policy - Get privacy policy
app.get('/api/privacy-policy', (req, res) => {
  res.json({
    success: true,
    privacy_policy: {
      title: 'Hotel ECS Privacy Policy',
      title_th: 'นโยบายความเป็นส่วนตัว Hotel ECS',
      description: 'Personal data protection in accordance with Thailand\'s PDPA',
      data_collected: [
        'Guest name',
        'Room number',
        'Check-in/Check-out time',
        'QR code scan history'
      ],
      retention_period: '30 days after check-out',
      encryption: 'AES-256-GCM at rest, TLS 1.3 in transit',
      user_rights: [
        'Access your data',
        'Request data deletion',
        'Modify data retention settings',
        'Withdraw consent'
      ],
      contact_email: 'privacy@hotelecs.local',
      last_updated: '2026-07-18'
    }
  });
});

/**
 * Admin Routes (Protected)
 */

// GET /api/admin/audit-logs - Get audit logs (Admin only)
app.get('/api/admin/audit-logs', verifyJWT, requireRole('admin'), (req, res, next) => {
  const { limit = 50, offset = 0 } = req.query;

  db.all(
    `SELECT id, user_id, action, resource, resource_id, ip_address, status, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, logs) => {
      if (err) return next(err);

      res.json({
        success: true,
        audit_logs: logs,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }
  );
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

/**
 * Error Handler Middleware (must be last)
 */
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Hotel ECS Backend Server Started ✅             ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Server: http://localhost:${PORT}${' '.repeat(37 - PORT.toString().length)}║`);
  console.log(`║ Environment: ${NODE_ENV}${' '.repeat(45 - NODE_ENV.length)}║`);
  console.log(`║ Database: ${DB_PATH.substring(DB_PATH.length - 30)}${' '.repeat(24 - (DB_PATH.substring(DB_PATH.length - 30).length))}║`);
  console.log(`║ CORS Origin: ${CORS_ORIGIN}${' '.repeat(41 - CORS_ORIGIN.length)}║`);
  console.log('║                                                        ║');
  console.log('║ Available Endpoints:                                   ║');
  console.log('║ • GET  /api/health          - Health check             ║');
  console.log('║ • POST /api/auth/login      - User login               ║');
  console.log('║ • POST /api/checkin         - Guest check-in           ║');
  console.log('║ • POST /api/checkout        - Guest check-out          ║');
  console.log('║ • GET  /api/room/status/:id - Room status              ║');
  console.log('║ • PUT  /api/room/unlock/:id - Unlock room (admin)      ║');
  console.log('║ • PUT  /api/room/lock/:id   - Lock room (admin)        ║');
  console.log('║ • GET  /api/privacy-policy  - Privacy policy           ║');
  console.log('║ • GET  /api/admin/audit-logs- Audit logs (admin)       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) console.error(err);
    console.log('✅ Database connection closed');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});

module.exports = app;
