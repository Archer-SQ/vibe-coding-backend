import { z } from 'zod';

// 设备ID验证Schema
export const DeviceIdSchema = z.string()
  .length(32, '设备ID长度必须为32位')
  .regex(/^[a-f0-9]+$/, '设备ID必须是十六进制字符串');

// 游戏记录提交验证Schema
export const GameRecordSubmissionSchema = z.object({
  deviceId: DeviceIdSchema,
  score: z.number()
    .int('分数必须是整数')
    .min(0, '分数不能为负数')
    .max(999999, '分数不能超过999999')
});

// 分页参数验证Schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional()
});

// 排行榜查询参数验证Schema
export const RankingQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  timeRange: z.enum(['all', 'daily', 'weekly', 'monthly']).optional().default('all')
});

// 游戏记录查询参数验证Schema
export const GameRecordQuerySchema = z.object({
  deviceId: DeviceIdSchema,
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['score', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * 验证数据的通用函数
 * @param schema Zod验证Schema
 * @param data 要验证的数据
 * @returns 验证结果
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    return {
      success: false,
      error: '数据验证失败'
    };
  }
}

/**
 * 验证设备ID
 * @param deviceId 设备ID
 * @returns 验证结果
 */
export function validateDeviceId(deviceId: unknown): {
  success: boolean;
  deviceId?: string;
  error?: string;
} {
  return validateData(DeviceIdSchema, deviceId);
}

/**
 * 验证游戏记录提交数据
 * @param data 游戏记录数据
 * @returns 验证结果
 */
export function validateGameRecordSubmission(data: unknown): {
  success: boolean;
  data?: { deviceId: string; score: number };
  error?: string;
} {
  return validateData(GameRecordSubmissionSchema, data);
}

/**
 * 验证分页参数
 * @param params 分页参数
 * @returns 验证结果
 */
export function validatePaginationParams(params: unknown): {
  success: boolean;
  data?: { page: number; limit: number; offset?: number };
  error?: string;
} {
  const result = validateData(PaginationSchema, params);
  if (result.success && result.data) {
    return {
      success: true,
      data: {
        page: result.data.page || 1,
        limit: result.data.limit || 20,
        offset: result.data.offset
      }
    };
  }
  return {
    success: false,
    error: result.error
  };
}