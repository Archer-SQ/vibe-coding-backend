#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function simpleTest() {
  console.log('🔄 开始简单连接测试...');
  
  try {
    // 最简单的连接配置
    const options = {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 1,
      retryWrites: true,
      w: 'majority'
    };

    console.log('📡 正在连接到MongoDB Atlas...');
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, options);
    
    console.log('✅ 连接建立成功！');
    console.log('🔗 连接状态:', connection.readyState);
    
    // 等待连接完全建立
    if (connection.readyState !== 1) {
      console.log('⏳ 等待连接完全建立...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('连接超时'));
        }, 10000);
        
        connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    
    console.log('🔗 最终连接状态:', connection.readyState);
    
    // 简单的ping测试
    if (connection.db) {
      const admin = connection.db.admin();
      const pingResult = await admin.ping();
      console.log('🏓 Ping测试:', pingResult);
      
      // 列出数据库
      const databases = await admin.listDatabases();
      console.log('📊 可用数据库:', databases.databases.map(db => db.name));
    } else {
      console.log('⚠️ 数据库对象未就绪，跳过高级测试');
    }
    
    console.log('✅ 所有测试通过！');
    
    await connection.close();
    console.log('🔌 连接已关闭');
    
  } catch (error) {
    console.error('❌ 连接测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.cause) {
      console.error('根本原因:', error.cause.message);
    }
    
    // 分析错误类型
    if (error.message.includes('ECONNRESET')) {
      console.log('\n💡 网络连接被重置，可能的原因:');
      console.log('   • 网络不稳定');
      console.log('   • VPN或代理问题');
      console.log('   • 防火墙阻止连接');
      console.log('   • MongoDB Atlas服务器问题');
    }
    
    if (error.message.includes('whitelisted')) {
      console.log('\n💡 IP白名单问题:');
      console.log('   • 检查MongoDB Atlas的Network Access设置');
      console.log('   • 确认当前IP已添加到白名单');
    }
    
    process.exit(1);
  }
}

simpleTest();