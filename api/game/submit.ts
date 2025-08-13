import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../lib/database/connection';
import { GameService } from '../../lib/services/gameService';
import { cacheService } from '../../lib/services/cacheservice';
import { validateDeviceId } from '../../lib/utils/deviceId';

interface GameSubmissionRequest {
  deviceId: string;
  score: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '只支持POST请求'
      },
      timestamp: Date.now()
    });
  }

  try {
    const { deviceId, score }: GameSubmissionRequest = req.body;

    // 验证请求数据
    if (!deviceId || typeof score !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_DATA',
          message: '缺少必要的请求参数'
        },
        timestamp: Date.now()
      });
    }

    // 验证设备ID格式
    if (!validateDeviceId(deviceId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_ID',
          message: '设备ID格式不正确'
        },
        timestamp: Date.now()
      });
    }

    // 验证分数范围
    if (score < 0 || score > 999999) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SCORE',
          message: '分数必须在0-999999之间'
        },
        timestamp: Date.now()
      });
    }

    // 使用导入的缓存服务实例

    // API限流检查
    const rateLimitResult = await cacheService.checkRateLimit(deviceId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试'
        },
        timestamp: Date.now()
      });
    }

    // 连接数据库
    await connectDatabase();

    // 提交游戏记录
    const gameService = new GameService();
    const result = await gameService.submitGameRecord({ deviceId, score });

    // 更新缓存
    try {
      // 清除相关缓存
      await cacheService.clearDeviceCaches(deviceId);
      await cacheService.clearRankingCaches();
      
      console.log('缓存更新成功', { deviceId, score });
    } catch (cacheError: any) {
      // 缓存错误不影响主要功能
      console.warn('缓存更新失败', { 
        deviceId, 
        error: cacheError?.message || '未知错误'
      });
    }

    console.log('游戏记录提交成功', {
      deviceId,
      score,
      isNewBest: result.isNewBest,
      bestScore: result.bestScore
    });

    return res.status(200).json({
      success: true,
      data: {
        recordId: result.recordId,
        isNewBest: result.isNewBest,
        bestScore: result.bestScore
      },
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('游戏记录提交失败', { 
      error: error?.message || '未知错误', 
      stack: error?.stack,
      deviceId: req.body?.deviceId,
      score: req.body?.score
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