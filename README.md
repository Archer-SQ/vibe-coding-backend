# 🎮 手势飞机大战后端服务（简化版）

一个基于 TypeScript + MongoDB 的轻量级游戏后端服务，专为手势飞机大战游戏设计。

## ✨ 核心特性

- 🚀 **Serverless 架构**：基于 Vercel Functions，支持自动扩缩容
- 🎯 **游客模式**：基于设备指纹识别，无需注册登录
- 📊 **简化排行榜**：支持总榜和周榜前十查询
- 💾 **最高分记录**：每设备只保留最高分数记录
- 🔒 **类型安全**：TypeScript 强类型，提升代码质量
- 🌐 **CORS 支持**：完美支持前端跨域请求
- 📱 **移动优化**：专为移动端游戏优化的 API 设计

## 🛠️ 技术栈

- **运行时**：Node.js 18+
- **语言**：TypeScript
- **框架**：Express.js + Vercel Functions
- **数据库**：MongoDB Atlas
- **ODM**：Mongoose
- **部署**：Vercel
- **包管理**：pnpm

## 📁 项目结构

```
backend/
├── api/                    # Vercel API 端点
│   ├── game/
│   │   ├── submit.ts      # 提交游戏成绩
│   │   ├── ranking.ts     # 获取排行榜
│   │   ├── history/       # 个人历史记录
│   │   └── stats/         # 个人统计数据
│   ├── health.ts          # 健康检查
│   └── sync.ts            # 数据同步
├── lib/                   # 核心业务逻辑
│   ├── database/          # 数据库连接和模型
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript 类型定义
└── tests/                 # 测试文件
```

## 🔧 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 配置环境变量：
```bash
# MongoDB 配置
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/gamedb"
MONGODB_DB_NAME="gamedb"

# Redis 配置 (可选)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"

# 其他配置
NODE_ENV="development"
```

## 📦 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

## 🚀 本地开发

```bash
# 启动开发服务器
npm run dev

# 或使用 pnpm
pnpm dev
```

服务将在 `http://localhost:3000` 启动。

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 📋 API 文档

### 游戏记录 API

#### 提交游戏成绩
```http
POST /api/game/submit
Content-Type: application/json

{
  "deviceId": "a1b2c3d4e5f6789012345678901234ab",
  "score": 15800
}
```

#### 获取排行榜
```http
GET /api/game/ranking?limit=50&page=1
```

#### 获取个人历史记录
```http
GET /api/game/history/{deviceId}?limit=20&page=1
```

#### 获取个人统计
```http
GET /api/game/stats/{deviceId}
```

### 系统 API

#### 健康检查
```http
GET /api/health
```

#### 数据同步
```http
POST /api/sync
Content-Type: application/json

{
  "deviceId": "a1b2c3d4e5f6789012345678901234ab",
  "records": [
    { "score": 15000 },
    { "score": 18000 }
  ]
}
```

## 📊 数据模型

### 游戏记录 (GameRecord)
```typescript
{
  _id: string;
  deviceId: string;    // 32位十六进制设备ID
  score: number;       // 游戏分数 (0-999999)
  createdAt: Date;     // 创建时间
}
```

### 设备统计 (DeviceStats)
```typescript
{
  _id: string;         // 设备ID作为主键
  deviceId: string;    // 设备ID
  bestScore: number;   // 最高分数
  createdAt: Date;     // 创建时间
  updatedAt: Date;     // 更新时间
}
```

## 🔒 数据验证

- **设备ID**：32位十六进制字符串 (`/^[a-f0-9]{32}$/`)
- **分数**：0-999999 的整数
- **分页**：limit 1-100，page ≥ 1

## 🚀 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

```bash
# 手动部署
vercel --prod
```

### 环境变量配置

在 Vercel 控制台配置以下环境变量：
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `UPSTASH_REDIS_REST_URL` (可选)
- `UPSTASH_REDIS_REST_TOKEN` (可选)

## 📈 性能优化

- **数据库索引**：为常用查询字段创建索引
- **Redis 缓存**：缓存排行榜和统计数据
- **连接池**：MongoDB 连接池优化
- **查询优化**：使用聚合管道和 lean() 查询

## 🔍 监控和日志

- **健康检查**：`/api/health` 端点
- **错误日志**：Winston 日志记录
- **性能监控**：Vercel Analytics
- **数据库监控**：MongoDB Atlas 监控

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请创建 [Issue](https://github.com/your-repo/issues) 或联系开发团队。