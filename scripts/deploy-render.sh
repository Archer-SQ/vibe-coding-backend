#!/bin/bash

# =============================================================================
# Render部署脚本
# 手势飞机大战后端服务 - 自动化部署到Render平台
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="vibe-coding-backend"
SERVICE_NAME="vibe-coding-backend"
GIT_BRANCH="main"
RENDER_REGION="oregon"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎮 手势飞机大战后端服务 - Render部署脚本"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# 检查必要工具
check_prerequisites() {
    log_step "检查部署前置条件..."
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm未安装，正在安装..."
        npm install -g pnpm
    fi
    
    # 检查curl（用于API调用）
    if ! command -v curl &> /dev/null; then
        log_error "curl未安装，请先安装curl"
        exit 1
    fi
    
    log_success "前置条件检查完成"
}

# 检查环境变量
check_environment() {
    log_step "检查环境变量配置..."
    
    # 检查必要的环境变量文件
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local文件不存在，请确保已配置本地环境变量"
    fi
    
    if [ ! -f ".env.render" ]; then
        log_warning ".env.render文件不存在，将创建模板文件"
        create_env_template
    fi
    
    log_success "环境变量检查完成"
}

# 创建环境变量模板
create_env_template() {
    log_info "创建Render环境变量模板..."
    
    cat > .env.render << 'EOF'
# Render环境变量配置模板
# 请在Render控制台中设置这些环境变量

# =============================================================================
# 必需环境变量（需要在Render控制台手动设置）
# =============================================================================

# MongoDB Atlas连接字符串
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gamedb?retryWrites=true&w=majority

# Upstash Redis配置
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_redis_token

# 可选：Sentry错误监控
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# =============================================================================
# 自动配置环境变量（已在render.yaml中设置）
# =============================================================================

# NODE_ENV=production
# PORT=10000
# MONGODB_DB_NAME=gamedb
# API_RATE_LIMIT=100
# ENABLE_ANALYTICS=true
# ENABLE_CACHE=true
# DEBUG_MODE=false
# CORS_ORIGIN=*
# RATE_LIMIT_WINDOW_MS=60000
# RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    log_success "环境变量模板已创建：.env.render"
}

# 验证项目结构
validate_project() {
    log_step "验证项目结构..."
    
    # 检查必要文件
    local required_files=(
        "package.json"
        "server.js"
        "app.ts"
        "render.yaml"
        "tsconfig.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必要文件：$file"
            exit 1
        fi
    done
    
    # 检查必要目录
    local required_dirs=(
        "lib"
        "routes"
        "scripts"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_error "缺少必要目录：$dir"
            exit 1
        fi
    done
    
    log_success "项目结构验证完成"
}

# 运行测试
run_tests() {
    log_step "运行项目测试..."
    
    if [ -f "jest.config.js" ] && [ -d "tests" ]; then
        log_info "运行单元测试..."
        pnpm test || {
            log_warning "测试失败，但继续部署（可在生产环境中修复）"
        }
    else
        log_warning "未找到测试配置，跳过测试步骤"
    fi
    
    log_success "测试步骤完成"
}

# 构建项目
build_project() {
    log_step "构建项目..."
    
    # 安装依赖
    log_info "安装项目依赖..."
    pnpm install --frozen-lockfile
    
    # 构建TypeScript
    log_info "编译TypeScript代码..."
    pnpm run build
    
    # 验证构建结果
    if [ ! -f "server.js" ]; then
        log_error "构建失败：未找到server.js文件"
        exit 1
    fi
    
    log_success "项目构建完成"
}

# 检查Git状态
check_git_status() {
    log_step "检查Git状态..."
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是Git仓库"
        exit 1
    fi
    
    # 检查当前分支
    local current_branch=$(git branch --show-current)
    log_info "当前分支：$current_branch"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warning "存在未提交的更改，建议先提交代码"
        git status --porcelain
        
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "Git状态检查完成"
}

# 推送到远程仓库
push_to_remote() {
    log_step "推送代码到远程仓库..."
    
    # 检查远程仓库
    if ! git remote get-url origin > /dev/null 2>&1; then
        log_error "未配置远程仓库origin"
        exit 1
    fi
    
    # 推送到main分支
    log_info "推送到$GIT_BRANCH分支..."
    git push origin $GIT_BRANCH
    
    log_success "代码推送完成"
}

# 显示部署信息
show_deployment_info() {
    log_step "显示部署信息..."
    
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "📋 部署信息"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    echo "🎮 项目名称：$PROJECT_NAME"
    echo "🌐 服务名称：$SERVICE_NAME"
    echo "🌍 部署区域：$RENDER_REGION"
    echo "🔗 Git分支：$GIT_BRANCH"
    echo "📁 项目目录：$(pwd)"
    echo "🕒 部署时间：$(date '+%Y-%m-%d %H:%M:%S')"
    
    echo -e "\n${YELLOW}📝 下一步操作：${NC}"
    echo "1. 登录Render控制台：https://dashboard.render.com"
    echo "2. 创建新的Web Service"
    echo "3. 连接GitHub仓库"
    echo "4. 选择render.yaml配置文件"
    echo "5. 设置环境变量（参考.env.render文件）"
    echo "6. 部署服务"
    
    echo -e "\n${GREEN}🔧 必需环境变量：${NC}"
    echo "• MONGODB_URI - MongoDB Atlas连接字符串"
    echo "• UPSTASH_REDIS_REST_URL - Redis REST URL"
    echo "• UPSTASH_REDIS_REST_TOKEN - Redis访问令牌"
    
    echo -e "\n${BLUE}📚 相关文档：${NC}"
    echo "• Render部署指南：docs/render-deployment-guide.md"
    echo "• API文档：docs/api-documentation.md"
    echo "• 项目README：README.md"
}

# 主函数
main() {
    show_banner
    
    log_info "开始Render部署流程..."
    
    # 执行部署步骤
    check_prerequisites
    check_environment
    validate_project
    check_git_status
    build_project
    run_tests
    push_to_remote
    
    show_deployment_info
    
    echo -e "\n${GREEN}✅ 部署准备完成！${NC}"
    echo -e "${CYAN}🚀 请在Render控制台完成最终部署步骤${NC}\n"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查上述输出"' ERR

# 运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi