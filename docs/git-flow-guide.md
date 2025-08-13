# Git Flow 工作流指南

## 📋 概述

本项目使用 Git Flow 工作流来管理代码版本和发布流程，确保代码质量和发布稳定性。

## 🌳 分支结构

### 主要分支
- **main**: 生产环境分支，包含稳定的发布版本
- **develop**: 开发分支，包含最新的开发功能

### 支持分支
- **feature/**: 功能开发分支
- **release/**: 发布准备分支
- **hotfix/**: 紧急修复分支
- **support/**: 长期支持分支

## 🚀 常用命令

### 1. 功能开发流程

#### 开始新功能开发
```bash
# 创建并切换到新的功能分支
git flow feature start 功能名称

# 例如：开发用户认证功能
git flow feature start user-auth
```

#### 完成功能开发
```bash
# 完成功能开发，合并到develop分支
git flow feature finish 功能名称

# 例如：完成用户认证功能
git flow feature finish user-auth
```

#### 发布功能分支（可选）
```bash
# 将功能分支推送到远程仓库进行协作
git flow feature publish 功能名称

# 获取他人发布的功能分支
git flow feature pull origin 功能名称
```

### 2. 发布流程

#### 开始发布准备
```bash
# 创建发布分支
git flow release start 版本号

# 例如：准备v1.0.0版本发布
git flow release start v1.0.0
```

#### 完成发布
```bash
# 完成发布，合并到main和develop分支，并创建标签
git flow release finish 版本号

# 例如：完成v1.0.0版本发布
git flow release finish v1.0.0
```

### 3. 紧急修复流程

#### 开始紧急修复
```bash
# 从main分支创建hotfix分支
git flow hotfix start 修复版本号

# 例如：修复v1.0.1版本的紧急问题
git flow hotfix start v1.0.1
```

#### 完成紧急修复
```bash
# 完成修复，合并到main和develop分支
git flow hotfix finish 修复版本号

# 例如：完成v1.0.1版本修复
git flow hotfix finish v1.0.1
```

## 📝 提交规范

### 提交消息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 类型说明
- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

### 示例
```bash
# 新功能
git commit -m "feat(api): 添加游戏记录提交接口"

# 修复bug
git commit -m "fix(database): 修复排行榜查询性能问题"

# 文档更新
git commit -m "docs(readme): 更新API使用说明"

# 代码重构
git commit -m "refactor(service): 优化游戏服务代码结构"
```

## 🔄 工作流程示例

### 开发新功能的完整流程

1. **确保在develop分支**
```bash
git checkout develop
git pull origin develop
```

2. **开始新功能开发**
```bash
git flow feature start ranking-system
```

3. **开发过程中的提交**
```bash
git add .
git commit -m "feat(ranking): 添加排行榜基础结构"
git commit -m "feat(ranking): 实现排行榜查询逻辑"
git commit -m "test(ranking): 添加排行榜单元测试"
```

4. **完成功能开发**
```bash
git flow feature finish ranking-system
```

5. **推送到远程仓库**
```bash
git push origin develop
```

### 发布版本的完整流程

1. **开始发布准备**
```bash
git checkout develop
git pull origin develop
git flow release start v1.1.0
```

2. **发布准备工作**
```bash
# 更新版本号
npm version 1.1.0

# 更新CHANGELOG
git add .
git commit -m "chore(release): 准备v1.1.0版本发布"
```

3. **完成发布**
```bash
git flow release finish v1.1.0
```

4. **推送所有分支和标签**
```bash
git push origin main
git push origin develop
git push origin --tags
```

## 🛠️ 最佳实践

### 1. 分支命名规范
- **功能分支**: `feature/功能描述` (如: `feature/user-authentication`)
- **发布分支**: `release/版本号` (如: `release/v1.0.0`)
- **修复分支**: `hotfix/版本号` (如: `hotfix/v1.0.1`)

### 2. 开发建议
- 保持功能分支小而专注
- 定期从develop分支合并最新代码
- 在合并前确保所有测试通过
- 使用有意义的提交消息

### 3. 代码审查
- 所有功能分支在合并前需要代码审查
- 使用Pull Request进行代码审查
- 确保代码符合项目规范

### 4. 测试要求
- 新功能必须包含单元测试
- 发布前进行完整的集成测试
- 修复bug时添加回归测试

## 🔧 配置说明

### Git Flow 配置
```bash
# 查看当前配置
git flow config

# 重新配置（如果需要）
git flow init
```

### 分支保护规则（推荐）
- **main分支**: 禁止直接推送，只能通过PR合并
- **develop分支**: 要求代码审查和测试通过
- **功能分支**: 允许直接推送，但建议使用PR

## 📚 相关资源

- [Git Flow 官方文档](https://nvie.com/posts/a-successful-git-branching-model/)
- [Git Flow 命令参考](https://danielkummer.github.io/git-flow-cheatsheet/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [约定式提交规范](https://www.conventionalcommits.org/zh-hans/)

## ❓ 常见问题

### Q: 如何撤销Git Flow操作？
A: Git Flow操作本质上是Git操作，可以使用标准Git命令撤销。

### Q: 功能分支开发时间过长怎么办？
A: 定期从develop分支合并最新代码，避免冲突积累。

### Q: 如何处理合并冲突？
A: 使用Git标准冲突解决流程，必要时寻求团队帮助。

### Q: 发布分支可以添加新功能吗？
A: 发布分支只应包含bug修复和发布准备工作，不应添加新功能。