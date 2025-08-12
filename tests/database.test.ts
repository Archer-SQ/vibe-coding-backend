import { connectDatabase, disconnectDatabase } from '../lib/database/connection';
import { validateDeviceId, generateDeviceId } from '../lib/utils/deviceId';

describe('数据库连接测试', () => {
  test('应该能够连接到MongoDB', async () => {
    await expect(connectDatabase()).resolves.not.toThrow();
  });

  test('应该能够断开MongoDB连接', async () => {
    await expect(disconnectDatabase()).resolves.not.toThrow();
  });
});

describe('设备ID工具测试', () => {
  test('应该验证有效的设备ID', () => {
    const validDeviceId = 'a1b2c3d4e5f6789012345678901234ab';
    expect(validateDeviceId(validDeviceId)).toBe(true);
  });

  test('应该拒绝无效的设备ID', () => {
    const invalidDeviceIds = [
      '', // 空字符串
      'invalid', // 太短
      'a1b2c3d4e5f6789012345678901234abcd', // 太长
      'g1b2c3d4e5f6789012345678901234ab', // 包含无效字符
      123, // 非字符串
      null, // null值
      undefined // undefined值
    ];

    invalidDeviceIds.forEach(deviceId => {
      expect(validateDeviceId(deviceId as any)).toBe(false);
    });
  });

  test('应该生成有效的设备ID', () => {
    const deviceId = generateDeviceId('test-user-agent', Date.now());
    expect(validateDeviceId(deviceId)).toBe(true);
    expect(deviceId).toHaveLength(32);
  });

  test('生成的设备ID应该是唯一的', () => {
    const deviceId1 = generateDeviceId('test-user-agent-1', Date.now());
    const deviceId2 = generateDeviceId('test-user-agent-2', Date.now() + 1);
    expect(deviceId1).not.toBe(deviceId2);
  });
});

describe('环境变量测试', () => {
  test('应该设置必要的环境变量', () => {
    // 在测试环境中，这些变量应该被设置
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.MONGODB_URI).toBeDefined();
    expect(process.env.MONGODB_DB_NAME).toBeDefined();
  });
});