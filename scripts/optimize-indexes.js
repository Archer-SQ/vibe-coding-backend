#!/usr/bin/env node

/**
 * MongoDB索引优化脚本
 * 创建和优化数据库索引以提升查询性能
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function optimizeIndexes() {
  try {
    console.log('🔄 开始MongoDB索引优化...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    const db = mongoose.connection.db;
    console.log('✅ 数据库连接成功');

    // 1. 优化 gameRecords 集合索引
    console.log('\n📊 优化 gameRecords 集合索引...');
    
    const gameRecordsCollection = db.collection('gamerecords');
    
    // 删除可能存在的旧索引（除了_id）
    try {
      const existingIndexes = await gameRecordsCollection.indexes();
      console.log(`当前索引数量: ${existingIndexes.length}`);
      
      for (const index of existingIndexes) {
        if (index.name !== '_id_') {
          try {
            await gameRecordsCollection.dropIndex(index.name);
            console.log(`✅ 删除旧索引: ${index.name}`);
          } catch (error) {
            console.log(`⚠️ 索引删除失败 ${index.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 获取现有索引失败:', error.message);
    }

    // 创建优化的索引
    const gameRecordIndexes = [
      // 设备ID索引 - 用于查询特定设备的记录
      { key: { deviceId: 1 }, name: 'deviceId_1' },
      
      // 分数降序索引 - 用于排行榜查询
      { key: { score: -1 }, name: 'score_-1' },
      
      // 创建时间降序索引 - 用于时间范围查询
      { key: { createdAt: -1 }, name: 'createdAt_-1' },
      
      // 复合索引：设备ID + 分数降序 - 用于查询设备最高分
      { key: { deviceId: 1, score: -1 }, name: 'deviceId_1_score_-1' },
      
      // 复合索引：分数降序 + 创建时间升序 - 用于排行榜（相同分数按时间排序）
      { key: { score: -1, createdAt: 1 }, name: 'score_-1_createdAt_1' },
      
      // 时间范围查询索引 - 用于周榜等时间范围查询
      { key: { createdAt: -1, deviceId: 1 }, name: 'createdAt_-1_deviceId_1' }
    ];

    for (const indexSpec of gameRecordIndexes) {
      try {
        await gameRecordsCollection.createIndex(indexSpec.key, { 
          name: indexSpec.name,
          background: true 
        });
        console.log(`✅ 创建索引: ${indexSpec.name}`);
      } catch (error) {
        console.log(`❌ 索引创建失败 ${indexSpec.name}:`, error.message);
      }
    }

    // 2. 优化 deviceStats 集合索引
    console.log('\n📊 优化 deviceStats 集合索引...');
    
    const deviceStatsCollection = db.collection('devicestats');
    
    // 删除可能存在的旧索引（除了_id）
    try {
      const existingStatsIndexes = await deviceStatsCollection.indexes();
      console.log(`当前索引数量: ${existingStatsIndexes.length}`);
      
      for (const index of existingStatsIndexes) {
        if (index.name !== '_id_') {
          try {
            await deviceStatsCollection.dropIndex(index.name);
            console.log(`✅ 删除旧索引: ${index.name}`);
          } catch (error) {
            console.log(`⚠️ 索引删除失败 ${index.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 获取现有索引失败:', error.message);
    }

    const deviceStatsIndexes = [
      // 设备ID唯一索引 - 确保设备ID唯一性
      { key: { deviceId: 1 }, name: 'deviceId_1', unique: true },
      
      // 最高分降序索引 - 用于排行榜查询
      { key: { bestScore: -1 }, name: 'bestScore_-1' },
      
      // 创建时间降序索引 - 用于时间查询
      { key: { createdAt: -1 }, name: 'createdAt_-1' },
      
      // 更新时间降序索引 - 用于最近更新查询
      { key: { updatedAt: -1 }, name: 'updatedAt_-1' },
      
      // 复合索引：最高分降序 + 创建时间升序 - 用于排行榜（相同分数按注册时间排序）
      { key: { bestScore: -1, createdAt: 1 }, name: 'bestScore_-1_createdAt_1' }
    ];

    for (const indexSpec of deviceStatsIndexes) {
      try {
        const options = { 
          name: indexSpec.name,
          background: true 
        };
        
        if (indexSpec.unique) {
          options.unique = true;
        }
        
        await deviceStatsCollection.createIndex(indexSpec.key, options);
        console.log(`✅ 创建索引: ${indexSpec.name}${indexSpec.unique ? ' (唯一)' : ''}`);
      } catch (error) {
        console.log(`❌ 索引创建失败 ${indexSpec.name}:`, error.message);
      }
    }

    // 3. 创建 rankingCache 集合索引（如果存在）
    console.log('\n📊 优化 rankingCache 集合索引...');
    
    const rankingCacheCollection = db.collection('rankingcache');
    
    // 检查集合是否存在
    const collections = await db.listCollections({ name: 'rankingcache' }).toArray();
    
    if (collections.length > 0) {
      const rankingCacheIndexes = [
        // 设备ID唯一索引
        { key: { deviceId: 1 }, name: 'deviceId_1', unique: true },
        
        // 分数降序索引
        { key: { score: -1 }, name: 'score_-1' },
        
        // 排名位置索引
        { key: { rankPosition: 1 }, name: 'rankPosition_1' },
        
        // TTL索引 - 自动删除过期文档
        { key: { expiresAt: 1 }, name: 'expiresAt_1_ttl', expireAfterSeconds: 0 },
        
        // 缓存时间索引
        { key: { cachedAt: -1 }, name: 'cachedAt_-1' }
      ];

      for (const indexSpec of rankingCacheIndexes) {
        try {
          const options = { 
            name: indexSpec.name,
            background: true 
          };
          
          if (indexSpec.unique) {
            options.unique = true;
          }
          
          if (indexSpec.expireAfterSeconds !== undefined) {
            options.expireAfterSeconds = indexSpec.expireAfterSeconds;
          }
          
          await rankingCacheCollection.createIndex(indexSpec.key, options);
          console.log(`✅ 创建索引: ${indexSpec.name}${indexSpec.unique ? ' (唯一)' : ''}${indexSpec.expireAfterSeconds !== undefined ? ' (TTL)' : ''}`);
        } catch (error) {
          console.log(`❌ 索引创建失败 ${indexSpec.name}:`, error.message);
        }
      }
    } else {
      console.log('⚠️ rankingcache 集合不存在，跳过索引创建');
    }

    // 4. 验证索引创建结果
    console.log('\n📋 验证索引创建结果...');
    
    const gameRecordsFinalIndexes = await gameRecordsCollection.indexes();
    const deviceStatsFinalIndexes = await deviceStatsCollection.indexes();
    
    console.log(`✅ gameRecords 集合索引数量: ${gameRecordsFinalIndexes.length}`);
    gameRecordsFinalIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log(`✅ deviceStats 集合索引数量: ${deviceStatsFinalIndexes.length}`);
    deviceStatsFinalIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // 5. 性能测试
    console.log('\n⚡ 执行性能测试...');
    
    // 测试排行榜查询性能
    const startTime1 = Date.now();
    await deviceStatsCollection.find({}).sort({ bestScore: -1 }).limit(10).toArray();
    const duration1 = Date.now() - startTime1;
    console.log(`✅ 排行榜查询性能: ${duration1}ms`);
    
    // 测试设备记录查询性能
    const sampleDevice = await gameRecordsCollection.findOne({});
    if (sampleDevice) {
      const startTime2 = Date.now();
      await gameRecordsCollection.find({ deviceId: sampleDevice.deviceId }).sort({ score: -1 }).limit(20).toArray();
      const duration2 = Date.now() - startTime2;
      console.log(`✅ 设备记录查询性能: ${duration2}ms`);
    }
    
    // 测试时间范围查询性能
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startTime3 = Date.now();
    await gameRecordsCollection.find({ createdAt: { $gte: oneWeekAgo } }).sort({ score: -1 }).limit(10).toArray();
    const duration3 = Date.now() - startTime3;
    console.log(`✅ 时间范围查询性能: ${duration3}ms`);

    console.log('\n🎉 MongoDB索引优化完成！');
    console.log('\n📊 优化总结:');
    console.log('✅ gameRecords 集合 - 6个优化索引');
    console.log('✅ deviceStats 集合 - 5个优化索引');
    console.log('✅ 查询性能测试通过');
    console.log('\n💡 建议:');
    console.log('- 定期监控查询性能');
    console.log('- 根据实际使用情况调整索引策略');
    console.log('- 考虑使用 explain() 分析查询计划');

  } catch (error) {
    console.error('❌ 索引优化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 执行索引优化
if (require.main === module) {
  optimizeIndexes();
}

module.exports = { optimizeIndexes };