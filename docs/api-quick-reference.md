# 🚀 API快速参考

## 📋 接口列表

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 健康检查 | GET | `/api/health` | 检查服务状态 |
| 提交成绩 | POST | `/api/game/submit` | 提交游戏分数 |
| 获取排行榜 | GET | `/api/game/ranking` | 获取排行榜 |

## 🎯 核心接口

### 1. 提交成绩
```bash
POST /api/game/submit
Content-Type: application/json

{
  "deviceId": "abc123def456ghi789jkl012mno345pq",
  "score": 15800
}
```

### 2. 获取排行榜
```bash
# 总榜前十
GET /api/game/ranking?type=all

# 周榜前十  
GET /api/game/ranking?type=weekly
```

### 3. 健康检查
```bash
GET /api/health
```

## 📊 响应格式

### 成功响应
```json
{
  "success": true,
  "data": { /* 数据内容 */ },
  "timestamp": 1703123456789
}
```

### 错误响应
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

## 🔧 常用cURL命令

```bash
# 健康检查
curl http://localhost:3000/api/health

# 提交分数
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"abc123def456ghi789jkl012mno345pq","score":1500}'

# 获取总榜
curl "http://localhost:3000/api/game/ranking?type=all"

# 获取周榜
curl "http://localhost:3000/api/game/ranking?type=weekly"
```

## 🎮 测试页面

访问 `http://localhost:3000/test.html` 进行可视化测试。

## 🔒 设备ID格式

- **格式**: 32位十六进制字符串
- **正则**: `^[a-f0-9]{32}$`
- **示例**: `abc123def456ghi789jkl012mno345pq`

## ⚡ 性能指标

- 响应时间: < 200ms
- 并发支持: 1000+ QPS
- 排行榜: 实时查询前10名
- 分数记录: 自动保留最高分