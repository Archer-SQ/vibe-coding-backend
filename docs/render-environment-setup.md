# Render环境变量配置指南

## 🚨 问题诊断

根据前端请求截图显示的错误状态，Render服务无法正常响应API请求。这通常是由于**关键环境变量缺失**导致服务启动失败。

## 📋 必需环境变量清单

### ✅ 已自动配置的环境变量
这些变量已在 `render.yaml` 中配置，无需手动设置：

```yaml
NODE_ENV=production
PORT=10000
MONGODB_DB_NAME=gamedb
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=true
DEBUG_MODE=false
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### ❌ 需要手动设置的关键环境变量
这些变量必须在Render控制台手动配置：

#### 1. MongoDB连接配置（必需）
```bash
# 变量名：MONGODB_URI
# 格式：mongodb+srv://username:password@cluster.mongodb.net/gamedb?retryWrites=true&w=majority
# 示例：mongodb+srv://gameuser:your_password@cluster0.abc123.mongodb.net/gamedb?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://...
```

#### 2. Redis缓存配置（可选，但推荐）
```bash
# Upstash Redis REST API配置
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

#### 3. 错误监控配置（可选）
```bash
# Sentry错误监控
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🛠️ 配置步骤

### 步骤1：登录Render控制台
1. 访问 https://dashboard.render.com/
2. 登录您的账户
3. 找到 `vibe-coding-backend` 服务

### 步骤2：设置环境变量
1. 点击服务名称进入详情页
2. 点击左侧菜单的 "Environment"
3. 点击 "Add Environment Variable"
4. 逐一添加以下变量：

#### MongoDB配置（必需）
```
Key: MONGODB_URI
Value: mongodb+srv://your_username:your_password@your_cluster.mongodb.net/gamedb?retryWrites=true&w=majority
```

**获取MongoDB连接字符串：**
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 选择您的集群
3. 点击 "Connect" → "Connect your application"
4. 选择 "Node.js" 驱动
5. 复制连接字符串并替换密码

#### Redis配置（推荐）
```
Key: UPSTASH_REDIS_REST_URL
Value: https://your-redis-instance.upstash.io

Key: UPSTASH_REDIS_REST_TOKEN
Value: your_redis_token
```

**获取Upstash Redis配置：**
1. 访问 [Upstash Console](https://console.upstash.com/)
2. 创建或选择Redis数据库
3. 在 "Details" 页面找到 REST API 配置
4. 复制 "UPSTASH_REDIS_REST_URL" 和 "UPSTASH_REDIS_REST_TOKEN"

### 步骤3：触发重新部署
1. 在Render控制台中，点击 "Manual Deploy"
2. 选择 "Deploy latest commit"
3. 等待部署完成（通常需要2-5分钟）

## 🔍 验证配置

### 检查服务状态
1. 在Render控制台查看服务状态应显示为 "Live"
2. 查看 "Logs" 标签页，确认没有启动错误
3. 访问健康检查端点：`https://vibe-coding-backend-l3ys.onrender.com/api/health`

### 测试API端点
```bash
# 健康检查
curl https://vibe-coding-backend-l3ys.onrender.com/api/health

# 排行榜
curl https://vibe-coding-backend-l3ys.onrender.com/api/game/ranking
```

## 🚨 常见问题排查

### 问题1：MongoDB连接失败
**症状**：服务启动后立即崩溃，日志显示连接错误

**解决方案**：
1. 检查MongoDB连接字符串格式
2. 确认用户名和密码正确
3. 检查MongoDB Atlas网络访问设置：
   - 进入 "Network Access"
   - 确保IP白名单包含 `0.0.0.0/0`（允许所有IP）
   - 或添加Render的IP范围

### 问题2：环境变量未生效
**症状**：设置了环境变量但服务仍然报错

**解决方案**：
1. 确认变量名拼写正确（区分大小写）
2. 重新部署服务使变量生效
3. 检查变量值中是否包含特殊字符需要转义

### 问题3：服务频繁休眠
**症状**：首次访问响应很慢（冷启动）

**解决方案**：
1. 这是免费计划的正常行为
2. 可以设置定时ping保持服务活跃
3. 考虑升级到付费计划

## 📊 监控和维护

### 设置监控
1. 配置Sentry错误监控
2. 设置Render邮件通知
3. 定期检查服务日志

### 性能优化
1. 启用Redis缓存减少数据库查询
2. 优化数据库索引
3. 监控响应时间和错误率

## 🎯 下一步行动

### 立即执行（高优先级）
- [ ] 在Render控制台设置 `MONGODB_URI` 环境变量
- [ ] 触发手动重新部署
- [ ] 验证服务启动成功
- [ ] 测试API端点响应

### 推荐配置（中优先级）
- [ ] 设置Upstash Redis缓存
- [ ] 配置Sentry错误监控
- [ ] 设置邮件通知

### 长期优化（低优先级）
- [ ] 监控服务性能
- [ ] 优化数据库查询
- [ ] 考虑升级服务计划

## 📞 获取帮助

如果按照以上步骤操作后问题仍然存在，请提供：

1. **Render服务状态截图**
2. **最新的部署日志**（去除敏感信息）
3. **环境变量配置列表**（隐藏实际值）
4. **MongoDB Atlas网络设置截图**

---

**最后更新**：2025-08-14  
**适用版本**：Render Free Plan  
**预计解决时间**：15-30分钟