# 更新日志

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- Git Flow 工作流配置
- Git hooks 自动化检查
- 提交消息格式规范
- 版本管理脚本

## [1.0.0] - 2024-01-15

### 新增
- 🎮 手势飞机大战后端服务初始版本
- 🏗️ TypeScript + Express.js 基础架构
- 🗄️ MongoDB 数据库连接和模型设计
- 📊 游戏记录存储和查询功能
- 🏆 排行榜系统（全球排行榜）
- 🔍 健康检查API接口
- 🌐 CORS 跨域支持
- 📝 统一的API响应格式
- 🔒 数据验证和错误处理
- 📋 日志记录系统
- 🧪 Jest 测试框架配置
- 🚀 Railway Node.js 部署配置
- 🛠️ 本地开发环境支持
- 📚 完整的API文档

### API接口
- `GET /api/health` - 健康检查
- `POST /api/game/submit` - 提交游戏成绩
- `GET /api/game/ranking` - 获取排行榜

### 技术栈
- **后端框架**: Express.js + TypeScript
- **数据库**: MongoDB + Mongoose
- **部署平台**: Railway Node.js 应用
- **测试框架**: Jest + Supertest
- **代码规范**: ESLint + Prettier
- **包管理**: pnpm

### 数据模型
- `GameRecord` - 游戏记录模型
- `DeviceStats` - 设备统计模型

### 开发工具
- 本地开发服务器
- 数据库种子数据脚本
- API测试脚本
- 代码质量检查工具

---

## 版本说明

### 版本号格式
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型
- **新增**: 新功能
- **变更**: 对现有功能的变更
- **弃用**: 不久将移除的功能
- **移除**: 已移除的功能
- **修复**: 问题修复
- **安全**: 安全相关的修复