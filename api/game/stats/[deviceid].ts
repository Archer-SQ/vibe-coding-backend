import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../../lib/database/connection';
import { GameService } from '../../../lib/services/gameService';
import { cacheService } from '../../../lib/services/cacheservice';
import { validateDeviceId } from '../../../lib/utils/deviceId';
import { createSuccessResponse, createErrorResponse } from '../../../lib/utils/response';

/**
 * 获取设备统计数据API
 * GET /api/game/stats/[deviceId]
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('METHOD_NOT_ALLOWED', '只支持GET请求'));
  }

  try {
    // 获取设备ID
    const { deviceId } = req.query;
    
    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json(createErrorResponse('INVALID_DEVICE_ID', '设备ID不能为空'));
    }

    // 验证设备ID格式
    if (!validateDeviceId(deviceId)) {
      return res.status(400).json(createErrorResponse('INVALID_DEVICE_ID', '设备ID格式不正确'));
    }

    // API限流检查
    const rateLimitResult = await cacheService.checkRateLimit(deviceId, 100);
    if (!rateLimitResult.allowed) {
      return res.status(429).json(createErrorResponse('RATE_LIMIT_EXCEEDED', '请求过于频繁，请稍后再试'));
    }

    // 连接数据库
    await connectDatabase();

    // 初始化游戏服务
    const gameService = new GameService();

    // 尝试从缓存获取设备统计数据
    let deviceStats = await cacheService.getDeviceStatsCache(deviceId);
    
    if (!deviceStats) {
      // 缓存中没有，从数据库查询
      console.log(`缓存未命中，从数据库查询设备统计: ${deviceId}`);
      
      deviceStats = await gameService.getDeviceStats(deviceId);
      
      if (!deviceStats) {
        return res.status(404).json(createErrorResponse('DEVICE_NOT_FOUND', '设备不存在'));
      }

      // 将结果写入缓存
      await cacheService.setDeviceStatsCache(deviceId, deviceStats);
    } else {
      console.log(`缓存命中，返回设备统计: ${deviceId}`);
    }

    // 设置默认排名为null（因为GameService中没有getDeviceRank方法）
    const deviceRank = null;

    // 构建响应数据
    const responseData = {
      deviceId,
      bestScore: deviceStats.bestScore,
      rank: deviceRank || null,
      createdAt: deviceStats.createdAt,
      updatedAt: deviceStats.updatedAt
    };

    console.log(`设备统计查询成功: ${deviceId}, 最高分: ${deviceStats.bestScore}, 排名: ${deviceRank}`);

    return res.status(200).json(createSuccessResponse(responseData));

  } catch (error) {
    console.error('获取设备统计失败:', error);
    return res.status(500).json(createErrorResponse('INTERNAL_ERROR', '服务器内部错误'));
  }
}