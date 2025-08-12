const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// 注册ts-node以支持TypeScript文件
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',  // Vite默认端口
    'http://localhost:8080',  // Vue CLI默认端口
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 简化的API路由加载器
const loadApiRoutes = () => {
  const apiRoutes = [
    { path: '/api/health', file: 'api/health.ts' },
    { path: '/api/game/submit', file: 'api/game/submit.ts' },
    { path: '/api/game/ranking', file: 'api/game/ranking.ts' }
  ];

  apiRoutes.forEach(({ path: routePath, file }) => {
     try {
       const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        delete require.cache[require.resolve(filePath)];
        const handler = require(filePath);
        const handlerFunc = handler.default || handler;
        
        if (typeof handlerFunc === 'function') {
          app.all(routePath, async (req, res) => {
             try {
               const vercelReq = {
                 ...req,
                 query: { ...req.query, ...req.params },
                 body: req.body
               };
               
               const vercelRes = {
                 status: (code) => { res.status(code); return vercelRes; },
                 json: (data) => { res.json(data); return vercelRes; },
                 send: (data) => { res.send(data); return vercelRes; },
                 setHeader: (name, value) => { res.setHeader(name, value); return vercelRes; }
               };
               
               await handlerFunc(vercelReq, vercelRes);
             } catch (error) {
               console.error(`API错误 ${routePath}:`, error);
               res.status(500).json({
                 success: false,
                 error: { code: 'INTERNAL_SERVER_ERROR', message: '服务器内部错误' },
                 timestamp: Date.now()
               });
             }
           });
           
           console.log(`✅ 已加载API路由: ${routePath}`);
        }
      }
    } catch (error) {
         console.error(`❌ 加载API路由失败 ${routePath}:`, error.message);
       }
  });
};

// 加载所有API路由
console.log('🚀 正在加载API路由...');
loadApiRoutes();

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));

// 健康检查路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '手势飞机大战后端服务运行中',
    timestamp: Date.now(),
    version: '1.0.0',
    environment: 'development',
    testPage: 'http://localhost:3000/public/test.html'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${req.originalUrl} 不存在`
    },
    timestamp: Date.now()
  });
});

// 错误处理中间件
app.use((error, req, res) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误'
    },
    timestamp: Date.now()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('🎮 手势飞机大战后端服务已启动');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/`);
  console.log(`🎯 API文档: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 可用的API接口:');
  console.log('  GET  /api/health              - 健康检查');
  console.log('  POST /api/game/submit         - 提交游戏成绩');
  console.log('  GET  /api/game/ranking        - 获取排行榜');
  console.log('');
  console.log('💡 前端联调示例:');
  console.log(`  curl http://localhost:${PORT}/api/health`);
  console.log(`  curl http://localhost:${PORT}/api/game/ranking`);
  console.log('');
  console.log('🔧 环境配置:');
  console.log(`  MongoDB: ${process.env.MONGODB_URI || '未配置'}`);
  console.log(`  Redis: ${process.env.REDIS_URL || '未配置'}`);
  console.log(`  调试模式: ${process.env.DEBUG_MODE || 'false'}`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});