## 一、项目简介

- 📌 **项目名称**：手势飞机大战后端服务
- 🎯 **项目目标**：为前端游戏提供数据存储、排行榜、统计分析等后端服务
- 👤 **用户模式**：游客模式（基于设备ID标识用户）
- 🔐 **认证方式**：设备指纹识别，无需注册登录
- 📊 **核心功能**：游戏记录存储、排行榜管理、数据统计、离线数据同步
- 🚀 **部署方式**：Serverless 架构，支持自动扩缩容

## 二、技术选型

### 2.1 核心技术栈
- **主语言**：TypeScript（强类型，提升可维护性）
- **运行时**：Node.js 18+
- **Web框架**：Express.js + Serverless Functions
- **数据库**：MongoDB（主库）+ Redis（缓存）
- **ODM**：Mongoose（类型安全的MongoDB访问）
- **部署平台**：Railway（Node.js 应用）
- **数据库服务**：MongoDB Atlas（云端MongoDB服务）
- **缓存服务**：Upstash Redis（Serverless Redis）

### 2.2 开发工具
- **包管理**：pnpm
- **代码规范**：ESLint + Prettier
- **类型检查**：TypeScript strict mode
- **测试框架**：Jest + Supertest
- **API文档**：OpenAPI
- **监控日志**：Winston + Railway 内置监控

### 2.3 第三方服务
- **CDN**：Railway 内置 CDN
- **监控**：Sentry（错误追踪）
- **分析**：Railway 内置分析

## 三、目录结构

```
backend/
├── routes/                        # Express 路由
│   ├── game.ts                   # 游戏相关路由
│   ├── health.ts                 # 健康检查路由
│   └── sync.ts                   # 数据同步路由
├── lib/                          # 核心业务逻辑
│   ├── database/
│   │   ├── connection.ts        # MongoDB连接配置
│   │   ├── models/              # Mongoose数据模型
│   │   │   ├── GameRecord.ts    # 游戏记录模型
│   │   │   ├── DeviceStats.ts   # 设备统计模型
│   │   │   └── RankingCache.ts  # 排行榜缓存模型
│   │   └── schemas/             # MongoDB Schema定义
│   ├── services/
│   │   ├── gameService.ts       # 游戏数据服务
│   │   ├── rankingService.ts    # 排行榜服务
│   │   ├── statsService.ts      # 统计服务
│   │   └── cacheService.ts      # 缓存服务
│   ├── utils/
│   │   ├── deviceId.ts          # 设备ID验证工具
│   │   ├── validation.ts        # 数据验证工具
│   │   ├── response.ts          # 统一响应格式
│   │   └── logger.ts            # 日志工具
│   └── types/
│       ├── api.ts               # API类型定义
│       ├── game.ts              # 游戏数据类型
│       └── database.ts          # 数据库类型
├── config/
│   ├── database.ts              # MongoDB配置
│   └── seed.ts                  # 数据库种子数据
├── tests/                       # 测试文件
│   ├── api/                     # API测试
│   ├── services/                # 服务层测试
│   ├── utils/                   # 工具函数测试
│   └── setup.ts                 # 测试环境配置
├── docs/                        # 项目文档
│   ├── api.md                   # API文档
│   ├── database.md              # 数据库设计文档
│   └── deployment.md            # 部署文档
├── .env.example                 # 环境变量示例
├── .env.local                   # 本地环境变量
├── railway.json                 # Railway配置（可选）
├── package.json
├── tsconfig.json
├── jest.config.js
├── mongoose.config.js
└── README.md
```

## 四、数据库设计规范

### 4.1 核心数据模型

#### 4.1.1 游戏记录集合 (gameRecords)
```javascript
// MongoDB文档结构
{
  _id: ObjectId,                            // MongoDB自动生成的ID
  deviceId: String,                         // 设备ID（32位哈希值）
  score: Number,                            // 游戏分数
  createdAt: Date                           // 创建时间
}

// 索引配置
db.gameRecords.createIndex({ deviceId: 1 })
db.gameRecords.createIndex({ score: -1 })
db.gameRecords.createIndex({ createdAt: -1 })
db.gameRecords.createIndex({ deviceId: 1, score: -1 })
```

#### 4.1.2 设备统计集合 (deviceStats)
```javascript
// MongoDB文档结构
{
  _id: String,                              // 设备ID作为主键
  deviceId: String,                         // 设备ID（冗余字段，便于查询）
  bestScore: Number,                        // 最高分数
  createdAt: Date,                          // 创建时间
  updatedAt: Date                           // 更新时间
}

// 索引配置
db.deviceStats.createIndex({ bestScore: -1 })
db.deviceStats.createIndex({ createdAt: -1 })
```

#### 4.1.3 排行榜缓存集合 (rankingCache)
```javascript
// MongoDB文档结构
{
  _id: ObjectId,                            // MongoDB自动生成的ID
  deviceId: String,                         // 设备ID
  score: Number,                            // 分数
  rankPosition: Number,                     // 排名位置
  cachedAt: Date,                           // 缓存时间
  expiresAt: Date                           // 过期时间
}

// 索引配置
db.rankingCache.createIndex({ deviceId: 1 }, { unique: true })
db.rankingCache.createIndex({ rankPosition: 1 })
db.rankingCache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.rankingCache.createIndex({ score: -1 })
```

### 4.2 Mongoose Schema 定义

```typescript
// src/models/GameRecord.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGameRecord extends Document {
  deviceId: string;
  score: number;
  createdAt: Date;
}

const GameRecordSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: (v: string) => /^[a-f0-9]{32}$/.test(v),
      message: '设备ID格式不正确'
    }
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'gameRecords'
});

// 复合索引
GameRecordSchema.index({ deviceId: 1, score: -1 });

export default mongoose.model<IGameRecord>('GameRecord', GameRecordSchema);

// src/models/DeviceStats.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceStats extends Document {
  _id: string; // 使用deviceId作为主键
  deviceId: string;
  bestScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceStatsSchema: Schema = new Schema({
  _id: { 
    type: String, 
    required: true 
  },
  deviceId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: (v: string) => /^[a-f0-9]{32}$/.test(v),
      message: '设备ID格式不正确'
    }
  },
  bestScore: { 
    type: Number, 
    default: 0,
    min: 0,
    index: true
  }
}, {
  timestamps: true,
  collection: 'deviceStats',
  _id: false // 使用自定义_id
});

export default mongoose.model<IDeviceStats>('DeviceStats', DeviceStatsSchema);

// src/models/RankingCache.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRankingCache extends Document {
  deviceId: string;
  score: number;
  rankPosition: number;
  cachedAt: Date;
  expiresAt: Date;
}

const RankingCacheSchema: Schema = new Schema({
  deviceId: { 
    type: String, 
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /^[a-f0-9]{32}$/.test(v),
      message: '设备ID格式不正确'
    }
  },
  score: { 
    type: Number, 
    required: true,
    min: 0,
    index: true
  },
  rankPosition: { 
    type: Number, 
    required: true,
    min: 1,
    index: true 
  },
  cachedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true 
  }
}, {
  collection: 'rankingCache'
});

// 索引配置
RankingCacheSchema.index({ score: -1 });
RankingCacheSchema.index({ rankPosition: 1 });

// TTL索引，自动删除过期文档
RankingCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRankingCache>('RankingCache', RankingCacheSchema);
```

## 五、开发规范

### 5.1 API 开发规范

#### 5.1.1 统一响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
  requestId?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  requestId?: string;
}
```

#### 5.1.2 设备ID验证规范
```typescript
// 设备ID格式：32位十六进制字符串
const DEVICE_ID_PATTERN = /^[a-f0-9]{32}$/;

function validateDeviceId(deviceId: string): boolean {
  return DEVICE_ID_PATTERN.test(deviceId);
}
```

#### 5.1.3 数据验证规范
```typescript
import { z } from 'zod';

// 游戏记录提交验证
const GameRecordSchema = z.object({
  deviceId: z.string().length(32).regex(/^[a-f0-9]+$/),
  score: z.number().int().min(0).max(999999)
});
```

### 5.2 TypeScript 规范

#### 5.2.1 类型定义
```typescript
// 游戏数据类型
export interface GameRecord {
  _id: string;
  deviceId: string;
  score: number;
  createdAt: Date;
}

// 排行榜项目类型
export interface RankingItem {
  deviceId: string;
  score: number;
  rank: number;
  createdAt: Date;
}

// 设备统计类型
export interface DeviceStatistics {
  deviceId: string;
  bestScore: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 5.2.2 错误处理规范
```typescript
// 自定义错误类型
export class GameApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'GameApiError';
  }
}

// 错误码定义
export const ErrorCodes = {
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
  INVALID_GAME_DATA: 'INVALID_GAME_DATA',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
} as const;
```

### 5.3 数据库连接配置

#### 5.3.1 MongoDB 连接配置
```typescript
// lib/database/connection.ts
import mongoose from 'mongoose';

interface ConnectionOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  bufferCommands?: boolean;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const options: ConnectionOptions = {
        maxPoolSize: 10, // 连接池最大连接数
        serverSelectionTimeoutMS: 5000, // 服务器选择超时
        socketTimeoutMS: 45000, // Socket超时
        bufferCommands: false, // 禁用命令缓冲
      };

      await mongoose.connect(process.env.MONGODB_URI!, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB连接成功');
      
      // 监听连接事件
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB连接错误:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB连接断开');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ MongoDB连接失败:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    console.log('✅ MongoDB连接已关闭');
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default DatabaseConnection;

// 使用示例
export const connectDatabase = async () => {
  const db = DatabaseConnection.getInstance();
  await db.connect();
};
```

### 5.4 缓存策略规范

#### 5.4.1 Redis 缓存键命名
```typescript
const CacheKeys = {
  // 排行榜缓存 (TTL: 5分钟)
  RANKING_GLOBAL: 'ranking:global',
  RANKING_DAILY: 'ranking:daily',
  RANKING_WEEKLY: 'ranking:weekly',
  
  // 设备统计缓存 (TTL: 1小时)
  DEVICE_STATS: (deviceId: string) => `stats:${deviceId}`,
  
  // 设备排名缓存 (TTL: 10分钟)
  DEVICE_RANK: (deviceId: string) => `rank:${deviceId}`,
  
  // API限流缓存 (TTL: 1分钟)
  RATE_LIMIT: (deviceId: string) => `limit:${deviceId}`,
} as const;
```

#### 5.4.2 缓存更新策略
- **排行榜**：写入时更新，5分钟TTL
- **设备统计**：写入时更新，1小时TTL
- **设备排名**：查询时计算并缓存，10分钟TTL

#### 5.4.3 MongoDB 查询优化
```typescript
// 使用聚合管道优化排行榜查询
const getRankingPipeline = (cacheType: string, limit: number = 50) => [
  { $match: { cacheType } },
  { $sort: { score: -1, createdAt: 1 } },
  { $limit: limit },
  { $lookup: {
    from: 'deviceStats',
    localField: 'deviceId',
    foreignField: '_id',
    as: 'playerStats'
  }},
  { $project: {
    deviceId: 1,
    score: 1,
    level: 1,
    rankPosition: 1,
    playerData: 1,
    totalGames: { $arrayElemAt: ['$playerStats.totalGames', 0] },
    avgScore: { $arrayElemAt: ['$playerStats.avgScore', 0] }
  }}
];

// 使用索引提示优化查询
const findGameRecords = async (deviceId: string, limit: number = 20) => {
  return await GameRecord
    .find({ deviceId })
    .sort({ score: -1, createdAt: -1 })
    .limit(limit)
    .hint({ deviceId: 1, score: -1 }) // 使用复合索引
    .lean(); // 返回普通对象，提升性能
};
```

## 六、工程化与协作

### 6.1 分支管理
- **主分支**：`main`（生产环境）
- **开发分支**：`develop`（开发环境）
- **功能分支**：`feature/功能名称`
- **修复分支**：`hotfix/问题描述`

### 6.2 代码提交规范
```bash
# 提交格式
<type>(<scope>): <description>

# 示例
feat(api): 添加游戏记录提交接口
fix(database): 修复排行榜查询性能问题
docs(readme): 更新API文档
test(game): 添加游戏服务单元测试
```

### 6.3 自动化测试
- **单元测试**：覆盖率 ≥ 80%
- **集成测试**：API接口测试
- **性能测试**：数据库查询性能
- **安全测试**：输入验证和SQL注入防护

### 6.4 持续集成
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: railway up
```

## 七、其他约定

### 7.1 环境变量管理
```bash
# .env.example
# MongoDB配置
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/gamedb?retryWrites=true&w=majority"
MONGODB_DB_NAME="gamedb"

# Redis配置
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"

# Railway配置
RAILWAY_TOKEN="your_railway_token"

# 第三方服务
SENTRY_DSN="your_sentry_dsn"

# 安全配置
API_RATE_LIMIT="100" # 每分钟请求限制

# 功能开关
ENABLE_ANALYTICS="true"
ENABLE_CACHE="true"
DEBUG_MODE="false"

# MongoDB Atlas配置
ATLAS_PUBLIC_KEY="your_atlas_public_key"
ATLAS_PRIVATE_KEY="your_atlas_private_key"
ATLAS_PROJECT_ID="your_project_id"
```

### 7.2 性能要求
- **API响应时间**：< 200ms (P95)
- **数据库查询**：< 100ms (P95)
- **缓存命中率**：> 90%
- **并发处理**：支持1000+ QPS

### 7.3 安全规范
- **输入验证**：所有用户输入必须验证
- **NoSQL注入防护**：使用Mongoose参数化查询
- **XSS防护**：输出转义
- **CORS配置**：限制允许的域名
- **API限流**：防止恶意刷分

### 7.4 监控与日志
- **错误监控**：Sentry集成
- **性能监控**：Railway 内置监控
- **日志级别**：ERROR, WARN, INFO, DEBUG
- **关键指标**：QPS、响应时间、错误率、缓存命中率

### 7.5 数据备份与恢复
- **数据库备份**：每日自动备份
- **备份保留**：30天
- **恢复测试**：每月一次
- **灾难恢复**：RTO < 1小时，RPO < 15分钟

## 八、核心API设计

### 8.1 游戏记录API

#### 8.1.1 提交游戏成绩
```typescript
POST /api/game/submit
Content-Type: application/json

{
  "deviceId": "abc123def456...",
  "score": 15800
}

// 响应
{
  "success": true,
  "data": {
    "recordId": "507f1f77bcf86cd799439011",
    "rank": 15,
    "isNewBest": true,
    "bestScore": 15000
  }
}
```

#### 8.1.2 获取个人历史记录
```typescript
GET /api/game/history/{deviceId}?limit=20&offset=0

// 响应
{
  "success": true,
  "data": {
    "records": [...],
    "total": 156,
    "hasMore": true
  },
  "timestamp": 1703123456789
}
```

### 8.2 排行榜API

#### 8.2.1 获取全球排行榜
```typescript
GET /api/game/ranking?limit=50

// 响应
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "deviceId": "device_hash_1",
        "score": 25000,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 1000
  },
  "timestamp": 1703123456789
}
```

### 8.3 统计数据API

#### 8.3.1 获取设备统计
```typescript
GET /api/game/stats/{deviceId}

// 响应
{
  "success": true,
  "data": {
     "deviceId": "abc123def456...",
     "bestScore": 25600,
     "rank": 15,
     "recentGames": [
       {
         "score": 18000,
         "createdAt": "2024-01-15T09:00:00Z"
       }
     ]
   },
  "timestamp": 1703123456789
}
```