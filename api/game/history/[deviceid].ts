import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../../lib/database/connection';
import { cacheService } from '../../../lib/services/cacheservice';
import { validateDeviceId } from '../../../lib/utils/deviceId';
import GameRecord from '../../../lib/database/models/GameRecord';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '只支持GET请求'
      },
      timestamp: Date.now()
    });
  }

  try {
    const { deviceId } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // 验证设备ID
    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_ID',
          message: '设备ID参数无效'
        },
        timestamp: Date.now()
      });
    }

    // 验证设备ID格式
    if (!validateDeviceId(deviceId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_ID_FORMAT',
          message: '设备ID格式不正确'
        },
        timestamp: Date.now()
      });
    }

    // 验证分页参数
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'limit参数必须在1-100之间'
        },
        timestamp: Date.now()
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OFFSET',
          message: 'offset参数不能为负数'
        },
        timestamp: Date.now()
      });
    }

    // 使用导入的缓存服务实例
    let responseData: any = null;
    let cached = false;

    // 生成缓存键（包含分页参数）
    const cacheKey = `history:${deviceId}:${limit}:${offset}`;

    // 尝试从缓存获取历史记录
    try {
      const cachedHistory = await cacheService.get(cacheKey);
      if (cachedHistory && typeof cachedHistory === 'string') {
        responseData = JSON.parse(cachedHistory);
        responseData.cached = true;
        cached = true;
        console.log('从缓存获取历史记录', { deviceId, limit, offset });
      }
    } catch (cacheError: any) {
      console.warn('缓存读取失败', { error: cacheError?.message });
    }

    // 如果缓存中没有数据，从数据库查询
    if (!cached) {
      // 连接数据库
      await connectDatabase();

      // 获取游戏记录总数
      const total = await GameRecord.countDocuments({ deviceId });

      if (total === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_RECORDS_FOUND',
            message: '未找到游戏记录'
          },
          timestamp: Date.now()
        });
      }

      // 获取分页的游戏记录
      const records = await GameRecord.find({ deviceId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('_id score createdAt')
        .lean();

      const hasMore = offset + limit < total;

      responseData = {
        records: records.map(record => ({
          _id: record._id.toString(),
          score: record.score,
          createdAt: record.createdAt
        })),
        total,
        hasMore,
        cached: false
      };

      // 缓存历史记录数据（TTL: 10分钟）
      try {
        await cacheService.set(cacheKey, JSON.stringify(responseData), 600);
        console.log('历史记录数据已缓存', { deviceId, limit, offset });
      } catch (cacheError: any) {
        console.warn('缓存写入失败', { error: cacheError?.message });
      }
    }

    console.log('历史记录查询成功', {
      deviceId,
      total: responseData.total,
      recordsCount: responseData.records.length,
      hasMore: responseData.hasMore,
      cached
    });

    return res.status(200).json({
      success: true,
      data: responseData,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('历史记录查询失败', { 
      error: error?.message || '未知错误', 
      stack: error?.stack,
      deviceId: req.query?.deviceId
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误'
      },
      timestamp: Date.now()
    });
  }
}