#!/bin/bash

# 快速修复验证脚本
# 用于验证Render环境变量配置修复后的服务状态

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 服务配置
SERVER_URL="https://vibe-coding-backend-l3ys.onrender.com"
TIMEOUT=30

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

# 打印分隔线
print_separator() {
    echo "================================================="
}

# 打印标题
print_title() {
    echo -e "${PURPLE}🎮 手势飞机大战后端服务修复验证${NC}"
    print_separator
    echo "服务地址: $SERVER_URL"
    echo "验证时间: $(date)"
    print_separator
}

# 等待用户确认
wait_for_confirmation() {
    echo -e "${YELLOW}⚠️ 请确认您已完成以下步骤：${NC}"
    echo "1. ✅ 在Render控制台设置了 MONGODB_URI 环境变量"
    echo "2. ✅ 触发了手动重新部署"
    echo "3. ✅ 部署状态显示为 'Live'"
    echo ""
    read -p "是否已完成上述步骤？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ 请先完成环境变量配置，然后重新运行此脚本${NC}"
        echo ""
        echo "📋 配置指南: docs/render-environment-setup.md"
        exit 1
    fi
}

# 快速连接测试
quick_connection_test() {
    log_step "1. 快速连接测试"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$SERVER_URL/api/health" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        log_success "✅ 服务连接正常 (HTTP $status_code)"
        return 0
    elif [ "$status_code" = "000" ]; then
        log_error "❌ 服务无法连接 - 可能仍在启动中或配置有误"
        return 1
    else
        log_warning "⚠️ 服务响应异常 (HTTP $status_code)"
        return 1
    fi
}

# 健康检查测试
health_check_test() {
    log_step "2. 健康检查详细测试"
    
    local response=$(curl -s \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$SERVER_URL/api/health" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        log_success "✅ 健康检查响应正常"
        echo "响应内容: $response"
        return 0
    else
        log_error "❌ 健康检查失败"
        return 1
    fi
}

# API端点测试
api_endpoints_test() {
    log_step "3. API端点功能测试"
    
    # 测试排行榜端点
    log_info "测试排行榜端点..."
    local ranking_status=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$SERVER_URL/api/game/ranking" 2>/dev/null)
    
    if [ "$ranking_status" = "200" ]; then
        log_success "✅ 排行榜端点正常 (HTTP $ranking_status)"
    else
        log_error "❌ 排行榜端点异常 (HTTP $ranking_status)"
    fi
    
    # 测试根路径
    log_info "测试根路径..."
    local root_status=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$SERVER_URL/" 2>/dev/null)
    
    if [ "$root_status" = "200" ] || [ "$root_status" = "404" ]; then
        log_success "✅ 根路径响应正常 (HTTP $root_status)"
    else
        log_error "❌ 根路径响应异常 (HTTP $root_status)"
    fi
}

# 性能测试
performance_test() {
    log_step "4. 性能测试"
    
    log_info "测试响应时间..."
    local times=()
    
    for i in {1..3}; do
        local time=$(curl -s -o /dev/null -w "%{time_total}" \
            --connect-timeout $TIMEOUT \
            --max-time $TIMEOUT \
            "$SERVER_URL/api/health" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            times+=("$time")
            log_info "第 $i 次请求: ${time}s"
        else
            log_error "第 $i 次请求失败"
        fi
    done
    
    if [ ${#times[@]} -gt 0 ]; then
        # 计算平均响应时间（简化版本）
        local total=0
        for time in "${times[@]}"; do
            # 转换为毫秒进行整数计算
            local ms=$(echo "$time * 1000" | bc -l 2>/dev/null || echo "0")
            total=$((total + ${ms%.*}))
        done
        local avg=$((total / ${#times[@]}))
        
        log_success "平均响应时间: ${avg}ms"
        
        if [ $avg -lt 2000 ]; then
            log_success "✅ 响应时间优秀"
        elif [ $avg -lt 5000 ]; then
            log_warning "⚠️ 响应时间一般"
        else
            log_error "❌ 响应时间过慢"
        fi
    else
        log_error "❌ 所有性能测试请求都失败了"
    fi
}

# 前端集成测试建议
frontend_integration_test() {
    log_step "5. 前端集成测试建议"
    
    echo "📱 前端测试步骤："
    echo "1. 确保前端配置的API地址正确："
    echo "   const API_BASE_URL = '$SERVER_URL'"
    echo ""
    echo "2. 测试前端功能："
    echo "   - 游戏结束后提交分数"
    echo "   - 查看排行榜数据"
    echo "   - 检查网络请求是否成功"
    echo ""
    echo "3. 检查浏览器开发者工具："
    echo "   - Network标签页查看API请求状态"
    echo "   - Console标签页查看错误信息"
}

# 故障排除建议
troubleshooting_guide() {
    log_step "6. 故障排除指南"
    
    echo "🔧 如果测试失败，请检查："
    echo ""
    echo "1. Render控制台检查项："
    echo "   - 服务状态是否为 'Live'"
    echo "   - 查看最新的部署日志"
    echo "   - 确认环境变量已正确设置"
    echo ""
    echo "2. MongoDB Atlas检查项："
    echo "   - 网络访问设置 (IP白名单)"
    echo "   - 数据库用户权限"
    echo "   - 连接字符串格式"
    echo ""
    echo "3. 常见解决方案："
    echo "   - 重新部署服务"
    echo "   - 检查环境变量拼写"
    echo "   - 验证MongoDB连接"
    echo ""
    echo "📚 详细指南: docs/render-environment-setup.md"
}

# 生成测试报告
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="fix-verification-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    log_step "7. 生成验证报告"
    
    cat > "$report_file" << EOF
手势飞机大战后端服务修复验证报告
=====================================

验证时间: $timestamp
服务地址: $SERVER_URL

验证结果:
---------
$(if quick_connection_test >/dev/null 2>&1; then echo "✅ 服务连接: 正常"; else echo "❌ 服务连接: 失败"; fi)
$(if health_check_test >/dev/null 2>&1; then echo "✅ 健康检查: 正常"; else echo "❌ 健康检查: 失败"; fi)

建议:
-----
- 如果所有测试通过，服务已成功修复
- 如果测试失败，请按照故障排除指南操作
- 定期运行此脚本监控服务状态
- 考虑设置监控和告警

EOF
    
    log_success "验证报告已保存: $report_file"
}

# 主函数
main() {
    print_title
    
    # 等待用户确认配置完成
    wait_for_confirmation
    
    print_separator
    log_info "开始验证服务修复状态..."
    print_separator
    
    # 执行测试
    local test_results=()
    
    # 快速连接测试
    if quick_connection_test; then
        test_results+=("connection:pass")
    else
        test_results+=("connection:fail")
        echo ""
        log_error "🚨 服务连接失败！请检查："
        echo "1. Render控制台服务状态"
        echo "2. 环境变量配置"
        echo "3. 部署日志错误信息"
        echo ""
    fi
    
    print_separator
    
    # 健康检查测试
    if health_check_test; then
        test_results+=("health:pass")
    else
        test_results+=("health:fail")
    fi
    
    print_separator
    
    # API端点测试
    api_endpoints_test
    
    print_separator
    
    # 性能测试
    if command -v bc &> /dev/null; then
        performance_test
        print_separator
    fi
    
    # 前端集成建议
    frontend_integration_test
    
    print_separator
    
    # 故障排除指南
    troubleshooting_guide
    
    print_separator
    
    # 生成报告
    generate_report
    
    # 总结
    print_separator
    log_info "🎯 验证总结:"
    
    local passed=0
    local total=${#test_results[@]}
    
    for result in "${test_results[@]}"; do
        if [[ $result == *":pass" ]]; then
            ((passed++))
        fi
    done
    
    if [ $passed -eq $total ] && [ $total -gt 0 ]; then
        log_success "🎉 所有核心测试通过！服务已成功修复！"
        echo ""
        echo "✅ 现在可以正常使用前端应用了"
        echo "🔗 API地址: $SERVER_URL"
        echo "📱 前端可以正常调用后端API"
    elif [ $passed -gt 0 ]; then
        log_warning "⚠️ 部分测试通过 ($passed/$total)"
        echo "请检查失败的测试项并按照故障排除指南操作"
    else
        log_error "❌ 所有测试失败"
        echo "请按照 docs/render-environment-setup.md 重新配置环境变量"
    fi
    
    print_separator
    
    return $((total - passed))
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi