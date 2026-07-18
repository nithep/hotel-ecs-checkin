# Hotel ECS Integration System - Architecture

## 🏗️ System Overview

The Hotel ECS (Electronic Communication System) Integration is a **smart self-check-in/check-out system** that automates guest access to hotel rooms through PBX integration, QR code scanning, and real-time room control.

**Target Platform**: Raspberry Pi Zero 2W + Phonik PBX (ECS-103R)  
**Primary Stack**: Node.js (Backend) + React (Frontend) + PostgreSQL (Database)

---

## 📐 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GUEST FACING INTERFACE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐         ┌──────────────────────┐               │
│  │  Guest Check-in UI   │         │   Staff Dashboard    │               │
│  │  (React/Mobile QR)   │         │   (Admin Panel)      │               │
│  │                      │         │                      │               │
│  │ • QR Code Scanner    │         │ • Room Management    │               │
│  │ • Check-in Form      │         │ • Guest Records      │               │
│  │ • Room Status        │         │ • Audit Logs         │               │
│  └──────────┬───────────┘         └──────────┬───────────┘               │
│             │                                 │                           │
│             └─────────────────┬────────────────┘                          │
│                               │                                           │
│                          HTTPS/TLS                                        │
│                          (Port 443)                                       │
│                               │                                           │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │    NGINX REVERSE PROXY   │
                    │                          │
                    │ • SSL Termination        │
                    │ • Rate Limiting          │
                    │ • Static Files Serving   │
                    │ • WebSocket Upgrade      │
                    │ (Port 80/443)            │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   API GATEWAY / ROUTER   │
                    │                          │
                    │ • Authentication         │
                    │ • Authorization (RBAC)   │
                    │ • Request Validation     │
                    │ • Error Handling         │
                    └─┬──────────┬──────────────┘
                      │          │
         ┌────────────┘          └────────────┐
         │                                     │
    ┌────▼──────────┐          ┌─────────────▼──────┐
    │ AUTH SERVICE  │          │ ROOM SERVICE / API  │
    │               │          │                     │
    │ • JWT Tokens  │          │ • Check-in Logic    │
    │ • User CRUD   │          │ • Check-out Logic   │
    │ • PDPA Check  │          │ • Room Status       │
    │ • MFA         │          │ • Guest Profiles    │
    └────┬──────────┘          └──────────┬──────────┘
         │                                 │
         │                      ┌──────────▼──────────┐
         │                      │  PBX BRIDGE SERVICE │
         │                      │                     │
         │                      │ • Command Queue     │
         │                      │ • Room Relay Ctrl   │
         │                      │ • Response Handler  │
         │                      │ • Error Recovery    │
         │                      └──────────┬──────────┘
         │                                 │
         │        ┌────────────────────────┘
         │        │
         │   ┌────▼─────────────────────────────┐
         │   │     PBX CONNECTOR (Daemon)       │
         │   │                                  │
         │   │ • Serial/TCP Handler            │
         │   │ • Protocol Parser               │
         │   │ • HMAC-SHA256 Signing           │
         │   │ • Retry Logic                   │
         │   │ • Connection Management         │
         │   │ (Runs on Pi, Direct to PBX)     │
         │   └────┬─────────────────────────────┘
         │        │
         │   ┌────▼──────────────────────┐
         │   │  Phonik PBX (ECS-103R)   │
         │   │                           │
         │   │ • Room Relay Control      │
         │   │ • Extension Signaling     │
         │   │ • Door Lock Commands      │
         │   │ (Serial RS-232/TCP)       │
         │   └────────────────────────────┘
         │
    ┌────▼─────────────────────────────────┐
    │        PostgreSQL Database           │
    │                                       │
    │ • Guests (ENCRYPTED)                 │
    │ • Users (Hashed Passwords)           │
    │ • Rooms                              │
    │ • Audit Logs (ENCRYPTED)             │
    │ • Check-in/Check-out Records         │
    │ • PDPA Retention Policy              │
    └───────────────────────────────────────┘
```

---

## 🔌 Component Architecture

### 1. **Frontend Layer** (React SPA)
**Location**: `/frontend`

**Responsibilities**:
- Guest check-in QR code scanning interface
- Staff admin dashboard
- Real-time room status display
- User authentication (JWT token storage)

**Key Features**:
- Responsive design (mobile-first for kiosk displays)
- Dark theme for late-night check-ins
- Offline mode support (limited functionality)
- Camera permission handling
- Error notifications

**Technology Stack**:
- React 18+ with Hooks
- React Router for navigation
- TailwindCSS for styling
- Axios for API calls
- `react-qr-scanner` for QR code reading

### 2. **Backend API Layer** (Node.js/Express)
**Location**: `/backend`

**Responsibilities**:
- RESTful API for frontend and mobile clients
- Business logic for check-in/check-out
- User and authentication management
- Database persistence
- Audit logging

**Architecture**:
```
backend/
├── server.js                 # Express app setup
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── validation.js       # Input schema validation
│   ├── errorHandler.js     # Centralized error handling
│   └── pdpaConsent.js      # PDPA consent verification
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── guests.js           # Guest CRUD operations
│   ├── rooms.js            # Room status & control
│   ├── checkin.js          # Check-in logic
│   └── admin.js            # Admin operations
├── controllers/
│   ├── authController.js
│   ├── guestController.js
│   ├── roomController.js
│   └── pbxController.js
├── models/
│   ├── User.js
│   ├── Guest.js
│   ├── Room.js
│   └── AuditLog.js
├── utils/
│   ├── encryption.js       # AES-256 encryption/decryption
│   ├── jwt.js             # JWT token generation/verification
│   ├── validators.js      # Data validation rules
│   └── pbxQueue.js        # Command queue manager
├── migrations/
│   └── *.sql              # Database schema migrations
└── .env.example
```

**Key APIs**:
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/checkin` - Guest check-in (QR scan)
- `POST /api/checkout` - Guest check-out
- `GET /api/rooms/:id` - Room status
- `PUT /api/rooms/:id/lock` - Lock/unlock room
- `GET /api/audit-logs` - Admin audit history

### 3. **PBX Connector Service** (Node.js Daemon)
**Location**: `/pbx-connector`

**Responsibilities**:
- Real-time communication with Phonik PBX
- Serial/TCP protocol handling
- Command queuing and execution
- Error recovery and retry logic
- Event broadcasting to backend

**Architecture**:
```
pbx-connector/
├── connector.js           # Main service loop
├── protocol.js            # Phonik protocol parser
├── serialPort.js          # Serial communication handler
├── tcpClient.js           # TCP communication handler
├── queue.js               # Command queue manager
├── signer.js              # HMAC-SHA256 command signer
├── eventBus.js            # Event emitter for status updates
├── logger.js              # Structured logging
└── .env.example
```

**Communication Flow**:
1. Backend queues room control command
2. PBX Connector fetches from queue
3. Signs command with HMAC-SHA256
4. Sends to Phonik PBX via serial/TCP
5. Receives response
6. Updates room status in database
7. Broadcasts event via EventBus or WebSocket

**Supported Commands**:
- Room relay ON/OFF
- Door lock control
- Light control (if supported)
- Status queries

---

## 🔄 Data Flow Diagrams

### Guest Check-in Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GUEST SCANS QR CODE                                          │
│    QR contains: { roomId, guestId, checkInTime }               │
│    Location: Kiosk/Mobile app at lobby                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    HTTPS POST
                    /api/checkin
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND VALIDATES                                            │
│    • JWT token valid?                                           │
│    • QR code not tampered?                                      │
│    • Guest exists & matches room?                              │
│    • PDPA consent given?                                        │
│    • Check-in time valid?                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ✅ VALID
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATABASE TRANSACTION                                         │
│    • INSERT check_in_record                                     │
│    • UPDATE room status = "checked_in"                          │
│    • INSERT audit_log (guest check-in)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. QUEUE PBX COMMAND                                            │
│    {                                                             │
│      command: "UNLOCK_DOOR",                                   │
│      room: "101",                                              │
│      timestamp: 2026-07-18T10:30:00Z,                          │
│      signature: "HMAC-SHA256(command|timestamp|secret)"        │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PBX CONNECTOR PROCESSES                                      │
│    • Fetch from queue                                           │
│    • Send to Phonik PBX (serial/TCP)                           │
│    • Wait for ACK response (5 sec timeout)                      │
│    • On success: broadcast event                               │
│    • On failure: retry with exponential backoff                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PHONIK PBX EXECUTES                                          │
│    • Activate relay for room 101                               │
│    • Door lock opens (2-3 seconds)                             │
│    • Status: "LOCKED_OPEN"                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE TO GUEST                                            │
│    HTTP 200 OK                                                  │
│    {                                                             │
│      "success": true,                                          │
│      "message": "ประตูห้องเปิดแล้ว",                            │
│      "roomNumber": "101",                                      │
│      "expiresAt": "2026-07-19T14:00:00Z"                       │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Guest Check-out Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GUEST INITIATES CHECK-OUT                                    │
│    • Via mobile app or lobby kiosk                             │
│    • Or automatic at check-out time                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    POST /api/checkout
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VERIFY GUEST & ROOM                                          │
│    • Check JWT token/QR code                                    │
│    • Room still checked in?                                     │
│    • Settle any pending charges?                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ✅ VERIFIED
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATABASE UPDATE                                              │
│    • INSERT check_out_record                                   │
│    • UPDATE room status = "vacant"                             │
│    • ENCRYPT & ARCHIVE guest data (PDPA)                       │
│    • Schedule data deletion (30 days)                          │
│    • INSERT audit_log                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. QUEUE PBX LOCK COMMAND                                       │
│    {                                                             │
│      command: "LOCK_DOOR",                                     │
│      room: "101"                                               │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PBX CONNECTOR EXECUTES                                       │
│    • Deactivate relay                                          │
│    • Door lock closes (mechanical)                             │
│    • Status: "LOCKED"                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SEND CONFIRMATION                                            │
│    HTTP 200 OK                                                  │
│    {                                                             │
│      "success": true,                                          │
│      "message": "ขอบคุณที่พักใน ≪Hotel Name≫"                   │
│      "message_en": "Thank you for staying with us",            │
│      "checkout_time": "2026-07-19T14:00:00Z"                   │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ PDPA Compliance Architecture

### Personal Data Classification

**PII Collected**:
- Guest name (encrypted at rest)
- Room number (indexed for quick lookup)
- Check-in/Check-out timestamps
- QR code scan history
- Authentication logs

### Encryption Strategy

```
┌─────────────────────────────────────┐
│   DATA ENCRYPTION LAYERS            │
├─────────────────────────────────────┤
│                                     │
│  ▌ IN TRANSIT                       │
│  └─ TLS 1.3 (HTTPS)                │
│     All API calls encrypted         │
│                                     │
│  ▌ AT REST                          │
│  └─ AES-256-GCM                    │
│     • Guest PII encrypted           │
│     • Audit logs encrypted          │
│     • Database column-level         │
│                                     │
│  ▌ KEY MANAGEMENT                   │
│  └─ AWS KMS / Local Vault          │
│     • Master key offline            │
│     • Key rotation quarterly        │
│     • Audit key access              │
│                                     │
└─────────────────────────────────────┘
```

### Data Retention Policy

```
Retention Schedule:
├─ Active Guest Data
│  ├─ During Stay: Full Access
│  └─ After Check-out: 30 days (encrypted)
│
├─ Audit Logs
│  ├─ Admin Actions: 90 days
│  ├─ Guest Check-in/out: 30 days
│  └─ Security Events: 1 year
│
├─ Access Logs
│  ├─ API Logs: 7 days
│  └─ Failed Auth: 30 days
│
└─ Automatic Deletion
   ├─ Trigger: 30 days post-checkout
   ├─ Method: Cryptographic erasure
   └─ Audit: Log deletion event
```

### Consent Management

```
PDPA Consent Flow:
├─ Pre-Check-in
│  ├─ Display privacy notice
│  ├─ Explain data collection
│  ├─ Get explicit consent (checkbox)
│  ├─ Store consent record (encrypted)
│  └─ Allow guest to modify retention
│
├─ Guest Rights
│  ├─ Access data: /api/guests/me/data
│  ├─ Request deletion: /api/guests/me/delete
│  ├─ Modify retention: /api/guests/me/retention
│  └─ SLA: 15 days response time
│
└─ Audit Trail
   ├─ Log consent acceptance
   ├─ Log data access requests
   ├─ Log deletion requests
   └─ Log retention changes
```

### Security Controls

| Control | Implementation |
|---------|----------------|
| **Authentication** | JWT (RS256, 7-day refresh) |
| **Authorization** | Role-based (Admin, Staff, Guest) |
| **Rate Limiting** | 10 req/min per IP, 100 req/min per user |
| **Input Validation** | Joi schema for all endpoints |
| **SQL Injection** | Parameterized queries (ORM) |
| **XSS Protection** | React XSS escaping + CSP headers |
| **CSRF** | Double-submit cookies |
| **Session Timeout** | 15 min inactivity auto-logout |
| **MFA** | TOTP for admin users |
| **Audit Logging** | All admin actions logged & encrypted |

---

## 🔗 Integration Points

### 1. **Phonik PBX Protocol**

**Connection Type**: Serial RS-232 or TCP/IP  
**Baud Rate**: 9600 bps  
**Timeout**: 5 seconds per command  
**Max Commands/Minute**: 10 per room

**Command Format**:
```
[HMAC-SHA256 Signature]|[Room ID]|[Command]|[Timestamp]
Example: 3a4f2c...|101|UNLOCK|2026-07-18T10:30:00Z
```

### 2. **External Integrations (Future)**

- **Hotel PMS** (Property Management System) - Guest arrival sync
- **Payment Gateway** - Pre-authorization for charges
- **Housekeeping System** - Room cleaning status
- **Analytics Dashboard** - Occupancy & check-in stats

---

## 🚀 Deployment Architecture

### Raspberry Pi Setup

```
Raspberry Pi Zero 2W
├─ OS: Raspberry Pi OS Lite (Bullseye)
├─ Services:
│  ├─ Node.js Backend (Port 3001)
│  ├─ PBX Connector (Serial/TCP)
│  ├─ PostgreSQL (Port 5432, local only)
│  ├─ Nginx Reverse Proxy (Port 80/443)
│  ├─ PM2 Process Manager
│  └─ WireGuard VPN (Port 51820, optional)
│
├─ Storage:
│  ├─ microSD: OS + Application
│  └─ USB: Database backups (if available)
│
└─ Network:
   ├─ Eth/WiFi: Internet (setup/updates only)
   ├─ LAN: Phonik PBX communication
   └─ Serial: USB-FTDI for RS-232 (if needed)
```

### Scaling Considerations

- **Single Pi**: Supports up to 50 rooms (typical hotel)
- **Multiple Pis**: Deploy per floor/wing + master coordinator
- **Load Balancing**: HAProxy on separate device (future)
- **Database**: PostgreSQL replication for redundancy

---

## 📊 Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.x |
| **Backend** | Express.js | 4.x |
| **Runtime** | Node.js | 18.x |
| **Database** | PostgreSQL | 13+ |
| **ORM** | Sequelize | 6.x |
| **Auth** | JWT (RS256) | jsonwebtoken |
| **Encryption** | crypto (Node.js) | AES-256-GCM |
| **Process Manager** | PM2 | 5.x |
| **Reverse Proxy** | Nginx | 1.x |
| **VPN** | WireGuard | Latest |
| **Testing** | Jest | 27.x |
| **Logging** | Winston | 3.x |
| **Validation** | Joi | 17.x |

---

## 🔄 System Reliability

### Failover Mechanisms

1. **PBX Communication Failure**
   - Retry with exponential backoff (1s, 2s, 4s, 8s)
   - Max 3 retries before notifying staff
   - Queue persists across restarts
   - Manual override available in admin panel

2. **Database Connection Loss**
   - Connection pooling (min: 2, max: 10)
   - Automatic reconnection with exponential backoff
   - Read replicas for load distribution
   - Transaction rollback on failures

3. **Network Connectivity**
   - WireGuard VPN for secure remote access
   - Local-first architecture (no cloud dependency)
   - Graceful degradation for read-only operations

---

## 📈 Performance Targets

- **Check-in Response Time**: < 2 seconds
- **Database Query**: < 100ms (p99)
- **PBX Command Execution**: < 3 seconds (including relay activation)
- **API Throughput**: 100+ concurrent guests
- **Memory Usage**: 300-500MB per service (Raspberry Pi)

---

## 🎯 Future Enhancements

1. **Multi-property Support** - Centralized management
2. **Mobile App** - Native iOS/Android clients
3. **Biometric Auth** - Fingerprint/facial recognition
4. **IoT Integration** - Lights, AC, TV control
5. **Analytics Dashboard** - Real-time occupancy & metrics
6. **API Marketplace** - Third-party integrations

---

**Last Updated**: 2026-07-18  
**Maintained by**: @nithep  
**Status**: Production-Ready ✅
