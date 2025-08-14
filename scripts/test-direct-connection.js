#!/usr/bin/env node

/**
 * 直接连接测试脚本
 * 使用SRV记录中的实际主机地址进行连接测试
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// 从SRV记录获取的实际主机地址
const directHosts = [
  'ac-e1k0aoa-shard-00-00.xjmtcqp.mongodb.net:27017',
  'ac-e1k0aoa-shard-00-01.xjmtcqp.mongodb.net:27017',
  'ac-e1k0aoa-shard-00-02.xjmtcqp.mongodb.net:27017'
];

// 构建直接连接字符串
const username = 's707365172';
const password = '2UY299CVZc1sgAUp';
const database = 'vibe_coding_game';

async function testDirectConnection() {
  console.log('🔗 测试直接连接到MongoDB Atlas分片...');
  
  for (let i = 0; i < directHosts.length; i++) {
    const host = directHosts[i];
    console.log(`\n📡 测试连接到分片 ${i + 1}: ${host}`);
    
    // 构建直接连接URI
    const directUri = `mongodb://${username}:${password}@${host}/${database}?authSource=admin&retryWrites=true&w=majority`;
    
    try {
      console.log('   正在连接...');
      
      await mongoose.connect(directUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 1
      });
      
      console.log('   ✅ 连接成功!');
      
      // 测试简单操作
      const db = mongoose.connection.db;
      const result = await db.admin().ping();
      console.log('   ✅ 数据库响应正常:', result);
      
      await mongoose.disconnect();
      console.log('\n🎉 找到可用的连接! 分片', i + 1, '工作正常');
      return true;
      
    } catch (error) {
      console.log('   ❌ 连接失败:', error.message);
      
      // 确保断开连接
      try {
        await mongoose.disconnect();
      } catch (e) {
        // 忽略断开连接的错误
      }
    }
  }
  
  console.log('\n❌ 所有分片连接都失败了');
  return false;
}

async function testOriginalConnection() {
  console.log('\n🔗 测试原始SRV连接...');
  
  const originalUri = process.env.MONGODB_URI;
  
  try {
    console.log('正在使用原始连接字符串连接...');
    
    await mongoose.connect(originalUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 1
    });
    
    console.log('✅ 原始连接成功!');
    
    const db = mongoose.connection.db;
    const result = await db.admin().ping();
    console.log('✅ 数据库响应正常:', result);
    
    await mongoose.disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ 原始连接失败:', error.message);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // 忽略断开连接的错误
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 MongoDB Atlas 直接连接测试\n');
  
  // 首先测试原始连接
  const originalSuccess = await testOriginalConnection();
  
  if (originalSuccess) {
    console.log('\n🎉 原始连接工作正常! 问题可能已经解决。');
    return;
  }
  
  // 如果原始连接失败，尝试直接连接
  const directSuccess = await testDirectConnection();
  
  if (directSuccess) {
    console.log('\n💡 建议: 直接连接可以工作，但SRV连接失败。');
    console.log('这可能是DNS解析问题。尝试以下解决方案:');
    console.log('1. 更换DNS服务器 (8.8.8.8, 1.1.1.1)');
    console.log('2. 刷新DNS缓存');
    console.log('3. 检查网络代理设置');
  } else {
    console.log('\n❌ 所有连接方式都失败了。');
    console.log('请检查:');
    console.log('1. MongoDB Atlas集群状态');
    console.log('2. IP白名单设置');
    console.log('3. 用户名和密码');
    console.log('4. 网络连接');
  }
}

// 运行测试
main().catch(console.error);