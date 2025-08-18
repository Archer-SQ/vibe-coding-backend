import { Request, Response } from 'express';
import { connectDatabase } from '../../lib/database/connection';
import { RankingService } from '../../lib/services/rankingService';

export default async function rankingHandler(
  req: Request,
  res: Response
) {
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
    const { type = 'all', limit = '50' } = req.query;
    
    // 验证排行榜类型
    if (type !== 'all' && type !== 'weekly') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RANKING_TYPE',
          message: '排行榜类型必须是 all 或 weekly'
        },
        timestamp: Date.now()
      });
    }

    // 验证限制数量
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: '限制数量必须在1-100之间'
        },
        timestamp: Date.now()
      });
    }

    // 连接数据库
    await connectDatabase();

    // 直接从数据库获取排行榜数据
    const rankingService = new RankingService();
    const rankings = await rankingService.getRanking({ timeRange: type as 'all' | 'weekly' });
    
    // 应用限制数量
    const limitedRankings = rankings.slice(0, limitNum);

    console.log('排行榜查询成功', {
      type,
      limit: limitNum,
      resultCount: limitedRankings.length
    });

    // 发送响应
    const response = {
      success: true,
      data: {
        rankings: limitedRankings,
        total: limitedRankings.length,
        type: type as string
      },
      timestamp: Date.now()
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('排行榜查询失败', { 
      error: error?.message || '未知错误', 
      stack: error?.stack 
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