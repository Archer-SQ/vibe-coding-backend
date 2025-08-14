#!/usr/bin/env node

/**
 * MongoDB连接测试脚本
 * 用于验证本地MongoDB连接是否正常
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('🔄 正在连接MongoDB...');
    console.log('连接URI:', process.env.MONGODB_URI);
    
    // 连接配置
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // 增加超时时间
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    // 使用createConnection方式（与验证脚本一致）
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, options);
    
    console.log('✅ MongoDB连接成功！');
    
    // 等待连接完全建立
    await new Promise((resolve) => {
      if (connection.readyState === 1) {
        resolve();
      } else {
        connection.once('connected', resolve);
      }
    });
    
    console.log('数据库名称:', connection.db?.databaseName || 'unknown');
    console.log('连接状态:', connection.readyState);
    
    // 测试基本操作
    const collections = await connection.db.listCollections().toArray();
    console.log('📊 现有集合:', collections.map(c => c.name));
    
    // 创建测试集合（如果不存在）
    const testCollection = connection.db.collection('test');
    await testCollection.insertOne({ 
      message: 'Hello MongoDB!', 
      timestamp: new Date(),
      source: 'connection-test'
    });
    
    console.log('✅ 数据写入测试成功！');
    
    // 清理测试数据
    await testCollection.deleteMany({ source: 'connection-test' });
    console.log('🧹 测试数据已清理');
    
    // 关闭连接
    await connection.close();
    console.log('🔌 连接已关闭');
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 解决建议:');
      console.log('1. 确保MongoDB服务正在运行');
      console.log('2. 检查MongoDB Compass是否已启动');
      console.log('3. 验证连接地址: mongodb://localhost:27017');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
testConnection();