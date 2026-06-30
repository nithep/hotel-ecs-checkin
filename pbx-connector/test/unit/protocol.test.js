'use strict';

const protocol = require('../../protocol');

describe('Phonik PBX Protocol Engine', () => {
  describe('Room Normalization', () => {
    test('ควรแปลงเลขห้อง 1-4 หลักให้เป็น 4 หลัก zero-padded', () => {
      expect(protocol.normalizeRoom(101)).toBe('0101');
      expect(protocol.normalizeRoom('101')).toBe('0101');
      expect(protocol.normalizeRoom('0101')).toBe('0101');
      expect(protocol.normalizeRoom(2)).toBe('0002');
    });

    test('ควร throw error เมื่อเลขห้องไม่ถูกต้อง', () => {
      expect(() => protocol.normalizeRoom(null)).toThrow('Room number is required');
      expect(() => protocol.normalizeRoom('')).toThrow('Invalid room number');
      expect(() => protocol.normalizeRoom('abc')).toThrow('Invalid room number');
      expect(() => protocol.normalizeRoom('12345')).toThrow('Invalid room number');
    });
  });

  describe('Command Builders', () => {
    test('ควรสร้างคำสั่ง Set Room Status ที่ถูกต้อง', () => {
      expect(protocol.buildSetRoom(101, protocol.ROOM_STATUS.ON)).toBe('..ROOM0101=1\r\n');
      expect(protocol.buildSetRoom('0203', protocol.ROOM_STATUS.OFF)).toBe('..ROOM0203=0\r\n');
    });

    test('ควร throw error เมื่อใช้ status นอกเหนือจาก 0-3', () => {
      expect(() => protocol.buildSetRoom(101, 4)).toThrow('Invalid room status');
      expect(() => protocol.buildSetRoom(101, -1)).toThrow('Invalid room status');
    });

    test('ควรสร้างคำสั่ง Get Room Status ที่ถูกต้อง', () => {
      expect(protocol.buildGetRoom(101)).toBe('..ROOM0101=\r\n');
    });

    test('ควรสร้างคำสั่ง Set Guest Name และจำกัดความยาว 16 ตัวอักษร', () => {
      expect(protocol.buildSetName(101, 'John Doe')).toBe('..NAME0101=John Doe\r\n');
      expect(protocol.buildSetName(101, 'A'.repeat(20))).toBe(`..NAME0101=${'A'.repeat(16)}\r\n`);
    });

    test('ควรสร้างคำสั่ง Get Version', () => {
      expect(protocol.buildGetVersion()).toBe('..VERS=\r\n');
    });

    test('ควรสร้างคำสั่ง Ping', () => {
      expect(protocol.buildPing()).toBe('..VERS=\r\n');
    });

    test('ควรสร้างคำสั่ง STOP', () => {
      expect(protocol.buildStop()).toBe('..STOP\r\n');
    });

    test('ควรสร้างคำสั่ง Set Wakeup Time (hhmm format)', () => {
      expect(protocol.buildSetWake(101, '0630')).toBe('..WAKE0101=0630\r\n');
      expect(() => protocol.buildSetWake(101, '630')).toThrow('Invalid wake time');
      expect(() => protocol.buildSetWake(101, '2400')).toThrow('Invalid wake time');
    });

    test('ควรสร้างคำสั่ง Set Lock Status (0 หรือ 1)', () => {
      expect(protocol.buildSetLock(101, 1)).toBe('..LOCK0101=1\r\n');
      expect(protocol.buildSetLock(101, 0)).toBe('..LOCK0101=0\r\n');
      expect(() => protocol.buildSetLock(101, 2)).toThrow('Invalid lock state');
    });
  });

  describe('Response Parser', () => {
    test('ควร parse ROOM status response ได้ถูกต้อง (ทั้ง 3 และ 4 หลัก)', () => {
      const parsed1 = protocol.parseResponse('==ROOM0101=1\r\n');
      expect(parsed1.type).toBe(protocol.RESPONSE_TYPE.ROOM);
      expect(parsed1.room).toBe('0101');
      expect(parsed1.value).toBe('1');
      expect(parsed1.error).toBe(false);

      const parsed2 = protocol.parseResponse('==ROOM102=0\r\n');
      expect(parsed2.type).toBe(protocol.RESPONSE_TYPE.ROOM);
      expect(parsed2.room).toBe('102');
      expect(parsed2.value).toBe('0');
      expect(parsed2.error).toBe(false);
    });

    test('ควร parse guest NAME response ได้ถูกต้อง', () => {
      const parsed = protocol.parseResponse('==NAME0101=John Doe\r\n');
      expect(parsed.type).toBe(protocol.RESPONSE_TYPE.NAME);
      expect(parsed.room).toBe('0101');
      expect(parsed.value).toBe('John Doe');
      expect(parsed.error).toBe(false);
    });

    test('ควร parse VERSION response ได้ถูกต้อง', () => {
      const parsed = protocol.parseResponse('==VERS=DX-COMPACT V5.Super Diamond-32C\r\n');
      expect(parsed.type).toBe(protocol.RESPONSE_TYPE.VERSION);
      expect(parsed.value).toBe('DX-COMPACT V5.Super Diamond-32C');
      expect(parsed.error).toBe(false);
    });

    test('ควร parse NACK response เป็น error ได้ถูกต้อง', () => {
      const parsed = protocol.parseResponse('==NACK\r\n');
      expect(parsed.type).toBe(protocol.RESPONSE_TYPE.NACK);
      expect(parsed.error).toBe(true);
      expect(parsed.errorMessage).toContain('PBX returned NACK');
    });

    test('ควร throw/return error เมื่อรูปแบบ response ไม่ถูกต้อง', () => {
      const parsed1 = protocol.parseResponse('invalid_resp');
      expect(parsed1.error).toBe(true);
      expect(parsed1.errorMessage).toContain('Unexpected response format');

      const parsed2 = protocol.parseResponse(null);
      expect(parsed2.error).toBe(true);
    });
  });
});
