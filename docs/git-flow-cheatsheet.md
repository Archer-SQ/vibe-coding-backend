# Git Flow 快速参考

## 🚀 快速开始

```bash
# 初始化 Git Flow (已完成)
git flow init -d

# 设置 Git Hooks (已完成)
npm run git:setup-hooks
```

## 📋 常用命令速查

### 功能开发 (Feature)

```bash
# 开始新功能
git flow feature start 功能名
# 或使用 npm 脚本
npm run git:feature 功能名

# 完成功能
git flow feature finish 功能名
# 或使用 npm 脚本
npm run git:feature-finish 功能名

# 发布功能分支到远程
git flow feature publish 功能名

# 获取远程功能分支
git flow feature pull origin 功能名
```

### 版本发布 (Release)

```bash
# 开始发布
git flow release start v1.1.0
# 或使用 npm 脚本
npm run git:release v1.1.0

# 完成发布
git flow release finish v1.1.0
# 或使用 npm 脚本
npm run git:release-finish v1.1.0
```

### 紧急修复 (Hotfix)

```bash
# 开始紧急修复
git flow hotfix start v1.0.1
# 或使用 npm 脚本
npm run git:hotfix v1.0.1

# 完成紧急修复
git flow hotfix finish v1.0.1
# 或使用 npm 脚本
npm run git:hotfix-finish v1.0.1
```

### 版本管理

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm run version:patch

# 次版本 (1.0.0 -> 1.1.0)
npm run version:minor

# 主版本 (1.0.0 -> 2.0.0)
npm run version:major
```

## 🔄 典型工作流

### 1. 开发新功能

```bash
# 1. 确保在 develop 分支
git checkout develop
git pull origin develop

# 2. 开始新功能
git flow feature start user-profile

# 3. 开发过程中提交
git add .
git commit -m "feat(profile): 添加用户资料页面"

# 4. 完成功能
git flow feature finish user-profile

# 5. 推送到远程
git push origin develop
```

### 2. 发布版本

```bash
# 1. 开始发布
git flow release start v1.1.0

# 2. 更新版本号和文档
npm version 1.1.0 --no-git-tag-version
git add .
git commit -m "chore(release): 准备 v1.1.0 发布"

# 3. 完成发布
git flow release finish v1.1.0

# 4. 推送所有分支和标签
git push origin main
git push origin develop
git push origin --tags
```

### 3. 紧急修复

```bash
# 1. 开始修复
git flow hotfix start v1.0.1

# 2. 修复问题
git add .
git commit -m "fix(api): 修复排行榜查询错误"

# 3. 完成修复
git flow hotfix finish v1.0.1

# 4. 推送
git push origin main
git push origin develop
git push origin --tags
```

## 📝 提交规范

### 格式
```
<type>(<scope>): <description>
```

### 类型
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建

### 示例
```bash
git commit -m "feat(api): 添加用户认证接口"
git commit -m "fix(db): 修复连接池配置"
git commit -m "docs(readme): 更新安装说明"
```

## 🛠️ 分支说明

| 分支 | 用途 | 来源 | 合并到 |
|------|------|------|--------|
| `main` | 生产环境 | - | - |
| `develop` | 开发环境 | `main` | `main` |
| `feature/*` | 功能开发 | `develop` | `develop` |
| `release/*` | 发布准备 | `develop` | `main`, `develop` |
| `hotfix/*` | 紧急修复 | `main` | `main`, `develop` |

## ⚠️ 注意事项

1. **不要直接在 main 分支开发**
2. **功能分支保持小而专注**
3. **发布分支只做 bug 修复**
4. **提交前确保测试通过**
5. **使用有意义的提交消息**

## 🔧 Git Hooks

项目已配置以下 hooks：

- **pre-commit**: 代码风格检查、类型检查、测试
- **commit-msg**: 提交消息格式检查
- **pre-push**: 完整测试套件、覆盖率检查

跳过检查：`git commit --no-verify`

## 📚 相关链接

- [Git Flow 原理](https://nvie.com/posts/a-successful-git-branching-model/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [约定式提交](https://www.conventionalcommits.org/zh-hans/)