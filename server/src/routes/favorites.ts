import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { userIdFromReq } from './auth.js'

export async function favoriteRoutes(app: FastifyInstance) {
  // ========== 获取用户收藏列表 ==========
  app.get('/api/favorites', async (request, reply) => {
    const q = z.object({ userId: z.string().optional() }).parse(request.query)
    const uid = userIdFromReq(request) || q.userId
    if (!uid) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const favorites = await prisma.favorite.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
    })
    return { ok: true, data: { favorites } }
  })

  // ========== 切换收藏（前端期望接口：/toggle） ==========
  app.post('/api/favorites/toggle', async (request, reply) => {
    const uid = userIdFromReq(request)
    const body = z.object({
      userId: z.string().optional(),
      poiId: z.string().optional(),
      poiName: z.string().min(1),
      poiType: z.string().default('scenic'),
      location: z.string().optional(),
      address: z.string().optional(),
    }).parse(request.body || {})

    const owner = uid || body.userId
    if (!owner) return reply.code(401).send({ error: '请先登录或提供 userId' })

    // 兼容：Favorite 模型用 placeName + category + metadata(location,address,poiId)
    const metadata: any = {}
    if (body.location) metadata.location = body.location
    if (body.address) metadata.address = body.address
    if (body.poiId) metadata.poiId = body.poiId

    const exist = await prisma.favorite.findUnique({
      where: { userId_placeName: { userId: owner, placeName: body.poiName } },
    })
    if (exist) {
      await prisma.favorite.delete({ where: { userId_placeName: { userId: owner, placeName: body.poiName } } })
      return { ok: true, data: { favorited: false } }
    } else {
      await prisma.favorite.create({
        data: {
          userId: owner,
          placeName: body.poiName,
          poiId: body.poiId,
          category: body.poiType,
          metadata: Object.keys(metadata).length ? metadata : undefined,
        },
      })
      return { ok: true, data: { favorited: true } }
    }
  })

  // ========== 添加/更新收藏（旧版兼容） ==========
  app.post('/api/favorites', async (request, reply) => {
    const uid = userIdFromReq(request)
    const body = z.object({
      userId: z.string().optional(),
      placeName: z.string(),
      poiId: z.string().optional(),
      category: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }).parse(request.body)

    const owner = uid || body.userId
    if (!owner) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const data = {
      userId: owner,
      placeName: body.placeName,
      poiId: body.poiId,
      category: body.category,
      metadata: body.metadata,
    }
    const fav = await prisma.favorite.upsert({
      where: { userId_placeName: { userId: owner, placeName: body.placeName } },
      update: { poiId: body.poiId, category: body.category, metadata: body.metadata },
      create: data,
    })
    return { ok: true, data: fav }
  })

  // ========== 取消收藏 ==========
  app.delete('/api/favorites', async (request, reply) => {
    const uid = userIdFromReq(request)
    const q = z.object({
      userId: z.string().optional(),
      placeName: z.string(),
    }).parse(request.query)
    const owner = uid || q.userId
    if (!owner) return reply.code(401).send({ error: '请先登录或提供 userId' })

    await prisma.favorite.delete({ where: { userId_placeName: { userId: owner, placeName: q.placeName } } })
    return { ok: true }
  })

  // ========== 检查是否已收藏 ==========
  app.get('/api/favorites/check', async (request, reply) => {
    const uid = userIdFromReq(request)
    const q = z.object({
      userId: z.string().optional(),
      placeName: z.string(),
    }).parse(request.query)
    const owner = uid || q.userId
    if (!owner) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const fav = await prisma.favorite.findUnique({
      where: { userId_placeName: { userId: owner, placeName: q.placeName } },
    })
    return { ok: true, data: { favorited: !!fav } }
  })
}
