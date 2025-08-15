# ===== build 阶段 =====
FROM node:18-alpine AS builder

WORKDIR /app

# 安装编译所需工具
RUN apk add --no-cache python3 make g++

# 安装 pnpm
RUN npm install -g pnpm@10.14.0

# 先复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖时跳过 postinstall（否则会提前触发 tsc）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 复制源码
COPY . .

# 手动构建
RUN pnpm run build


# ===== 运行阶段 =====
FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm@10.14.0

# 只安装生产依赖，跳过 postinstall
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# 拷贝 build 阶段的编译产物
COPY --from=builder /app/dist ./dist

# 如果还有运行时需要的非编译文件，可以额外拷贝
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/app.js"]
