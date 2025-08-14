#!/usr/bin/env node

/**
 * 网络故障排除脚本
 * 专门用于诊断MongoDB Atlas连接问题
 */

require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const { promisify } = require('util');
const https = require('https');

const lookup = promisify(dns.lookup);
const resolveSrv = promisify(dns.resolveSrv);

async function checkNetworkStatus() {
  console.log('🌐 网络状态全面检查\n');
  
  // 1. 检查多个IP服务
  console.log('📍 检查当前公网IP地址:');
  const ipServices = [
    'https://ipinfo.io/ip',
    'https://api.ipify.org',
    'https://ifconfig.me/ip',
    'https://icanhazip.com'
  ];
  
  for (const service of ipServices) {
    try {
      const ip = await getIPFromService(service);
      console.log(`   ✅ ${service}: ${ip}`);
    } catch (error) {
      console.log(`   ❌ ${service}: 失败 - ${error.message}`);
    }
  }
  
  // 2. 检查DNS服务器
  console.log('\n🔍 检查DNS服务器配置:');
  try {
    const dnsServers = dns.getServers();
    console.log('   当前DNS服务器:', dnsServers.join(', '));
  } catch (error) {
    console.log('   ❌ 无法获取DNS服务器配置');
  }
  
  // 3. 测试不同DNS服务器的解析
  console.log('\n🔍 测试不同DNS服务器解析MongoDB域名:');
  const testDNSServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
  const hostname = 'cluster0.xjmtcqp.mongodb.net';
  
  for (const dnsServer of testDNSServers) {
    try {
      dns.setServers([dnsServer]);
      const address = await lookup(hostname);
      console.log(`   ✅ ${dnsServer}: ${address.address}`);
    } catch (error) {
      console.log(`   ❌ ${dnsServer}: 解析失败 - ${error.code}`);
    }
  }
  
  // 恢复原始DNS设置
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  
  // 4. 检查网络连通性
  console.log('\n🔗 检查网络连通性:');
  const testHosts = [
    'google.com',
    'mongodb.com',
    'atlas.mongodb.com'
  ];
  
  for (const host of testHosts) {
    try {
      const address = await lookup(host);
      console.log(`   ✅ ${host}: 可达 (${address.address})`);
    } catch (error) {
      console.log(`   ❌ ${host}: 不可达 - ${error.code}`);
    }
  }
  
  // 5. 检查MongoDB Atlas特定域名
  console.log('\n🍃 检查MongoDB Atlas域名解析:');
  const mongoHosts = [
    'cluster0.xjmtcqp.mongodb.net',
    'ac-e1k0aoa-shard-00-00.xjmtcqp.mongodb.net',
    'ac-e1k0aoa-shard-00-01.xjmtcqp.mongodb.net',
    'ac-e1k0aoa-shard-00-02.xjmtcqp.mongodb.net'
  ];
  
  for (const host of mongoHosts) {
    try {
      const address = await lookup(host);
      console.log(`   ✅ ${host}: ${address.address}`);
    } catch (error) {
      console.log(`   ❌ ${host}: 解析失败 - ${error.code}`);
    }
  }
  
  // 6. 检查SRV记录
  console.log('\n📋 检查SRV记录:');
  try {
    const srvRecords = await resolveSrv('_mongodb._tcp.cluster0.xjmtcqp.mongodb.net');
    console.log(`   ✅ 找到 ${srvRecords.length} 个SRV记录:`);
    srvRecords.forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.name}:${record.port} (优先级: ${record.priority})`);
    });
  } catch (error) {
    console.log(`   ❌ SRV记录解析失败: ${error.code}`);
  }
  
  // 7. 生成诊断报告
  console.log('\n📊 诊断报告和建议:');
  console.log('\n🔧 可能的解决方案:');
  console.log('\n1. MongoDB Atlas控制台检查:');
  console.log('   • 登录 https://cloud.mongodb.com');
  console.log('   • 检查集群状态是否为 "Active"');
  console.log('   • 验证Network Access中的IP白名单');
  console.log('   • 确认Database Access中的用户权限');
  
  console.log('\n2. 网络配置检查:');
  console.log('   • 确认已完全关闭VPN/代理软件');
  console.log('   • 尝试使用手机热点测试连接');
  console.log('   • 检查公司/学校防火墙设置');
  
  console.log('\n3. DNS配置优化:');
  console.log('   • 更换DNS服务器为 8.8.8.8, 1.1.1.1');
  console.log('   • 清除DNS缓存');
  console.log('   • 重启网络适配器');
  
  console.log('\n4. 连接字符串验证:');
  console.log('   • 从Atlas控制台重新复制连接字符串');
  console.log('   • 确认用户名和密码正确');
  console.log('   • 检查数据库名称是否正确');
  
  console.log('\n5. 临时解决方案:');
  console.log('   • 尝试使用不同的网络环境');
  console.log('   • 联系网络管理员检查端口27017是否被阻止');
  console.log('   • 考虑使用MongoDB Atlas的HTTP API作为备选方案');
}

function getIPFromService(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data.trim());
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 运行检查
checkNetworkStatus().catch(console.error);