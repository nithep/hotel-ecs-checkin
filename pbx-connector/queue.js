'use strict';

/**
 * @file queue.js — FIFO Command Queue Utility
 *
 * ช่วยจัดการคำสั่งแบบ Asynchronous ให้ทำงานเรียงตามลำดับก่อนหลัง (FIFO)
 * ป้องกันปัญหาสัญญาณชนกันหรือคำสั่งซ้อนทับกันเมื่อ API ได้รับ Concurrent Requests
 *
 * @module pbx-connector/queue
 */
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
   *
   * @param {Function} asyncFn - ฟังก์ชันที่คืนค่าเป็น Promise
   * @returns {Promise<any>} ผลลัพธ์ของ asyncFn หลังจากรันเสร็จสิ้น
   */
  add(asyncFn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ asyncFn, resolve, reject });
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
