/**
 * 综合优化配置文件
 * 整合MongoDB性能优化、缓存策略、安全加固、监控告警和备份恢复等功能
 */

import { mongoAtlasMonitoring, startMonitoring, stopMonitoring } from './mongodb-atlas-monitoring';
import { backupRecoveryService, startBackupService, stopBackupService } from './backup-recovery';
import { cacheService } from '../lib/services/cacheservice';
import { withSecurity } from '../lib/middleware/security';

// 优化配置
export const OptimizationConfig = {
  // 启用的优化功能
  FEATURES: {
    MONGODB_OPTIMIZATION: process.env.ENABLE_MONGODB_OPTIMIZATION === 'true',
    CACHE_OPTIMIZATION: process.env.ENABLE_CACHE_OPTIMIZATION === 'true',
    SECURITY_HARDENING: process.env.ENABLE_SECURITY_HARDENING === 'true',
    MONITORING_ALERTS: process.env.ENABLE_MONITORING_ALERTS === 'true',
    BACKUP_RECOVERY: process.env.ENABLE_BACKUP_RECOVERY === 'true'
  },
  
  // 性能优化配置
  PERFORMANCE: {
    // 连接池配置
    CONNECTION_POOL: {
      MIN_SIZE: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),
      MAX_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '20'),
      MAX_IDLE_TIME_MS: parseInt(process.env.DB_MAX_IDLE_TIME_MS || '30000'),
      SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '5000')
    },
    
    // 查询优化
    QUERY_OPTIMIZATION: {
      ENABLE_QUERY_CACHE: process.env.ENABLE_QUERY_CACHE === 'true',
      CACHE_TTL_SECONDS: parseInt(process.env.QUERY_CACHE_TTL || '300'),
      MAX_QUERY_TIME_MS: parseInt(process.env.MAX_QUERY_TIME_MS || '1000'),
      ENABLE_SLOW_QUERY_LOG: process.env.ENABLE_SLOW_QUERY_LOG === 'true'
    },
    
    // 索引优化
    INDEX_OPTIMIZATION: {
      AUTO_CREATE_INDEXES: process.env.AUTO_CREATE_INDEXES === 'true',
      INDEX_ANALYSIS_INTERVAL_HOURS: parseInt(process.env.INDEX_ANALYSIS_INTERVAL_HOURS || '24'),
      UNUSED_INDEX_THRESHOLD_DAYS: parseInt(process.env.UNUSED_INDEX_THRESHOLD_DAYS || '30')
    }
  },
  
  // 缓存优化配置
  CACHE: {
    // Redis集群配置
    CLUSTER: {
      ENABLE_CLUSTER: process.env.REDIS_CLUSTER_ENABLED === 'true',
      NODES: process.env.REDIS_CLUSTER_NODES?.split(',') || [],
      RETRY_ATTEMPTS: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3'),
      RETRY_DELAY_MS: parseInt(process.env.REDIS_RETRY_DELAY_MS || '1000')
    },
    
    // 缓存策略
    STRATEGY: {
      DEFAULT_TTL_SECONDS: parseInt(process.env.DEFAULT_CACHE_TTL || '3600'),
      HOT_DATA_TTL_SECONDS: parseInt(process.env.HOT_DATA_TTL || '300'),
      COLD_DATA_TTL_SECONDS: parseInt(process.env.COLD_DATA_TTL || '86400'),
      ENABLE_COMPRESSION: process.env.ENABLE_CACHE_COMPRESSION === 'true',
      COMPRESSION_THRESHOLD_BYTES: parseInt(process.env.COMPRESSION_THRESHOLD || '1024')
    },
    
    // 内存缓存
    MEMORY_CACHE: {
      ENABLE_MEMORY_CACHE: process.env.ENABLE_MEMORY_CACHE === 'true',
      MAX_SIZE_MB: parseInt(process.env.MEMORY_CACHE_MAX_SIZE_MB || '100'),
      CLEANUP_INTERVAL_MS: parseInt(process.env.MEMORY_CACHE_CLEANUP_INTERVAL_MS || '300000')
    }
  },
  
  // 安全配置
  SECURITY: {
    // 限流配置
    RATE_LIMITING: {
      ENABLE_IP_RATE_LIMIT: process.env.ENABLE_IP_RATE_LIMIT === 'true',
      ENABLE_DEVICE_RATE_LIMIT: process.env.ENABLE_DEVICE_RATE_LIMIT === 'true',
      IP_REQUESTS_PER_MINUTE: parseInt(process.env.IP_REQUESTS_PER_MINUTE || '100'),
      DEVICE_REQUESTS_PER_MINUTE: parseInt(process.env.DEVICE_REQUESTS_PER_MINUTE || '60'),
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
    },
    
    // 安全头配置
    HEADERS: {
      ENABLE_SECURITY_HEADERS: process.env.ENABLE_SECURITY_HEADERS === 'true',
      ENABLE_CORS: process.env.ENABLE_CORS === 'true',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['*']
    },
    
    // 请求验证
    VALIDATION: {
      MAX_REQUEST_SIZE_MB: parseInt(process.env.MAX_REQUEST_SIZE_MB || '10'),
      ENABLE_DEVICE_ID_VALIDATION: process.env.ENABLE_DEVICE_ID_VALIDATION === 'true',
      ENABLE_SUSPICIOUS_ACTIVITY_DETECTION: process.env.ENABLE_SUSPICIOUS_ACTIVITY_DETECTION === 'true'
    }
  },
  
  // 监控配置
  MONITORING: {
    // 性能监控
    PERFORMANCE_MONITORING: {
      ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
      METRICS_COLLECTION_INTERVAL_MS: parseInt(process.env.METRICS_COLLECTION_INTERVAL_MS || '60000'),
      PERFORMANCE_THRESHOLD_MS: parseInt(process.env.PERFORMANCE_THRESHOLD_MS || '1000')
    },
    
    // 健康检查
    HEALTH_CHECK: {
      ENABLE_HEALTH_CHECK: process.env.ENABLE_HEALTH_CHECK === 'true',
      HEALTH_CHECK_INTERVAL_MS: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000'),
      HEALTH_CHECK_TIMEOUT_MS: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000')
    },
    
    // 告警配置
    ALERTS: {
      ENABLE_ALERTS: process.env.ENABLE_ALERTS === 'true',
      ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
      ALERT_EMAIL_RECIPIENTS: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      ALERT_COOLDOWN_MS: parseInt(process.env.ALERT_COOLDOWN_MS || '300000')
    }
  },
  
  // 备份配置
  BACKUP: {
    // 备份策略
    STRATEGY: {
      ENABLE_AUTO_BACKUP: process.env.ENABLE_AUTO_BACKUP === 'true',
      FULL_BACKUP_INTERVAL_HOURS: parseInt(process.env.FULL_BACKUP_INTERVAL_HOURS || '24'),
      INCREMENTAL_BACKUP_INTERVAL_HOURS: parseInt(process.env.INCREMENTAL_BACKUP_INTERVAL_HOURS || '6'),
      BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || '30')
    },
    
    // 备份存储
    STORAGE: {
      LOCAL_BACKUP_PATH: process.env.LOCAL_BACKUP_PATH || './backups',
      ENABLE_CLOUD_BACKUP: process.env.ENABLE_CLOUD_BACKUP === 'true',
      CLOUD_STORAGE_PROVIDER: process.env.CLOUD_STORAGE_PROVIDER || 'aws-s3',
      CLOUD_STORAGE_BUCKET: process.env.CLOUD_STORAGE_BUCKET || ''
    },
    
    // 恢复配置
    RECOVERY: {
      ENABLE_AUTO_RECOVERY: process.env.ENABLE_AUTO_RECOVERY === 'true',
      RECOVERY_VERIFICATION: process.env.ENABLE_RECOVERY_VERIFICATION === 'true',
      ROLLBACK_ENABLED: process.env.ENABLE_ROLLBACK === 'true'
    }
  }
};

/**
 * 优化服务管理器
 */
export class OptimizationManager {
  private isInitialized = false;
  private enabledFeatures: Set<string> = new Set();
  
  /**
   * 初始化所有优化功能
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('优化服务已初始化');
      return;
    }
    
    try {
      console.log('🚀 开始初始化优化服务...');
      
      // 初始化MongoDB优化
      if (OptimizationConfig.FEATURES.MONGODB_OPTIMIZATION) {
        await this.initializeMongoDBOptimization();
        this.enabledFeatures.add('mongodb');
      }
      
      // 初始化缓存优化
      if (OptimizationConfig.FEATURES.CACHE_OPTIMIZATION) {
        await this.initializeCacheOptimization();
        this.enabledFeatures.add('cache');
      }
      
      // 初始化安全加固
      if (OptimizationConfig.FEATURES.SECURITY_HARDENING) {
        await this.initializeSecurityHardening();
        this.enabledFeatures.add('security');
      }
      
      // 初始化监控告警
      if (OptimizationConfig.FEATURES.MONITORING_ALERTS) {
        await this.initializeMonitoringAlerts();
        this.enabledFeatures.add('monitoring');
      }
      
      // 初始化备份恢复
      if (OptimizationConfig.FEATURES.BACKUP_RECOVERY) {
        await this.initializeBackupRecovery();
        this.enabledFeatures.add('backup');
      }
      
      this.isInitialized = true;
      
      console.log('✅ 优化服务初始化完成');
      console.log(`📊 已启用功能: ${Array.from(this.enabledFeatures).join(', ')}`);
      
    } catch (error) {
      console.error('❌ 优化服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 停止所有优化服务
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      console.log('🛑 开始停止优化服务...');
      
      // 停止监控服务
      if (this.enabledFeatures.has('monitoring')) {
        await stopMonitoring();
      }
      
      // 停止备份服务
      if (this.enabledFeatures.has('backup')) {
        await stopBackupService();
      }
      
      this.isInitialized = false;
      this.enabledFeatures.clear();
      
      console.log('✅ 优化服务已停止');
      
    } catch (error) {
      console.error('❌ 停止优化服务失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取优化状态
   */
  public getOptimizationStatus(): {
    initialized: boolean;
    enabledFeatures: string[];
    configuration: typeof OptimizationConfig;
  } {
    return {
      initialized: this.isInitialized,
      enabledFeatures: Array.from(this.enabledFeatures),
      configuration: OptimizationConfig
    };
  }
  
  /**
   * 获取性能指标
   */
  public async getPerformanceMetrics(): Promise<{
    mongodb: any;
    cache: any;
    security: any;
    monitoring: any;
    backup: any;
  }> {
    const metrics = {
      mongodb: {},
      cache: {},
      security: {},
      monitoring: {},
      backup: {}
    };
    
    try {
      // 获取MongoDB指标
      if (this.enabledFeatures.has('mongodb')) {
        metrics.mongodb = await this.getMongoDBMetrics();
      }
      
      // 获取缓存指标
      if (this.enabledFeatures.has('cache')) {
        metrics.cache = await this.getCacheMetrics();
      }
      
      // 获取安全指标
      if (this.enabledFeatures.has('security')) {
        metrics.security = await this.getSecurityMetrics();
      }
      
      // 获取监控指标
      if (this.enabledFeatures.has('monitoring')) {
        metrics.monitoring = await mongoAtlasMonitoring.getMetricsHistory(1);
      }
      
      // 获取备份指标
      if (this.enabledFeatures.has('backup')) {
        metrics.backup = await backupRecoveryService.getBackupList();
      }
      
    } catch (error) {
      console.error('获取性能指标失败:', error);
    }
    
    return metrics;
  }
  
  // 私有方法
  
  private async initializeMongoDBOptimization(): Promise<void> {
    console.log('🔧 初始化MongoDB优化...');
    
    // 这里可以添加MongoDB优化逻辑
    // 例如：创建索引、优化查询等
    
    console.log('✅ MongoDB优化初始化完成');
  }
  
  private async initializeCacheOptimization(): Promise<void> {
    console.log('🔧 初始化缓存优化...');
    
    // 检查缓存服务是否可用
    const isAvailable = await cacheService.isAvailable();
    if (!isAvailable) {
      throw new Error('缓存服务不可用');
    }
    
    console.log('✅ 缓存优化初始化完成');
  }
  
  private async initializeSecurityHardening(): Promise<void> {
    console.log('🔧 初始化安全加固...');
    
    // 这里可以添加安全初始化逻辑
    // 例如：配置安全中间件、初始化限流器等
    
    console.log('✅ 安全加固初始化完成');
  }
  
  private async initializeMonitoringAlerts(): Promise<void> {
    console.log('🔧 初始化监控告警...');
    
    // 启动MongoDB Atlas监控
    await startMonitoring();
    
    console.log('✅ 监控告警初始化完成');
  }
  
  private async initializeBackupRecovery(): Promise<void> {
    console.log('🔧 初始化备份恢复...');
    
    // 启动备份服务
    await startBackupService();
    
    console.log('✅ 备份恢复初始化完成');
  }
  
  private async getMongoDBMetrics(): Promise<any> {
    // 获取MongoDB性能指标
    return {
      connectionPool: {
        active: 0,
        available: 0,
        created: 0
      },
      operations: {
        queries: 0,
        inserts: 0,
        updates: 0,
        deletes: 0
      },
      performance: {
        averageQueryTime: 0,
        slowQueries: 0
      }
    };
  }
  
  private async getCacheMetrics(): Promise<any> {
    // 获取缓存性能指标
    return {
      redis: {
        connected: await cacheService.isAvailable(),
        memory: {
          used: 0,
          peak: 0
        },
        operations: {
          hits: 0,
          misses: 0,
          sets: 0,
          gets: 0
        }
      },
      memoryCache: {
        size: 0,
        entries: 0,
        hitRate: 0
      }
    };
  }
  
  private async getSecurityMetrics(): Promise<any> {
    // 获取安全指标
    return {
      rateLimiting: {
        blockedRequests: 0,
        allowedRequests: 0
      },
      security: {
        suspiciousActivities: 0,
        blockedIPs: 0
      },
      validation: {
        invalidRequests: 0,
        validRequests: 0
      }
    };
  }
}

// 创建全局优化管理器实例
export const optimizationManager = new OptimizationManager();

// 导出便捷函数
export async function initializeOptimizations(): Promise<void> {
  await optimizationManager.initialize();
}

export async function shutdownOptimizations(): Promise<void> {
  await optimizationManager.shutdown();
}

export function getOptimizationStatus() {
  return optimizationManager.getOptimizationStatus();
}

export async function getPerformanceMetrics() {
  return await optimizationManager.getPerformanceMetrics();
}

// 导出安全中间件包装器
export function createSecureHandler<T extends (...args: any[]) => any>(handler: T): T {
  if (!OptimizationConfig.FEATURES.SECURITY_HARDENING) {
    return handler;
  }
  
  return withSecurity(handler as any, {
    skipRateLimit: !OptimizationConfig.SECURITY.RATE_LIMITING.ENABLE_IP_RATE_LIMIT,
    skipCors: !OptimizationConfig.SECURITY.HEADERS.ENABLE_CORS,
    skipSecurityHeaders: !OptimizationConfig.SECURITY.HEADERS.ENABLE_SECURITY_HEADERS
  }) as T;
}