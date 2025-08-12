import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../lib/database/connection';
import { RankingService } from '../../lib/services/rankingService';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '../../lib/utils/response';

const rankingService = new RankingService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('METHOD_NOT_ALLOWED', '只支持GET请求'));
  }

  try {
    // 连接数据库
    await connectDatabase();

    // 获取查询参数
    const { type = 'all' } = req.query;
    
    // 验证排行榜类型
    if (type !== 'all' && type !== 'weekly') {
      return res.status(400).json(createErrorResponse(
        'INVALID_PARAMS',
        '排行榜类型无效，只支持 all 或 weekly'
      ));
    }

    // 获取排行榜数据
    const rankings = await rankingService.getRanking({
      timeRange: type as 'all' | 'weekly'
    });

    const response = {
      type,
      rankings,
      count: rankings.length
    };

    res.status(200).json(createSuccessResponse(response, '排行榜获取成功'));

  } catch (error) {
    res.status(500).json(CommonErrors.internalServerError());
  }
}