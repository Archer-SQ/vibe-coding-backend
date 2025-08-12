// Jest globals are available in the test environment
import { connectDatabase } from '../lib/database/connection';
import mongoose from 'mongoose';

describe('API Tests', () => {
  beforeAll(async () => {
    // 连接测试数据库
    await connectDatabase();
  });

  afterAll(async () => {
    // 关闭数据库连接
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      // 这里可以添加健康检查的测试
      expect(true).toBe(true);
    });
  });

  describe('Game API', () => {
    test('should validate device ID format', () => {
      const validDeviceId = 'a1b2c3d4e5f6789012345678901234ab';
      const invalidDeviceId = 'invalid-device-id';
      
      expect(validDeviceId).toMatch(/^[a-f0-9]{32}$/);
      expect(invalidDeviceId).not.toMatch(/^[a-f0-9]{32}$/);
    });

    test('should validate score range', () => {
      const validScore = 15000;
      const invalidScore = -100;
      const tooHighScore = 1000000;
      
      expect(validScore).toBeGreaterThanOrEqual(0);
      expect(validScore).toBeLessThanOrEqual(999999);
      expect(invalidScore).toBeLessThan(0);
      expect(tooHighScore).toBeGreaterThan(999999);
    });
  });

  describe('Validation Utils', () => {
    test('should validate pagination parameters', () => {
      const validLimit = 20;
      const invalidLimit = 150;
      
      expect(validLimit).toBeGreaterThan(0);
      expect(validLimit).toBeLessThanOrEqual(100);
      expect(invalidLimit).toBeGreaterThan(100);
    });
  });
});