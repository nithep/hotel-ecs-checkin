'use strict';

const { PBXProtocolHandler, RESPONSE_TYPE } = require('../protocol');

/**
 * StateVerifier Class
 * ทำหน้าที่ยืนยันสถานะการทำงานของตู้สาขา (ACK/NACK/Timeout)
 * พร้อมระบบ Self-Healing (Retry) สูงสุด 3 ครั้ง
 * 
 * **หน้าที่หลัก**:
 * 1. Pre-Flight Verification: ตรวจสอบความถูกต้องของคำสั่งก่อนส่ง
 * 2. Post-Flight Verification: ยืนยันว่า hardware ตอบกลับด้วย ACK และสถานะถูกต้อง
 * 3. Self-Healing: หากตรวจพบ state mismatch หรือ error จะ retry อัตโนมัติ (max 3 ครั้ง)
 * 4. Fatal Error Handling: หากล้มเหลวหลัง retry ทั้งหมด จะ throw error เพื่อให้ Queue Manager จัดการ
 */
class StateVerifier {
  /**
   * @param {Object} options - Configuration options
   * @param {number} [options.maxRetries=3] - จำนวนครั้งที่ยอมให้ retry (default 3)
   * @param {number} [options.retryDelayMs=1000] - เวลาที่หน่วงก่อน retry (default 1000ms)
   * @param {boolean} [options.enableExponentialBackoff=true] - เปิดใช้ exponential backoff หรือไม่
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.enableExponentialBackoff = options.enableExponentialBackoff !== false;
    
    // ตัวติดตามสถิติสำหรับ debugging และ monitoring
    this._totalVerifications = 0;
    this._successfulVerifications = 0;
    this._failedVerifications = 0;
  }

  /**
   * หน่วงเวลาแบบ async
   * @param {number} ms - มิลลิวินาทีที่จะรอ
   * @returns {Promise<void>}
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pre-Flight Verification: ตรวจสอบความถูกต้องของคำสั่งก่อนส่งไปยัง hardware
   * ป้องกันการส่งคำสั่งที่ malformed ไปยัง PBX
   * 
   * @param {string|number} roomNumber - หมายเลขห้องที่ต้องการตรวจสอบ
   * @param {'ON'|'OFF'} expectedAction - การกระทำที่คาดหวัง ('ON' หรือ 'OFF')
   * @returns {{valid: boolean, error?: string}} ผลลัพธ์การตรวจสอบ
   */
  preFlightCheck(roomNumber, expectedAction) {
    try {
      // ตรวจสอบ room number
      if (!roomNumber && roomNumber !== 0) {
        return { valid: false, error: 'Room number is required' };
      }

      // ตรวจสอบ action
      if (expectedAction !== 'ON' && expectedAction !== 'OFF') {
        return { valid: false, error: `Invalid action: "${expectedAction}" — must be 'ON' or 'OFF'` };
      }

      // ทดลอง encode command เพื่อตรวจสอบความถูกต้อง
      PBXProtocolHandler.encodeCommand(roomNumber, expectedAction);

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Post-Flight Verification: ตรวจสอบ response จาก hardware ว่าตรงกับที่คาดหวังหรือไม่
   * ใช้ PBXProtocolHandler.decodeResponse เพื่อ categorize เป็น ACK/NACK/UNKNOWN
   * 
   * @param {Buffer|string} rawResponse - Response ดิบจาก PBX
   * @param {string|number} roomNumber - หมายเลขห้องที่ส่งคำสั่งไป
   * @param {'ON'|'OFF'} expectedAction - การกระทำที่คาดหวัง
   * @returns {{verified: boolean, type?: 'ACK'|'NACK'|'UNKNOWN', parsed?: Object, error?: string}}
   */
  postFlightCheck(rawResponse, roomNumber, expectedAction) {
    try {
      if (!rawResponse) {
        return { verified: false, error: 'No response received from PBX' };
      }

      // Decode response โดยใช้ PBXProtocolHandler
      const decoded = PBXProtocolHandler.decodeResponse(rawResponse);

      // ตรวจสอบว่าเป็น ACK หรือไม่
      if (decoded.type === 'ACK') {
        // ตรวจสอบเพิ่มเติมว่า response ตรงกับ room และ action ที่ส่งไปหรือไม่
        if (decoded.parsed && decoded.parsed.room) {
          const normalizedRoom = String(roomNumber).padStart(4, '0');
          if (decoded.parsed.room !== normalizedRoom) {
            return {
              verified: false,
              type: decoded.type,
              parsed: decoded.parsed,
              error: `Room mismatch: expected ${normalizedRoom}, got ${decoded.parsed.room}`,
            };
          }
        }

        return {
          verified: true,
          type: decoded.type,
          parsed: decoded.parsed,
        };
      } else if (decoded.type === 'NACK') {
        return {
          verified: false,
          type: decoded.type,
          parsed: decoded.parsed,
          error: decoded.parsed?.errorMessage || 'PBX returned NACK',
        };
      } else {
        return {
          verified: false,
          type: decoded.type,
          parsed: decoded.parsed,
          error: `Unknown response format: ${decoded.raw}`,
        };
      }
    } catch (error) {
      return {
        verified: false,
        error: `Post-flight verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Executes a command with full state verification and self-healing retry logic.
   * 
   * **ขั้นตอนการทำงาน**:
   * 1. Pre-Flight Check: ตรวจสอบความถูกต้องของ input
   * 2. Execute Command: ส่งคำสั่งผ่าน executeFn
   * 3. Post-Flight Check: ตรวจสอบ response ว่าเป็น ACK/NACK/UNKNOWN
   * 4. Self-Healing: หากล้มเหลว → retry ด้วย exponential backoff (max 3 ครั้ง)
   * 5. Fatal Error: หาก retry ครบแล้ว ยังล้มเหลว → throw error
   * 
   * @param {Function} executeFn - ฟังก์ชันที่คืนค่า Promise ซึ่งส่งคำสั่งและอ่าน Response ตอบกลับจาก PBX
   *                               ควร return raw response string หรือ Buffer
   * @param {Object} context - Context information สำหรับ logging และ verification
   * @param {string|number} context.roomNumber - หมายเลขห้อง
   * @param {'ON'|'OFF'} context.expectedAction - การกระทำที่คาดหวัง
   * @returns {Promise<Object>} Object { success: boolean, data?: Object, error?: string, attempts: number }
   * @throws {Error} FatalError เมื่อ retry ครบ maxRetries แล้ว ยังล้มเหลว
   */
  async verify(executeFn, context = {}) {
    const { roomNumber, expectedAction } = context;
    let attempts = 0;
    
    // เพิ่มตัวนับการ verify
    this._totalVerifications++;

    // Pre-Flight Check
    if (roomNumber && expectedAction) {
      const preCheck = this.preFlightCheck(roomNumber, expectedAction);
      if (!preCheck.valid) {
        this._failedVerifications++;
        throw new Error(`Pre-flight check failed: ${preCheck.error}`);
      }
    }

    // Retry loop with exponential backoff
    while (attempts <= this.maxRetries) {
      attempts++;
      
      try {
        // Execute the command
        const rawResponse = await executeFn();
        
        if (!rawResponse) {
          throw new Error('Timeout: No response from PBX');
        }

        // Post-Flight Check
        const postCheck = this.postFlightCheck(rawResponse, roomNumber, expectedAction);

        if (postCheck.verified) {
          // สำเร็จ → บันทึกสถิติและ return
          this._successfulVerifications++;
          return {
            success: true,
            data: postCheck.parsed,
            attempts,
            responseType: postCheck.type,
          };
        } else {
          // ล้มเหลว → throw error เพื่อให้ catch block จัดการ retry
          throw new Error(postCheck.error || 'Verification failed');
        }
      } catch (error) {
        // ตรวจสอบว่าเป็น attempt สุดท้ายหรือไม่
        if (attempts > this.maxRetries) {
          // แจ้งเตือนระบบล้มเหลว (Fatal Error)
          this._failedVerifications++;
          
          const fatalErrorMessage = `Fatal Error: Command verification failed after ${this.maxRetries + 1} attempts for room ${roomNumber}. Last error: ${error.message}`;
          
          console.error(`[STATE VERIFIER] ${fatalErrorMessage}`);
          
          return {
            success: false,
            error: fatalErrorMessage,
            attempts,
          };
        }
        
        // Exponential Backoff / หน่วงเวลาก่อน Retry
        // Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s (ถ้าเปิดใช้ exponential backoff)
        const delay = this.enableExponentialBackoff
          ? this.retryDelayMs * Math.pow(2, attempts - 1)
          : this.retryDelayMs;
        
        console.warn(`[STATE VERIFIER] Attempt ${attempts}/${this.maxRetries + 1} failed for room ${roomNumber}: ${error.message}. Retrying in ${delay}ms...`);
        
        await this.sleep(delay);
      }
    }

    // ควรจะไม่มาถึงจุดนี้ (ป้องกันกรณี edge case)
    this._failedVerifications++;
    throw new Error(`Unexpected error: Verification loop exited without result for room ${roomNumber}`);
  }

  /**
   * Verify hardware state matches expected state by sending query command.
   * ใช้สำหรับตรวจสอบสถานะจริงของ hardware หลังส่งคำสั่งควบคุม
   * 
   * @param {Function} queryFn - ฟังก์ชันที่ส่ง query command ไปยัง PBX และ return response
   * @param {string|number} roomNumber - หมายเลขห้องที่ต้องการตรวจสอบ
   * @param {number} expectedStatus - สถานะที่คาดหวัง (0=OFF, 1=ON, 2=MAINTENANCE, 3=OUT_OF_ORDER)
   * @returns {Promise<Object>} ผลลัพธ์การตรวจสอบ
   */
  async verifyHardwareState(queryFn, roomNumber, expectedStatus) {
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      attempts++;

      try {
        // ส่ง query command เพื่ออ่านสถานะปัจจุบัน
        const rawResponse = await queryFn();
        
        if (!rawResponse) {
          throw new Error('Timeout: No response from PBX during state query');
        }

        // Parse response
        const decoded = PBXProtocolHandler.decodeResponse(rawResponse);

        if (decoded.type !== 'ACK' || !decoded.parsed) {
          throw new Error(decoded.parsed?.errorMessage || 'Failed to parse hardware state');
        }

        // ตรวจสอบว่าสถานะตรงกับที่คาดหวังหรือไม่
        let actualStatus;
        if (decoded.parsed.type === RESPONSE_TYPE.POWER) {
          // Legacy PWER response: 'on'/'off'
          actualStatus = decoded.parsed.value === 'on' ? 1 : 0;
        } else if (decoded.parsed.type === RESPONSE_TYPE.ROOM) {
          // ROOM response: numeric status
          actualStatus = parseInt(decoded.parsed.value, 10);
        } else {
          throw new Error(`Unexpected response type for state query: ${decoded.parsed.type}`);
        }

        if (actualStatus === expectedStatus) {
          // สถานะตรงกัน → สำเร็จ
          this._successfulVerifications++;
          return {
            success: true,
            verified: true,
            actualStatus,
            expectedStatus,
            attempts,
          };
        } else {
          // สถานะไม่ตรงกัน → state mismatch
          throw new Error(`State mismatch: expected ${expectedStatus}, got ${actualStatus}`);
        }
      } catch (error) {
        if (attempts > this.maxRetries) {
          // ล้มเหลวหลัง retry ทั้งหมด → Fatal Error
          this._failedVerifications++;
          
          const fatalErrorMessage = `Fatal Error: Hardware state verification failed after ${this.maxRetries + 1} attempts for room ${roomNumber}. Expected: ${expectedStatus}. Last error: ${error.message}`;
          
          console.error(`[STATE VERIFIER] ${fatalErrorMessage}`);
          
          return {
            success: false,
            verified: false,
            error: fatalErrorMessage,
            attempts,
          };
        }

        // Exponential Backoff
        const delay = this.enableExponentialBackoff
          ? this.retryDelayMs * Math.pow(2, attempts - 1)
          : this.retryDelayMs;
        
        console.warn(`[STATE VERIFIER] State verification attempt ${attempts}/${this.maxRetries + 1} failed for room ${roomNumber}: ${error.message}. Retrying in ${delay}ms...`);
        
        await this.sleep(delay);
      }
    }

    // ควรจะไม่มาถึงจุดนี้
    this._failedVerifications++;
    throw new Error(`Unexpected error: State verification loop exited without result for room ${roomNumber}`);
  }

  /**
   * Get verification statistics for monitoring and debugging.
   * @returns {Object} สถิติการ verify
   */
  getStats() {
    return {
      totalVerifications: this._totalVerifications,
      successfulVerifications: this._successfulVerifications,
      failedVerifications: this._failedVerifications,
      successRate: this._totalVerifications > 0
        ? ((this._successfulVerifications / this._totalVerifications) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Reset verification statistics.
   */
  resetStats() {
    this._totalVerifications = 0;
    this._successfulVerifications = 0;
    this._failedVerifications = 0;
  }
}

module.exports = StateVerifier;

