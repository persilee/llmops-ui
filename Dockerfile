# 使用官方 Node.js 镜像作为基础镜像
# 拉取amd64版本的node镜像
# docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20.19.5
# docker tag swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20.19.5 node:20.19.5
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

# 一行命令部署：
# DOCKER_BUILDKIT=0 docker run --rm --user $(id -u):$(id -g) -v $(pwd):/app/web -v /www/wwwroot/llmops:/app/llmops -w /app/web -e NODE_OPTIONS=--max-old-space-size=4096 node:20.19.5 bash -c "yarn install && yarn build && cp -r dist/. /app/llmops"
