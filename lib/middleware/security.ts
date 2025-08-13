/**
 * API安全中间件
 * 包含限流、安全头、输入验证等功能
 */

// API请求和响应类型定义
export interface ApiRequest {
  method?: string;
  url?: string;
  headers: { [key: string]: string | string[] | undefined };
  socket: { remoteAddress?: string };
  body?: any;
}

export interface ApiResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): ApiResponse;
  json(body: any): void;
  end(): void;
}
import { cacheService } from '../services/cacheservice';
import { createHash } from 'crypto';

// 安全配置
export const SecurityConfig = {
  // 限流配置
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1分钟窗口
    MAX_REQUESTS: 100,    // 每分钟最大请求数
    BURST_LIMIT: 10,      // 突发限制
    BLOCK_DURATION: 15 * 60 * 1000, // 封禁时长15分钟
  },
  
  // IP白名单（可选）
  IP_WHITELIST: process.env.IP_WHITELIST?.split(',') || [],
  
  // 请求大小限制
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  
  // 安全头配置
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
  
  // CORS配置
  CORS: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
    credentials: false,
  }
} as const;

// 错误类型
export class SecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 429,
    public details?: any
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

// 安全错误码
export const SecurityErrorCodes = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  IP_BLOCKED: 'IP_BLOCKED',
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  CORS_VIOLATION: 'CORS_VIOLATION',
} as const;

/**
 * 获取客户端IP地址
 */
export function getClientIP(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  
  return req.socket.remoteAddress || 'unknown';
}

/**
 * 生成设备指纹
 */
export function generateDeviceFingerprint(req: ApiRequest): string {
  const ip = getClientIP(req);
  const userAgentHeader = req.headers['user-agent'];
  const acceptLanguageHeader = req.headers['accept-language'];
  const acceptEncodingHeader = req.headers['accept-encoding'];
  
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader || '';
  const acceptLanguage = Array.isArray(acceptLanguageHeader) ? acceptLanguageHeader[0] : acceptLanguageHeader || '';
  const acceptEncoding = Array.isArray(acceptEncodingHeader) ? acceptEncodingHeader[0] : acceptEncodingHeader || '';
  
  const fingerprint = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * 验证设备ID格式
 */
export function validateDeviceId(deviceId: string): boolean {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  
  // 32位十六进制字符串
  return /^[a-f0-9]{32}$/i.test(deviceId);
}

/**
 * IP限流中间件
 */
export async function ipRateLimitMiddleware(
  req: ApiRequest,
  res: ApiResponse
): Promise<boolean> {
  const ip = getClientIP(req);
  
  // 检查IP白名单
  if (SecurityConfig.IP_WHITELIST.length > 0 && SecurityConfig.IP_WHITELIST.includes(ip)) {
    return true;
  }
  
  const rateLimitKey = `rate_limit:ip:${ip}`;
  const blockKey = `blocked:ip:${ip}`;
  
  try {
    // 检查是否被封禁
    const isBlocked = await cacheService.get(blockKey);
    if (isBlocked) {
      throw new SecurityError(
        SecurityErrorCodes.IP_BLOCKED,
        'IP地址已被临时封禁',
        429,
        { ip, blockedUntil: isBlocked }
      );
    }
    
    // 检查限流
    const rateLimit = await cacheService.checkRateLimit(
      rateLimitKey,
      SecurityConfig.RATE_LIMIT.MAX_REQUESTS
    );
    
    if (!rateLimit.allowed) {
      // 记录违规行为
      await recordSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', req);
      
      // 如果超过突发限制，临时封禁IP
      const burstKey = `burst:${ip}`;
      const burstCount = await cacheService.get<number>(burstKey) || 0;
      
      if (burstCount >= SecurityConfig.RATE_LIMIT.BURST_LIMIT) {
        const blockUntil = Date.now() + SecurityConfig.RATE_LIMIT.BLOCK_DURATION;
        await cacheService.set(blockKey, blockUntil, SecurityConfig.RATE_LIMIT.BLOCK_DURATION / 1000);
        await cacheService.del(burstKey);
        
        throw new SecurityError(
          SecurityErrorCodes.IP_BLOCKED,
          'IP地址因频繁违规已被临时封禁',
          429,
          { ip, blockedUntil: blockUntil }
        );
      }
      
      await cacheService.set(burstKey, burstCount + 1, 300); // 5分钟窗口
      
      throw new SecurityError(
        SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        '请求频率过高，请稍后重试',
        429,
        { ip, remaining: rateLimit.remaining }
      );
    }
    
    // 设置响应头
    res.setHeader('X-RateLimit-Limit', SecurityConfig.RATE_LIMIT.MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', Date.now() + SecurityConfig.RATE_LIMIT.WINDOW_MS);
    
    return true;
    
  } catch (error) {
    if (error instanceof SecurityError) {
      throw error;
    }
    
    console.error('限流检查失败:', error);
    return true; // 失败时允许通过，避免影响正常用户
  }
}

/**
 * 设备ID限流中间件
 */
export async function deviceRateLimitMiddleware(
  req: ApiRequest,
  res: ApiResponse,
  deviceId: string
): Promise<boolean> {
  if (!validateDeviceId(deviceId)) {
    throw new SecurityError(
      SecurityErrorCodes.INVALID_DEVICE_ID,
      '无效的设备ID格式',
      400,
      { deviceId }
    );
  }
  
  const rateLimitKey = `rate_limit:device:${deviceId}`;
  
  try {
    const rateLimit = await cacheService.checkRateLimit(
      rateLimitKey,
      SecurityConfig.RATE_LIMIT.MAX_REQUESTS
    );
    
    if (!rateLimit.allowed) {
      await recordSuspiciousActivity(deviceId, 'DEVICE_RATE_LIMIT_EXCEEDED', req);
      
      throw new SecurityError(
        SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        '设备请求频率过高，请稍后重试',
        429,
        { deviceId, remaining: rateLimit.remaining }
      );
    }
    
    return true;
    
  } catch (error) {
    if (error instanceof SecurityError) {
      throw error;
    }
    
    console.error('设备限流检查失败:', error);
    return true;
  }
}

/**
 * 记录可疑活动
 */
export async function recordSuspiciousActivity(
  identifier: string,
  activityType: string,
  req: ApiRequest
): Promise<void> {
  const activity = {
    identifier,
    activityType,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
  };
  
  const key = `suspicious:${identifier}:${Date.now()}`;
  await cacheService.set(key, activity, 24 * 60 * 60); // 保存24小时
  
  console.warn('🚨 检测到可疑活动:', activity);
}

/**
 * CORS中间件
 */
export function corsMiddleware(
  req: ApiRequest,
  res: ApiResponse
): boolean {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const { CORS } = SecurityConfig;
  
  // 检查Origin
  if (origin && !CORS.origin.includes(origin)) {
    throw new SecurityError(
      SecurityErrorCodes.CORS_VIOLATION,
      'CORS策略违规',
      403,
      { origin, allowed: CORS.origin }
    );
  }
  
  // 设置CORS头
  if (origin && CORS.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', CORS.methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', CORS.allowedHeaders.join(', '));
  res.setHeader('Access-Control-Allow-Credentials', CORS.credentials.toString());
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // 停止后续处理
  }
  
  return true;
}

/**
 * 安全头中间件
 */
export function securityHeadersMiddleware(
  req: ApiRequest,
  res: ApiResponse
): void {
  Object.entries(SecurityConfig.SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * 请求大小验证中间件
 */
export function requestSizeMiddleware(
  req: ApiRequest
): boolean {
  const contentLengthHeader = req.headers['content-length'];
  const contentLengthStr = Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader;
  const contentLength = parseInt(contentLengthStr || '0', 10);
  
  if (contentLength > SecurityConfig.MAX_REQUEST_SIZE) {
    throw new SecurityError(
      SecurityErrorCodes.REQUEST_TOO_LARGE,
      '请求体过大',
      413,
      { size: contentLength, maxSize: SecurityConfig.MAX_REQUEST_SIZE }
    );
  }
  
  return true;
}

/**
 * 综合安全中间件
 */
export async function securityMiddleware(
  req: ApiRequest,
  res: ApiResponse,
  options: {
    skipRateLimit?: boolean;
    skipCors?: boolean;
    skipSecurityHeaders?: boolean;
    deviceId?: string;
  } = {}
): Promise<boolean> {
  try {
    // 设置安全头
    if (!options.skipSecurityHeaders) {
      securityHeadersMiddleware(req, res);
    }
    
    // CORS检查
    if (!options.skipCors) {
      const corsResult = corsMiddleware(req, res);
      if (!corsResult) {
        return false; // OPTIONS请求已处理
      }
    }
    
    // 请求大小检查
    requestSizeMiddleware(req);
    
    // 限流检查
    if (!options.skipRateLimit) {
      await ipRateLimitMiddleware(req, res);
      
      if (options.deviceId) {
        await deviceRateLimitMiddleware(req, res, options.deviceId);
      }
    }
    
    return true;
    
  } catch (error) {
    if (error instanceof SecurityError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        },
        timestamp: Date.now()
      });
      return false;
    }
    
    // 未知错误
    console.error('安全中间件错误:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SECURITY_ERROR',
        message: '安全检查失败'
      },
      timestamp: Date.now()
    });
    return false;
  }
}

/**
 * 创建安全的API处理器包装器
 */
export function withSecurity(
  handler: (req: ApiRequest, res: ApiResponse) => Promise<void>,
  options?: {
    skipRateLimit?: boolean;
    skipCors?: boolean;
    skipSecurityHeaders?: boolean;
    extractDeviceId?: (req: ApiRequest) => string | undefined;
  }
) {
  return async (req: ApiRequest, res: ApiResponse) => {
    const deviceId = options?.extractDeviceId?.(req);
    
    const securityPassed = await securityMiddleware(req, res, {
      ...options,
      deviceId
    });
    
    if (securityPassed) {
      await handler(req, res);
    }
  };
}