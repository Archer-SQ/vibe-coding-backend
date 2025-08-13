import { Redis } from '@upstash/redis';

// 缓存键命名规范
export const CacheKeys = {
  // 排行榜缓存 (TTL: 5分钟)
  RANKING_GLOBAL: 'ranking:global',
  RANKING_WEEKLY: 'ranking:weekly',
  
  // 设备统计缓存 (TTL: 1小时)
  DEVICE_STATS: (deviceId: string) => `stats:${deviceId}`,
  
  // 设备排名缓存 (TTL: 10分钟)
  DEVICE_RANK: (deviceId: string) => `rank:${deviceId}`,
  
  // API限流缓存 (TTL: 1分钟)
  RATE_LIMIT: (deviceId: string) => `limit:${deviceId}`,
} as const;

// 缓存TTL配置（秒）
export const CacheTTL = {
  RANKING: 300,        // 5分钟
  DEVICE_STATS: 3600,  // 1小时
  DEVICE_RANK: 600,    // 10分钟
  RATE_LIMIT: 60,      // 1分钟
} as const;

export class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * 初始化Redis连接
   */
  private initializeRedis(): void {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.isEnabled = true;
        console.log('Redis缓存服务初始化成功');
      } else {
        console.warn('Redis配置未找到，缓存功能已禁用');
        this.isEnabled = false;
      }
    } catch (error) {
      console.error('Redis初始化失败:', error);
      this.isEnabled = false;
    }
  }

  /**
   * 检查缓存是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled && this.redis !== null;
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const startTime = Date.now();
      const data = await this.redis!.get(key);
      const duration = Date.now() - startTime;
      
      console.log(`缓存操作 GET [${key}] - 成功: ${data !== null}, 耗时: ${duration}ms`);
      
      return data as T;
    } catch (error) {
      console.error(`缓存获取失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const startTime = Date.now();
      
      if (ttl) {
        await this.redis!.setex(key, ttl, JSON.stringify(value));
      } else {
        await this.redis!.set(key, JSON.stringify(value));
      }
      
      const duration = Date.now() - startTime;
      console.log(`缓存操作 SET [${key}] - 成功: true, 耗时: ${duration}ms`);
      
      return true;
    } catch (error) {
      console.error(`缓存设置失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 删除缓存数据
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const startTime = Date.now();
      await this.redis!.del(key);
      const duration = Date.now() - startTime;
      
      console.log(`缓存操作 DEL [${key}] - 成功: true, 耗时: ${duration}ms`);
      
      return true;
    } catch (error) {
      console.error(`缓存删除失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存（支持模式匹配）
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // 注意：Upstash Redis 可能不支持 KEYS 命令
      // 这里提供一个基础实现，实际使用时可能需要调整
      console.warn(`批量删除缓存模式 [${pattern}] - 请确认Upstash支持此操作`);
      return true;
    } catch (error) {
      console.error(`批量删除缓存失败 [${pattern}]:`, error);
      return false;
    }
  }

  /**
   * 获取排行榜缓存
   */
  async getRankingCache(type: 'global' | 'weekly'): Promise<any[] | null> {
    const key = type === 'global' ? CacheKeys.RANKING_GLOBAL : CacheKeys.RANKING_WEEKLY;
    return this.get<any[]>(key);
  }

  /**
   * 设置排行榜缓存
   */
  async setRankingCache(type: 'global' | 'weekly', data: any[]): Promise<boolean> {
    const key = type === 'global' ? CacheKeys.RANKING_GLOBAL : CacheKeys.RANKING_WEEKLY;
    return this.set(key, data, CacheTTL.RANKING);
  }

  /**
   * 获取设备统计缓存
   */
  async getDeviceStatsCache(deviceId: string): Promise<any | null> {
    const key = CacheKeys.DEVICE_STATS(deviceId);
    return this.get<any>(key);
  }

  /**
   * 设置设备统计缓存
   */
  async setDeviceStatsCache(deviceId: string, data: any): Promise<boolean> {
    const key = CacheKeys.DEVICE_STATS(deviceId);
    return this.set(key, data, CacheTTL.DEVICE_STATS);
  }

  /**
   * 获取设备排名缓存
   */
  async getDeviceRankCache(deviceId: string): Promise<number | null> {
    const key = CacheKeys.DEVICE_RANK(deviceId);
    return this.get<number>(key);
  }

  /**
   * 设置设备排名缓存
   */
  async setDeviceRankCache(deviceId: string, rank: number): Promise<boolean> {
    const key = CacheKeys.DEVICE_RANK(deviceId);
    return this.set(key, rank, CacheTTL.DEVICE_RANK);
  }

  /**
   * 检查API限流
   */
  async checkRateLimit(deviceId: string, limit: number = 100): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.isAvailable()) {
      return { allowed: true, remaining: limit };
    }

    try {
      const key = CacheKeys.RATE_LIMIT(deviceId);
      const current = await this.redis!.incr(key);
      
      if (current === 1) {
        // 第一次请求，设置过期时间
        await this.redis!.expire(key, CacheTTL.RATE_LIMIT);
      }
      
      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;
      
      console.log(`缓存操作 RATE_LIMIT [${key}] - 允许: ${allowed}, 剩余: ${remaining}`);
      
      return { allowed, remaining };
    } catch (error) {
      console.error(`限流检查失败 [${deviceId}]:`, error);
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * 清除所有排行榜缓存（当有新记录提交时）
   */
  async clearRankingCaches(): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.RANKING_GLOBAL),
      this.del(CacheKeys.RANKING_WEEKLY),
    ]);
    
    console.log('排行榜缓存已清除');
  }

  /**
   * 清除设备相关缓存
   */
  async clearDeviceCaches(deviceId: string): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.DEVICE_STATS(deviceId)),
      this.del(CacheKeys.DEVICE_RANK(deviceId)),
    ]);
    
    console.log(`设备缓存已清除: ${deviceId}`);
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{ available: boolean; connected: boolean }> {
    if (!this.isAvailable()) {
      return { available: false, connected: false };
    }

    try {
      // 尝试执行一个简单的ping命令来检查连接
      await this.redis!.ping();
      return { available: true, connected: true };
    } catch (error) {
      console.error('Redis连接检查失败:', error);
      return { available: true, connected: false };
    }
  }
}

// 导出单例实例
export const cacheService = new CacheService();