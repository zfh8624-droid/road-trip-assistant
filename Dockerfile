# ============================================================
# 行野 · 自驾出行助手  多阶段 Docker 构建
# 产出：一个 Node Runtime 镜像，同时托管前端 SPA + 后端 API
# 部署平台：Zeabur / 自建 VPS / 任何支持 Docker 的环境
# 启动时自动：环境变量检查 → Prisma migrate deploy → 启动服务
# ============================================================

# ========== Stage 1: 构建前端 ==========
FROM node:20-alpine AS web-builder
LABEL stage=intermediate
WORKDIR /build/web

COPY web/package.json web/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi

COPY web/tsconfig*.json ./
COPY web/vite.config.ts ./
COPY web/index.html ./
COPY web/src ./src
RUN npm run build 2>&1 | tail -20

# ========== Stage 2: 构建后端 ==========
FROM node:20-alpine AS server-builder
LABEL stage=intermediate
WORKDIR /build/server

COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --silent; else npm install --omit=dev --silent; fi
# optionalDependencies: pg （默认不装，但生产镜像一定要有 pg 驱动）
RUN npm install pg --save-optional --silent

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build 2>&1 | tail -20

# ========== Stage 3: 运行镜像 ==========
FROM node:20-alpine AS runner
LABEL maintainer="Xingye Road Trip"
LABEL description="行野 · 全国自驾路线规划助手（前端SPA + Node API + PostgreSQL）"
LABEL io.zeabur.app.name="road-trip-assistant"

ENV NODE_ENV=production
ENV PORT=8080
ENV TZ=Asia/Shanghai

WORKDIR /app/server

# --- 后端产物 + 依赖 ---
COPY --from=server-builder /build/server/package.json /app/server/package.json
COPY --from=server-builder /build/server/node_modules /app/server/node_modules
COPY --from=server-builder /build/server/dist        /app/server/dist
COPY --from=server-builder /build/server/prisma      /app/server/prisma
COPY server/scripts/entrypoint.sh                    /app/server/scripts/entrypoint.sh

# --- 前端静态资源（拷到 server/public，Fastify 静态插件会读）---
COPY --from=web-builder /build/web/dist /app/server/public

# --- 运行时权限与启动入口 ---
RUN chmod +x /app/server/scripts/entrypoint.sh \
 && chown -R node:node /app

# --- 健康检查：/health 接口（Zeabur 会定期探活） ---
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health >/dev/null || exit 1

EXPOSE 8080

# 非 root 启动（更安全）
USER node

# 入口：环境变量检查 → prisma migrate deploy → node dist/index.js
ENTRYPOINT ["sh", "/app/server/scripts/entrypoint.sh"]
