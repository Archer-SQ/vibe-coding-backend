#!/usr/bin/env node

const https = require('https');
const dns = require('dns');
const { promisify } = require('util');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const lookup = promisify(dns.lookup);
const resolveSrv = promisify(dns.resolveSrv);

// 获取公网IP
async function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.ip);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// 解析MongoDB连接字符串
function parseMongoURI(uri) {
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.*?)\?/);
  if (!match) {
    throw new Error('无法解析MongoDB连接字符串');
  }
  
  return {
    username: match[1],
    password: match[2],
    cluster: match[3],
    database: match[4].split('?')[0] || 'test'
  };
}

// 测试DNS解析
async function testDNSResolution(hostname) {
  try {
    const result = await lookup(hostname);
    return { success: true, ip: result.address };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试SRV记录
async function testSRVRecord(hostname) {
  try {
    const records = await resolveSrv(`_mongodb._tcp.${hostname}`);
    return { success: true, records };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试MongoDB连接
async function testMongoConnection(uri, timeout = 10000) {
  try {
    const connection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
      maxPoolSize: 1
    });
    
    await connection.close();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  console.log('\n============================================================');
  console.log('🔍 MongoDB Atlas 配置验证工具');
  console.log('============================================================\n');

  try {
    // 1. 获取当前IP
    console.log('📍 获取当前公网IP...');
    const currentIP = await getPublicIP();
    console.log(`✅ 当前公网IP: ${currentIP}`);

    // 2. 解析连接字符串
    console.log('\n🔗 解析MongoDB连接字符串...');
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('未找到MONGODB_URI环境变量');
    }
    
    const config = parseMongoURI(mongoURI);
    console.log(`✅ 集群地址: ${config.cluster}`);
    console.log(`✅ 用户名: ${config.username}`);
    console.log(`✅ 数据库: ${config.database}`);

    // 3. 测试DNS解析
    console.log('\n🌐 测试DNS解析...');
    const dnsResult = await testDNSResolution(config.cluster);
    if (dnsResult.success) {
      console.log(`✅ 主域名解析成功: ${dnsResult.ip}`);
    } else {
      console.log(`❌ 主域名解析失败: ${dnsResult.error}`);
    }

    // 4. 测试SRV记录
    console.log('\n📋 测试SRV记录...');
    const srvResult = await testSRVRecord(config.cluster);
    if (srvResult.success) {
      console.log(`✅ SRV记录解析成功，找到 ${srvResult.records.length} 个分片:`);
      srvResult.records.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.name}:${record.port}`);
      });
    } else {
      console.log(`❌ SRV记录解析失败: ${srvResult.error}`);
    }

    // 5. 测试MongoDB连接
    console.log('\n🍃 测试MongoDB连接...');
    const connectionResult = await testMongoConnection(mongoURI);
    if (connectionResult.success) {
      console.log('✅ MongoDB连接成功！');
    } else {
      console.log(`❌ MongoDB连接失败: ${connectionResult.error}`);
    }

    // 6. 生成诊断报告
    console.log('\n============================================================');
    console.log('📊 诊断报告');
    console.log('============================================================');
    
    if (!connectionResult.success) {
      console.log('\n❌ 连接失败分析:');
      
      if (connectionResult.error.includes('IP that isn\'t whitelisted')) {
        console.log('\n🚫 IP白名单问题:');
        console.log(`   • 当前IP ${currentIP} 未在MongoDB Atlas白名单中`);
        console.log('   • 解决方案:');
        console.log('     1. 登录 https://cloud.mongodb.com');
        console.log('     2. 选择你的项目和集群');
        console.log('     3. 点击 "Network Access" 标签');
        console.log(`     4. 添加IP地址: ${currentIP}`);
        console.log('     5. 或临时添加 0.0.0.0/0 (仅用于测试)');
      }
      
      if (!dnsResult.success && srvResult.success) {
        console.log('\n🌐 DNS解析问题:');
        console.log('   • 主域名无法解析，但SRV记录正常');
        console.log('   • 这通常是DNS缓存或网络配置问题');
        console.log('   • 建议:');
        console.log('     1. 更换DNS服务器 (8.8.8.8, 1.1.1.1)');
        console.log('     2. 清除DNS缓存');
        console.log('     3. 重启网络连接');
      }
      
      if (connectionResult.error.includes('authentication')) {
        console.log('\n🔐 认证问题:');
        console.log('   • 用户名或密码错误');
        console.log('   • 检查Database Access中的用户配置');
      }
    }

    console.log('\n💡 下一步建议:');
    if (!connectionResult.success) {
      console.log('   1. 首先解决IP白名单问题');
      console.log('   2. 确认集群状态为Active');
      console.log('   3. 验证数据库用户权限');
      console.log('   4. 重新运行此脚本验证');
    } else {
      console.log('   ✅ 配置正确，可以正常使用MongoDB Atlas');
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
  }

  console.log('\n============================================================');
  console.log('验证完成！');
  console.log('============================================================\n');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };