#!/bin/sh
# ============================================================
# 行野 · 生产环境启动入口
# 职责:
#   1. 校验必要的环境变量（缺失就报错退出，避免服务启动后才炸）
#   2. 执行 Prisma migrate deploy（生产标准迁移命令，不会改 schema）
#   3. 启动 Node 后端（同时托管前端静态资源）
# ============================================================
set -e

cd /app/server

echo "========================================="
echo "🚀 Xingye Server · 启动前置检查"
echo "  PORT:           ${PORT:-8080}"
echo "  DATABASE_URL:   ${DATABASE_URL:0:30}***"
echo "  AMAP_KEY:       ${AMAP_KEY:+已配置(尾号 ${AMAP_KEY: -4})}"
echo "  WECHAT_APPID:   ${WECHAT_APPID:+已配置}"
echo "========================================="

# 1. 必要环境变量检查
: "${DATABASE_URL:?❌ 缺少 DATABASE_URL，请在部署平台环境变量面板填写 PostgreSQL 连接串}"
: "${TOKEN_SECRET:?❌ 缺少 TOKEN_SECRET，请填写 32+ 字节随机字符串（openssl rand -hex 32）}"

if [ -z "$AMAP_KEY" ]; then
  echo "⚠️  AMAP_KEY 未配置 → 地理编码/路径规划/周边搜索 将降级为 Mock 数据（仅调试可用）"
fi

# 2. 生成 Prisma Client（防止镜像内没有预生成）
echo "🔄 Prisma Client 生成中..."
npx prisma generate

# 3. 执行生产迁移（migrate deploy 不会提示交互，失败直接退出）
echo "🔄 数据库迁移中..."
if npx prisma migrate deploy; then
  echo "✅ 数据库迁移完成"
else
  echo "❌ 数据库迁移失败，请检查 DATABASE_URL 账号权限与数据库是否存在"
  exit 1
fi

# 4. 启动服务
echo "✅ 启动 node 服务（PORT=${PORT:-8080}）..."
exec node dist/index.js
