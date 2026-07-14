const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { createConnector } = require('../pbx-connector');

// ─── Services ──────────────────────────────────────────────────────────────
const { ApprovalGate } = require('./services/approval_gate');
const { initAuditLog, appendAuditEvent, listAuditEvents } = require('./services/audit_log');
const { RateLimiter } = require('./services/rate_limiter');
const { TelegramBotService } = require('./services/telegram_bot');
const { GoogleNotifier } = require('./services/google_notifier');
const { WiFiService } = require('./services/wifi_service');
const apiKeyService = require('./services/apiKeyService');
const rateLimit = require('express-rate-limit');

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
pbx.on('connection_lost', () => {
    console.log(`[PBX] ⚠️ Connection lost!`);
    if (telegramBot) telegramBot.sendSystemAlert('Connection Lost', 'การเชื่อมต่อกับตู้สาขา PBX ขาดหาย!');
});
pbx.on('reconnecting', (d) => console.log(`[PBX] 🔄 Reconnecting (${d.attempt}/${d.maxAttempts})...`));
pbx.on('reconnected', () => {
    console.log(`[PBX] ✅ Reconnected!`);
    if (telegramBot) telegramBot.sendSystemAlert('Connection Restored', 'เชื่อมต่อกับตู้สาขา PBX สำเร็จแล้ว');
    syncPbxStateWithDatabase();
});
pbx.on('error', (err) => {
    console.error(`[PBX] ❌ Error:`, err.message);
    if (telegramBot) telegramBot.sendSystemAlert('PBX Error', err.message);
});

// Middleware
app.use(cors());
app.use(express.json());

const db = require('./db');

// ─── Initialize Safety Services ───────────────────────────────────────────
const gate = new ApprovalGate({
    approvalTtlMs: 60 * 1000,       // Approval หมดอายุใน 60 วินาที
    pendingTtlMs: 10 * 60 * 1000,   // Pending request หมดอายุใน 10 นาที
    enforceSchedule: process.env.ENFORCE_SCHEDULE !== 'false',
    scheduleStart: '06:00',
    scheduleEnd: '00:00',
});

const rateLimiter = new RateLimiter({
    maxCommands: 3,    // ≤ 3 cmd/min/room
    windowMs: 60000,
});

// Initialize Audit Log table
initAuditLog(db.db);
apiKeyService.initApiKeyDb();
console.log('[SAFETY] ✅ Approval Gate, Audit Log, Rate Limiter, API Key DB initialized');

// Setup Express Rate Limit for Open API
const externalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Initialize Telegram Bot Service
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
let telegramBot = null;

if (TELEGRAM_BOT_TOKEN) {
    telegramBot = new TelegramBotService({
        token: TELEGRAM_BOT_TOKEN,
        chatId: TELEGRAM_CHAT_ID,
        gate,
        pbx,
        rateLimiter,
        db: db.db,
        appendAuditEvent,
    });
    telegramBot.start();
}

// Initialize Google Chat Notifier
const googleNotifier = new GoogleNotifier();
if (googleNotifier.isChatActive() || googleNotifier.isSheetsActive()) {
    console.log('[GOOGLE CHAT/SHEETS] ✅ Google Notifier initialized');
}

const wifiService = new WiFiService();

// ─── Helper: Build command object for classification ──────────────────────
function buildCommand(commandType, roomNumber, options = {}) {
    const targetRooms = roomNumber === '*'
        ? ['*']
        : Array.isArray(roomNumber) ? roomNumber.map(String) : [String(roomNumber)];

    return {
        traceId: randomUUID(),
        commandType,
        targetRooms,
        requestedBy: options.requestedBy || 'user:frontend',
        source: options.source || 'unknown',
        dryRun: options.dryRun || false,
        executionMode: PBX_MODE,
        guestName: options.guestName || null,
        metadata: {
            flow: options.flow || null,
            reason: options.reason || null,
        },
    };
}

// ─── Helper: Execute command through safety pipeline ──────────────────────
async function executeWithSafety(command, executeFn) {
    const now = new Date();

    // 1. Rate Limiter — ตรวจสอบทุกห้องที่ได้รับผลกระทบ
    for (const room of command.targetRooms) {
        if (room === '*') continue; // all-room จะถูก gate บล็อกอยู่แล้ว
        const rateResult = rateLimiter.check(room, now);
        if (!rateResult.allowed) {
            return {
                blocked: true,
                reason: 'RATE_LIMITED',
                message: `ห้อง ${room} ส่งคำสั่งเกินขีดจำกัด (${rateLimiter.maxCommands} ครั้ง/นาที)`,
                resetAt: rateResult.resetAt,
            };
        }
    }

    // 2. Approval Gate — จำแนกระดับความเสี่ยง
    const classification = gate.classify(command, now);

    if (classification.requiresApproval) {
        // High-risk: สร้าง pending approval
        const pending = gate.requestApproval(command, classification, now);

        // Log APPROVAL_REQUESTED
        await appendAuditEvent(db.db, {
            traceId: command.traceId,
            eventType: 'APPROVAL_REQUESTED',
            command: { ...command, riskCode: classification.riskCode },
        });

        // Trigger Telegram Approval Notification
        if (telegramBot) {
            telegramBot.sendApprovalRequest(pending).catch(err => {
                console.error('[TELEGRAM] Error sending approval request:', err.message);
            });
        }

        return {
            blocked: true,
            reason: 'APPROVAL_REQUIRED',
            approvalId: pending.approvalId,
            classification,
            message: `คำสั่งเสี่ยงสูง (${classification.riskCode}: ${classification.riskName}) — ต้องได้รับอนุมัติจากแอดมินก่อน`,
        };
    }

    // 3. AUTO_PASSED — คำสั่ง low-risk ผ่านอัตโนมัติ แต่ต้อง log ทุกครั้ง
    await appendAuditEvent(db.db, {
        traceId: command.traceId,
        eventType: 'AUTO_PASSED',
        command: { ...command, riskCode: null },
    });

    // 4. If dryRun, skip rate limiter record and physical execute
    if (command.dryRun) {
        return {
            blocked: false,
            dryRun: true,
            result: { success: true, status: 'DRY_RUN_PASSED', message: 'คำสั่งผ่านการตรวจสอบความปลอดภัยเรียบร้อยแล้ว (ไม่ได้ยิงจริง)' }
        };
    }

    // 5. Record ลง Rate Limiter
    for (const room of command.targetRooms) {
        if (room === '*') continue;
        rateLimiter.record(room, now);
    }

    // 6. Execute
    const result = await executeFn();
    return { blocked: false, result };
}

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

// ═══════════════════════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════════════════════

// Get all rooms from Database
app.get('/api/rooms', (req, res) => {
    db.getAllRooms((err, rooms) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, rooms });
    });
});

// ─── Check-in (ผ่าน Safety Pipeline) ──────────────────────────────────────
app.post('/api/checkin', async (req, res) => {
    const { roomNumber, guestName, guestEmail, dryRun, dry_run, days, pdpaConsent } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    if (!dryRun && !dry_run && !pdpaConsent) {
        return res.status(403).json({ error: 'PDPA Consent is required for check-in' });
    }

    console.log(`[API] Received Check-in Request for Room: ${roomNumber} (Dry-run: ${Boolean(dryRun || dry_run)})`);

    const command = buildCommand('ROOM_ON', roomNumber, {
        source: 'checkin_flow',
        flow: 'checkin',
        guestName,
        dryRun: Boolean(dryRun || dry_run),
    });

    try {
        const safetyResult = await executeWithSafety(command, async () => {
            const numDays = days ? parseInt(days, 10) : 1;
            const hardwareResult = await pbx.checkIn(roomNumber, guestName, numDays);
            return hardwareResult;
        });

        if (safetyResult.blocked) {
            const statusCode = safetyResult.reason === 'RATE_LIMITED' ? 429 : 202;
            return res.status(statusCode).json(safetyResult);
        }

        if (safetyResult.dryRun) {
            return res.json({
                message: 'Check-in (Dry-run) successful',
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
            });
        }

        // Persist to Database with PDPA data
        const dbOptions = {
            guestName,
            guestEmail,
            consentGivenAt: pdpaConsent ? new Date().toISOString() : null,
            consentIp: req.ip
        };
        db.updateRoomState(roomNumber, 'occupied', true, dbOptions, (err) => {
            if (err) return res.status(500).json({ error: 'Database update failed' });
            
            // Notify Front Desk via Google Chat (and trigger email via Sheets Webhook)
            googleNotifier.sendCheckinAlert({ roomNumber, guestName, guestEmail });

            res.json({
                message: 'Check-in successful',
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
            });
        });
    } catch (err) {
        console.error(`[API] Check-in failed for Room ${roomNumber}:`, err.message);
        res.status(500).json({ error: `PBX command failed: ${err.message}` });
    }
});

// ─── Check-out (ผ่าน Safety Pipeline) ─────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
    const { roomNumber, dryRun, dry_run } = req.body;
    
    if (!roomNumber) {
        return res.status(400).json({ error: 'roomNumber is required' });
    }

    console.log(`[API] Received Check-out Request for Room: ${roomNumber} (Dry-run: ${Boolean(dryRun || dry_run)})`);

    const command = buildCommand('ROOM_OFF', roomNumber, {
        source: 'checkout_flow',
        flow: 'checkout',
        dryRun: Boolean(dryRun || dry_run),
    });

    try {
        const safetyResult = await executeWithSafety(command, async () => {
            const hardwareResult = await pbx.checkOut(roomNumber);
            return hardwareResult;
        });

        if (safetyResult.blocked) {
            const statusCode = safetyResult.reason === 'RATE_LIMITED' ? 429 : 202;
            return res.status(statusCode).json(safetyResult);
        }

        if (safetyResult.dryRun) {
            return res.json({
                message: 'Check-out (Dry-run) successful',
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
            });
        }

        // Persist to Database
        db.updateRoomState(roomNumber, 'vacant', false, (err) => {
            if (err) return res.status(500).json({ error: 'Database update failed' });
            
            // Notify Front Desk via Google Chat
            googleNotifier.sendCheckoutAlert({ roomNumber });

            res.json({
                message: 'Check-out successful',
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
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

// ─── Control Webhook (สำหรับ AppSheet / แอดมินบังคับเปิด-ปิด) ─────────────
app.post('/api/rooms/control', async (req, res) => {
    const { roomNumber, action, source, dryRun } = req.body;
    
    if (!roomNumber || !action) {
        return res.status(400).json({ error: 'roomNumber and action (ON/OFF) are required' });
    }

    const commandType = action.toUpperCase() === 'ON' ? 'ROOM_ON' : 'ROOM_OFF';
    const reqSource = source || 'appsheet_webhook';

    console.log(`[API] Received Control Webhook for Room: ${roomNumber} -> ${action} (Source: ${reqSource})`);

    const command = buildCommand(commandType, roomNumber, {
        source: reqSource,
        flow: 'force_control',
        dryRun: Boolean(dryRun),
    });

    try {
        const safetyResult = await executeWithSafety(command, async () => {
            if (commandType === 'ROOM_ON') {
                return await pbx.checkIn(roomNumber, 'Force ON');
            } else {
                return await pbx.checkOut(roomNumber);
            }
        });

        if (safetyResult.blocked) {
            const statusCode = safetyResult.reason === 'RATE_LIMITED' ? 429 : 202;
            return res.status(statusCode).json(safetyResult);
        }

        if (safetyResult.dryRun) {
            return res.json({
                message: `Control (Dry-run) successful -> ${action}`,
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
            });
        }

        // Persist to Database
        const dbStatus = commandType === 'ROOM_ON' ? 'occupied' : 'vacant';
        const isOccupied = commandType === 'ROOM_ON';
        
        db.updateRoomState(roomNumber, dbStatus, isOccupied, (err) => {
            if (err) return res.status(500).json({ error: 'Database update failed' });
            
            // Notify via Google Chat
            if (commandType === 'ROOM_ON') {
                googleNotifier.sendCheckinAlert({ roomNumber, guestName: 'Force ON (AppSheet)' });
            } else {
                googleNotifier.sendCheckoutAlert({ roomNumber });
            }

            res.json({
                success: true,
                message: `Force ${action} successful`,
                trace_id: command.traceId,
                hardware_status: safetyResult.result,
            });
        });
    } catch (err) {
        console.error(`[API] Control failed for Room ${roomNumber}:`, err.message);
        res.status(500).json({ error: `PBX command failed: ${err.message}` });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// External / Open API Routes (สำหรับ 3rd Party PMS)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/v1/external/checkin', externalApiLimiter, (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    apiKeyService.validateApiKey(apiKey, async (err, isValid) => {
        if (err || !isValid) {
            return res.status(403).json({ error: 'Invalid or revoked API Key' });
        }

        const { roomNumber, guestName, dryRun } = req.body;
        if (!roomNumber) {
            return res.status(400).json({ error: 'roomNumber is required' });
        }

        console.log(`[OPEN-API] Check-in request for Room: ${roomNumber} via API Key`);

        const command = buildCommand('ROOM_ON', roomNumber, {
            source: 'external_api',
            flow: 'checkin',
            guestName,
            dryRun: Boolean(dryRun),
        });

        try {
            const safetyResult = await executeWithSafety(command, async () => {
                return await pbx.checkIn(roomNumber, guestName);
            });

            if (safetyResult.blocked) {
                const statusCode = safetyResult.reason === 'RATE_LIMITED' ? 429 : 202;
                return res.status(statusCode).json(safetyResult);
            }

            if (safetyResult.dryRun) {
                return res.json({
                    message: 'External Check-in (Dry-run) successful',
                    trace_id: command.traceId,
                    hardware_status: safetyResult.result,
                });
            }

            // For external checkin, PDPA is handled by 3rd party
            db.updateRoomState(roomNumber, 'occupied', true, { guestName, consentGivenAt: new Date().toISOString() }, (err) => {
                if (err) return res.status(500).json({ error: 'Database update failed' });
                googleNotifier.sendCheckinAlert({ roomNumber, guestName: guestName || 'External API' });
                res.json({
                    success: true,
                    message: 'External Check-in successful',
                    trace_id: command.traceId,
                    hardware_status: safetyResult.result,
                });
            });
        } catch (err) {
            console.error(`[OPEN-API] Check-in failed:`, err.message);
            res.status(500).json({ error: `Command failed: ${err.message}` });
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Admin Approval Routes (/admin/approval)
// ═══════════════════════════════════════════════════════════════════════════

// ดึงรายการคำสั่งที่รอ approval
app.get('/api/admin/approval', (req, res) => {
    try {
        const pending = gate.listPending();
        res.json({ success: true, pending });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ดึงรายละเอียดคำสั่งเฉพาะตัว
app.get('/api/admin/approval/:id', (req, res) => {
    const record = gate.get(req.params.id);
    if (!record) {
        return res.status(404).json({ error: 'Approval request not found' });
    }
    res.json({ success: true, approval: record });
});

// Admin กด Approve
app.post('/api/admin/approval/:id/approve', async (req, res) => {
    const { reason, decidedBy } = req.body;

    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'reason is required' });
    }

    try {
        const record = gate.approve(req.params.id, {
            reason,
            decidedBy: decidedBy || `admin:${req.ip}`,
            ipAddress: req.ip,
        });

        // Log APPROVED event
        await appendAuditEvent(db.db, {
            traceId: record.command.traceId,
            eventType: 'APPROVED',
            command: { ...record.command, riskCode: record.classification.riskCode },
            approval: {
                decided_by: record.decidedBy,
                decided_at: record.decidedAt,
                reason: record.reason,
                ip_address: record.ipAddress,
            },
            expiry: {
                approved_at: record.approvedAt,
                expires_at: record.approvalExpiresAt,
                executed_at: null,
                expired: false,
            },
        });

        res.json({
            success: true,
            message: 'อนุมัติแล้ว — คำสั่งจะหมดอายุใน 60 วินาที',
            approval: gate.serialize(record),
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin กด Reject
app.post('/api/admin/approval/:id/reject', async (req, res) => {
    const { reason, decidedBy } = req.body;

    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'reason is required' });
    }

    try {
        const record = gate.reject(req.params.id, {
            reason,
            decidedBy: decidedBy || `admin:${req.ip}`,
            ipAddress: req.ip,
        });

        // Log REJECTED event
        await appendAuditEvent(db.db, {
            traceId: record.command.traceId,
            eventType: 'REJECTED',
            command: { ...record.command, riskCode: record.classification.riskCode },
            approval: {
                decided_by: record.decidedBy,
                decided_at: record.decidedAt,
                reason: record.reason,
                ip_address: record.ipAddress,
            },
        });

        res.json({
            success: true,
            message: 'คำสั่งถูกปฏิเสธ',
            approval: gate.serialize(record),
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Execute คำสั่งที่ได้รับอนุมัติแล้ว (ภายใน 60 วินาที)
app.post('/api/admin/approval/:id/execute', async (req, res) => {
    try {
        const record = gate.consumeApproved(req.params.id);
        const command = record.command;

        // Rate Limiter check อีกรอบก่อนยิงจริง
        for (const room of command.targetRooms) {
            if (room === '*') continue;
            const rateResult = rateLimiter.check(room);
            if (!rateResult.allowed) {
                return res.status(429).json({
                    error: `ห้อง ${room} ส่งคำสั่งเกินขีดจำกัด`,
                    resetAt: rateResult.resetAt,
                });
            }
        }

        // Execute PBX command
        let hardwareResult;
        if (command.commandType === 'ROOM_ON' || command.commandType === 'ALL_ROOM_ON') {
            for (const room of command.targetRooms) {
                hardwareResult = await pbx.checkIn(room, command.guestName);
                rateLimiter.record(room);
                
                // Update SQLite Database
                await new Promise((resolve, reject) => {
                    db.updateRoomState(room, 'occupied', true, (err) => {
                        if (err) {
                            console.error(`[DB] Failed to update room ${room} state on approval execute:`, err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        } else if (command.commandType === 'ROOM_OFF' || command.commandType === 'ALL_ROOM_OFF') {
            for (const room of command.targetRooms) {
                hardwareResult = await pbx.checkOut(room);
                rateLimiter.record(room);
                
                // Update SQLite Database
                await new Promise((resolve, reject) => {
                    db.updateRoomState(room, 'vacant', false, (err) => {
                        if (err) {
                            console.error(`[DB] Failed to update room ${room} state on approval execute:`, err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }

        // Mark as executed
        gate.markExecuted(req.params.id);

        // Log execution
        await appendAuditEvent(db.db, {
            traceId: command.traceId,
            eventType: 'APPROVED',
            command: { ...command, riskCode: record.classification.riskCode },
            expiry: {
                approved_at: record.approvedAt,
                expires_at: record.approvalExpiresAt,
                executed_at: new Date().toISOString(),
                expired: false,
            },
            result: { hardware: hardwareResult },
        });

        res.json({
            success: true,
            message: 'คำสั่งถูกดำเนินการแล้ว',
            trace_id: command.traceId,
            hardware_status: hardwareResult,
        });
    } catch (err) {
        // ถ้า approval หมดอายุ → log EXPIRED
        if (err.message.includes('expired')) {
            await appendAuditEvent(db.db, {
                traceId: req.params.id,
                eventType: 'EXPIRED',
                command: { commandType: 'UNKNOWN', targetRooms: [] },
            }).catch(() => {});
        }
        res.status(400).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// API Key Management Routes (/admin/apikeys)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/admin/apikeys', (req, res) => {
    apiKeyService.listApiKeys((err, keys) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, keys });
    });
});

app.post('/api/admin/apikeys', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    
    apiKeyService.createApiKey(name, (err, keyInfo) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, key: keyInfo });
    });
});

app.delete('/api/admin/apikeys/:id', (req, res) => {
    apiKeyService.revokeApiKey(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'API Key revoked successfully' });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Wi-Fi Management Routes
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/wifi/status', async (req, res) => {
    try {
        const status = await wifiService.getStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/wifi/scan', async (req, res) => {
    try {
        const result = await wifiService.scanNetworks();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/wifi/connect', async (req, res) => {
    const { ssid, password } = req.body;
    if (!ssid) {
        return res.status(400).json({ success: false, error: 'SSID is required' });
    }
    try {
        const result = await wifiService.connect(ssid, password);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/wifi/disconnect', async (req, res) => {
    try {
        const result = await wifiService.disconnect();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/wifi/toggle', async (req, res) => {
    const { enabled } = req.body;
    if (enabled === undefined) {
        return res.status(400).json({ success: false, error: 'enabled parameter is required' });
    }
    try {
        const result = await wifiService.toggleWifi(enabled);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Audit Log Routes
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/audit/events', async (req, res) => {
    try {
        const events = await listAuditEvents(db.db, {
            traceId: req.query.trace_id,
            eventType: req.query.event_type,
            commandType: req.query.command_type,
            limit: req.query.limit,
        });
        res.json({ success: true, events });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Telemetry & SSE Stream (/api/telemetry/stream)
// ═══════════════════════════════════════════════════════════════════════════
const os = require('os');
let sseClients = [];

app.get('/api/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush headers to establish connection

    const clientId = Date.now();
    sseClients.push({ id: clientId, res });

    res.write(`data: ${JSON.stringify({ type: 'sys', data: 'SSE Connection Established' })}\n\n`);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

function broadcastTelemetry(type, data) {
    if (sseClients.length === 0) return;
    const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
    sseClients.forEach(client => client.res.write(payload));
}

// Bind PBX events to SSE
pbx.on('checkin', (data) => broadcastTelemetry('pbx', `✅ Check-in: Room ${data.roomNumber || data.room}`));
pbx.on('checkout', (data) => broadcastTelemetry('pbx', `🔴 Check-out: Room ${data.roomNumber || data.room}`));
pbx.on('heartbeat', () => broadcastTelemetry('pbx', `💓 Heartbeat OK`));
pbx.on('connection_lost', () => broadcastTelemetry('sys', `⚠️ PBX Connection lost!`));
pbx.on('reconnected', () => broadcastTelemetry('sys', `✅ PBX Reconnected!`));
pbx.on('error', (err) => broadcastTelemetry('pbx', `❌ Error: ${err.message}`));

// Periodically send CPU/RAM metrics
setInterval(() => {
    const cpuLoad = os.loadavg()[0]; 
    const cpus = os.cpus().length;
    const cpuPercent = Math.min((cpuLoad / cpus) * 100, 100).toFixed(1); 
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

    broadcastTelemetry('metrics', {
        cpu: parseFloat(cpuPercent),
        ram: parseFloat(ramPercent),
        wlanDown: (Math.random() * 0.5).toFixed(3), // Simulated network
        wlanUp: (Math.random() * 0.1).toFixed(3),
    });
}, 3000);

// ═══════════════════════════════════════════════════════════════════════════
// Docs & Static Files
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');

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

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// React Router Fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
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

    app.listen(PORT, '0.0.0.0', () => {
        const os = require('os');
        const nets = os.networkInterfaces();
        let localIP = 'unknown';
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    localIP = net.address;
                }
            }
        }
        console.log(`\n========================================`);
        console.log(`🚀 Backend API Server running on port ${PORT}`);
        console.log(`🔧 PBX Mode: ${PBX_MODE}`);
        console.log(`🛡️  Safety: Approval Gate + Audit Log + Rate Limiter`);
        console.log(`🌐 Access from browser: http://${localIP}:${PORT}`);
        console.log(`========================================\n`);
    });
}

startServer();
