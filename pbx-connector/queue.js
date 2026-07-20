'use strict';

/**
 * @file queue.js — FIFO Command Queue Utility with Safety Timeout
 *
 * ช่วยจัดการคำสั่งแบบ Asynchronous ให้ทำงานเรียงตามลำดับก่อนหลัง (FIFO)
 * ป้องกันปัญหาสัญญาณชนกันหรือคำสั่งซ้อนทับกันเมื่อ API ได้รับ Concurrent Requests
 * พร้อมระบบ Safety Timeout เพื่อป้องกัน Deadlock เมื่อฮาร์ดแวร์ไม่ตอบสนอง
 *
 * @module pbx-connector/queue
 */

/**
 * ห่อหุ้มฟังก์ชันคำสั่งฮาร์ดแวร์ด้วย Safety Timeout
 * ใช้ Promise.race เพื่อจำกัดเวลาการรอตอบกลับจากตู้สาขา PBX
 * หากหมดเวลาจะ Throw Error ทันทีเพื่อให้ระบบ Self-Healing ทำการ Retry
 *
 * @param {Function} commandFn - ฟังก์ชันที่ส่งคำสั่งไปยังฮาร์ดแวร์ (คืนค่าเป็น Promise)
 * @param {number} timeoutMs - เวลาจำกัดในการรอตอบกลับ (มิลลิวินาที) ค่าเริ่มต้น 5000ms
 * @returns {Promise<any>} ผลลัพธ์ของคำสั่งฮาร์ดแวร์
 * @throws {Error} HARDWARE_TIMEOUT เมื่อหมดเวลารอ หรือ Error อื่นๆ จากคำสั่ง
 */
async function executeHardwareCommand(commandFn, timeoutMs = 5000) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error("HARDWARE_TIMEOUT: Phonik PBX failed to respond within 5s"));
        }, timeoutMs);
    });
    try {
        const result = await Promise.race([commandFn(), timeoutPromise]);
        clearTimeout(timeoutHandle);
        return result;
    } catch (error) {
        clearTimeout(timeoutHandle);
        console.error(`[QUEUE ERROR] Safety Gate Triggered: ${error.message}`);
        throw error;
    }
}

class CommandQueue {
  constructor() {
    /**
     * @private
     * @type {Array<{asyncFn: Function, resolve: Function, reject: Function}>}
     */
    this._queue = [];
    
    /**
     * @private
     * @type {boolean}
     */
    this._running = false;
  }

  /**
   * เพิ่ม Async function เข้าคิวเพื่อรอประมวลผลตามลำดับ
   * คำสั่งจะถูกห่อหุ้มด้วย executeHardwareCommand อัตโนมัติเพื่อป้องกัน Deadlock
   *
   * @param {Function} asyncFn - ฟังก์ชันที่คืนค่าเป็น Promise (คำสั่งฮาร์ดแวร์)
   * @returns {Promise<any>} ผลลัพธ์ของ asyncFn หลังจากรันเสร็จสิ้น
   */
  add(asyncFn) {
    return new Promise((resolve, reject) => {
      // Wrap the asyncFn with safety timeout before adding to queue
      const wrappedAsyncFn = () => executeHardwareCommand(asyncFn, 5000);
      this._queue.push({ asyncFn: wrappedAsyncFn, resolve, reject });
      this._next();
    });
  }

  /**
   * รันคำสั่งลำดับถัดไปในคิว
   * @private
   */
  async _next() {
    if (this._running || this._queue.length === 0) {
      return;
    }

    this._running = true;
    const { asyncFn, resolve, reject } = this._queue.shift();

    try {
      const result = await asyncFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      // หน่วงเวลาเล็กน้อยก่อนส่งคำสั่งถัดไปเพื่อป้องกันตู้สาขาทำงานไม่ทัน (Hardware Race Condition)
      await new Promise(resolve => setTimeout(resolve, 100));
      this._running = false;
      this._next();
    }
  }

  /**
   * ล้างคำสั่งที่ค้างอยู่ในคิวทั้งหมดออกพร้อมแจ้ง Error
   */
  clear() {
    const error = new Error('Command queue cleared due to connection reset or disconnect');
    while (this._queue.length > 0) {
      const { reject } = this._queue.shift();
      reject(error);
    }
    this._running = false;
  }

  /**
   * จำนวนคำสั่งที่ยังคงค้างอยู่ในคิวรอการประมวลผล
   * @returns {number}
   */
  get size() {
    return this._queue.length;
  }

  /**
   * ตรวจสอบว่าคิวกำลังรันคำสั่งอยู่หรือไม่
   * @returns {boolean}
   */
  get isRunning() {
    return this._running;
  }
}

module.exports = { CommandQueue };
