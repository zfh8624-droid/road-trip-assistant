# 行野 API

## 本地开发

```bash
cp .env.example .env
pnpm install
pnpm exec prisma migrate dev
pnpm dev
```

健康检查：`GET /health`

## Zeabur

1. 创建 PostgreSQL 服务。
2. 创建 Git 服务，仓库选择本项目，根目录设为 `server`。
3. 配置 `DATABASE_URL`、`WECHAT_APPID`、`WECHAT_SECRET`、`AMAP_KEY`。
4. 部署后运行 `pnpm exec prisma migrate deploy`。
5. 生成后端域名并加入微信公众平台合法请求域名。
