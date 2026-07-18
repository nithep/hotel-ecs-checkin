# GitHub Copilot Instructions for Hotel ECS Project

## 📋 Project Context

**Repository**: `nithep/hotel-ecs-checkin`  
**Description**: Smart Hotel Self Check-in/Check-out System - Raspberry Pi Zero 2W + Phonik PBX ECS-103R  
**Primary Language**: JavaScript (81.3%), TypeScript (15.2%), CSS (1.7%), Shell (1.6%)  
**Team**: Solo developer with Copilot assistance

---

## 🎯 Development Goals

1. **Authentication & Authorization**
   - JWT-based authentication with role-based access control (Admin, Staff, Guest)
   - PDPA compliance for personal data handling
   - Session management and token refresh mechanisms

2. **PBX Integration**
   - Serial/TCP communication with Phonik PBX (ECS-103R)
   - Room relay control (check-in/check-out operations)
   - Error handling and retry logic

3. **Frontend Features**
   - React-based QR code check-in page
   - Dark theme UI for guest-facing displays
   - Real-time room status updates

4. **Infrastructure**
   - Production deployment on Raspberry Pi Zero 2W
   - PM2 process management
   - WireGuard VPN for secure remote access
   - PostgreSQL database integration

---

## 💡 Recommended Copilot Prompts

### 1. Create Core Files

```
/create ARCHITECTURE.md with:
- High-level system diagram (ASCII or text description)
- Component breakdown: Frontend, Backend, PBX Connector, Database
- Data flow for check-in/check-out process
- PDPA compliance section explaining data retention and encryption
```

```
/create backend/middleware/auth.js with:
- JWT verification middleware
- Role-based access control (Admin/Staff/Guest)
- Error handling for expired/invalid tokens
- PDPA consent verification before allowing guest operations
```

```
/create frontend/pages/CheckIn.jsx with:
- React component for guest QR code scanning
- Dark theme styling (Tailwind CSS)
- Integration with backend API
- Error handling and loading states
```

### 2. Add Security Features

```
/add to backend/server.js:
- HTTPS/TLS support with certificate configuration
- Rate limiting middleware (10 requests per minute per IP)
- CORS configuration with whitelist
- Request validation and sanitization
- Audit logging for all admin actions
```

```
/implement in backend/utils/encryption.js:
- AES-256 encryption for guest personal data
- Key rotation mechanism
- Encrypted backup procedures
- Decryption helper functions with key derivation
```

### 3. Implement PBX Communication

```
/create pbx-connector/protocol.js with:
- Phonik ECS-103R serial communication protocol handler
- HMAC-SHA256 signing for commands
- Retry logic with exponential backoff
- Error codes documentation and handling
- Connection state management
```

### 4. Database & Models

```
/generate database schema and migrations for:
- guests table (id, name, email, room_id, check_in_time, check_out_time, encrypted_data)
- users table (id, email, password_hash, role, created_at)
- audit_logs table (id, user_id, action, resource, timestamp)
- rooms table (id, room_number, floor, pbx_id, status)
with PDPA-compliant retention policies
```

### 5. Testing & CI/CD

```
/generate GitHub Actions workflow (.github/workflows/ci.yml) with:
- Node.js dependency caching
- Unit tests for backend (Jest)
- Frontend build verification
- Security vulnerability scanning (npm audit)
- Code quality checks (ESLint)
- Deployment to Raspberry Pi (if applicable)
```

### 6. Documentation

```
/create docs/PHONIK_PROTOCOL.md with:
- Phonik ECS-103R command set documentation
- Serial communication parameters and examples
- Room relay control codes
- Error response codes and troubleshooting
```

```
/generate docs/API.md with:
- OpenAPI/Swagger specification
- All endpoints (auth, check-in, check-out, room status, admin)
- Request/response examples
- Authentication headers and error codes
- Rate limiting information
```

---

## 🔧 Code Quality Standards

### General Rules

- **Language**: Prefer JavaScript for backend/connectors; TypeScript optional for type safety
- **Formatting**: ESLint + Prettier (JavaScript/TypeScript)
- **Testing**: Jest for unit tests, 80%+ coverage target
- **Comments**: Explain "why", not "what"; use JSDoc for public APIs

### Security Best Practices

- ✅ Use environment variables for secrets (never commit `.env` files)
- ✅ Validate all inputs (schema validation with Joi/Yup)
- ✅ Implement rate limiting on all endpoints
- ✅ Use HTTPS/TLS for all communications
- ✅ Hash passwords with bcrypt (min 12 rounds)
- ✅ Implement audit logging for sensitive operations
- ✅ Never log sensitive data (tokens, passwords, PII)

### PDPA Compliance

- ✅ Explicit consent before collecting personal data
- ✅ Clear privacy notices in the UI
- ✅ Data retention policies (default: 30 days after checkout)
- ✅ Encryption at rest (AES-256) and in transit (TLS 1.3)
- ✅ Data access/deletion request handling (15-day SLA)

---

## 📁 Project Structure

```
hotel-ecs-checkin/
├── backend/                # Node.js Express API
│   ├── server.js
│   ├── middleware/
│   ├── routes/
│   ├── models/
│   ├── utils/
│   └── .env.example
├── frontend/              # React SPA
│   ├── src/
│   ├── public/
│   └── package.json
├── pbx-connector/         # PBX communication service
│   ├── connector.js
│   ├── protocol.js
│   └── .env.example
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PHONIK_PROTOCOL.md
│   └── DEPLOYMENT.md
├── scripts/               # Automation scripts
├── vpn-setup/            # WireGuard configuration
├── wiki/                 # GitHub Wiki files
├── SETUP.md              # Installation guide
├── SECURITY.md           # PDPA & security policy
├── LICENSE               # MIT License
└── ecosystem.config.js   # PM2 configuration
```

---

## 🚀 Development Workflow with Copilot

### For Each Feature:

1. **Planning**
   - Describe the feature using natural language
   - Ask Copilot for architecture suggestions: `Explain how to implement [feature] in this codebase`

2. **Implementation**
   - Use `/create` or `/add` commands for new files
   - Ask for code reviews: `Review this code for security issues`
   - Request refactoring: `/refactor [file] to improve [aspect]`

3. **Testing**
   - Generate test files: `Create Jest tests for [module]`
   - Ask for edge cases: `What edge cases should I handle for [function]?`

4. **Documentation**
   - Auto-generate API docs: `Create OpenAPI spec for these endpoints`
   - Ask for examples: `Generate usage examples for [API endpoint]`

---

## ⚠️ Known Constraints & Tips

### Hardware Constraints (Raspberry Pi Zero 2W)
- **RAM**: 2GB (use PM2 memory limits: 300-500MB per process)
- **CPU**: Single-core (use node clustering for backend; connector should be single instance)
- **Storage**: microSD card degrades quickly (optimize database queries, use log rotation)

### Communication Constraints
- **Serial/USB**: Latency ~100ms per command
- **Rate Limiting**: PBX accepts max 10 commands/minute per room
- **Timeout**: Set 5-second timeout for PBX responses

---

## 📞 Ask Copilot For:

✅ **DO ASK**:
- Code generation and refactoring
- Security vulnerability analysis
- Architecture and design patterns
- Testing strategies
- Documentation and API specs
- Performance optimization tips
- Error handling and edge cases

❌ **DON'T ASK** (and why):
- Deploying directly to production (requires human review)
- Modifying actual guest data without manual verification
- Bypassing security checks or PDPA compliance
- Making breaking changes without migration plans

---

## 🎓 Context For Copilot

When working on this repo, you can help Copilot understand the context by:

1. **Mentioning files**: `@workspace`, `@nithep/hotel-ecs-checkin`
2. **Referencing functions**: Point to specific modules in your prompts
3. **Pasting error messages**: Include full stack traces for debugging
4. **Sharing requirements**: Be specific about PDPA, security, and hardware constraints

---

## Last Updated
2026-07-18

**Ready to build a secure, production-grade hotel check-in system!** 🏨🚀
