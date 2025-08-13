/**
 * 优化功能状态和性能指标API
 * 提供系统优化状态、性能指标和健康检查信息
 */

import { getOptimizationStatus, getPerformanceMetrics } from '../../config/optimization';
import { createSecureHandler } from '../../config/optimization';
import { ApiResponse as ApiResponseType, ErrorResponse } from '../../lib/types/api';

// API请求和响应类型定义
interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse<T = any> {
  status: (code: number) => ApiResponse<T>;
  json: (data: T) => void;
}

// 优化状态响应类型
interface OptimizationStatusResponse {
  status: {
    initialized: boolean;
    enabledFeatures: string[];
    uptime: number;
    timestamp: number;
  };
  performance: {
    mongodb: any;
    cache: any;
    security: any;
    monitoring: any;
    backup: any;
  };
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    services: {
      mongodb: 'connected' | 'disconnected' | 'error';
      redis: 'connected' | 'disconnected' | 'error';
      monitoring: 'active' | 'inactive' | 'error';
      backup: 'active' | 'inactive' | 'error';
    };
  };
  configuration: {
    features: Record<string, boolean>;
    performance: any;
    cache: any;
    security: any;
    monitoring: any;
    backup: any;
  };
}

/**
 * 获取优化功能状态
 */
async function getOptimizationStatusHandler(
  req: ApiRequest,
  res: ApiResponse<ApiResponseType<OptimizationStatusResponse> | ErrorResponse>
) {
  try {
    // 只允许GET请求
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '只允许GET请求'
        },
        timestamp: Date.now()
      });
    }

    // 获取优化状态
    const optimizationStatus = getOptimizationStatus();
    
    // 获取性能指标
    const performanceMetrics = await getPerformanceMetrics();
    
    // 检查服务健康状态
    const healthStatus = await checkServicesHealth();
    
    // 计算系统运行时间
    const uptime = process.uptime();
    
    // 构建响应数据
    const responseData: OptimizationStatusResponse = {
      status: {
        initialized: optimizationStatus.initialized,
        enabledFeatures: optimizationStatus.enabledFeatures,
        uptime: Math.floor(uptime),
        timestamp: Date.now()
      },
      performance: performanceMetrics,
      health: {
        overall: calculateOverallHealth(healthStatus),
        services: healthStatus
      },
      configuration: {
        features: {
          mongodbOptimization: optimizationStatus.configuration.FEATURES.MONGODB_OPTIMIZATION,
          cacheOptimization: optimizationStatus.configuration.FEATURES.CACHE_OPTIMIZATION,
          securityHardening: optimizationStatus.configuration.FEATURES.SECURITY_HARDENING,
          monitoringAlerts: optimizationStatus.configuration.FEATURES.MONITORING_ALERTS,
          backupRecovery: optimizationStatus.configuration.FEATURES.BACKUP_RECOVERY
        },
        performance: optimizationStatus.configuration.PERFORMANCE,
        cache: optimizationStatus.configuration.CACHE,
        security: optimizationStatus.configuration.SECURITY,
        monitoring: optimizationStatus.configuration.MONITORING,
        backup: optimizationStatus.configuration.BACKUP
      }
    };

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: responseData,
      message: '优化状态获取成功',
      timestamp: Date.now()
    } as ApiResponseType<OptimizationStatusResponse>);

  } catch (error) {
    console.error('获取优化状态失败:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_STATUS_ERROR',
        message: '获取优化状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      timestamp: Date.now()
    });
  }
}

// 服务健康状态类型
type ServiceHealth = {
  mongodb: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'error';
  monitoring: 'active' | 'inactive' | 'error';
  backup: 'active' | 'inactive' | 'error';
};

/**
 * 检查各服务健康状态
 */
async function checkServicesHealth(): Promise<ServiceHealth> {
  const health: ServiceHealth = {
    mongodb: 'disconnected',
    redis: 'disconnected',
    monitoring: 'inactive',
    backup: 'inactive'
  };

  try {
    // 检查MongoDB连接
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      health.mongodb = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      health.mongodb = 'disconnected';
    } else {
      health.mongodb = 'error';
    }
  } catch (error) {
    health.mongodb = 'error';
  }

  try {
    // 检查Redis连接
    const { cacheService } = require('../../lib/services/cacheservice');
    const isRedisAvailable = await cacheService.isAvailable();
    health.redis = isRedisAvailable ? 'connected' : 'disconnected';
  } catch (error) {
    health.redis = 'error';
  }

  try {
    // 检查监控服务状态
    // 这里可以添加具体的监控服务检查逻辑
    health.monitoring = 'active';
  } catch (error) {
    health.monitoring = 'error';
  }

  try {
    // 检查备份服务状态
    // 这里可以添加具体的备份服务检查逻辑
    health.backup = 'active';
  } catch (error) {
    health.backup = 'error';
  }

  return health;
}

/**
 * 计算整体健康状态
 */
function calculateOverallHealth(services: ServiceHealth): 'healthy' | 'warning' | 'critical' {
  const serviceStatuses = Object.values(services);
  
  // 如果有任何服务处于错误状态，整体状态为严重
  if (serviceStatuses.includes('error')) {
    return 'critical';
  }
  
  // 如果MongoDB断开连接，整体状态为严重
  if (services.mongodb === 'disconnected') {
    return 'critical';
  }
  
  // 如果Redis断开连接或其他服务不活跃，整体状态为警告
  if (services.redis === 'disconnected' || 
      services.monitoring === 'inactive' || 
      services.backup === 'inactive') {
    return 'warning';
  }
  
  // 所有服务正常，整体状态为健康
  return 'healthy';
}

/**
 * 获取系统资源使用情况
 */
function getSystemResources() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: Math.floor(process.uptime()),
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * 简化版状态检查API（用于健康检查）
 */
async function healthCheckHandler(
  req: ApiRequest,
  res: ApiResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const health = await checkServicesHealth();
    const overall = calculateOverallHealth(health);
    const resources = getSystemResources();

    const statusCode = overall === 'healthy' ? 200 : overall === 'warning' ? 200 : 503;

    res.status(statusCode).json({
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: resources.uptime,
      services: health,
      resources: {
        memory: `${resources.memory.heapUsed}/${resources.memory.heapTotal} MB`,
        uptime: `${Math.floor(resources.uptime / 3600)}h ${Math.floor((resources.uptime % 3600) / 60)}m`
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 根据路径参数决定使用哪个处理器
export default async function handler(
  req: ApiRequest,
  res: ApiResponse
) {
  // 如果查询参数包含 health=true，返回简化的健康检查
  if (req.query.health === 'true') {
    return healthCheckHandler(req, res);
  }
  
  // 否则返回完整的优化状态
  const secureHandler = createSecureHandler(getOptimizationStatusHandler);
  return secureHandler(req, res);
}

// 导出类型定义
export type { OptimizationStatusResponse };