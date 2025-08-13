/**
 * MongoDB Atlas监控和告警配置
 * 提供数据库性能监控、告警设置和健康检查功能
 */

// 使用mongoose代替直接的mongodb驱动
import mongoose from 'mongoose';
import { cacheService } from '../lib/services/cacheservice';

// 监控配置
export const MonitoringConfig = {
  // 性能指标阈值
  PERFORMANCE_THRESHOLDS: {
    CONNECTION_TIME_MS: 5000,        // 连接时间阈值
    QUERY_TIME_MS: 1000,             // 查询时间阈值
    MEMORY_USAGE_PERCENT: 80,        // 内存使用率阈值
    CPU_USAGE_PERCENT: 70,           // CPU使用率阈值
    DISK_USAGE_PERCENT: 85,          // 磁盘使用率阈值
    CONNECTION_COUNT: 80,            // 连接数阈值
    OPERATIONS_PER_SECOND: 1000,     // 每秒操作数阈值
    REPLICATION_LAG_MS: 10000        // 复制延迟阈值
  },
  
  // 告警配置
  ALERT_CONFIG: {
    EMAIL_RECIPIENTS: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
    WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
    ALERT_COOLDOWN_MS: 300000,       // 告警冷却时间（5分钟）
    RETRY_ATTEMPTS: 3,               // 重试次数
    RETRY_DELAY_MS: 5000            // 重试延迟
  },
  
  // 监控间隔
  MONITORING_INTERVALS: {
    HEALTH_CHECK_MS: 30000,          // 健康检查间隔（30秒）
    PERFORMANCE_CHECK_MS: 60000,     // 性能检查间隔（1分钟）
    METRICS_COLLECTION_MS: 300000,   // 指标收集间隔（5分钟）
    CLEANUP_INTERVAL_MS: 3600000     // 清理间隔（1小时）
  }
};

// 告警类型
export enum AlertType {
  CONNECTION_FAILURE = 'CONNECTION_FAILURE',
  HIGH_RESPONSE_TIME = 'HIGH_RESPONSE_TIME',
  HIGH_MEMORY_USAGE = 'HIGH_MEMORY_USAGE',
  HIGH_CPU_USAGE = 'HIGH_CPU_USAGE',
  HIGH_DISK_USAGE = 'HIGH_DISK_USAGE',
  HIGH_CONNECTION_COUNT = 'HIGH_CONNECTION_COUNT',
  REPLICATION_LAG = 'REPLICATION_LAG',
  QUERY_PERFORMANCE = 'QUERY_PERFORMANCE'
}

// 监控指标接口
export interface MonitoringMetrics {
  timestamp: Date;
  connectionTime: number;
  activeConnections: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  operationsPerSecond: number;
  replicationLag?: number;
  queryPerformance: {
    averageTime: number;
    slowQueries: number;
  };
}

// 告警信息接口
export interface AlertInfo {
  type: AlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: Partial<MonitoringMetrics>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

/**
 * MongoDB Atlas监控服务
 */
export class MongoAtlasMonitoring {
  private isConnected = false;
  private isMonitoring = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private performanceCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private lastAlerts: Map<AlertType, number> = new Map();
  
  constructor(private connectionUri: string) {}
  
  /**
   * 启动监控
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('监控已在运行中');
      return;
    }
    
    try {
      await this.connect();
      this.isMonitoring = true;
      
      // 启动各种监控任务
      this.startHealthCheck();
      this.startPerformanceCheck();
      this.startMetricsCollection();
      
      console.log('✅ MongoDB Atlas监控已启动');
    } catch (error) {
      console.error('❌ 启动监控失败:', error);
      throw error;
    }
  }
  
  /**
   * 停止监控
   */
  public async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    
    // 清除所有定时器
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    // 断开数据库连接
    await this.disconnect();
    
    console.log('✅ MongoDB Atlas监控已停止');
  }
  
  /**
   * 连接数据库
   */
  private async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(this.connectionUri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
    }
    
    this.isConnected = true;
  }
  
  /**
   * 断开数据库连接
   */
  private async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.isConnected = false;
      // 注意：在Serverless环境中通常不需要手动断开mongoose连接
    }
  }
  
  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('健康检查失败:', error);
        await this.sendAlert({
          type: AlertType.CONNECTION_FAILURE,
          severity: 'CRITICAL',
          message: `数据库连接失败: ${error}`,
          metrics: {},
          timestamp: new Date()
        });
      }
    }, MonitoringConfig.MONITORING_INTERVALS.HEALTH_CHECK_MS);
  }
  
  /**
   * 启动性能检查
   */
  private startPerformanceCheck(): void {
    this.performanceCheckInterval = setInterval(async () => {
      try {
        await this.performPerformanceCheck();
      } catch (error) {
        console.error('性能检查失败:', error);
      }
    }, MonitoringConfig.MONITORING_INTERVALS.PERFORMANCE_CHECK_MS);
  }
  
  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        await this.storeMetrics(metrics);
      } catch (error) {
        console.error('指标收集失败:', error);
      }
    }, MonitoringConfig.MONITORING_INTERVALS.METRICS_COLLECTION_MS);
  }
  
  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('数据库未连接');
    }
    
    const startTime = Date.now();
    
    // 执行简单的ping命令
    if (!mongoose.connection.db) {
      throw new Error('数据库连接不可用');
    }
    await mongoose.connection.db.admin().ping();
    
    const connectionTime = Date.now() - startTime;
    
    // 检查连接时间是否超过阈值
    if (connectionTime > MonitoringConfig.PERFORMANCE_THRESHOLDS.CONNECTION_TIME_MS) {
      await this.sendAlert({
        type: AlertType.HIGH_RESPONSE_TIME,
        severity: 'MEDIUM',
        message: `数据库响应时间过长: ${connectionTime}ms`,
        metrics: { connectionTime, timestamp: new Date() },
        timestamp: new Date()
      });
    }
    
    return true;
  }
  
  /**
   * 执行性能检查
   */
  private async performPerformanceCheck(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    try {
      // 获取数据库统计信息
      if (!mongoose.connection.db) {
        throw new Error('数据库连接不可用');
      }
      const stats = await mongoose.connection.db.stats();
      
      // 检查内存使用率
      if (stats.indexSize && stats.dataSize) {
        const totalSize = stats.indexSize + stats.dataSize;
        const memoryUsagePercent = (totalSize / (1024 * 1024 * 1024)) * 100; // 转换为GB
        
        if (memoryUsagePercent > MonitoringConfig.PERFORMANCE_THRESHOLDS.MEMORY_USAGE_PERCENT) {
          await this.sendAlert({
            type: AlertType.HIGH_MEMORY_USAGE,
            severity: 'HIGH',
            message: `内存使用率过高: ${memoryUsagePercent.toFixed(2)}%`,
            metrics: {
              memoryUsage: {
                used: totalSize,
                available: 0,
                percentage: memoryUsagePercent
              },
              timestamp: new Date()
            },
            timestamp: new Date()
          });
        }
      }
      
      // 检查慢查询
      await this.checkSlowQueries();
      
    } catch (error) {
      console.error('性能检查执行失败:', error);
    }
  }
  
  /**
   * 检查慢查询
   */
  private async checkSlowQueries(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    try {
      // 获取当前操作
      if (!mongoose.connection.db) {
        return;
      }
      const currentOps = await mongoose.connection.db.admin().command({ currentOp: 1 });
      
      if (currentOps.inprog) {
        const slowOps = currentOps.inprog.filter((op: any) => 
          op.secs_running > (MonitoringConfig.PERFORMANCE_THRESHOLDS.QUERY_TIME_MS / 1000)
        );
        
        if (slowOps.length > 0) {
          await this.sendAlert({
            type: AlertType.QUERY_PERFORMANCE,
            severity: 'MEDIUM',
            message: `检测到 ${slowOps.length} 个慢查询`,
            metrics: {
              queryPerformance: {
                averageTime: slowOps.reduce((sum: number, op: any) => sum + op.secs_running, 0) / slowOps.length * 1000,
                slowQueries: slowOps.length
              },
              timestamp: new Date()
            },
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('慢查询检查失败:', error);
    }
  }
  
  /**
   * 收集监控指标
   */
  private async collectMetrics(): Promise<MonitoringMetrics> {
    if (!this.isConnected) {
      throw new Error('数据库未连接');
    }
    
    const startTime = Date.now();
    
    if (!mongoose.connection.db) {
      throw new Error('数据库连接不可用');
    }
    
    await mongoose.connection.db.admin().ping();
    const connectionTime = Date.now() - startTime;
    
    // 获取数据库统计信息
    const stats = await mongoose.connection.db.stats();
    
    // 获取服务器状态
    const serverStatus = await mongoose.connection.db.admin().command({ serverStatus: 1 });
    
    const metrics: MonitoringMetrics = {
      timestamp: new Date(),
      connectionTime,
      activeConnections: serverStatus.connections?.current || 0,
      memoryUsage: {
        used: stats.dataSize + stats.indexSize,
        available: 0,
        percentage: 0
      },
      cpuUsage: 0,
      diskUsage: {
        used: stats.storageSize || 0,
        total: 0,
        percentage: 0
      },
      operationsPerSecond: serverStatus.opcounters ? 
        Object.values(serverStatus.opcounters).reduce((sum: number, count: any) => sum + count, 0) : 0,
      queryPerformance: {
        averageTime: connectionTime,
        slowQueries: 0
      }
    };
    
    return metrics;
  }
  
  /**
   * 存储监控指标
   */
  private async storeMetrics(metrics: MonitoringMetrics): Promise<void> {
    try {
      // 存储到缓存中，保留24小时
      const cacheKey = `monitoring:metrics:${Date.now()}`;
      await cacheService.set(cacheKey, JSON.stringify(metrics), 24 * 60 * 60);
      
      // 清理旧的指标数据
      await this.cleanupOldMetrics();
      
    } catch (error) {
      console.error('存储监控指标失败:', error);
    }
  }
  
  /**
   * 清理旧的指标数据
   */
  private async cleanupOldMetrics(): Promise<void> {
    try {
      // 这里可以实现清理逻辑，删除超过一定时间的指标数据
      // 由于使用Redis TTL，数据会自动过期，这里可以做额外的清理工作
    } catch (error) {
      console.error('清理旧指标数据失败:', error);
    }
  }
  
  /**
   * 发送告警
   */
  private async sendAlert(alert: AlertInfo): Promise<void> {
    try {
      // 检查告警冷却时间
      const lastAlertTime = this.lastAlerts.get(alert.type) || 0;
      const now = Date.now();
      
      if (now - lastAlertTime < MonitoringConfig.ALERT_CONFIG.ALERT_COOLDOWN_MS) {
        return; // 在冷却时间内，跳过告警
      }
      
      // 更新最后告警时间
      this.lastAlerts.set(alert.type, now);
      
      // 存储告警信息
      const alertKey = `alert:${alert.type}:${now}`;
      await cacheService.set(alertKey, JSON.stringify(alert), 7 * 24 * 60 * 60); // 保留7天
      
      // 发送告警通知
      await this.sendAlertNotification(alert);
      
      console.log(`🚨 发送告警: ${alert.type} - ${alert.message}`);
      
    } catch (error) {
      console.error('发送告警失败:', error);
    }
  }
  
  /**
   * 发送告警通知
   */
  private async sendAlertNotification(alert: AlertInfo): Promise<void> {
    const { ALERT_CONFIG } = MonitoringConfig;
    
    // 构建告警消息
    const alertMessage = {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      metrics: alert.metrics,
      environment: process.env.NODE_ENV || 'development'
    };
    
    // 发送到Webhook（如果配置了）
    if (ALERT_CONFIG.WEBHOOK_URL) {
      try {
        const response = await fetch(ALERT_CONFIG.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(alertMessage)
        });
        
        if (!response.ok) {
          throw new Error(`Webhook响应错误: ${response.status}`);
        }
      } catch (error) {
        console.error('发送Webhook告警失败:', error);
      }
    }
    
    // 这里可以添加其他通知方式，如邮件、短信等
  }
  
  /**
   * 获取监控指标历史
   */
  public async getMetricsHistory(hours: number = 24): Promise<MonitoringMetrics[]> {
    try {
      // 这里可以实现从缓存或数据库中获取历史指标数据
      // 由于示例中使用Redis，可以通过模式匹配获取相关键
      console.log(`获取最近${hours}小时的监控指标`);
      return [];
    } catch (error) {
      console.error('获取监控指标历史失败:', error);
      return [];
    }
  }
  
  /**
   * 获取告警历史
   */
  public async getAlertHistory(hours: number = 24): Promise<AlertInfo[]> {
    try {
      // 这里可以实现从缓存中获取告警历史
      console.log(`获取最近${hours}小时的告警历史`);
      return [];
    } catch (error) {
      console.error('获取告警历史失败:', error);
      return [];
    }
  }
}

// 创建全局监控实例
export const mongoAtlasMonitoring = new MongoAtlasMonitoring(
  process.env.MONGODB_URI || ''
);

// 导出监控启动函数
export async function startMonitoring(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    await mongoAtlasMonitoring.startMonitoring();
  }
}

// 导出监控停止函数
export async function stopMonitoring(): Promise<void> {
  await mongoAtlasMonitoring.stopMonitoring();
}