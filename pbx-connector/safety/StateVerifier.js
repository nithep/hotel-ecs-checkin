'use strict';

const { PBXProtocolHandler, RESPONSE_TYPE } = require('../protocol');

/**
 * StateVerifier Class
 * ทำหน้าที่ยืนยันสถานะการทำงานของตู้สาขา (ACK/NACK/Timeout)
 * พร้อมระบบ Self-Healing (Retry) สูงสุด 3 ครั้ง
 */
class StateVerifier {
  /**
   * @param {number} maxRetries - จำนวนครั้งที่ยอมให้ retry (default 3)
   * @param {number} retryDelayMs - เวลาที่หน่วงก่อน retry (default 1000ms)
   */
  constructor(maxRetries = 3, retryDelayMs = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * หน่วงเวลา
   * @param {number} ms 
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executes a command with state verification and retry logic.
   * 
   * @param {Function} executeFn - ฟังก์ชันที่คืนค่า Promise ซึ่งส่งคำสั่งและอ่าน Response ตอบกลับจาก PBX
   * @returns {Promise<Object>} Object { success, data, error, attempts }
   */
  async verify(executeFn) {
    let attempts = 0;
    
    while (attempts <= this.maxRetries) {
      attempts++;
      try {
        // executeFn ควรจะ return raw response string ออกมา (มี Timeout handling ในตัว)
        const rawResponse = await executeFn();
        
        if (!rawResponse) {
          throw new Error('Timeout: No response from PBX');
        }

        const parsed = PBXProtocolHandler.parse(rawResponse);

        if (parsed.error || parsed.type === RESPONSE_TYPE.NACK) {
          throw new Error(parsed.errorMessage || 'PBX returned NACK');
        }

        return {
          success: true,
          data: parsed,
          attempts
        };
      } catch (error) {
        if (attempts > this.maxRetries) {
          // แจ้งเตือนระบบล้มเหลว (Failed)
          return {
            success: false,
            error: error.message,
            attempts
          };
        }
        
        // Exponential Backoff / หน่วงเวลาก่อน Retry
        await this.sleep(this.retryDelayMs * attempts);
      }
    }
  }
}

module.exports = StateVerifier;
