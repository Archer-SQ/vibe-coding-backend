# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache python3 make g++

# 安装pnpm (指定版本以确保兼容性)
RUN npm install -g pnpm@10.14.0

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 设置npm镜像源
RUN pnpm config set registry https://registry.npmmirror.com

# 安装依赖
RUN pnpm install --frozen-lockfile --prod

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "run", "start"]
