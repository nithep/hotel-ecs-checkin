# Raspberry Pi Zero 2 W Setup for Hotel ECS Check-in

## 1. System Specifications & Resources
- **OS**: Debian GNU/Linux (aarch64)
- **RAM**: ~512MB (416MB available after GPU allocation)
- **Swap**: 415MB Configured
- **Disk**: 32GB SD Card (29GB usable, ~24GB free)

## 2. Installed Runtimes & Tools
- **Python**: 3.13.5 (Pre-installed)
- **Node.js**: v20.20.2 (LTS)
- **NPM**: 10.8.2
- **Git**: 2.47.3

### Installation Commands Used
```bash
# Update and install Git
sudo apt update && sudo apt install -y git curl

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Hardware Interfaces
- **Serial Port**: `/dev/serial0` (Hardware UART on GPIO) mapped to `ttyS0`.
- **Note**: Currently, no USB-to-Serial adapters (`/dev/ttyUSB*`) are connected. Communication with the Phonik PBX will likely happen via the GPIO serial pins or LAN.

## 4. Status
✅ **Ready for testing**. The device is equipped with all necessary dependencies to run the Backend API, serve the Frontend, and handle PBX communication.
