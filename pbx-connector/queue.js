'use strict';

/**
 * @file queue.js — Deterministic Sequential FIFO Command Queue with Handshake Mechanism
 *
 * ช่วยจัดการคำสั่งแบบ Asynchronous ให้ทำงานเรียงตามลำดับก่อนหลัง (FIFO) อย่างเคร่งครัด
 * ป้องกันปัญหาสัญญาณชนกันหรือคำสั่งซ้อนทับกันเมื่อ API ได้รับ Concurrent Requests
 * 
 * คุณสมบัติหลัก:
 * - **Deterministic Sequential Processing**: คำสั่งถัดไปจะเริ่มต้นได้เฉพาะเมื่อคำสั่งปัจจุบันได้รับ ACK, NACK หรือ Timeout เท่านั้น
 * - **Handshake Mechanism**: ใช้ Promise chain + async/await locks เพื่อควบคุมการเข้าถึงทรัพยากรร่วมกัน
 * - **Safety Timeout**: จำกัดเวลาการรอตอบกลับจากตู้สาขา PBX เพื่อป้องกัน Deadlock
 * - **Self-Healing**: เมื่อเกิดข้อผิดพลาด ระบบจะ throw error เพื่อให้ StateVerifier ทำการ retry
 *
 * @module pbx-connector/queue
 */

const { PBXProtocolHandler } = require('./protocol');

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
     * @type {Array<{task: Function, resolve: Function, reject: Function}>}
     */
    this._queue = [];
    
    /**
     * @private
     * @type {boolean} - ตัวบ่งชี้ว่าคิวกำลังประมวลผลอยู่หรือไม่
     */
    this._processing = false;
    
    /**
     * @private
     * @type {Promise|null} - Promise chain สำหรับควบคุมลำดับการทำงานแบบ deterministic
     * ใช้เป็น mutex lock เพื่อให้แน่ใจว่ามีเพียงหนึ่งคำสั่งเท่านั้นที่ทำงานได้ในแต่ละครั้ง
     */
    this._executionChain = Promise.resolve();
    
    /**
     * @private
     * @type {boolean} - ตัวบ่งชี้ว่าคิวถูกเคลียร์หรือหยุดทำงานแล้วหรือไม่
     */
    this._stopped = false;
  }

  /**
   * เพิ่ม Async function เข้าคิวเพื่อรอประมวลผลตามลำดับ (FIFO)
   * คำสั่งจะถูกห่อหุ้มด้วย executeHardwareCommand อัตโนมัติเพื่อป้องกัน Deadlock
   * 
   * **Handshake Mechanism**:
   * 1. สร้าง Promise ใหม่สำหรับ task นี้
   * 2. เชื่อมต่อกับ execution chain ปัจจุบันผ่าน .then()
   * 3. รอจนกว่าคำสั่งก่อนหน้าจะเสร็จสิ้น (ACK/NACK/Timeout) ก่อนเริ่มทำงาน
   * 4. บังคับใช้คำสั่งแบบ sequential อย่างเคร่งครัด — ไม่มีการ parallel execution
   *
   * @param {Function} asyncFn - ฟังก์ชันที่คืนค่าเป็น Promise (คำสั่งฮาร์ดแวร์)
   * @returns {Promise<any>} ผลลัพธ์ของ asyncFn หลังจากรันเสร็จสิ้น
   */
  add(asyncFn) {
    // ตรวจสอบว่าคิวถูกหยุดแล้วหรือไม่
    if (this._stopped) {
      return Promise.reject(new Error('Command queue has been stopped'));
    }

    return new Promise((resolve, reject) => {
      // Wrap the asyncFn with safety timeout before adding to queue
      const wrappedTask = () => executeHardwareCommand(asyncFn, 5000);
      
      // เพิ่ม task เข้าคิวพร้อม resolve/reject handlers
      this._queue.push({ task: wrappedTask, resolve, reject });
      
      // เริ่มกระบวนการประมวลผลถ้ายังไม่เริ่ม
      this._processNext();
    });
  }

  /**
   * ประมวลผลคำสั่งลำดับถัดไปในคิวแบบ Deterministic Sequential
   * ใช้ Promise chain เป็น mutex lock เพื่อควบคุมการเข้าถึง
   * 
   * **ขั้นตอนการทำงานของ Handshake**:
   * 1. ตรวจสอบว่ามี task ในคิวและไม่ได้กำลังประมวลผลอยู่
   * 2. ดึง task ออกจากคิว (shift = FIFO)
   * 3. สร้าง Promise chain ใหม่ที่ต่อท้าย chain เดิม
   * 4. รัน task และรอผลลัพธ์ (ACK/NACK/Timeout)
   * 5. หน่วงเวลา 100ms เพื่อป้องกัน hardware race condition
   * 6. เรียก _processNext() อีกครั้งเพื่อทำงานถัดไป
   * 
   * @private
   */
  async _processNext() {
    // ถ้าไม่มี task ในคิว หรือกำลังประมวลผลอยู่ หรือถูกหยุดแล้ว → ออกทันที
    if (this._queue.length === 0 || this._processing || this._stopped) {
      return;
    }

    // ตั้ง flag ว่ากำลังประมวลผลอยู่
    this._processing = true;
    
    // ดึง task แรกออกจากคิว (FIFO order)
    const { task, resolve, reject } = this._queue.shift();

    // สร้าง execution chain ใหม่โดยต่อท้าย chain เดิม
    // นี่คือหัวใจของ handshake mechanism — รับประกันว่า task จะรันตามลำดับเท่านั้น
    this._executionChain = this._executionChain
      .then(async () => {
        try {
          // รัน task และรอผลลัพธ์
          const result = await task();
          
          // สำเร็จ → resolve promise ของ caller
          resolve(result);
        } catch (err) {
          // ล้มเหลว → reject promise ของ caller
          // Error จะถูกจับโดย StateVerifier เพื่อทำ retry
          reject(err);
        } finally {
          // หน่วงเวลาเล็กน้อยก่อนส่งคำสั่งถัดไปเพื่อป้องกันตู้สาขาทำงานไม่ทัน (Hardware Race Condition)
          // ป้องกันสัญญาณชนกันระหว่างคำสั่งต่อเนื่อง
          await new Promise(r => setTimeout(r, 100));
          
          // ปลด lock และประมวลผล task ถัดไป
          this._processing = false;
          this._processNext();
        }
      })
      .catch((err) => {
        // จับ error ที่ไม่คาดคิดใน chain เอง
        console.error('[QUEUE ERROR] Unhandled error in execution chain:', err);
        this._processing = false;
        this._processNext();
      });
  }

  /**
   * ล้างคำสั่งที่ค้างอยู่ในคิวทั้งหมดออกพร้อมแจ้ง Error
   * ใช้เมื่อต้องการ reset คิวเนื่องจาก connection หลุดหรือ disconnect
   */
  clear() {
    const error = new Error('Command queue cleared due to connection reset or disconnect');
    
    // Reject ทุก task ที่ยังค้างอยู่ในคิว
    while (this._queue.length > 0) {
      const { reject } = this._queue.shift();
      reject(error);
    }
    
    // Reset state
    this._processing = false;
    this._executionChain = Promise.resolve();
  }

  /**
   * หยุดการทำงานของคิวถาวร
   * ใช้เมื่อต้องการทำลาย connector
   */
  stop() {
    this._stopped = true;
    this.clear();
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
  get isProcessing() {
    return this._processing;
  }

  /**
   * ตรวจสอบว่าคิวถูกหยุดแล้วหรือไม่
   * @returns {boolean}
   */
  get isStopped() {
    return this._stopped;
  }
}

module.exports = { CommandQueue };

