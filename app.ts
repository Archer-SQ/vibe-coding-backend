import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// 导入路由处理器
import healthHandler from './routes/health';
import submitHandler from './routes/game/submit';
import rankingHandler from './routes/game/ranking';

// 加载环境变量
if (process.env.NODE_ENV === 'production') {
  // 生产环境使用系统环境变量
  dotenv.config();
} else {
  // 开发环境使用本地配置文件
  dotenv.config({ path: '.env.local' });
}

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// 压缩中间件
app.use(compression());

// CORS配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 开发环境：允许所有localhost和127.0.0.1的端口
    if (process.env.NODE_ENV === 'development') {
      if (!origin || 
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
          ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 
           'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 
           'http://127.0.0.1:5173', 'http://127.0.0.1:8080'].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // 生产环境：允许特定域名
      const allowedOrigins = [
        'https://vibe-coding-frontend.vercel.app',
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// API路由
app.get('/api/health', healthHandler);
app.post('/api/game/submit', submitHandler);
app.get('/api/game/ranking', rankingHandler);

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));

// 根路径
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: '手势飞机大战后端服务',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health - 健康检查',
      'POST /api/game/submit - 提交游戏成绩',
      'GET /api/game/ranking - 获取排行榜'
    ]
  });
});

// 404处理
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.originalUrl} 不存在`
    },
    timestamp: Date.now()
  });
});

// 错误处理中间件
app.use((error: Error, req: Request, res: Response) => {
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
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功`);
    console.log(`📍 本地地址: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    console.log('\n📋 可用的API端点:');
    console.log('  GET  /api/health        - 健康检查');
    console.log('  POST /api/game/submit   - 提交游戏成绩');
    console.log('  GET  /api/game/ranking  - 获取排行榜');
    console.log('\n✅ 服务器就绪，等待请求...');
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('\n🛑 收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
  });
}

export default app;