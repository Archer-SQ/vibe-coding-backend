import { connectDatabase, disconnectDatabase } from '../lib/database/connection';
import { cacheService } from '../lib/services/cacheservice';

// 测试环境配置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedb_test';
  process.env.MONGODB_DB_NAME = 'gamedb_test';
  process.env.DEBUG_MODE = 'true';
  
  // 连接测试数据库
  try {
    await connectDatabase();
    console.log('✅ 测试数据库连接成功');
  } catch (error) {
    console.error('❌ 测试数据库连接失败:', error);
    throw error;
  }
});

// 测试结束后清理
afterAll(async () => {
  try {
    // 清理缓存服务资源
    cacheService.cleanup();
    
    // 关闭数据库连接
    await disconnectDatabase();
    console.log('✅ 测试数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭测试数据库连接失败:', error);
  }
});

// 每个测试前的清理
beforeEach(async () => {
  // 这里可以添加每个测试前的数据清理逻辑
});

// 每个测试后的清理
afterEach(async () => {
  // 这里可以添加每个测试后的数据清理逻辑
});