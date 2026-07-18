---
type: raw-capture
title: Git Best Practices สำหรับ HECS
source: "{{url}}"
author:
published:
created: 2026-07-19T00:03
description:
status: inbox
tags:
  - capture
---
อัปดสตรัคเจอร์ repo ให้ครับ:ดีมากครับ! ตอนนี้ผมเห็น structure แล้ว ให้ผมดูไฟล์ที่มีอยู่เดิม:Perfect! ได้เห็นโครงสร้างแล้วครับ 🎯 ตอนนี้ผมจะให้ **แนวทางครบถ้วน Git & Documentation** ตามหลักสากล สำหรับโปรเจค **hotel-ecs-checkin** นี้

---

## 📋 **Git Best Practices สำหรับ hotel-ecs-checkin**

### **1️⃣ README.md (Root) - เอกสารหลัก**

ควรมี:
```markdown
# Hotel ECS Check-in System
- Project overview (1-2 sentences)
- Prerequisites (Node.js, Python, Hardware)
- Quick Start (installation + running)
- Project Structure
- Contributing Guidelines
- License
```

---

### **2️⃣ CHANGELOG.md - บันทึกเวอร์ชัน**

ติดตาม: **Semantic Versioning (v1.0.0)**
```markdown
# Changelog

## [Unreleased]
- Feature: Add WebSocket real-time updates
- Fix: Serial port connection handling

## [0.1.0] - 2026-07-18
- Initial project setup
- PBX Connector prototype
```

---

### **3️⃣ CONTRIBUTING.md - วิธีการ Contribute**

```markdown
# Contributing Guidelines

## Branch Naming Strategy
- `feature/xxx` - New features
- `bugfix/xxx` - Bug fixes  
- `hotfix/xxx` - Critical production fixes
- `docs/xxx` - Documentation only
- `test/xxx` - Tests only

## Commit Message Format (Conventional Commits)
```
<type>(<scope>): <subject>

<body>
<footer>
```

**Types**:
- `feat:` Feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (no logic change)
- `refactor:` Code refactoring
- `test:` Adding/modifying tests
- `chore:` Build, dependencies

**Examples**:
```
feat(pbx-connector): add TCP heartbeat mechanism
fix(backend): handle concurrent room check-ins
docs(frontend): update QR code scanning guide
```

---

### **4️⃣ .gitignore - ไฟล์ที่ไม่ควร commit**

ปรับปรุงให้ครอบคลุม:
```gitignore
# Dependencies
node_modules/
__pycache__/
*.egg-info/

# Build & Dist
dist/
build/
.vite/
*.tsbuildinfo

# Environment & Secrets
.env
.env.local
.env.*.local
.env.production.local
secrets/
*.key
*.pem

# IDE & Editors
.vscode/
.idea/
*.swp
*.swo
.sublime-workspace

# OS
.DS_Store
Thumbs.db
desktop.ini

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Testing
coverage/
.nyc_output/

# OS temp files
*~
*.tmp
```

---

### **5️⃣ .gitattributes - ควบคุมการ Handle Files**

```gitattributes
# Auto normalize line endings
* text=auto

# Shell scripts must be LF
*.sh text eol=lf
*.bash text eol=lf

# Windows batch files must be CRLF
*.bat text eol=crlf
*.cmd text eol=crlf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.zip binary
*.tar.gz binary
```

---

### **6️⃣ .github/ Directory - GitHub-specific Config**

#### **A) Pull Request Template** (.github/pull_request_template.md)
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] New Feature
- [ ] Bug Fix
- [ ] Breaking Change
- [ ] Documentation

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Updated documentation
- [ ] Tests added/updated
```

#### **B) Issue Templates** (.github/ISSUE_TEMPLATE/)
- `bug_report.md`
- `feature_request.md`
- `documentation.md`

#### **C) Workflows** (.github/workflows/)
- `test.yml` - Run tests on PR
- `lint.yml` - Code quality checks
- `deploy.yml` - CI/CD pipeline

---

### **7️⃣ package.json - Scripts & Metadata**

```json
{
  "name": "hotel-ecs-checkin",
  "version": "0.1.0",
  "description": "Smart Hotel Self Check-in/Check-out System",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/nithep/hotel-ecs-checkin.git"
  },
  "workspaces": [
    "backend",
    "frontend",
    "pbx-connector"
  ],
  "scripts": {
    "install:all": "npm install && npm install --workspace=backend --workspace=frontend --workspace=pbx-connector",
    "dev": "npm run dev --workspace=*",
    "test": "npm test --workspace=*",
    "lint": "npm run lint --workspace=*",
    "format": "prettier --write .",
    "build": "npm run build --workspace=*"
  }
}
```

---

### **8️⃣ LICENSE - อนุญาตใช้งาน**

เลือกจาก:
- **MIT** - Permissive, แนะนำสำหรับ open-source
- **Apache 2.0** - Permissive + patent protection
- **GPL 3.0** - Copyleft (enforce open-source)

```
MIT License

Copyright (c) 2026 Nithep

Permission is hereby granted, free of charge...
```

---

### **9️⃣ CODE_OF_CONDUCT.md - ประเมินจริยธรรมทีม**

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge
We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience...

## Our Standards
Examples of behavior that contributes to a positive environment:
- Being respectful of differing opinions
- Accepting constructive criticism
- Focusing on what is best for the community
```

---

### **🔟 docs/ Directory - เอกสารรายละเอียด**

```
docs/
├── ARCHITECTURE.md           # System design & data flow
├── API.md                   # REST API documentation
├── PBX_PROTOCOL.md          # Phonik protocol specification
├── SETUP.md                 # Installation & environment setup
├── DATABASE.md              # DB schema & migrations
├── DEPLOYMENT.md            # Production deployment guide
├── TROUBLESHOOTING.md       # Common issues & solutions
└── CONTRIBUTORS.md          # Team & credits
```

---

### **1️⃣1️⃣ .editorconfig - ความสม่ำเสมอ Code Style**

```editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,ts,jsx,tsx}]
indent_style = space
indent_size = 2

[*.{py}]
indent_style = space
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

---

### **1️⃣2️⃣ .prettierrc / .eslintrc - Code Formatting**

**.prettierrc**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

**.eslintrc.json** (Frontend/Backend):
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error"
  }
}
```

---

### **1️⃣3️⃣ SECURITY.md - นโยบายรักษาความปลอดภัย**

```markdown
# Security Policy

## Reporting Security Vulnerabilities
Please DO NOT open a public issue. Instead, email: security@example.com

## Security Best Practices
- Never commit `.env` files
- Use environment variables for secrets
- Keep dependencies updated
- Regular security audits
```

---

### **1️⃣4️⃣ package-lock.json / requirements.txt - Lock Dependencies**

ต้อง Commit ทุกครั้งเพื่อให้ reproducible builds:
```bash
# Commit both package.json & package-lock.json
git add package.json package-lock.json
git commit -m "chore: update dependencies"
```

---

## 📊 **Branch Protection Strategy**

**สำหรับ `master` branch**:
```
✅ Require pull request reviews before merging
✅ Require status checks to pass (CI/CD)
✅ Require branches to be up to date
✅ Require code owners review
✅ Dismiss stale pull request approvals
✅ Restrict who can push to matching branches
```

---

## 🎯 **ตัวอย่าง Full Directory Structure**

```
hotel-ecs-checkin/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── documentation.md
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── lint.yml
│   │   └── deploy.yml
│   └── pull_request_template.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PBX_PROTOCOL.md
│   ├── SETUP.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .eslintrc.json
│   └── README.md
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── pbx-connector/
│   ├── src/
│   ├── tests/
│   ├── simulator/
│   ├── package.json
│   └── README.md
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .prettierrc
├── .eslintrc.json
├── package.json              # Monorepo root
├── package-lock.json
├── README.md                 # Project overview
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # How to contribute
├── CODE_OF_CONDUCT.md        # Team ethics
├── SECURITY.md               # Security policy
├── LICENSE                   # MIT / Apache 2.0
└── AGENTS.md                 # ✅ Already have
```

---

## ✅ **Quick Checklist ที่ควรเพิ่ม**

- [ ] **README.md** (Root) - Overview + Quick Start
- [ ] **CHANGELOG.md** - Track versions
- [ ] **CONTRIBUTING.md** - Branch naming + commit conventions
- [ ] **CODE_OF_CONDUCT.md** - Team culture
- [ ] **LICENSE** - MIT recommended
- [ ] **SECURITY.md** - Vulnerability reporting
- [ ] **.github/workflows/** - CI/CD automation
- [ ] **.editorconfig** - Code style consistency
- [ ] **.prettierrc + .eslintrc** - Auto formatting
- [ ] **docs/** folder - Detailed documentation
- [ ] **package.json** (root) - Monorepo scripts

---

**ต้องการให้ผมสร้าง template files เหล่านี้ให้ได้ไหมครับ?** 🚀