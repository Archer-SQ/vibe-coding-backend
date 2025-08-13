import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../lib/database/connection';
import { RankingService } from '../../lib/services/rankingService';
import { cacheService } from '../../lib/services/cacheservice';

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

    // 使用导入的缓存服务实例
    let rankings: any[] = [];
    let cached = false;

    // 尝试从缓存获取排行榜数据
     try {
       const cacheType = type === 'all' ? 'global' : 'weekly';
       const cachedRankings = await cacheService.getRankingCache(cacheType as 'global' | 'weekly');
       
       if (cachedRankings && cachedRankings.length > 0) {
         rankings = cachedRankings.slice(0, limitNum);
         cached = true;
         console.log('从缓存获取排行榜数据', { type, count: rankings.length });
       }
     } catch (cacheError: any) {
       console.warn('缓存读取失败', { error: cacheError?.message });
     }

     // 如果缓存中没有数据，从数据库查询
     if (!cached) {
       // 连接数据库
       await connectDatabase();

       // 获取排行榜数据
        const rankingService = new RankingService();
        rankings = await rankingService.getRanking({ timeRange: type as 'all' | 'weekly' });

       // 缓存排行榜数据
       try {
         const cacheType = type === 'all' ? 'global' : 'weekly';
         await cacheService.setRankingCache(cacheType as 'global' | 'weekly', rankings);
         console.log('排行榜数据已缓存', { type, count: rankings.length });
       } catch (cacheError: any) {
         console.warn('缓存写入失败', { error: cacheError?.message });
       }
     }

    console.log('排行榜查询成功', {
      type,
      limit: limitNum,
      resultCount: rankings.length,
      cached
    });

    return res.status(200).json({
      success: true,
      data: {
        rankings,
        total: rankings.length,
        type: type as string,
        cached
      },
      timestamp: Date.now()
    });

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