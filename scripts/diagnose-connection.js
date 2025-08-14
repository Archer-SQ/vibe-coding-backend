#!/usr/bin/env node

/**
 * MongoDB Atlas 连接诊断脚本
 * 全面检查连接问题的各个方面
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const dns = require('dns');
const { promisify } = require('util');
const https = require('https');

const lookup = promisify(dns.lookup);
const resolve = promisify(dns.resolve);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `🔍 ${title}`);
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log('blue', `${step}. ${message}`);
}

function logSuccess(message) {
  log('green', `✅ ${message}`);
}

function logError(message) {
  log('red', `❌ ${message}`);
}

function logWarning(message) {
  log('yellow', `⚠️  ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function checkEnvironmentVariables() {
  logSection('环境变量检查');
  
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  
  if (!mongoUri) {
    logError('MONGODB_URI 环境变量未设置');
    return false;
  }
  
  if (!dbName) {
    logWarning('MONGODB_DB_NAME 环境变量未设置');
  }
  
  logSuccess('环境变量检查通过');
  logInfo(`连接URI: ${mongoUri}`);
  logInfo(`数据库名: ${dbName || '未设置'}`);
  
  return { mongoUri, dbName };
}

function parseConnectionString(uri) {
  logSection('连接字符串解析');
  
  try {
    const parsed = new URL(uri);
    const hostname = parsed.hostname;
    const port = parsed.port || (parsed.protocol === 'mongodb+srv:' ? 27017 : 27017);
    const isSRV = parsed.protocol === 'mongodb+srv:';
    
    logSuccess('连接字符串解析成功');
    logInfo(`协议: ${parsed.protocol}`);
    logInfo(`主机名: ${hostname}`);
    logInfo(`端口: ${port}`);
    logInfo(`SRV记录: ${isSRV ? '是' : '否'}`);
    
    return { hostname, port, isSRV, parsed };
  } catch (error) {
    logError(`连接字符串解析失败: ${error.message}`);
    return null;
  }
}

async function checkDNSResolution(hostname, isSRV) {
  logSection('DNS 解析检查');
  
  try {
    // 检查基本DNS解析
    logStep(1, '检查基本DNS解析');
    try {
      const result = await lookup(hostname);
      logSuccess(`DNS解析成功: ${hostname} -> ${result.address}`);
    } catch (error) {
      logError(`DNS解析失败: ${error.message}`);
      
      // 尝试使用不同的DNS服务器
      logStep(2, '尝试使用Google DNS (8.8.8.8)');
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      
      try {
        const result = await lookup(hostname);
        logSuccess(`使用Google DNS解析成功: ${hostname} -> ${result.address}`);
      } catch (googleError) {
        logError(`使用Google DNS也解析失败: ${googleError.message}`);
      }
    }
    
    // 如果是SRV记录，检查SRV解析
    if (isSRV) {
      logStep(3, '检查SRV记录解析');
      try {
        const srvRecords = await resolve(hostname, 'SRV');
        logSuccess(`SRV记录解析成功，找到 ${srvRecords.length} 个记录`);
        srvRecords.forEach((record, index) => {
          logInfo(`  SRV ${index + 1}: ${record.name}:${record.port} (优先级: ${record.priority})`);
        });
      } catch (srvError) {
        logError(`SRV记录解析失败: ${srvError.message}`);
      }
    }
    
  } catch (error) {
    logError(`DNS检查过程中发生错误: ${error.message}`);
  }
}

async function checkNetworkConnectivity() {
  logSection('网络连接检查');
  
  // 检查基本网络连接
  logStep(1, '检查基本网络连接 (ping Google DNS)');
  
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const ping = spawn('ping', ['-c', '3', '8.8.8.8']);
    
    let output = '';
    ping.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ping.on('close', (code) => {
      if (code === 0) {
        logSuccess('网络连接正常');
      } else {
        logError('网络连接异常');
        logInfo(output);
      }
      resolve(code === 0);
    });
  });
}

async function checkPublicIP() {
  logSection('公网IP检查');
  
  return new Promise((resolve) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        logSuccess(`当前公网IP: ${data}`);
        logInfo('请确保此IP已添加到MongoDB Atlas白名单中');
        resolve(data);
      });
    }).on('error', (error) => {
      logError(`获取公网IP失败: ${error.message}`);
      resolve(null);
    });
  });
}

async function testMongoDBConnection(mongoUri) {
  logSection('MongoDB 连接测试');
  
  try {
    logStep(1, '尝试连接到MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1
    });
    logSuccess('MongoDB连接成功！');
    
    logStep(2, '测试数据库操作...');
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // 获取服务器状态
    const serverStatus = await adminDb.serverStatus();
    logSuccess(`服务器版本: ${serverStatus.version}`);
    logSuccess(`服务器正常运行时间: ${Math.floor(serverStatus.uptime / 3600)} 小时`);
    
    // 列出数据库
    const databases = await adminDb.listDatabases();
    logSuccess(`可访问的数据库数量: ${databases.databases.length}`);
    
    return true;
    
  } catch (error) {
    logError(`MongoDB连接失败: ${error.message}`);
    
    // 分析错误类型
    if (error.message.includes('ENOTFOUND')) {
      logWarning('错误分析: DNS解析失败，主机名无法解析');
      logInfo('建议: 检查网络连接和DNS设置');
    } else if (error.message.includes('ECONNREFUSED')) {
      logWarning('错误分析: 连接被拒绝');
      logInfo('建议: 检查IP白名单设置');
    } else if (error.message.includes('authentication failed')) {
      logWarning('错误分析: 认证失败');
      logInfo('建议: 检查用户名和密码');
    } else if (error.message.includes('timeout')) {
      logWarning('错误分析: 连接超时');
      logInfo('建议: 检查网络连接和防火墙设置');
    }
    
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

async function generateRecommendations(results) {
  logSection('问题诊断和建议');
  
  const { dnsOk, networkOk, connectionOk, publicIP } = results;
  
  if (connectionOk) {
    logSuccess('🎉 连接测试通过！数据库连接正常。');
    return;
  }
  
  logError('连接失败，以下是可能的解决方案：');
  
  if (!networkOk) {
    log('red', '\n1. 网络连接问题');
    logInfo('   • 检查网络连接是否正常');
    logInfo('   • 确认防火墙设置');
    logInfo('   • 尝试使用其他网络环境');
  }
  
  if (!dnsOk) {
    log('red', '\n2. DNS解析问题');
    logInfo('   • 更换DNS服务器 (如 8.8.8.8, 1.1.1.1)');
    logInfo('   • 检查是否使用了代理或VPN');
    logInfo('   • 尝试刷新DNS缓存');
  }
  
  log('red', '\n3. MongoDB Atlas 配置问题');
  logInfo('   • 检查集群状态是否为 Active');
  logInfo('   • 确认连接字符串是否正确');
  logInfo('   • 验证数据库用户权限');
  
  if (publicIP) {
    log('red', '\n4. IP白名单问题');
    logInfo(`   • 将当前IP ${publicIP} 添加到白名单`);
    logInfo('   • 或者临时使用 0.0.0.0/0 (仅测试用)');
  }
  
  log('red', '\n5. 代理/VPN问题');
  logInfo('   • 如果使用了代理或VPN，尝试关闭后重试');
  logInfo('   • 配置代理例外规则，将 *.mongodb.net 设为直连');
  
  log('yellow', '\n💡 快速解决步骤:');
  logInfo('1. 关闭代理/VPN软件');
  logInfo('2. 重新获取公网IP并添加到Atlas白名单');
  logInfo('3. 从Atlas控制台重新获取连接字符串');
  logInfo('4. 重新运行此诊断脚本');
}

async function main() {
  console.log('\n🚀 MongoDB Atlas 连接诊断工具');
  console.log('此工具将全面检查连接问题并提供解决建议\n');
  
  const results = {};
  
  // 1. 检查环境变量
  const envCheck = await checkEnvironmentVariables();
  if (!envCheck) {
    process.exit(1);
  }
  
  // 2. 解析连接字符串
  const parseResult = parseConnectionString(envCheck.mongoUri);
  if (!parseResult) {
    process.exit(1);
  }
  
  // 3. 检查DNS解析
  await checkDNSResolution(parseResult.hostname, parseResult.isSRV);
  
  // 4. 检查网络连接
  results.networkOk = await checkNetworkConnectivity();
  
  // 5. 检查公网IP
  results.publicIP = await checkPublicIP();
  
  // 6. 测试MongoDB连接
  results.connectionOk = await testMongoDBConnection(envCheck.mongoUri);
  
  // 7. 生成建议
  await generateRecommendations(results);
  
  console.log('\n' + '='.repeat(60));
  log('cyan', '诊断完成！');
  console.log('='.repeat(60));
}

// 运行诊断
main().catch(error => {
  logError(`诊断过程中发生未预期的错误: ${error.message}`);
  console.error(error);
  process.exit(1);
});