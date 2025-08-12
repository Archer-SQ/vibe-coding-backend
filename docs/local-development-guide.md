# 🚀 本地开发服务器启动指南

## 📋 快速启动

### 1. 启动后端服务
```bash
# 进入项目目录
cd /Users/shaoqi/Desktop/vibe-coding-backend

# 启动本地开发服务器
pnpm run dev:local
```

### 2. 服务器信息
- **服务地址**: http://localhost:3000
- **API测试页面**: http://localhost:3000/public/test.html
- **健康检查**: http://localhost:3000/api/health

## 🎯 核心API接口

### 基础信息
- **Base URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **认证方式**: 设备ID（32位十六进制字符串）

### API列表

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| GET | `/health` | 健康检查 | 检查服务器和数据库状态 |
| POST | `/game/submit` | 提交游戏成绩 | 提交新的游戏记录 |
| GET | `/game/ranking` | 获取排行榜 | 支持分页查询 |
| GET | `/game/history/{deviceId}` | 获取个人历史 | 查询指定设备的游戏记录 |
| GET | `/game/stats/{deviceId}` | 获取个人统计 | 查询设备统计数据 |
| POST | `/sync` | 数据同步 | 批量同步离线数据 |

## 🧪 API测试

### 方式一：使用测试页面（推荐）
访问 http://localhost:3000/public/test.html 使用可视化测试界面

### 方式二：使用curl命令
```bash
# 健康检查
curl http://localhost:3000/api/health

# 获取排行榜
curl "http://localhost:3000/api/game/ranking?limit=10&page=1"

# 提交游戏成绩
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"a1b2c3d4e5f6789012345678901234ab","score":12345}'

# 获取个人历史
curl "http://localhost:3000/api/game/history/a1b2c3d4e5f6789012345678901234ab?limit=10&page=1"

# 获取个人统计
curl http://localhost:3000/api/game/stats/a1b2c3d4e5f6789012345678901234ab
```

### 方式三：使用Postman
导入 `/docs/postman-collection.json` 文件到Postman中进行测试

## 📱 前端集成示例

### JavaScript/TypeScript
```javascript
// API客户端配置
const API_BASE = 'http://localhost:3000/api';

// 生成设备ID
function generateDeviceId() {
  const chars = '0123456789abcdef';
  let deviceId = '';
  for (let i = 0; i < 32; i++) {
    deviceId += chars[Math.floor(Math.random() * chars.length)];
  }
  return deviceId;
}

// 提交游戏成绩
async function submitScore(deviceId, score) {
  const response = await fetch(`${API_BASE}/game/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId, score })
  });
  
  return await response.json();
}

// 获取排行榜
async function getRanking(limit = 20, page = 1) {
  const response = await fetch(`${API_BASE}/game/ranking?limit=${limit}&page=${page}`);
  return await response.json();
}

// 获取个人历史
async function getHistory(deviceId, limit = 20, page = 1) {
  const response = await fetch(`${API_BASE}/game/history/${deviceId}?limit=${limit}&page=${page}`);
  return await response.json();
}

// 获取个人统计
async function getStats(deviceId) {
  const response = await fetch(`${API_BASE}/game/stats/${deviceId}`);
  return await response.json();
}
```

### React Hook示例
```javascript
import { useState, useEffect } from 'react';

// 自定义Hook：游戏API
export function useGameAPI() {
  const [deviceId, setDeviceId] = useState(null);
  
  useEffect(() => {
    // 从localStorage获取或生成新的设备ID
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);
  
  const submitScore = async (score) => {
    if (!deviceId) return null;
    
    const response = await fetch(`${API_BASE}/game/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, score })
    });
    
    return await response.json();
  };
  
  const getRanking = async (limit = 20, page = 1) => {
    const response = await fetch(`${API_BASE}/game/ranking?limit=${limit}&page=${page}`);
    return await response.json();
  };
  
  return { deviceId, submitScore, getRanking };
}
```

## 🔧 环境配置

### 数据库配置
- **MongoDB**: `mongodb://localhost:27017/gamedb`
- **Redis**: `redis://localhost:6379`（可选，用于缓存）

### 环境变量
```bash
# MongoDB配置
MONGODB_URI="mongodb://localhost:27017/gamedb"
MONGODB_DB_NAME="gamedb"

# Redis配置（可选）
REDIS_URL="redis://localhost:6379"

# 功能开关
ENABLE_ANALYTICS="false"
ENABLE_CACHE="true"
DEBUG_MODE="true"

# 安全配置
API_RATE_LIMIT="1000"
```

## 🐛 故障排除

### 常见问题

#### 1. 服务器启动失败
```bash
# 检查端口是否被占用
lsof -i :3000

# 杀死占用端口的进程
kill -9 <PID>
```

#### 2. MongoDB连接失败
```bash
# 检查MongoDB服务状态
brew services list | grep mongodb

# 启动MongoDB服务
brew services start mongodb-community
```

#### 3. API请求失败
- 检查服务器是否正常运行
- 确认请求URL和参数格式正确
- 查看服务器控制台日志

#### 4. CORS错误
服务器已配置CORS，如果仍有问题，检查请求头设置

### 日志查看
服务器会在控制台输出详细的请求日志：
```
2025-08-12T07:48:12.324Z - GET /api/health
info: API请求 {"method":"GET","path":"/api/health","requestId":"health-1754984892324-nudvt9j0p"}
✅ MongoDB连接成功
info: API响应 {"duration":16,"statusCode":200}
```

## 📚 相关文档

- [完整API文档](./api-documentation.md)
- [快速参考](./api-quick-reference.md)
- [前端集成指南](./frontend-integration-guide.md)
- [Postman集合](./postman-collection.json)

## 🎮 开始开发

1. **启动后端服务**: `pnpm run dev:local`
2. **打开测试页面**: http://localhost:3000/public/test.html
3. **测试API接口**: 使用测试页面或curl命令
4. **集成到前端**: 参考上述JavaScript示例
5. **查看文档**: 阅读完整的API文档

---

**🚀 现在您可以开始前端开发和API联调了！**

如有问题，请查看服务器控制台日志或参考故障排除部分。