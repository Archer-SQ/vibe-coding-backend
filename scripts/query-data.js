#!/usr/bin/env node

/**
 * 数据查询脚本
 * 用于查看和验证数据库中的游戏数据
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function queryData() {
  try {
    console.log('🔄 正在连接MongoDB...');
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ MongoDB连接成功！');

    const db = mongoose.connection.db;
    
    // 查询数据库统计
    console.log('\n📊 数据库统计信息：');
    const gameRecordsCount = await db.collection('gamerecords').countDocuments();
    const deviceStatsCount = await db.collection('devicestats').countDocuments();
    const rankingCacheCount = await db.collection('rankingcache').countDocuments();
    
    console.log(`- 游戏记录总数: ${gameRecordsCount}`);
    console.log(`- 设备统计总数: ${deviceStatsCount}`);
    console.log(`- 排行榜缓存: ${rankingCacheCount}`);
    
    // 查询最高分记录
    console.log('\n🏆 最高分记录：');
    const topScores = await db.collection('gamerecords')
      .find({})
      .sort({ score: -1 })
      .limit(5)
      .toArray();
    
    topScores.forEach((record, index) => {
      const date = new Date(record.createdAt).toLocaleString('zh-CN');
      console.log(`${index + 1}. ${record.score}分 - 设备 ${record.deviceId.substring(0, 8)}... (${date})`);
    });
    
    // 查询设备排行榜
    console.log('\n📱 设备排行榜（按最高分）：');
    const deviceRanking = await db.collection('devicestats')
      .find({})
      .sort({ bestScore: -1 })
      .limit(10)
      .toArray();
    
    deviceRanking.forEach((device, index) => {
      console.log(`${index + 1}. 设备 ${device.deviceId.substring(0, 8)}... - 最高分: ${device.bestScore}`);
    });
    
    // 查询最近的游戏记录
    console.log('\n⏰ 最近的游戏记录：');
    const recentRecords = await db.collection('gamerecords')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    recentRecords.forEach((record, index) => {
      const date = new Date(record.createdAt).toLocaleString('zh-CN');
      console.log(`${index + 1}. ${record.score}分 - 设备 ${record.deviceId.substring(0, 8)}... (${date})`);
    });
    
    // 查询分数分布
    console.log('\n📈 分数分布统计：');
    const scoreDistribution = await db.collection('gamerecords').aggregate([
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 1000, 5000, 15000, 50000, 100000],
          default: "其他",
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: "$score" }
          }
        }
      }
    ]).toArray();
    
    const ranges = ['0-999', '1000-4999', '5000-14999', '15000-49999', '50000+'];
    scoreDistribution.forEach((bucket, index) => {
      if (index < ranges.length) {
        console.log(`- ${ranges[index]}分: ${bucket.count}条记录 (平均: ${Math.round(bucket.avgScore)}分)`);
      }
    });
    
    // 查询活跃设备（有多条记录的设备）
    console.log('\n🎮 活跃设备统计：');
    const activeDevices = await db.collection('gamerecords').aggregate([
      {
        $group: {
          _id: "$deviceId",
          gameCount: { $sum: 1 },
          totalScore: { $sum: "$score" },
          avgScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          lastPlayed: { $max: "$createdAt" }
        }
      },
      {
        $match: { gameCount: { $gt: 1 } }
      },
      {
        $sort: { gameCount: -1 }
      },
      {
        $limit: 5
      }
    ]).toArray();
    
    activeDevices.forEach((device, index) => {
      const lastPlayed = new Date(device.lastPlayed).toLocaleString('zh-CN');
      console.log(`${index + 1}. 设备 ${device._id.substring(0, 8)}... - ${device.gameCount}局游戏, 最高${device.maxScore}分, 平均${Math.round(device.avgScore)}分 (最后游戏: ${lastPlayed})`);
    });
    
    // 查询排行榜缓存
    console.log('\n🏅 当前排行榜缓存：');
    const rankingCache = await db.collection('rankingcache')
      .find({})
      .sort({ rankPosition: 1 })
      .toArray();
    
    if (rankingCache.length > 0) {
      rankingCache.forEach((entry) => {
        const cachedAt = new Date(entry.cachedAt).toLocaleString('zh-CN');
        console.log(`${entry.rankPosition}. 设备 ${entry.deviceId.substring(0, 8)}... - ${entry.score}分 (缓存时间: ${cachedAt})`);
      });
    } else {
      console.log('暂无排行榜缓存数据');
    }
    
  } catch (error) {
    console.error('❌ 数据查询失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行查询脚本
queryData();