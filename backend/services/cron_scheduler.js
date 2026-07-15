const cron = require('node-cron');

/**
 * เริ่มต้นระบบ Cronjob เพื่อรายงานสรุปประจำวัน
 * @param {Object} db - Database module (backend/db.js)
 * @param {Object} googleNotifier - GoogleNotifier instance
 * @param {Object} pbx - PBX Connector instance
 */
function startCronJobs(db, googleNotifier, pbx) {
    console.log('[CRON] 🕒 Initializing daily cron jobs...');

    // Run every day at 23:55 (11:55 PM)
    cron.schedule('55 23 * * *', async () => {
        console.log('[CRON] 📊 Generating daily system report...');
        await generateAndSendReport(db, googleNotifier, pbx);
    }, {
        scheduled: true,
        timezone: "Asia/Bangkok"
    });

    // Auto-Eviction: Run every day at 12:00 PM (Noon)
    cron.schedule('0 12 * * *', async () => {
        console.log('[CRON] ⏰ Running Auto-Eviction Check at 12:00 PM...');
        await runAutoEviction(db, googleNotifier, pbx);
    }, {
        scheduled: true,
        timezone: "Asia/Bangkok"
    });
}

/**
 * ตัดไฟอัตโนมัติสำหรับห้องที่หมดเวลาพัก (checkout_date <= now)
 */
async function runAutoEviction(db, googleNotifier, pbx) {
    db.getAllRooms(async (err, rooms) => {
        if (err) {
            console.error('[CRON] ❌ Error fetching rooms for auto-eviction:', err.message);
            return;
        }

        const now = new Date();
        const occupiedRooms = rooms.filter(r => r.status === 'occupied');
        let evictedCount = 0;

        for (const room of occupiedRooms) {
            if (room.checkout_date) {
                const checkoutDate = new Date(room.checkout_date);
                if (checkoutDate <= now) {
                    console.log(`[CRON] ⚡ Auto-evicting Room ${room.id} (Checkout date: ${room.checkout_date})`);
                    
                    try {
                        // ส่งคำสั่งตัดไฟไปที่ตู้สาขา
                        await pbx.checkOut(room.id);
                        
                        // อัปเดตฐานข้อมูลให้เป็นห้องว่าง
                        db.updateRoomState(room.id, 'vacant', false, {}, (updateErr) => {
                            if (updateErr) {
                                console.error(`[CRON] ❌ DB update failed for evicted room ${room.id}:`, updateErr.message);
                            } else {
                                evictedCount++;
                                if (googleNotifier) {
                                    googleNotifier.sendSystemAlert('⏰ Auto-Eviction Triggered', `ระบบทำการตัดไฟห้องพัก <b>${room.id}</b> อัตโนมัติ<br>เนื่องจากเกินเวลาเช็คเอาท์ (12:00 น.)`, false);
                                }
                            }
                        });
                    } catch (evictErr) {
                        console.error(`[CRON] ❌ PBX eviction failed for room ${room.id}:`, evictErr.message);
                    }
                }
            }
        }
        
        if (evictedCount === 0) {
            console.log('[CRON] ✨ No rooms needed auto-eviction today.');
        } else {
            console.log(`[CRON] ✅ Auto-evicted ${evictedCount} rooms.`);
        }
    });
}

/**
 * สร้างและส่งรายงานระบบ (ใช้ได้ทั้ง Cronjob และ On-Demand)
 */
async function generateAndSendReport(db, googleNotifier, pbx) {
    return new Promise((resolve, reject) => {
        db.getAllRooms((err, rooms) => {
            if (err) {
                console.error('[CRON] ❌ Error fetching rooms:', err.message);
                if (googleNotifier) {
                    googleNotifier.sendSystemAlert('Daily Report Error', `Failed to fetch database: ${err.message}`, true);
                }
                return reject(err);
            }

            const totalRooms = rooms.length;
            const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
            const vacantRooms = totalRooms - occupiedRooms;
            const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
            
            // ตรวจสอบสถานะ PBX
            // pbx-connector exposes isConnected (or we can assume online if we have it)
            // Wait, in pbx-connector, state is usually managed internally. We'll use pbx.mode as fallback.
            const pbxStatusStr = pbx ? '🟢 Online (Active)' : '🔴 Offline (Disconnected)';
            const pbxModeStr = pbx ? pbx.mode : 'Unknown';

            let reportMessage = `<b>สถานะตู้สาขา (PBX):</b> ${pbxStatusStr}<br>`;
            reportMessage += `<b>โหมดการเชื่อมต่อ:</b> ${pbxModeStr}<br><br>`;
            reportMessage += `<b>📊 สรุปยอดการเข้าพักปัจจุบัน:</b><br>`;
            reportMessage += `- ห้องพักทั้งหมด: ${totalRooms} ห้อง<br>`;
            reportMessage += `- มีแขกเข้าพัก (Occupied): ${occupiedRooms} ห้อง<br>`;
            reportMessage += `- ว่าง (Vacant): ${vacantRooms} ห้อง<br>`;
            reportMessage += `- อัตราการเข้าพัก (Occupancy): ${occupancyRate}%`;

            if (googleNotifier) {
                googleNotifier.sendSystemAlert('📊 Daily System Report', reportMessage, false);
                console.log('[CRON] ✅ Daily report sent to Google Chat.');
            } else {
                console.log('[CRON] ⚠️ Google Notifier is not available. Report:', reportMessage);
            }

            resolve({
                pbx: {
                    status: pbx ? 'active' : 'disconnected',
                    mode: pbxModeStr
                },
                occupancy: {
                    total: totalRooms,
                    occupied: occupiedRooms,
                    vacant: vacantRooms,
                    rate: occupancyRate
                },
                timestamp: new Date().toISOString()
            });
        });
    });
}

module.exports = {
    startCronJobs,
    generateAndSendReport
};
