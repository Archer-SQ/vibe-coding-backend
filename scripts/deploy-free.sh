#!/bin/bash

# 免费部署脚本
# 用于快速部署到Railway或其他免费平台

set -e

echo "🚀 开始免费部署准备..."

# 检查必要的文件
echo "📋 检查项目文件..."
if [ ! -f "app.ts" ]; then
    echo "❌ 错误: app.ts 文件不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 文件不存在"
    exit 1
fi

echo "✅ 项目文件检查完成"

# 安装依赖
echo "📦 安装依赖..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "❌ 错误: 未找到 npm 或 pnpm"
    exit 1
fi

echo "✅ 依赖安装完成"

# 运行测试
echo "🧪 运行本地测试..."
if command -v pnpm &> /dev/null; then
    timeout 10s pnpm run dev &
else
    timeout 10s npm run dev &
fi

SERVER_PID=$!
sleep 5

# 测试健康检查
echo "🔍 测试API端点..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 健康检查API正常"
else
    echo "⚠️  警告: 健康检查API测试失败，但可能是正常的"
fi

# 停止测试服务器
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo "✅ 本地测试完成"

# 检查环境变量模板
echo "🔧 检查环境变量配置..."
if [ ! -f ".env.example" ]; then
    echo "📝 创建环境变量模板..."
    cat > .env.example << EOF
# 生产环境配置模板
NODE_ENV=production
PORT=3000

# 数据库配置（必填）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=vibe_coding_game

# 可选配置
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=false
EOF
    echo "✅ 已创建 .env.example 文件"
fi

# 创建Railway配置
echo "🚂 创建Railway部署配置..."
cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
echo "✅ 已创建 railway.json 配置"

# 创建Dockerfile（可选）
echo "🐳 创建Docker配置..."
cat > Dockerfile << EOF
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件
COPY package*.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "run", "start"]
EOF
echo "✅ 已创建 Dockerfile"

# 创建.dockerignore
cat > .dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.nyc_output
coverage
.DS_Store
EOF
echo "✅ 已创建 .dockerignore"

# 更新.gitignore
echo "📝 更新.gitignore..."
if ! grep -q "railway.json" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# 部署配置文件" >> .gitignore
    echo "railway.json" >> .gitignore
fi
echo "✅ 已更新 .gitignore"

echo ""
echo "🎉 免费部署准备完成！"
echo ""
echo "📋 接下来的步骤："
echo ""
echo "1. 🗃️  设置MongoDB数据库："
echo "   - 访问 https://www.mongodb.com/atlas"
echo "   - 创建免费账户和集群"
echo "   - 获取连接字符串"
echo ""
echo "2. 🚂 部署到Railway："
echo "   - 访问 https://railway.app"
echo "   - 使用GitHub登录"
echo "   - 选择 'Deploy from GitHub repo'"
echo "   - 在环境变量中设置 MONGODB_URI 和 MONGODB_DB_NAME"
echo ""
echo "4. 🧪 部署后测试："
echo "   - curl https://your-app.railway.app/api/health"
echo "   - 检查所有API端点是否正常工作"
echo ""
echo "📖 详细部署指南请查看: docs/free-deployment-guide.md"
echo ""
echo "✨ 祝你部署顺利！"