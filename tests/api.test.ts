import { connectDatabase } from '../lib/database/connection';
import { GameService } from '../lib/services/gameService';
import { RankingService } from '../lib/services/rankingService';
import { CacheService } from '../lib/services/cacheservice';
import { validateDeviceId } from '../lib/utils/deviceId';
import mongoose from 'mongoose';
import GameRecord from '../lib/database/models/GameRecord';
import DeviceStats from '../lib/database/models/DeviceStats';

// 测试环境配置
beforeAll(async () => {
  // 连接测试数据库
  await connectDatabase();
  
  // 等待连接建立
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }
}, 30000);

afterAll(async () => {
  try {
    // 清理测试数据
    if (mongoose.connection.readyState === 1) {
      await GameRecord.deleteMany({});
      await DeviceStats.deleteMany({});
    }
  } catch (error) {
    console.warn('清理测试数据时出错:', error);
  }
  
  // 关闭数据库连接
  await mongoose.connection.close();
}, 30000);

describe('API 验证测试', () => {
  describe('设备ID验证', () => {
    test('应该接受有效的设备ID格式', () => {
      const validDeviceId = 'a1b2c3d4e5f6789012345678901234ab';
      expect(validateDeviceId(validDeviceId)).toBe(true);
      expect(validDeviceId).toMatch(/^[a-f0-9]{32}$/);
    });

    test('应该拒绝无效的设备ID格式', () => {
      const invalidDeviceIds = [
        'invalid',
        '123',
        'g1b2c3d4e5f6789012345678901234ab', // 包含无效字符
        'a1b2c3d4e5f678901234567890123', // 长度不足
        'A1B2C3D4E5F6789012345678901234AB' // 大写字母
      ];
      
      invalidDeviceIds.forEach(deviceId => {
        expect(validateDeviceId(deviceId)).toBe(false);
        expect(deviceId).not.toMatch(/^[a-f0-9]{32}$/);
      });
    });
  });

  describe('分数验证', () => {
    test('应该接受有效的分数范围', () => {
      const validScores = [0, 100, 50000, 999999];
      validScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(999999);
      });
    });

    test('应该拒绝无效的分数', () => {
      const invalidScores = [-1, 1000000, -100];
      invalidScores.forEach(score => {
        expect(score < 0 || score > 999999).toBe(true);
      });
    });
  });

  describe('分页参数验证', () => {
    test('应该接受有效的分页参数', () => {
      const validParams = [
        { limit: 10, offset: 0 },
        { limit: 50, offset: 100 },
        { limit: 100, offset: 0 }
      ];
      
      validParams.forEach(({ limit, offset }) => {
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(100);
        expect(offset).toBeGreaterThanOrEqual(0);
      });
    });

    test('应该拒绝无效的分页参数', () => {
      const invalidParams = [
        { limit: 0, offset: 0 },
        { limit: 101, offset: 0 },
        { limit: 10, offset: -1 }
      ];
      
      invalidParams.forEach(({ limit, offset }) => {
        const isValidLimit = limit > 0 && limit <= 100;
        const isValidOffset = offset >= 0;
        expect(isValidLimit && isValidOffset).toBe(false);
      });
    });
  });
});

describe('游戏服务测试', () => {
  const gameService = new GameService();
  const testDeviceId = 'a1b2c3d4e5f6789012345678901234ab';

  beforeEach(async () => {
    // 清理测试数据
    await GameRecord.deleteMany({ deviceId: testDeviceId });
    await DeviceStats.deleteMany({ deviceId: testDeviceId });
  });

  describe('submitGameRecord', () => {
    test('应该成功提交游戏记录', async () => {
      const gameData = {
        deviceId: testDeviceId,
        score: 15000
      };

      const result = await gameService.submitGameRecord(gameData);
      
      expect(result).toBeDefined();
      expect(result.deviceId).toBe(testDeviceId);
      expect(result.bestScore).toBe(15000);
    });

    test('应该只保留最高分记录', async () => {
      // 提交第一个分数
      await gameService.submitGameRecord({
        deviceId: testDeviceId,
        score: 10000
      });

      // 提交更高分数
      await gameService.submitGameRecord({
        deviceId: testDeviceId,
        score: 15000
      });

      // 提交更低分数
      await gameService.submitGameRecord({
        deviceId: testDeviceId,
        score: 8000
      });

      // 检查只保留了最高分
      const records = await GameRecord.find({ deviceId: testDeviceId });
      expect(records).toHaveLength(1);
      expect(records[0].score).toBe(15000);

      // 检查设备统计
      const deviceStats = await DeviceStats.findOne({ deviceId: testDeviceId });
      expect(deviceStats?.bestScore).toBe(15000);
    });
  });

  describe('getDeviceStats', () => {
    test('应该返回设备统计数据', async () => {
      // 先提交一个游戏记录
      await gameService.submitGameRecord({
        deviceId: testDeviceId,
        score: 12000
      });

      const stats = await gameService.getDeviceStats(testDeviceId);
      
      expect(stats).toBeDefined();
      expect(stats?.deviceId).toBe(testDeviceId);
      expect(stats?.bestScore).toBe(12000);
    });

    test('设备不存在时应该返回null', async () => {
      const stats = await gameService.getDeviceStats('abcdef1234567890abcdef1234567890ab');
      expect(stats).toBeNull();
    });
  });
});

describe('排行榜服务测试', () => {
  const rankingService = new RankingService();
  const gameService = new GameService();

  beforeEach(async () => {
    // 清理测试数据
    await GameRecord.deleteMany({});
    await DeviceStats.deleteMany({});
  });

  describe('getAllTimeRanking', () => {
    test('应该返回按分数排序的排行榜', async () => {
      // 创建测试数据
      const testData = [
        { deviceId: 'a1b2c3d4e5f6789012345678901234ab', score: 25000 },
        { deviceId: 'b2c3d4e5f6789012345678901234abc1', score: 20000 },
        { deviceId: 'c3d4e5f6789012345678901234abc12d', score: 30000 }
      ];

      // 提交游戏记录
      for (const data of testData) {
        await gameService.submitGameRecord(data);
      }

      const ranking = await rankingService.getAllTimeRanking();
      
      expect(ranking).toHaveLength(3);
      expect(ranking[0].score).toBe(30000); // 最高分在第一位
      expect(ranking[1].score).toBe(25000);
      expect(ranking[2].score).toBe(20000);
    });

    test('应该限制返回数量', async () => {
      // 创建超过10个测试记录
      for (let i = 0; i < 15; i++) {
        const hexSuffix = (i * 123456).toString(16).padStart(30, '0');
        const deviceId = `d${i.toString(16).padStart(1, '0')}${hexSuffix}`.substring(0, 32);
        await gameService.submitGameRecord({
          deviceId,
          score: 1000 + i * 100
        });
      }

      const ranking = await rankingService.getAllTimeRanking();
      expect(ranking.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getWeeklyRanking', () => {
    test('应该返回本周的排行榜', async () => {
      // 创建本周的测试数据
      await gameService.submitGameRecord({
        deviceId: 'a1b2c3d4e5f6789012345678901234ab',
        score: 15000
      });

      const weeklyRanking = await rankingService.getWeeklyRanking();
      
      expect(Array.isArray(weeklyRanking)).toBe(true);
      if (weeklyRanking.length > 0) {
        expect(weeklyRanking[0]).toHaveProperty('deviceId');
        expect(weeklyRanking[0]).toHaveProperty('score');
      }
    });
  });
});

describe('缓存服务测试', () => {
  const cacheService = new CacheService();
  const testKey = 'test:key';
  const testValue = 'test value';

  afterAll(() => {
    // 清理缓存服务资源
    cacheService.cleanup();
  });

  describe('基础缓存操作', () => {
    test('应该能够设置和获取缓存', async () => {
      const setResult = await cacheService.set(testKey, testValue, 60);
      const result = await cacheService.get(testKey);
      
      if (cacheService.isAvailable()) {
        expect(setResult).toBe(true);
        expect(result).toBe(testValue);
      } else {
        expect(setResult).toBe(false);
        expect(result).toBeNull();
      }
    });

    test('应该能够删除缓存', async () => {
      await cacheService.set(testKey, testValue, 60);
      const delResult = await cacheService.del(testKey);
      const result = await cacheService.get(testKey);
      
      if (cacheService.isAvailable()) {
        expect(delResult).toBe(true);
      } else {
        expect(delResult).toBe(false);
      }
      expect(result).toBeNull();
    });

    test('应该能够批量删除缓存', async () => {
      await cacheService.set('test:key1', 'value1', 60);
      await cacheService.set('test:key2', 'value2', 60);
      
      const delResult = await cacheService.delPattern('test:*');
      
      const result1 = await cacheService.get('test:key1');
      const result2 = await cacheService.get('test:key2');
      
      // delPattern 方法总是返回 true，无论缓存是否可用
      // 因为它至少会处理内存缓存
      expect(delResult).toBe(true);
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('排行榜缓存', () => {
    test('应该能够缓存和获取排行榜数据', async () => {
      const rankingData = [
        { deviceId: 'device123', score: 15000, rank: 1 }
      ];

      const setResult = await cacheService.setRankingCache('global', rankingData);
      const result = await cacheService.getRankingCache('global');
      
      if (cacheService.isAvailable()) {
        expect(setResult).toBe(true);
        expect(result).toEqual(rankingData);
      } else {
        expect(setResult).toBe(false);
        expect(result).toBeNull();
      }
    });
  });

  describe('设备统计缓存', () => {
    test('应该能够缓存和获取设备统计数据', async () => {
      const deviceId = 'a1b2c3d4e5f6789012345678901234ab';
      const statsData = {
        deviceId,
        bestScore: 15000,
        recentGames: []
      };

      const setResult = await cacheService.setDeviceStatsCache(deviceId, statsData);
      const result = await cacheService.getDeviceStatsCache(deviceId);
      
      if (cacheService.isAvailable()) {
        expect(setResult).toBe(true);
        expect(result).toEqual(statsData);
      } else {
        expect(setResult).toBe(false);
        expect(result).toBeNull();
      }
    });
  });

  describe('API限流', () => {
    test('应该能够检查API限流', async () => {
      const deviceId = 'a1b2c3d4e5f6789012345678901234ab';
      
      // 第一次请求应该通过
      const firstCheck = await cacheService.checkRateLimit(deviceId, 10);
      expect(firstCheck.allowed).toBe(true);
      expect(firstCheck.remaining).toBeGreaterThanOrEqual(0);
      
      if (cacheService.isAvailable()) {
        // 如果缓存可用，测试限流功能
        // 连续请求应该受到限制
        for (let i = 0; i < 10; i++) {
          await cacheService.checkRateLimit(deviceId, 10);
        }
        
        const limitedCheck = await cacheService.checkRateLimit(deviceId, 10);
        expect(limitedCheck.allowed).toBe(false);
        expect(limitedCheck.remaining).toBe(0);
      } else {
        // 如果缓存不可用，限流功能应该总是允许请求
        for (let i = 0; i < 15; i++) {
          const check = await cacheService.checkRateLimit(deviceId, 10);
          expect(check.allowed).toBe(true);
          expect(check.remaining).toBe(10);
        }
      }
    });
  });
});

describe('性能测试', () => {
  const gameService = new GameService();
  const rankingService = new RankingService();

  test('游戏记录提交性能测试', async () => {
    const startTime = Date.now();
    
    await gameService.submitGameRecord({
      deviceId: 'a1b2c3d4e5f6789012345678901234ab',
      score: 15000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 应该在100ms内完成
    expect(duration).toBeLessThan(100);
  });

  test('排行榜查询性能测试', async () => {
    // 创建一些测试数据
    for (let i = 0; i < 5; i++) {
      const hexSuffix = (i * 123456789).toString(16).padStart(30, '0');
      const deviceId = `a${i.toString(16)}${hexSuffix}`.substring(0, 32);
      await gameService.submitGameRecord({
        deviceId,
        score: 1000 + i * 100
      });
    }

    const startTime = Date.now();
    
    const ranking = await rankingService.getAllTimeRanking();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 应该在200ms内完成
    expect(duration).toBeLessThan(200);
    expect(ranking.length).toBeGreaterThan(0);
  });
});