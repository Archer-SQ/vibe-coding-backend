#!/bin/bash

# Git Hooks 设置脚本
# 用于自动化代码质量检查和提交规范

echo "🔧 设置 Git Hooks..."

# 创建 hooks 目录
mkdir -p .git/hooks

# Pre-commit hook - 提交前检查
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 运行 pre-commit 检查..."

# 检查是否有暂存的文件
if git diff --cached --quiet; then
    echo "❌ 没有暂存的文件"
    exit 1
fi

# 运行 ESLint 检查
echo "📝 运行 ESLint 检查..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint 检查失败，请修复代码风格问题"
    exit 1
fi

# 运行 TypeScript 类型检查
echo "🔍 运行 TypeScript 类型检查..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript 类型检查失败"
    exit 1
fi

# 运行测试
echo "🧪 运行单元测试..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ 测试失败，请修复测试问题"
    exit 1
fi

echo "✅ Pre-commit 检查通过"
EOF

# Commit-msg hook - 提交消息格式检查
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# 提交消息格式检查
commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ 提交消息格式不正确"
    echo "格式应为: <type>(<scope>): <description>"
    echo "类型: feat, fix, docs, style, refactor, test, chore"
    echo "示例: feat(api): 添加用户认证接口"
    exit 1
fi

echo "✅ 提交消息格式正确"
EOF

# Pre-push hook - 推送前检查
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🚀 运行 pre-push 检查..."

# 获取当前分支
current_branch=$(git rev-parse --abbrev-ref HEAD)

# 检查是否直接推送到 main 分支
if [ "$current_branch" = "main" ]; then
    echo "❌ 不允许直接推送到 main 分支"
    echo "请使用 Git Flow 发布流程"
    exit 1
fi

# 运行完整测试套件
echo "🧪 运行完整测试套件..."
npm run test:coverage
if [ $? -ne 0 ]; then
    echo "❌ 测试失败，推送被阻止"
    exit 1
fi

# 检查测试覆盖率
echo "📊 检查测试覆盖率..."
coverage=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
if [ "$coverage" -lt 80 ]; then
    echo "❌ 测试覆盖率低于80%，当前覆盖率: ${coverage}%"
    exit 1
fi

echo "✅ Pre-push 检查通过"
EOF

# 设置执行权限
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
chmod +x .git/hooks/pre-push

echo "✅ Git Hooks 设置完成"
echo ""
echo "已设置的 hooks:"
echo "  - pre-commit: 代码风格和测试检查"
echo "  - commit-msg: 提交消息格式检查"
echo "  - pre-push: 推送前完整检查"
echo ""
echo "如需跳过 hooks 检查，可使用 --no-verify 参数"
echo "例如: git commit --no-verify -m \"临时提交\""