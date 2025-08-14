# 🚀 手势飞机大战后端 - 免费部署指南

## 📋 项目改造完成情况

✅ **已完成的改造**：
- 移除所有 Vercel 相关配置和依赖（已完成）
- 转换 Serverless Functions 为 Express 路由
- 创建标准的 Node.js Express 应用入口
- 更新项目配置和启动脚本
- 提供完整的免费部署方案

## ⚡ 快速开始

### 1. 一键部署准备
```bash
# 运行部署脚本（自动创建Render配置文件）
./scripts/deploy-free.sh
```

### 2. 数据库设置
1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费 M0 集群（512MB存储）
3. 创建数据库用户和密码
4. 设置网络访问白名单为 `0.0.0.0/0`
5. 获取连接字符串（格式：`mongodb+srv://...`）

### 3. Render 部署
1. 访问 [Render](https://render.com) 并用 GitHub 登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的项目仓库
4. 在项目设置中添加环境变量（见下方配置）
5. 等待自动部署完成

### 4. 获取部署结果
- 部署完成后获得免费域名：`https://your-app.onrender.com`
- 测试API：`curl https://your-app.onrender.com/api/health`

## 🚀 Render 免费部署方案

### 🚂 为什么选择 Render
- ✅ **完全免费**：500小时/月运行时间（约20天24小时运行）
- ✅ **部署简单**：GitHub一键部署，自动检测项目类型
- ✅ **性能优秀**：快速启动，低延迟，共享vCPU
- ✅ **无需信用卡**：完全免费使用，无隐藏费用
- ✅ **自动HTTPS**：免费.onrender.com域名和SSL证书
- ✅ **实时监控**：内置日志、性能监控和自动重启
- ✅ **GitHub集成**：代码推送自动部署

### 📋 部署步骤
1. 访问 [Render](https://render.com)
2. GitHub 登录并连接仓库
3. 配置环境变量（MONGODB_URI）
4. 自动部署完成

## 🗃️ 数据库配置

### MongoDB Atlas（推荐）
1. 访问 [MongoDB Atlas](https://www.mongodb.com/atlas)
2. 创建免费账户（512MB 存储）
3. 创建集群并获取连接字符串
4. 在部署平台设置环境变量：
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB_NAME=vibe_coding_game
   ```

## 🔧 环境变量配置

**必需变量**：
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=vibe_coding_game
```

**可选变量**：
```env
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=false
```

## 📊 API 端点

- `GET /api/health` - 健康检查
- `POST /api/game/submit` - 提交游戏成绩
- `GET /api/game/ranking` - 获取排行榜

## 🧪 部署后测试

```bash
# 健康检查
curl https://your-app.onrender.com/api/health

# 提交测试数据
curl -X POST https://your-app.onrender.com/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"a1b2c3d4e5f6789012345678901234567890abcd","score":1000}'

# 获取排行榜
curl https://your-app.onrender.com/api/game/ranking?type=global&limit=10
```

## 💰 成本分析

### Render 免费额度详情
| 资源类型 | 免费额度 | 说明 |
|----------|----------|------|
| 运行时间 | 500小时/月 | 约20天24小时运行 |
| 内存 | 512MB RAM | 共享内存资源 |
| CPU | 共享vCPU | 适合中小型应用 |
| 存储 | 1GB | 持久化存储 |
| 带宽 | 100GB/月 | 出站流量限制 |
| 域名 | 免费子域名 | .onrender.com 域名 |
| HTTPS | 免费SSL证书 | 自动配置 |

### MongoDB Atlas 免费版
- **存储空间**：512MB 数据存储
- **连接数**：500个并发连接
- **集群类型**：M0 沙盒集群
- **备份**：无自动备份（免费版限制）
- **网络访问**：支持全球访问

### 💡 总成本
**完全免费 ($0/月)** 
- 无需信用卡验证
- 无隐藏费用
- 足够支撑个人项目和中小型游戏后端
- 适合学习、开发和小规模生产环境

## 📚 详细文档

- [完整部署指南](docs/free-deployment-guide.md)
- [API 文档](docs/api.md)
- [数据库设计](docs/database.md)

## 🆘 常见问题

**Q: 部署后API返回500错误？**
A: 检查环境变量配置，特别是 MONGODB_URI

**Q: 数据库连接失败？**
A: 确认MongoDB Atlas白名单设置为 0.0.0.0/0

**Q: Render应用休眠？**
A: 免费版会在无活动时休眠，首次请求可能较慢

## 🎉 部署成功！

恭喜！你的手势飞机大战后端现在运行在完全免费的云平台上。

**下一步**：
1. 更新前端配置，指向新的API地址
2. 设置监控和日志
3. 根据使用情况考虑扩展方案

---

**技术支持**：如有问题，请查看详细部署指南或提交Issue。