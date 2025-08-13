import winston from 'winston';

// 日志级别
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 创建Winston logger实例
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vibe-coding-backend' },
  transports: [
    // 控制台输出
    new winston.transports.Console()
  ]
});

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

/**
 * 日志记录器接口
 */
export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

/**
 * 游戏API专用日志记录器
 */
class GameLogger implements Logger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  error(message: string, meta?: any): void {
    this.winston.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  /**
   * 记录API请求
   */
  logApiRequest(method: string, path: string, deviceId?: string, requestId?: string): void {
    this.info('API请求', {
      method,
      path,
      deviceId,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录API响应
   */
  logApiResponse(method: string, path: string, statusCode: number, duration: number, requestId?: string): void {
    this.info('API响应', {
      method,
      path,
      statusCode,
      duration,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录数据库操作
   */
  logDatabaseOperation(operation: string, collection: string, duration?: number, error?: Error): void {
    if (error) {
      this.error('数据库操作失败', {
        operation,
        collection,
        duration,
        error: error.message,
        stack: error.stack
      });
    } else {
      this.debug('数据库操作', {
        operation,
        collection,
        duration
      });
    }
  }

  /**
   * 记录缓存操作
   */
  logCacheOperation(operation: string, key: string, hit?: boolean, duration?: number): void {
    this.debug('缓存操作', {
      operation,
      key,
      hit,
      duration
    });
  }

  /**
   * 记录游戏事件
   */
  logGameEvent(event: string, deviceId: string, data?: any): void {
    this.info('游戏事件', {
      event,
      deviceId,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// 导出默认日志记录器实例
export const gameLogger = new GameLogger(logger);

// 导出原始winston实例（如果需要）
export { logger as winstonLogger };

export default gameLogger;