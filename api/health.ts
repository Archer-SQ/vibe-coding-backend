import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../lib/database/connection';
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '../lib/utils/response';
import gameLogger from '../lib/utils/logger';

/**
 * 健康检查API
 * GET /api/health
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 只允许GET请求
    if (req.method !== 'GET') {
      return res.status(405).json(
        createErrorResponse(
          ErrorCodes.INVALID_REQUEST,
          '方法不允许',
          { allowedMethods: ['GET'] },
          requestId
        )
      );
    }

    gameLogger.logApiRequest('GET', '/api/health', undefined, requestId);

    // 检查数据库连接
    let dbStatus = 'disconnected';
    let dbError = null;
    
    try {
      await connectDatabase();
      dbStatus = 'connected';
    } catch (error) {
      dbError = error instanceof Error ? error.message : '未知错误';
      gameLogger.error('数据库连接检查失败', { error: dbError, requestId });
    }

    // 检查环境变量
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      MONGODB_DB_NAME: !!process.env.MONGODB_DB_NAME,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        error: dbError
      },
      environment: envCheck,
      version: '1.0.0',
      requestId
    };

    const duration = Date.now() - startTime;
    gameLogger.logApiResponse('GET', '/api/health', 200, duration, requestId);

    return res.status(200).json(createSuccessResponse(healthData, '服务健康', requestId));

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    gameLogger.error('健康检查失败', { 
      error: errorMessage, 
      requestId,
      duration 
    });

    gameLogger.logApiResponse('GET', '/api/health', 500, duration, requestId);

    return res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        '健康检查失败',
        { error: errorMessage },
        requestId
      )
    );
  }
}