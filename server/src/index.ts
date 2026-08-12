import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { config } from './lib/config.js'
import { authRoutes } from './routes/auth.js'
import { tripRoutes } from './routes/trips.js'
import { amapRoutes } from './routes/amap.js'
import { favoriteRoutes } from './routes/favorites.js'
import { invitationRoutes } from './routes/invitations.js'
import { templateRoutes } from './routes/templates.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(sensible)

// 健康检查
app.get('/health', async () => ({ ok: true, service: 'xingye-api', version: '1.0.0' }))

// 注册路由
await app.register(authRoutes)
await app.register(tripRoutes)
await app.register(amapRoutes)
await app.register(favoriteRoutes)
await app.register(invitationRoutes)
await app.register(templateRoutes)

const port = config.port
await app.listen({ port, host: '0.0.0.0' })
console.log(`🚀 行野 API 服务已启动: http://localhost:${port}`)
if (!config.amapKey) {
  console.log('⚠️  AMAP_KEY 未配置，将使用 Mock 数据运行（可在 .env 中配置高德 Web 服务 Key）')
}
