'use strict';

/**
 * @file test-relay.js — สคริปต์ทดสอบเปิด-ปิดรีเลย์ไฟฟ้าจริง (220V!)
 *
 * ⚠️  คำเตือน: สคริปต์นี้จะส่งคำสั่งที่จ่าย/ตัดกระแสไฟ 220V จริง!
 *     ใช้ด้วยความระมัดระวัง และควรมีคนอยู่ที่ห้องทดสอบเพื่อยืนยัน
 *
 * การใช้งาน:
 *   node test-relay.js <host> <port> <room> <on|off|status>
 *
 * ตัวอย่าง:
 *   node test-relay.js 192.168.1.91 23 101 on       ← เปิดไฟห้อง 101
 *   node test-relay.js 192.168.1.91 23 101 off      ← ปิดไฟห้อง 101
 *   node test-relay.js 192.168.1.91 23 101 status   ← อ่านสถานะห้อง 101
 *
 * @author RelaySync Integration Team
 */

const net = require('net');
const readline = require('readline');
const {
    buildSetRoom,
    buildGetRoom,
    buildGetVersion,
    parseResponse,
    ROOM_STATUS,
    TERMINATOR,
} = require('./protocol');

// ─── Parse Arguments ──────────────────────────────────────────────────────────
const HOST = process.argv[2];
const PORT = parseInt(process.argv[3], 10);
const ROOM = process.argv[4];
const ACTION = (process.argv[5] || '').toLowerCase();
const TIMEOUT_MS = 5000;

if (!HOST || !PORT || !ROOM || !['on', 'off', 'status'].includes(ACTION)) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║    ⚡ RelaySync — Relay Test Tool                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  การใช้งาน:                                                   ║
║    node test-relay.js <host> <port> <room> <on|off|status>   ║
║                                                              ║
║  ตัวอย่าง:                                                    ║
║    node test-relay.js 192.168.1.91 23 101 on                 ║
║    node test-relay.js 192.168.1.91 23 101 off                ║
║    node test-relay.js 192.168.1.91 23 101 status             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log = (icon, msg) => console.log(`  ${icon}  ${msg}`);
const separator = () => console.log('─'.repeat(60));

/**
 * ส่งคำสั่งผ่าน TCP socket และรอ response
 */
function sendCommand(socket, command) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        const timer = setTimeout(() => {
            reject(new Error(`Timeout: ตู้ PBX ไม่ตอบกลับภายใน ${TIMEOUT_MS}ms`));
        }, TIMEOUT_MS);

        const onData = (chunk) => {
            buffer += chunk.toString('ascii');
            const idx = buffer.indexOf(TERMINATOR);
            if (idx !== -1) {
                clearTimeout(timer);
                socket.removeListener('data', onData);
                resolve(buffer.substring(0, idx + TERMINATOR.length));
            }
        };

        socket.on('data', onData);
        socket.write(command, 'ascii');
    });
}

/**
 * ถามยืนยันจากผู้ใช้ก่อนส่งคำสั่ง (สำหรับ ON/OFF เท่านั้น)
 */
function confirm(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().trim());
        });
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const actionLabel = ACTION === 'on' ? '🟢 เปิดไฟ (ON — จ่ายกระแสไฟ 220V)'
                      : ACTION === 'off' ? '🔴 ปิดไฟ (OFF — ตัดกระแสไฟ)'
                      : '📊 อ่านสถานะ (Read Only)';

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║    ⚡ RelaySync — Relay Test Tool                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    log('🎯', `เป้าหมาย: ${HOST}:${PORT}`);
    log('🏨', `ห้อง: ${ROOM}`);
    log('🔧', `คำสั่ง: ${actionLabel}`);
    separator();

    // ── Confirmation สำหรับ ON/OFF ──
    if (ACTION === 'on' || ACTION === 'off') {
        console.log('');
        console.log('  ⚠️  ══════════════════════════════════════════════════');
        console.log('  ⚠️   คำเตือน: คำสั่งนี้จะส่งผลต่อกระแสไฟ 220V จริง!');
        console.log('  ⚠️   ตรวจสอบว่ามีคนอยู่ที่ห้อง ' + ROOM + ' เพื่อยืนยัน');
        console.log('  ⚠️  ══════════════════════════════════════════════════');
        console.log('');

        const answer = await confirm(`  ❓  ยืนยัน${ACTION === 'on' ? 'เปิด' : 'ปิด'}ไฟห้อง ${ROOM}? (y/n): `);
        if (answer !== 'y' && answer !== 'yes') {
            log('🚫', 'ยกเลิกคำสั่ง — ไม่มีการส่งข้อมูลใดๆ ไปที่ตู้ PBX');
            process.exit(0);
        }
        separator();
    }

    // ── TCP Connect ──
    log('⏳', 'กำลังเชื่อมต่อ TCP...');

    const socket = new net.Socket();

    try {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                socket.destroy();
                reject(new Error(`Timeout: ไม่สามารถเชื่อมต่อ ${HOST}:${PORT}`));
            }, TIMEOUT_MS);

            socket.once('connect', () => { clearTimeout(timer); resolve(); });
            socket.once('error', (err) => { clearTimeout(timer); reject(err); });
            socket.connect(PORT, HOST);
        });

        log('✅', `TCP Connected!`);
    } catch (err) {
        log('❌', `TCP Connection ล้มเหลว: ${err.message}`);
        log('💡', `ลอง: node probe-pbx.js ${HOST} ${PORT} — เพื่อวิเคราะห์ปัญหาก่อน`);
        process.exit(1);
    }

    separator();

    // ── Ping ก่อน (VERS) เพื่อยืนยันว่าตู้พูดภาษาเดียวกัน ──
    log('⏳', 'ส่ง Ping (VERS) เพื่อยืนยัน Protocol...');

    try {
        const versCmd = buildGetVersion();
        const versResp = await sendCommand(socket, versCmd);
        const versParsed = parseResponse(versResp);

        if (versParsed.error) {
            log('⚠️', `PBX ตอบกลับผิดปกติ: ${versParsed.errorMessage}`);
            log('💡', 'ตู้อาจใช้ Protocol ต่างจากที่คาดไว้ — ดำเนินการต่อด้วยความระมัดระวัง');
        } else {
            log('✅', `PBX ตอบกลับ! Firmware: ${versParsed.value}`);
        }
    } catch (err) {
        log('⚠️', `Ping ล้มเหลว: ${err.message} — ดำเนินการต่อ...`);
    }

    separator();

    // ── Execute Command ──
    try {
        let command, description;

        if (ACTION === 'status') {
            command = buildGetRoom(ROOM);
            description = `GET ROOM ${ROOM}`;
        } else if (ACTION === 'on') {
            command = buildSetRoom(ROOM, ROOM_STATUS.ON);
            description = `SET ROOM ${ROOM} = ON (จ่ายไฟ)`;
        } else {
            command = buildSetRoom(ROOM, ROOM_STATUS.OFF);
            description = `SET ROOM ${ROOM} = OFF (ตัดไฟ)`;
        }

        log('⏳', `กำลังส่ง: ${description}`);
        log('📤', `Raw: ${command.replace(/\r\n/, '\\r\\n')}`);

        const response = await sendCommand(socket, command);
        const parsed = parseResponse(response);

        log('📥', `Raw: ${response.replace(/\r\n/, '\\r\\n')}`);

        if (parsed.error) {
            log('❌', `PBX ตอบ Error: ${parsed.errorMessage}`);
        } else {
            const statusMap = { '0': 'OFF (ตัดไฟ)', '1': 'ON (จ่ายไฟ)', '2': 'MAINTENANCE', '3': 'OUT_OF_ORDER' };
            const statusLabel = statusMap[parsed.value] || parsed.value;

            if (ACTION === 'status') {
                log('✅', `ห้อง ${ROOM} สถานะปัจจุบัน: ${statusLabel}`);
            } else if (ACTION === 'on') {
                log('✅', `ส่งคำสั่ง ON สำเร็จ! PBX ยืนยัน: ${statusLabel}`);
                log('👀', `→ ตรวจสอบที่ห้อง ${ROOM}: ไฟควรสว่างขึ้น (เมื่อเสียบ Key Card)`);
            } else {
                log('✅', `ส่งคำสั่ง OFF สำเร็จ! PBX ยืนยัน: ${statusLabel}`);
                log('👀', `→ ตรวจสอบที่ห้อง ${ROOM}: ไฟควรดับลง`);
            }
        }

    } catch (err) {
        log('❌', `คำสั่งล้มเหลว: ${err.message}`);
    }

    // ── Cleanup ──
    socket.destroy();

    separator();
    console.log(`\n  💡 คำสั่งถัดไปที่คุณอาจต้องการ:`);

    if (ACTION === 'on') {
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} status  ← ตรวจสอบสถานะ`);
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} off     ← ปิดไฟกลับ`);
    } else if (ACTION === 'off') {
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} status  ← ตรวจสอบสถานะ`);
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} on      ← เปิดไฟอีกครั้ง`);
    } else {
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} on      ← เปิดไฟ`);
        console.log(`     node test-relay.js ${HOST} ${PORT} ${ROOM} off     ← ปิดไฟ`);
    }
    console.log('');
}

main().catch((err) => {
    console.error('\n❌ Unexpected Error:', err.message);
    process.exit(1);
});
