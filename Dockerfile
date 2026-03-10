# 使用官方 Node.js 镜像作为基础镜像
FROM node:20.19.5

# 设置工作目录
WORKDIR /app/web

# 将 package.json 和 yarn.lock 拷贝到镜像内
COPY package.json .
COPY yarn.lock .

# 使用 yarn 安装依赖
RUN yarn install

# 将项目代码拷贝到容器中
COPY . .

# 配置环境变量
ENV VITE_API_PREFIX=/api

# 构建/编译项目
RUN NODE_OPTIONS=--max-old-space-size=4096 yarn build
