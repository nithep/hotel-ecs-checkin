# Security Policy & PDPA Compliance

## 🔐 Security Overview

The Hotel ECS Integration Project handles sensitive guest data and controls critical hotel infrastructure. Security and privacy are paramount.

---

## 🛡️ Data Protection & PDPA Compliance

This system complies with **Thailand's Personal Data Protection Act (PDPA)** and follows these principles:

### Personal Data Handling
- **Guest Check-in Records**: Name, QR code, timestamp, room number
- **Encryption**: All personal data is encrypted at rest using AES-256
- **Transmission**: TLS 1.3 for all network communication
- **Retention**: Guest data is purged after checkout + 30 days (configurable)

### Data Minimization
- Only collect data necessary for check-in/check-out operations
- No unnecessary tracking or analytics of guest behavior
- No third-party sharing without explicit consent

### User Consent & Transparency
- Clear privacy notices at check-in
- Opt-out options for data retention
- Data access and deletion requests honored within 15 days

---

## 🔒 Authentication & Authorization

### Backend API Security
- **JWT Tokens**: Signed with RS256 (RSA 4096-bit keys)
- **Refresh Tokens**: Rotated every 7 days; revoked on logout
- **Session Timeout**: 15 minutes of inactivity
- **MFA**: Supported for admin staff (TOTP)

### Access Control
- Role-based access control (RBAC):
  - `admin`: Full system access
  - `staff`: Check-in/check-out operations only
  - `guest`: Self-check-in via QR code only
  - `auditor`: Read-only access for compliance

### Room Hardware Security
- Serial/TCP communication encrypted with AES-128
- PBX commands signed with HMAC-SHA256
- Rate limiting: Max 10 commands per minute per room

---

## 🚨 Vulnerability Disclosure

If you discover a security vulnerability, **please do NOT open a public issue**. Instead:

1. **Email**: security@hotelecs.local (or project maintainer)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Response SLA**: 48 hours acknowledgment, 7 days mitigation plan

---

## 📋 Security Checklist (Pre-Production)

- [ ] TLS certificates installed and valid
- [ ] Database credentials stored in environment variables (not in git)
- [ ] PBX communication keys generated and secured
- [ ] JWT secret keys rotated
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS properly configured (whitelist only trusted domains)
- [ ] SQL injection tests passed
- [ ] XSS vulnerability scans passed
- [ ] CSRF tokens enabled for state-changing operations
- [ ] Audit logs enabled for all admin actions
- [ ] Backup encryption keys stored offline

---

## 🔄 Dependency Management

- Run `npm audit` before every release
- Pin exact versions for production dependencies
- Automated dependency updates via Dependabot (security patches only)
- Monthly security audit of all dependencies

---

## 📊 Audit & Compliance

### Logging
- All guest check-in/check-out events logged with timestamp and user
- All admin actions (user creation, deletions, config changes) logged
- PBX communication errors logged for debugging
- Logs stored with AES-256 encryption for 90 days

### Access Monitoring
- Failed login attempts locked after 5 attempts
- Admin IP whitelist (if applicable)
- Session anomaly detection enabled

---

## 🏥 Incident Response

If a security incident occurs:

1. **Immediate Actions**:
   - Isolate affected systems
   - Disable compromised credentials
   - Preserve forensic evidence (logs, memory dumps)

2. **Investigation** (within 24 hours):
   - Root cause analysis
   - Scope of compromise
   - Affected data identification

3. **Communication** (within 72 hours):
   - Notify affected guests (if personal data exposed)
   - Notify hotel management
   - File incident report with Thai PDPA authority if required

4. **Remediation**:
   - Deploy patches
   - Reset credentials
   - Restore from clean backups if necessary

---

## 📞 Security Contacts

- **Project Lead**: [nithep](https://github.com/nithep)
- **Security Email**: security@hotelecs.local
- **Emergency Hotline**: +66 (contact hotel management)

---

## Last Updated
2026-07-18

---

**Stay Vigilant. Protect Guest Privacy. Secure Infrastructure.**
