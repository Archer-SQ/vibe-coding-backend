import { ApiResponse, ErrorResponse } from '../types/api';

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 可选消息
 * @param requestId 可选请求ID
 * @returns 成功响应对象
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: Date.now(),
    requestId
  };
}

/**
 * 创建错误响应
 * @param code 错误码
 * @param message 错误消息
 * @param details 错误详情
 * @param requestId 可选请求ID
 * @returns 错误响应对象
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: Date.now(),
    requestId
  };
}

/**
 * 错误码常量
 */
export const ErrorCodes = {
  // 通用错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // 设备相关错误
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  
  // 游戏相关错误
  INVALID_GAME_DATA: 'INVALID_GAME_DATA',
  SCORE_TOO_HIGH: 'SCORE_TOO_HIGH',
  SCORE_TOO_LOW: 'SCORE_TOO_LOW',
  
  // 数据库错误
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // 缓存错误
  CACHE_ERROR: 'CACHE_ERROR',
  
  // 限流错误
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN'
} as const;

/**
 * 自定义游戏API错误类
 */
export class GameApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'GameApiError';
  }
}

/**
 * 创建常用错误响应的便捷函数
 */
export const CommonErrors = {
  invalidDeviceId: (requestId?: string) => 
    createErrorResponse(
      ErrorCodes.INVALID_DEVICE_ID,
      '设备ID格式不正确',
      undefined,
      requestId
    ),
    
  validationError: (message: string, requestId?: string) =>
    createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      message,
      undefined,
      requestId
    ),
    
  databaseError: (requestId?: string) =>
    createErrorResponse(
      ErrorCodes.DATABASE_ERROR,
      '数据库操作失败',
      undefined,
      requestId
    ),
    
  internalServerError: (requestId?: string) =>
    createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      '服务器内部错误',
      undefined,
      requestId
    ),
    
  rateLimitExceeded: (requestId?: string) =>
    createErrorResponse(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      '请求频率过高，请稍后再试',
      undefined,
      requestId
    ),
    
  deviceNotFound: (deviceId: string, requestId?: string) =>
    createErrorResponse(
      ErrorCodes.DEVICE_NOT_FOUND,
      '设备未找到',
      { deviceId },
      requestId
    )
};