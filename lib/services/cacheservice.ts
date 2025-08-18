import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

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
  HOT_DATA: 1800,      // 30分钟 - 热点数据
  COLD_DATA: 7200,     // 2小时 - 冷数据
} as const;

// 缓存层级配置
export const CacheLevel = {
  L1_MEMORY: 'L1',     // 内存缓存
  L2_REDIS: 'L2',      // Redis缓存
} as const;

// 缓存压缩配置
export const CacheCompression = {
  THRESHOLD: 1024,     // 超过1KB的数据进行压缩
  ENABLED: true,       // 启用压缩
} as const;

export class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;
  private memoryCache: Map<string, { data: any; expires: number; hits: number }> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private maxMemoryCacheSize = 1000; // 内存缓存最大条目数
  private cleanupTimer: NodeJS.Timeout | null = null; // 清理定时器

  constructor() {
    this.initializeRedis();
    this.startCleanupTimer();
  }

  /**
   * 初始化Redis连接
   */
  private initializeRedis(): void {
    // 暂时禁用Redis缓存，只使用内存缓存
    console.warn('⚠️ Redis缓存已禁用，使用内存缓存模式');
    this.redis = null;
    this.isEnabled = true; // 启用内存缓存
  }

  /**
   * 启动内存缓存清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanupMemoryCache();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires < now) {
        this.memoryCache.delete(key);
      }
    }
    
    // 如果缓存条目过多，删除最少使用的
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, this.memoryCache.size - this.maxMemoryCacheSize);
      
      for (const [key] of entries) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 生成缓存键的哈希值
   */
  private hashKey(key: string): string {
    return createHash('md5').update(key).digest('hex');
  }

  /**
   * 压缩数据
   */
  private compressData(data: string): string {
    // 简单的压缩实现，实际项目中可以使用更好的压缩算法
    if (data.length > CacheCompression.THRESHOLD && CacheCompression.ENABLED) {
      return JSON.stringify({ compressed: true, data: Buffer.from(data).toString('base64') });
    }
    return data;
  }

  /**
   * 解压数据
   */
  private decompressData(data: string): string {
    try {
      const parsed = JSON.parse(data);
      if (parsed.compressed) {
        return Buffer.from(parsed.data, 'base64').toString();
      }
    } catch {
      // 如果解析失败，返回原始数据
    }
    return data;
  }

  /**
   * 从内存缓存获取数据
   */
  private getFromMemoryCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      this.cacheStats.hits++;
      return cached.data;
    }
    
    if (cached) {
      this.memoryCache.delete(key);
    }
    
    this.cacheStats.misses++;
    return null;
  }

  /**
   * 设置内存缓存
   */
  private setToMemoryCache<T>(key: string, value: T, ttl: number): void {
    const expires = Date.now() + (ttl * 1000);
    this.memoryCache.set(key, {
      data: value,
      expires,
      hits: 0
    });
    this.cacheStats.sets++;
  }

  /**
   * 检查缓存是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled && this.redis !== null;
  }

  /**
   * 多层缓存获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      // 先从内存缓存获取
      const memoryResult = this.getFromMemoryCache<T>(key);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // 从Redis获取
      if (this.redis) {
        const redisResult = await this.redis.get(key);
        if (redisResult !== null) {
          const decompressed = this.decompressData(redisResult as string);
          const parsed = JSON.parse(decompressed);
          
          // 回写到内存缓存
          this.setToMemoryCache(key, parsed, CacheTTL.HOT_DATA);
          
          this.cacheStats.hits++;
          return parsed;
        }
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * 多层缓存设置数据
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const compressed = this.compressData(serialized);
      const cacheTtl = ttl || CacheTTL.DEVICE_STATS;

      // 设置到内存缓存
      this.setToMemoryCache(key, value, cacheTtl);

      // 设置到Redis
      if (this.redis) {
        if (ttl) {
          await this.redis.setex(key, ttl, compressed);
        } else {
          await this.redis.set(key, compressed);
        }
      }

      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error('缓存设置失败:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // 从内存缓存删除
      this.memoryCache.delete(key);

      // 从Redis删除
      if (this.redis) {
        await this.redis.del(key);
      }

      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      console.error('缓存删除失败:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * 批量删除匹配模式的缓存键
   * @param pattern 匹配模式，如 'test:*'
   * @returns 删除是否成功
   */
  async delPattern(pattern: string): Promise<boolean> {
    try {
      // 从内存缓存中删除匹配的键
      const memoryKeys = Array.from(this.memoryCache.keys());
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      for (const key of memoryKeys) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
      
      if (!this.isEnabled || !this.redis) {
        return true;
      }

      // Redis 批量删除
      const keys = await this.redis.keys(pattern);
      if (keys && keys.length > 0) {
        await this.redis.del(...keys);
        this.cacheStats.deletes += keys.length;
      }
      
      return true;
    } catch (error) {
      console.error('批量缓存删除失败:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * 获取排行榜缓存
   */
  async getRankingCache(type: 'global' | 'weekly'): Promise<any[] | null> {
    const key = type === 'global' ? CacheKeys.RANKING_GLOBAL : CacheKeys.RANKING_WEEKLY;
    return await this.get<any[]>(key);
  }

  /**
   * 设置排行榜缓存
   */
  async setRankingCache(type: 'global' | 'weekly', data: any[]): Promise<boolean> {
    const key = type === 'global' ? CacheKeys.RANKING_GLOBAL : CacheKeys.RANKING_WEEKLY;
    return await this.set(key, data, CacheTTL.RANKING);
  }

  /**
   * 获取设备统计缓存
   */
  async getDeviceStatsCache(deviceId: string): Promise<any | null> {
    return await this.get(CacheKeys.DEVICE_STATS(deviceId));
  }

  /**
   * 设置设备统计缓存
   */
  async setDeviceStatsCache(deviceId: string, data: any): Promise<boolean> {
    return await this.set(CacheKeys.DEVICE_STATS(deviceId), data, CacheTTL.DEVICE_STATS);
  }

  /**
   * 获取设备排名缓存
   */
  async getDeviceRankCache(deviceId: string): Promise<number | null> {
    return await this.get<number>(CacheKeys.DEVICE_RANK(deviceId));
  }

  /**
   * 设置设备排名缓存
   */
  async setDeviceRankCache(deviceId: string, rank: number): Promise<boolean> {
    return await this.set(CacheKeys.DEVICE_RANK(deviceId), rank, CacheTTL.DEVICE_RANK);
  }

  /**
   * 检查API限流
   */
  async checkRateLimit(deviceId: string, limit: number = 100): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.isEnabled || !this.redis) {
      return { allowed: true, remaining: limit };
    }

    try {
      const key = CacheKeys.RATE_LIMIT(deviceId);
      const current = await this.redis.get(key);
      
      if (current === null) {
        // 首次请求
        await this.redis.setex(key, CacheTTL.RATE_LIMIT, '1');
        return { allowed: true, remaining: limit - 1 };
      }
      
      const count = parseInt(current as string, 10);
      if (count >= limit) {
        return { allowed: false, remaining: 0 };
      }
      
      // 增加计数
      await this.redis.incr(key);
      return { allowed: true, remaining: limit - count - 1 };
      
    } catch (error) {
      console.error('限流检查失败:', error);
      this.cacheStats.errors++;
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * 清除排行榜缓存
   */
  async clearRankingCaches(): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.RANKING_GLOBAL),
      this.del(CacheKeys.RANKING_WEEKLY)
    ]);
  }

  /**
   * 清除设备相关缓存
   */
  async clearDeviceCaches(deviceId: string): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.DEVICE_STATS(deviceId)),
      this.del(CacheKeys.DEVICE_RANK(deviceId)),
      this.del(CacheKeys.RATE_LIMIT(deviceId))
    ]);
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{ 
    available: boolean; 
    connected: boolean;
    memoryCache: { size: number; maxSize: number };
    stats: { hits: number; misses: number; sets: number; deletes: number; errors: number };
  }> {
    return {
      available: this.isAvailable(),
      connected: this.redis !== null,
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize
      },
      stats: { 
         hits: this.cacheStats.hits,
         misses: this.cacheStats.misses,
         sets: this.cacheStats.sets,
         deletes: this.cacheStats.deletes,
         errors: this.cacheStats.errors
       }
    };
  }

  /**
   * 清理资源（用于测试环境）
   */
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.memoryCache.clear();
  }
}

// 导出单例实例
export const cacheService = new CacheService();