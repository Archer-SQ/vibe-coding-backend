# 部署指南

本文档详细说明如何将手势飞机大战后端服务部署到 Vercel。

## 📋 部署前检查清单

### ✅ 代码准备
- [ ] 所有测试通过 (`npm test`)
- [ ] TypeScript 编译无错误 (`npx tsc --noEmit`)
- [ ] 代码已提交到 Git 仓库
- [ ] 环境变量配置完成

### ✅ 数据库准备
- [ ] MongoDB Atlas 集群已创建
- [ ] 数据库用户已配置
- [ ] 网络访问已设置（允许所有 IP：0.0.0.0/0）
- [ ] 连接字符串已获取

### ✅ 缓存服务准备（可选）
- [ ] Upstash Redis 实例已创建
- [ ] REST API 凭据已获取

## 🚀 部署步骤

### 方法一：通过 Vercel Dashboard 导入（推荐）

#### 1. 准备 Git 仓库
```bash
# 确保代码已推送到 GitHub/GitLab/Bitbucket
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

#### 2. 在 Vercel Dashboard 导入项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 Git 仓库
4. 选择 "vibe-coding-backend" 项目
5. 点击 "Import"

#### 3. 配置环境变量
在项目设置中添加以下环境变量：

**必需的环境变量：**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gamedb?retryWrites=true&w=majority
MONGODB_DB_NAME=gamedb
```

**可选的环境变量：**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=true
```

#### 4. 部署
1. 点击 "Deploy"
2. 等待构建完成
3. 获取部署 URL

### 方法二：通过 Vercel CLI

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 初始化项目
```bash
vercel
```

#### 4. 配置环境变量
```bash
# 添加 MongoDB 配置
vercel env add MONGODB_URI
vercel env add MONGODB_DB_NAME

# 添加 Redis 配置（可选）
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# 添加其他配置
vercel env add API_RATE_LIMIT
vercel env add ENABLE_CACHE
vercel env add ENABLE_ANALYTICS
```

#### 5. 部署到生产环境
```bash
vercel --prod
```

## 🔧 MongoDB Atlas 配置

### 1. 创建集群
1. 访问 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 创建新项目或选择现有项目
3. 点击 "Build a Database"
4. 选择 "Shared" (免费层)
5. 选择云提供商和区域
6. 创建集群

### 2. 配置数据库用户
1. 在 "Database Access" 中点击 "Add New Database User"
2. 选择 "Password" 认证方式
3. 设置用户名和密码
4. 设置权限为 "Read and write to any database"
5. 点击 "Add User"

### 3. 配置网络访问
1. 在 "Network Access" 中点击 "Add IP Address"
2. 选择 "Allow Access from Anywhere" (0.0.0.0/0)
3. 点击 "Confirm"

### 4. 获取连接字符串
1. 在 "Clusters" 中点击 "Connect"
2. 选择 "Connect your application"
3. 复制连接字符串
4. 替换 `<password>` 为实际密码

## 🔄 Upstash Redis 配置（可选）

### 1. 创建 Redis 实例
1. 访问 [Upstash Console](https://console.upstash.com/)
2. 点击 "Create Database"
3. 选择区域（建议选择与 Vercel 相同区域）
4. 创建数据库

### 2. 获取连接信息
1. 在数据库详情页面找到 "REST API"
2. 复制 "UPSTASH_REDIS_REST_URL"
3. 复制 "UPSTASH_REDIS_REST_TOKEN"

## 🧪 验证部署

### 1. 测试健康检查接口
```bash
curl https://your-app.vercel.app/api/health
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": 1703123456789,
    "database": {
      "connected": true,
      "status": "ready"
    },
    "cache": {
      "available": true,
      "connected": true
    }
  },
  "timestamp": 1703123456789
}
```

### 2. 测试游戏记录提交
```bash
curl -X POST https://your-app.vercel.app/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "abcdef1234567890abcdef1234567890",
    "score": 1500
  }'
```

### 3. 测试排行榜接口
```bash
curl https://your-app.vercel.app/api/game/ranking
```

## 📊 监控和日志

### 1. Vercel 函数日志
1. 在 Vercel Dashboard 中进入项目
2. 点击 "Functions" 标签
3. 查看函数执行日志

### 2. 实时监控
1. 在 Vercel Dashboard 中查看 "Analytics"
2. 监控请求量、响应时间、错误率

### 3. 错误追踪（可选）
如果配置了 Sentry：
1. 访问 Sentry Dashboard
2. 查看错误报告和性能监控

## 🔧 性能优化

### 1. 函数配置优化
在 `vercel.json` 中调整函数配置：
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 10,
      "memory": 1024
    }
  }
}
```

### 2. 缓存策略
- 启用 Redis 缓存以提高响应速度
- 合理设置缓存 TTL
- 使用排行榜缓存减少数据库查询

### 3. 数据库优化
- 确保 MongoDB 索引已创建
- 使用连接池优化数据库连接
- 定期清理过期数据

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败
**错误信息：** `MongoServerError: bad auth`
**解决方案：**
- 检查 MongoDB 用户名和密码
- 确认网络访问配置
- 验证连接字符串格式

#### 2. 函数超时
**错误信息：** `Function execution timed out`
**解决方案：**
- 增加 `maxDuration` 配置
- 优化数据库查询
- 检查网络连接

#### 3. 环境变量未生效
**解决方案：**
- 重新部署项目
- 检查环境变量名称拼写
- 确认环境变量已保存

#### 4. CORS 错误
**解决方案：**
- 检查前端域名配置
- 更新 CORS 设置
- 确认请求头格式

## 📝 部署后配置

### 1. 自定义域名（可选）
1. 在 Vercel Dashboard 中进入项目
2. 点击 "Settings" → "Domains"
3. 添加自定义域名
4. 配置 DNS 记录

### 2. 环境变量管理
- 生产环境和开发环境分别配置
- 定期轮换敏感凭据
- 使用 Vercel 的环境变量加密

### 3. 自动部署
- 配置 Git 分支自动部署
- 设置部署钩子
- 配置预览部署

## 🔐 安全最佳实践

1. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Vercel 环境变量管理
   - 定期轮换 API 密钥

2. **数据库安全**
   - 使用强密码
   - 启用 MongoDB Atlas 的安全功能
   - 定期备份数据

3. **API 安全**
   - 启用速率限制
   - 验证输入数据
   - 使用 HTTPS

## 📞 支持

如果在部署过程中遇到问题：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 检查 [MongoDB Atlas 文档](https://docs.atlas.mongodb.com/)
3. 查看项目的 GitHub Issues
4. 联系开发团队

---

**部署成功后，你的后端 API 将在以下地址可用：**
- 健康检查：`https://your-app.vercel.app/api/health`
- 游戏记录提交：`https://your-app.vercel.app/api/game/submit`
- 排行榜：`https://your-app.vercel.app/api/game/ranking`

🎉 **恭喜！你的手势飞机大战后端服务已成功部署到 Vercel！**