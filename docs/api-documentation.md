# 🎮 游戏API文档（简化版）

## 📋 概述

本文档描述了手势飞机大战游戏后端服务的API接口。简化版本专注于核心功能：分数记录和排行榜查询。

### 🎯 核心特性
- 每设备只保留最高分数记录
- 支持总榜和周榜前十查询
- 基于设备ID的游客模式
- 无需注册登录

### 🔗 服务地址
- **本地开发**: `http://localhost:3000`
- **生产环境**: `https://your-domain.vercel.app`

## 🚀 快速开始

### 设备ID格式
所有API都使用32位十六进制字符串作为设备标识：
```
格式: [a-f0-9]{32}
示例: abc123def456ghi789jkl012mno345pq
```

### 统一响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据内容
  },
  "timestamp": 1703123456789
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "timestamp": 1703123456789
}
```

## 📊 API接口

### 1. 健康检查

检查服务运行状态和数据库连接。

**接口地址**: `GET /api/health`

**请求示例**:
```bash
curl http://localhost:3000/api/health
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "database": {
      "status": "connected",
      "collections": {
        "gameRecords": 1250,
        "deviceStats": 856
      }
    },
    "uptime": 3600
  },
  "timestamp": 1703123456789
}
```

### 2. 提交游戏成绩

提交新的游戏分数。如果新分数更高，则更新记录；否则忽略。

**接口地址**: `POST /api/game/submit`

**请求头**:
```
Content-Type: application/json
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | string | 是 | 32位十六进制设备ID |
| score | number | 是 | 游戏分数 (0-999999) |

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "abc123def456ghi789jkl012mno345pq",
    "score": 15800
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recordId": "507f1f77bcf86cd799439011",
    "isNewBest": true,
    "currentBest": 15800,
    "message": "新纪录！分数已更新"
  },
  "timestamp": 1703123456789
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DEVICE_ID",
    "message": "设备ID格式不正确"
  },
  "timestamp": 1703123456789
}
```

### 3. 获取排行榜

获取总榜或周榜前十名。

**接口地址**: `GET /api/game/ranking`

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | 否 | all | 排行榜类型: `all`(总榜) 或 `weekly`(周榜) |

**请求示例**:
```bash
# 获取总榜前十
curl "http://localhost:3000/api/game/ranking?type=all"

# 获取周榜前十
curl "http://localhost:3000/api/game/ranking?type=weekly"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "type": "all",
    "rankings": [
      {
        "rank": 1,
        "deviceId": "abc123def456ghi789jkl012mno345pq",
        "score": 25600,
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "rank": 2,
        "deviceId": "def456ghi789jkl012mno345pqabc123",
        "score": 23400,
        "updatedAt": "2024-01-14T15:20:00.000Z"
      }
    ],
    "count": 10
  },
  "timestamp": 1703123456789
}
```

## 🔧 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| INVALID_DEVICE_ID | 400 | 设备ID格式不正确 |
| INVALID_SCORE | 400 | 分数格式不正确或超出范围 |
| MISSING_REQUIRED_FIELDS | 400 | 缺少必填字段 |
| DATABASE_ERROR | 500 | 数据库操作失败 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

## 📈 数据模型

### GameRecord (游戏记录)
```typescript
interface GameRecord {
  _id: string;          // MongoDB ObjectId
  deviceId: string;     // 32位十六进制设备ID
  score: number;        // 游戏分数 (0-999999)
  createdAt: Date;      // 创建时间
}
```

### DeviceStats (设备统计)
```typescript
interface DeviceStats {
  _id: string;          // 设备ID (作为主键)
  deviceId: string;     // 32位十六进制设备ID
  bestScore: number;    // 最高分数
  createdAt: Date;      // 创建时间
  updatedAt: Date;      // 更新时间
}
```

## 🧪 测试工具

### 在线测试页面
访问 `http://localhost:3000/test.html` 使用可视化测试界面。

### cURL命令示例
```bash
# 1. 健康检查
curl http://localhost:3000/api/health

# 2. 提交分数
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"abc123def456ghi789jkl012mno345pq","score":1500}'

# 3. 获取总榜
curl "http://localhost:3000/api/game/ranking?type=all"

# 4. 获取周榜
curl "http://localhost:3000/api/game/ranking?type=weekly"
```

## 🔒 安全说明

### 数据验证
- 所有输入数据都经过严格验证
- 设备ID必须符合32位十六进制格式
- 分数范围限制在0-999999之间

### 速率限制
- 每个设备每分钟最多提交10次分数
- 超出限制将返回429错误

### CORS配置
- 支持跨域请求
- 生产环境建议配置允许的域名白名单

## 📊 性能指标

- **响应时间**: < 200ms (P95)
- **并发支持**: 1000+ QPS
- **数据库查询**: < 100ms (P95)
- **可用性**: 99.9%

## 🚀 部署信息

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- 内存: 512MB+
- 存储: 1GB+

### 环境变量
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gamedb
NODE_ENV=production
API_BASE_URL=https://your-domain.vercel.app
```

## 📞 技术支持

如有问题，请通过以下方式联系：
- GitHub Issues: [项目地址](https://github.com/yourusername/gesture-plane-war-backend)
- 邮箱: support@yourdomain.com

---

**文档版本**: v2.0 (简化版)  
**更新时间**: 2024-01-15  
**API版本**: v1