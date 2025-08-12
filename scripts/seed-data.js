#!/usr/bin/env node

/**
 * 数据库种子数据脚本
 * 用于插入模拟游戏数据进行测试
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// 生成随机设备ID
function generateDeviceId() {
  return Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// 生成随机分数
function generateScore() {
  return Math.floor(Math.random() * 50000) + 1000;
}

// 生成随机日期（最近30天内）
function generateRandomDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
}

// 生成最近7天内的随机日期
function generateWeeklyDate() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime()));
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 连接到MongoDB成功');
    
    const db = mongoose.connection.db;
    
    // 清空现有数据
    console.log('🗑️ 清空现有数据...');
    await db.collection('gameRecords').deleteMany({});
    await db.collection('deviceStats').deleteMany({});
    
    // 生成设备列表
    const deviceCount = 100;
    const devices = Array.from({length: deviceCount}, () => generateDeviceId());
    
    console.log(`📱 生成 ${deviceCount} 个设备...`);
    
    // 为每个设备生成游戏记录和统计
    const gameRecords = [];
    const deviceStats = [];
    
    for (let i = 0; i < devices.length; i++) {
      const deviceId = devices[i];
      
      // 每个设备生成1-10条游戏记录，但只保留最高分
      const recordCount = Math.floor(Math.random() * 10) + 1;
      let bestScore = 0;
      let bestRecordDate = new Date();
      
      // 生成多条记录，找出最高分
      for (let j = 0; j < recordCount; j++) {
        const score = generateScore();
        const createdAt = i < 30 ? generateWeeklyDate() : generateRandomDate(); // 前30个设备有周榜数据
        
        if (score > bestScore) {
          bestScore = score;
          bestRecordDate = createdAt;
        }
      }
      
      // 只保存最高分记录
      gameRecords.push({
        deviceId,
        score: bestScore,
        createdAt: bestRecordDate
      });
      
      // 生成设备统计
      deviceStats.push({
        _id: deviceId,
        deviceId,
        bestScore,
        createdAt: bestRecordDate,
        updatedAt: bestRecordDate
      });
    }
    
    // 插入游戏记录
    console.log(`🎮 插入 ${gameRecords.length} 条游戏记录...`);
    await db.collection('gameRecords').insertMany(gameRecords);
    
    // 插入设备统计
    console.log(`📊 插入 ${deviceStats.length} 条设备统计...`);
    await db.collection('deviceStats').insertMany(deviceStats);
    
    // 创建索引
    console.log('📇 创建数据库索引...');
    
    // gameRecords 索引
    await db.collection('gameRecords').createIndex({ deviceId: 1 });
    await db.collection('gameRecords').createIndex({ score: -1 });
    await db.collection('gameRecords').createIndex({ createdAt: -1 });
    await db.collection('gameRecords').createIndex({ deviceId: 1, score: -1 });
    
    // deviceStats 索引
    await db.collection('deviceStats').createIndex({ bestScore: -1 });
    await db.collection('deviceStats').createIndex({ createdAt: -1 });
    
    // 统计信息
    const totalRecords = await db.collection('gameRecords').countDocuments();
    const totalDevices = await db.collection('deviceStats').countDocuments();
    const maxScore = Math.max(...deviceStats.map(d => d.bestScore));
    const weeklyRecords = await db.collection('gameRecords').countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    console.log('✅ 数据库种子数据生成完成！');
    console.log(`📈 统计信息:`);
    console.log(`   - 设备数量: ${totalDevices}`);
    console.log(`   - 游戏记录: ${totalRecords}`);
    console.log(`   - 最高分: ${maxScore}`);
    console.log(`   - 周榜记录数: ${weeklyRecords}`);
    
    // 显示排行榜预览
    console.log('\n🏆 总榜前5名:');
    const topAll = await db.collection('deviceStats')
      .find({})
      .sort({ bestScore: -1 })
      .limit(5)
      .toArray();
    
    topAll.forEach((record, index) => {
      console.log(`   ${index + 1}. 设备: ${record.deviceId.substring(0, 8)}... 分数: ${record.bestScore}`);
    });
    
    console.log('\n📅 周榜前5名:');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const topWeekly = await db.collection('gameRecords')
      .find({ createdAt: { $gte: weekAgo } })
      .sort({ score: -1 })
      .limit(5)
      .toArray();
    
    topWeekly.forEach((record, index) => {
      console.log(`   ${index + 1}. 设备: ${record.deviceId.substring(0, 8)}... 分数: ${record.score}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库种子数据生成失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 运行种子数据生成
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };