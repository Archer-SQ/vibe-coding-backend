/**
 * MongoDB索引优化脚本
 * 用于创建和优化数据库索引，提升查询性能
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

class MongoIndexOptimizer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB_NAME || 'gamedb');
      console.log('✅ 连接到MongoDB成功');
    } catch (error) {
      console.error('❌ MongoDB连接失败:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('✅ MongoDB连接已关闭');
    }
  }

  /**
   * 创建游戏记录集合的索引
   */
  async createGameRecordsIndexes() {
    const collection = this.db.collection('gameRecords');
    
    console.log('🔧 创建gameRecords集合索引...');
    
    // 1. 设备ID索引 - 用于查询特定设备的记录
    await collection.createIndex(
      { deviceId: 1 },
      { 
        name: 'idx_deviceId',
        background: true,
        partialFilterExpression: { deviceId: { $exists: true } }
      }
    );
    
    // 2. 分数降序索引 - 用于排行榜查询
    await collection.createIndex(
      { score: -1 },
      { 
        name: 'idx_score_desc',
        background: true
      }
    );
    
    // 3. 创建时间降序索引 - 用于时间范围查询
    await collection.createIndex(
      { createdAt: -1 },
      { 
        name: 'idx_createdAt_desc',
        background: true
      }
    );
    
    // 4. 复合索引：设备ID + 分数降序 - 用于查询设备最高分
    await collection.createIndex(
      { deviceId: 1, score: -1 },
      { 
        name: 'idx_deviceId_score_desc',
        background: true
      }
    );
    
    // 5. 复合索引：分数降序 + 创建时间降序 - 用于排行榜分页
    await collection.createIndex(
      { score: -1, createdAt: -1 },
      { 
        name: 'idx_score_createdAt_desc',
        background: true
      }
    );
    
    // 6. 时间范围查询索引 - 用于周排行榜
    await collection.createIndex(
      { createdAt: -1, score: -1 },
      { 
        name: 'idx_createdAt_score_desc',
        background: true
      }
    );
    
    console.log('✅ gameRecords索引创建完成');
  }

  /**
   * 创建设备统计集合的索引
   */
  async createDeviceStatsIndexes() {
    const collection = this.db.collection('deviceStats');
    
    console.log('🔧 创建deviceStats集合索引...');
    
    // 1. 设备ID唯一索引
    await collection.createIndex(
      { deviceId: 1 },
      { 
        name: 'idx_deviceId_unique',
        unique: true,
        background: true
      }
    );
    
    // 2. 最高分数降序索引 - 用于全局排行榜
    await collection.createIndex(
      { bestScore: -1 },
      { 
        name: 'idx_bestScore_desc',
        background: true
      }
    );
    
    // 3. 创建时间索引
    await collection.createIndex(
      { createdAt: -1 },
      { 
        name: 'idx_createdAt_desc',
        background: true
      }
    );
    
    // 4. 更新时间索引
    await collection.createIndex(
      { updatedAt: -1 },
      { 
        name: 'idx_updatedAt_desc',
        background: true
      }
    );
    
    console.log('✅ deviceStats索引创建完成');
  }

  /**
   * 创建排行榜缓存集合的索引
   */
  async createRankingCacheIndexes() {
    const collection = this.db.collection('rankingCache');
    
    console.log('🔧 创建rankingCache集合索引...');
    
    // 1. 设备ID唯一索引
    await collection.createIndex(
      { deviceId: 1 },
      { 
        name: 'idx_deviceId_unique',
        unique: true,
        background: true
      }
    );
    
    // 2. 排名位置索引
    await collection.createIndex(
      { rankPosition: 1 },
      { 
        name: 'idx_rankPosition',
        background: true
      }
    );
    
    // 3. TTL索引 - 自动删除过期文档
    await collection.createIndex(
      { expiresAt: 1 },
      { 
        name: 'idx_expiresAt_ttl',
        expireAfterSeconds: 0,
        background: true
      }
    );
    
    // 4. 分数降序索引
    await collection.createIndex(
      { score: -1 },
      { 
        name: 'idx_score_desc',
        background: true
      }
    );
    
    console.log('✅ rankingCache索引创建完成');
  }

  /**
   * 分析现有索引使用情况
   */
  async analyzeIndexUsage() {
    console.log('📊 分析索引使用情况...');
    
    const collections = ['gameRecords', 'deviceStats', 'rankingCache'];
    
    for (const collectionName of collections) {
      console.log(`\n📋 ${collectionName} 集合索引信息:`);
      
      const collection = this.db.collection(collectionName);
      
      // 获取索引信息
      const indexes = await collection.indexes();
      console.log('现有索引:', indexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      })));
      
      // 获取集合统计信息
      const stats = await collection.stats();
      console.log('集合统计:', {
        count: stats.count,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        avgObjSize: `${stats.avgObjSize} bytes`,
        indexSizes: stats.indexSizes
      });
    }
  }

  /**
   * 创建分片键建议
   */
  async createShardingStrategy() {
    console.log('\n🔀 MongoDB分片策略建议:');
    
    console.log(`
📊 gameRecords集合分片策略:
` +
      `- 分片键: { deviceId: "hashed" }
` +
      `- 原因: 设备ID分布均匀，避免热点
` +
      `- 命令: sh.shardCollection("gamedb.gameRecords", { "deviceId": "hashed" })
`);
    
    console.log(`📊 deviceStats集合分片策略:
` +
      `- 分片键: { deviceId: "hashed" }
` +
      `- 原因: 设备ID作为主键，天然分布均匀
` +
      `- 命令: sh.shardCollection("gamedb.deviceStats", { "deviceId": "hashed" })
`);
    
    console.log(`📊 rankingCache集合分片策略:
` +
      `- 建议: 不分片，数据量小且频繁更新
` +
      `- 原因: 排行榜数据相对较小，分片开销大于收益
`);
  }

  /**
   * 执行所有优化操作
   */
  async optimizeAll() {
    try {
      await this.connect();
      
      console.log('🚀 开始MongoDB性能优化...');
      
      await this.createGameRecordsIndexes();
      await this.createDeviceStatsIndexes();
      await this.createRankingCacheIndexes();
      
      await this.analyzeIndexUsage();
      await this.createShardingStrategy();
      
      console.log('\n✅ MongoDB性能优化完成!');
      
    } catch (error) {
      console.error('❌ 优化过程中出现错误:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// 执行优化
if (require.main === module) {
  const optimizer = new MongoIndexOptimizer();
  optimizer.optimizeAll().catch(console.error);
}

module.exports = MongoIndexOptimizer;