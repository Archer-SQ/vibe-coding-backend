import * as crypto from 'crypto';

// 设备ID格式：32位十六进制字符串
const DEVICE_ID_PATTERN = /^[a-f0-9]{32}$/;

/**
 * 验证设备ID格式
 * @param deviceId 设备ID
 * @returns 是否有效
 */
export function validateDeviceId(deviceId: string): boolean {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  return DEVICE_ID_PATTERN.test(deviceId);
}

/**
 * 生成设备ID（用于测试或演示）
 * @param userAgent 用户代理字符串
 * @param timestamp 时间戳
 * @returns 32位十六进制设备ID
 */
export function generateDeviceId(userAgent: string = '', timestamp: number = Date.now()): string {
  const data = `${userAgent}-${timestamp}-${Math.random()}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * 设备ID验证结果接口
 */
export interface DeviceIdValidationResult {
  isValid: boolean;
  deviceId: string;
  error?: string;
}

/**
 * 完整的设备ID验证
 * @param deviceId 设备ID
 * @returns 验证结果
 */
export function validateDeviceIdWithDetails(deviceId: string): DeviceIdValidationResult {
  if (!deviceId) {
    return {
      isValid: false,
      deviceId: '',
      error: '设备ID不能为空'
    };
  }

  if (typeof deviceId !== 'string') {
    return {
      isValid: false,
      deviceId: String(deviceId),
      error: '设备ID必须是字符串'
    };
  }

  if (deviceId.length !== 32) {
    return {
      isValid: false,
      deviceId,
      error: '设备ID长度必须为32位'
    };
  }

  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    return {
      isValid: false,
      deviceId,
      error: '设备ID格式不正确，必须是32位十六进制字符串'
    };
  }

  return {
    isValid: true,
    deviceId
  };
}

/**
 * 从请求头中提取设备ID
 * @param headers 请求头
 * @returns 设备ID或null
 */
export function extractDeviceIdFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
  const deviceId = headers['x-device-id'] || headers['X-Device-ID'];
  
  if (Array.isArray(deviceId)) {
    return deviceId[0] || null;
  }
  
  return deviceId || null;
}

/**
 * 设备ID中间件验证函数
 * @param deviceId 设备ID
 * @throws Error 如果设备ID无效
 */
export function requireValidDeviceId(deviceId: string): void {
  const validation = validateDeviceIdWithDetails(deviceId);
  if (!validation.isValid) {
    throw new Error(validation.error || '设备ID验证失败');
  }
}