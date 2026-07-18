# Setup Guide: Hotel ECS Integration System

## 🎯 Quick Start

This guide walks you through setting up the Hotel ECS self-check-in system on a **Raspberry Pi Zero 2 W** connected to a **Phonik PBX (ECS-103R)**.

---

## 📋 Prerequisites

### Hardware
- **Raspberry Pi Zero 2 W** (2GB RAM, microSD card 32GB+)
- **Phonik ECS-103R V.5** board in guest rooms
- **Phonik PBX (ตู้สาขา)** communication hub
- **USB-to-Serial converter** (FTDI, CH340) for RS-232 communication OR LAN cable
- **Power supply**: 5V/2.5A for Raspberry Pi

### Software
- Raspberry Pi OS (Lite or Desktop, latest Bullseye+)
- Node.js 18+ and npm 9+
- Git

### Network
- Internet connection for initial setup
- Local network access to Phonik PBX
- Static IP for Raspberry Pi (recommended)

---

## 🚀 Installation Steps

### 1. **Prepare Raspberry Pi OS**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git and essential tools
sudo apt install -y git build-essential python3-dev
```

### 2. **Clone the Repository**

```bash
cd /opt
sudo git clone https://github.com/nithep/hotel-ecs-checkin.git
cd hotel-ecs-checkin
sudo chown -R $USER:$USER /opt/hotel-ecs-checkin
```

### 3. **Install Dependencies**

```bash
# Backend
cd backend
npm install
cd ..

# Frontend (if building on Pi)
cd frontend
npm install
npm run build
cd ..

# PBX Connector
cd pbx-connector
npm install
cd ..
```

### 4. **Configure Environment Variables**

Create `.env` files for each service:

**Backend** (`backend/.env`):
```env
# Server config
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_ecs
DB_USER=ecs_user
DB_PASSWORD=secure_password_here

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# PBX Connector
PBX_HOST=192.168.1.100  # Replace with actual PBX IP
PBX_PORT=9600           # Serial: /dev/ttyUSB0, TCP: 9600
PBX_PROTOCOL=serial     # Options: serial, tcp
PBX_BAUDRATE=9600
PBX_TIMEOUT=5000

# PDPA & Security
GUEST_DATA_RETENTION_DAYS=30
ENCRYPTION_KEY=your-aes-256-encryption-key-base64-encoded
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/hotel-ecs/backend.log
```

**PBX Connector** (`pbx-connector/.env`):
```env
PBX_SERIAL_PORT=/dev/ttyUSB0
PBX_BAUDRATE=9600
PBX_TIMEOUT=5000
LOG_LEVEL=debug
LOG_FILE=/var/log/hotel-ecs/pbx-connector.log
```

### 5. **Setup Database (PostgreSQL)**

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE hotel_ecs;
CREATE USER ecs_user WITH PASSWORD 'secure_password_here';
ALTER ROLE ecs_user SET client_encoding TO 'utf8';
ALTER ROLE ecs_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecs_user SET default_transaction_deferrable TO on;
ALTER ROLE ecs_user SET timezone TO 'Asia/Bangkok';
GRANT ALL PRIVILEGES ON DATABASE hotel_ecs TO ecs_user;
\c hotel_ecs
GRANT ALL PRIVILEGES ON SCHEMA public TO ecs_user;
EOF

# Run migrations
cd backend
npm run db:migrate
cd ..
```

### 6. **Setup Serial Communication (if using RS-232)**

```bash
# Check USB-to-Serial device
ls -la /dev/ttyUSB*

# Give permissions to current user
sudo usermod -a -G dialout $USER
# Log out and back in for changes to take effect

# Test serial connection (install screen: sudo apt install -y screen)
screen /dev/ttyUSB0 9600
# Ctrl+A, then :quit to exit
```

### 7. **Process Management with PM2**

Install and configure PM2 for production-grade process management:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 config file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hotel-ecs-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/hotel-ecs/backend-error.log',
      out_file: '/var/log/hotel-ecs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'hotel-ecs-pbx-connector',
      script: './pbx-connector/connector.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/hotel-ecs/pbx-error.log',
      out_file: '/var/log/hotel-ecs/pbx-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
EOF

# Create log directory
sudo mkdir -p /var/log/hotel-ecs
sudo chown $USER:$USER /var/log/hotel-ecs

# Start PM2 processes
pm2 start ecosystem.config.js

# Save PM2 config to auto-restart on reboot
pm2 startup
pm2 save
```

### 8. **VPN Setup with WireGuard (Optional but Recommended)**

For secure remote access and management:

```bash
# Install WireGuard
sudo apt install -y wireguard wireguard-tools

# Generate keys (run these in /etc/wireguard)
cd /etc/wireguard
sudo umask 077
sudo wg genkey | sudo tee privatekey | wg pubkey > publickey

# Create WireGuard config
sudo tee /etc/wireguard/wg0.conf > /dev/null << EOF
[Interface]
PrivateKey = $(sudo cat privatekey)
Address = 10.0.0.1/24
ListenPort = 51820
SaveCounter = true

[Peer]
PublicKey = YOUR_PEER_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
EOF

# Enable and start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Check status
sudo wg show
```

See [vpn-setup/README.md](./vpn-setup/README.md) for detailed WireGuard configuration.

### 9. **Generate SSL Certificates (Production)**

```bash
# Generate self-signed certificate (or use Let's Encrypt)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Copy to secure location
sudo mkdir -p /etc/hotel-ecs/certs
sudo cp cert.pem key.pem /etc/hotel-ecs/certs/
sudo chmod 600 /etc/hotel-ecs/certs/*.pem
```

### 10. **Setup Frontend (Nginx Reverse Proxy)**

```bash
sudo apt install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/hotel-ecs > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;

    root /opt/hotel-ecs-checkin/frontend/dist;
    index index.html;

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/hotel-ecs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🧪 Testing

### 1. **Backend Health Check**

```bash
curl http://localhost:3001/api/health
# Expected response: {"status": "ok", "timestamp": "2026-07-18T..."}
```

### 2. **PBX Connection Test**

```bash
curl -X POST http://localhost:3001/api/pbx/test \
  -H "Content-Type: application/json" \
  -d '{"room": "101", "action": "ON"}'
# Expected: Room relay should activate
```

### 3. **Login & JWT Token**

```bash
# Create admin user (run this once)
cd backend
npm run user:create -- --email admin@hotel.com --password secure123 --role admin

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hotel.com", "password": "secure123"}'
```

### 4. **Guest Check-in Test**

Use the frontend (http://yourdomain.com) and scan a test QR code for room 101.

---

## 📊 Monitoring & Logs

```bash
# PM2 Monitoring
pm2 monit

# Real-time PM2 logs
pm2 logs

# PM2 status
pm2 status

# View specific service logs
pm2 logs hotel-ecs-backend
pm2 logs hotel-ecs-pbx-connector

# Check log files directly
tail -f /var/log/hotel-ecs/backend.log
tail -f /var/log/hotel-ecs/pbx-connector.log
```

---

## 🔧 Troubleshooting

### Cannot connect to PBX
- Check serial port: `ls /dev/ttyUSB*`
- Check PBX IP and port in `.env`
- Test with `screen /dev/ttyUSB0 9600`

### PM2 processes won't start
- Check PM2 logs: `pm2 logs`
- Verify Node.js is installed: `node -v`
- Check .env files exist in backend and pbx-connector directories

### Backend won't start
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Check port 3001 is free: `sudo lsof -i :3001`
- Run migrations: `cd backend && npm run db:migrate`

### Frontend shows blank page
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check frontend build: `cd frontend && npm run build`

### Database connection error
- Verify PostgreSQL user and password in `.env`
- Check database exists: `sudo -u postgres psql -l`

---

## 📚 Additional Resources

- [Phonik PBX Protocol](./docs/phonik-protocol.md)
- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [PDPA & Security Compliance](./SECURITY.md)
- [VPN Setup with WireGuard](./vpn-setup/README.md)

---

## ✅ Next Steps

1. Configure firewall rules (allow only internal network to backend)
2. Setup HTTPS with Let's Encrypt (recommended for production)
3. Configure automated backups for PostgreSQL
4. Setup monitoring and alerting (e.g., Prometheus + Grafana)
5. Deploy on multiple rooms and test end-to-end
6. Review PDPA compliance checklist in [SECURITY.md](./SECURITY.md)

---

**Happy Checking In! 🏨**

Last Updated: 2026-07-18
