import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './lib/config.js'
import { authRoutes } from './routes/auth.js'
import { tripRoutes } from './routes/trips.js'
import { amapRoutes } from './routes/amap.js'
import { favoriteRoutes } from './routes/favorites.js'
import { invitationRoutes } from './routes/invitations.js'
import { templateRoutes } from './routes/templates.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(sensible)

// 健康检查
app.get('/health', async () => ({ ok: true, service: 'xingye-api', version: '1.0.0' }))

// 注册 API 路由（必须在静态资源之前，保证 /api/* 不被前端 SPA 吃掉）
await app.register(authRoutes)
await app.register(tripRoutes)
await app.register(amapRoutes)
await app.register(favoriteRoutes)
await app.register(invitationRoutes)
await app.register(templateRoutes)

// ---- 前端静态资源托管（同一域名下，线上零跨域）----
// 约定：构建时把 web/dist/* 拷到 server/public/，Dockerfile 里已处理
const WEB_ROOT = path.resolve(__dirname, '../public')
try {
  await app.register(fastifyStatic, {
    root: WEB_ROOT,
    prefix: '/',
    // cache 策略：带 hash 的 assets 长缓存，其它默认
    setHeaders(res, filePath) {
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  })
  // SPA fallback: 所有未匹配路由都返回 index.html（Vue Router history 模式）
  app.setNotFoundHandler((req, reply) => {
    const url = req.raw.url || ''
    if (url.startsWith('/api/') || url.startsWith('/health')) {
      return reply.code(404).send({ error: 'Not Found', statusCode: 404 })
    }
    return reply.sendFile('index.html')
  })
  console.log(`🌐 前端静态资源已挂载: ${WEB_ROOT}`)
} catch (e: any) {
  // 本地开发没拷贝 public 目录也不影响，API 照常跑
  if (!String(e?.message || '').includes('root directory')) throw e
  console.log('ℹ️  未检测到 server/public（本地开发），前端由 Vite 单独提供')
}

const port = config.port
await app.listen({ port, host: '0.0.0.0' })
console.log(`🚀 行野 API 服务已启动: http://localhost:${port}`)
if (!config.amapKey) {
  console.log('⚠️  AMAP_KEY 未配置，将使用 Mock 数据运行（可在 .env 中配置高德 Web 服务 Key）')
}
