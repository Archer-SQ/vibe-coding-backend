#!/usr/bin/env node

/**
 * 使用IP地址直接连接测试
 * 绕过DNS解析问题
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// 从网络诊断获取的实际IP地址
const shardIPs = [
  { host: 'ac-e1k0aoa-shard-00-00.xjmtcqp.mongodb.net', ip: '89.192.8.224' },
  { host: 'ac-e1k0aoa-shard-00-01.xjmtcqp.mongodb.net', ip: '89.192.8.243' },
  { host: 'ac-e1k0aoa-shard-00-02.xjmtcqp.mongodb.net', ip: '89.192.8.233' }
];

const username = 's707365172';
const password = 'KXWaMkFmhOUGNX1x';
const database = 'vibe_coding_game';

async function testIPConnection() {
  console.log('🔗 使用IP地址直接连接测试\n');
  
  for (let i = 0; i < shardIPs.length; i++) {
    const shard = shardIPs[i];
    console.log(`📡 测试分片 ${i + 1}: ${shard.host} (${shard.ip})`);
    
    // 构建使用IP地址的连接URI
    const ipUri = `mongodb://${username}:${password}@${shard.ip}:27017/${database}?authSource=admin&retryWrites=true&w=majority&ssl=true`;
    
    try {
      console.log('   正在连接...');
      
      await mongoose.connect(ipUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 1
      });
      
      console.log('   ✅ IP连接成功!');
      
      // 测试数据库操作
      const db = mongoose.connection.db;
      const result = await db.admin().ping();
      console.log('   ✅ 数据库响应正常:', result);
      
      // 测试集合操作
      const collections = await db.listCollections().toArray();
      console.log(`   📊 数据库中有 ${collections.length} 个集合`);
      
      await mongoose.disconnect();
      console.log('\n🎉 IP直连成功! 这证明网络连接正常，问题在于DNS解析');
      return true;
      
    } catch (error) {
      console.log('   ❌ IP连接失败:', error.message);
      
      // 确保断开连接
      try {
        await mongoose.disconnect();
      } catch (e) {
        // 忽略断开连接的错误
      }
    }
  }
  
  console.log('\n❌ 所有IP连接都失败了');
  return false;
}

async function testHostnameConnection() {
  console.log('\n🔗 测试主机名连接（对比）...');
  
  for (let i = 0; i < shardIPs.length; i++) {
    const shard = shardIPs[i];
    console.log(`📡 测试分片 ${i + 1}: ${shard.host}`);
    
    // 构建使用主机名的连接URI
    const hostUri = `mongodb://${username}:${password}@${shard.host}:27017/${database}?authSource=admin&retryWrites=true&w=majority&ssl=true`;
    
    try {
      console.log('   正在连接...');
      
      await mongoose.connect(hostUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 1
      });
      
      console.log('   ✅ 主机名连接成功!');
      
      await mongoose.disconnect();
      return true;
      
    } catch (error) {
      console.log('   ❌ 主机名连接失败:', error.message);
      
      try {
        await mongoose.disconnect();
      } catch (e) {
        // 忽略断开连接的错误
      }
    }
  }
  
  return false;
}

async function testOriginalSRVConnection() {
  console.log('\n🔗 测试原始SRV连接...');
  
  const originalUri = process.env.MONGODB_URI;
  
  try {
    console.log('正在使用原始SRV连接字符串连接...');
    
    await mongoose.connect(originalUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 1
    });
    
    console.log('✅ SRV连接成功!');
    await mongoose.disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ SRV连接失败:', error.message);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // 忽略断开连接的错误
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 MongoDB Atlas 连接方式对比测试\n');
  
  // 1. 测试原始SRV连接
  const srvSuccess = await testOriginalSRVConnection();
  
  if (srvSuccess) {
    console.log('\n🎉 SRV连接正常工作! 问题已解决。');
    return;
  }
  
  // 2. 测试主机名连接
  const hostnameSuccess = await testHostnameConnection();
  
  // 3. 测试IP直连
  const ipSuccess = await testIPConnection();
  
  // 4. 生成诊断结果
  console.log('\n📊 测试结果总结:');
  console.log(`   SRV连接: ${srvSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   主机名连接: ${hostnameSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   IP直连: ${ipSuccess ? '✅ 成功' : '❌ 失败'}`);
  
  if (ipSuccess && !hostnameSuccess) {
    console.log('\n💡 诊断结论: DNS解析问题');
    console.log('   • 网络连接正常，可以直接访问MongoDB服务器');
    console.log('   • 问题出现在DNS解析环节');
    console.log('   • 建议更换DNS服务器或联系网络管理员');
  } else if (!ipSuccess) {
    console.log('\n💡 诊断结论: 网络连接问题');
    console.log('   • 无法直接访问MongoDB服务器');
    console.log('   • 可能是防火墙、代理或IP白名单问题');
    console.log('   • 建议检查MongoDB Atlas的网络访问设置');
  }
  
  console.log('\n🔧 建议的解决步骤:');
  console.log('1. 登录MongoDB Atlas控制台验证集群状态');
  console.log('2. 确认IP白名单包含当前IP: 45.61.224.13');
  console.log('3. 尝试使用不同的网络环境（如手机热点）');
  console.log('4. 联系网络管理员检查端口27017的访问权限');
  console.log('5. 考虑更换DNS服务器为8.8.8.8或1.1.1.1');
}

// 运行测试
main().catch(console.error);