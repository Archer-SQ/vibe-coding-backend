import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../lib/database/connection';
import { GameService } from '../../lib/services/gameService';
import { validateGameRecordSubmission } from '../../lib/utils/validation';
import { createSuccessResponse, createErrorResponse, ErrorCodes, CommonErrors } from '../../lib/utils/response';

const gameService = new GameService();

/**
 * 提交游戏成绩API
 * POST /api/game/submit
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = `submit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 只允许POST请求
    if (req.method !== 'POST') {
      return res.status(405).json(
        createErrorResponse(
          ErrorCodes.INVALID_REQUEST,
          '方法不允许',
          { allowedMethods: ['POST'] },
          requestId
        )
      );
    }

    // 验证请求数据
    const validation = validateGameRecordSubmission(req.body);
    if (!validation.success) {
      return res.status(400).json(
        CommonErrors.validationError(validation.error || '数据验证失败', requestId)
      );
    }

    const { deviceId, score } = validation.data!;

    // 连接数据库
    await connectDatabase();

    // 提交游戏记录
    const result = await gameService.submitGameRecord({ deviceId, score });

    return res.status(200).json(
      createSuccessResponse(result, '游戏记录提交成功', requestId)
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return res.status(500).json(
      CommonErrors.internalServerError(requestId)
    );
  }
}