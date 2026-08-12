import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = Fastify({ logger: true })
await app.register(cors, { origin: true })
await app.register(sensible)

app.get('/health', async () => ({ ok: true, service: 'xingye-api' }))

app.post('/api/auth/wechat', async (request, reply) => {
  const body = z.object({ code: z.string().min(1), nickname: z.string().optional(), avatarUrl: z.string().url().optional() }).parse(request.body)
  if (!process.env.WECHAT_APPID || !process.env.WECHAT_SECRET) return reply.serviceUnavailable('微信登录尚未配置 WECHAT_APPID / WECHAT_SECRET')
  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}&js_code=${encodeURIComponent(body.code)}&grant_type=authorization_code`)
  const data = await response.json() as { openid?: string; errcode?: number; errmsg?: string }
  if (!data.openid) return reply.badRequest(data.errmsg || '微信登录失败')
  const user = await prisma.user.upsert({ where: { openid: data.openid }, update: { nickname: body.nickname, avatarUrl: body.avatarUrl }, create: { openid: data.openid, nickname: body.nickname, avatarUrl: body.avatarUrl } })
  return { userId: user.id }
})

app.post('/api/trips', async (request) => {
  const body = z.object({ title: z.string(), origin: z.string(), destination: z.string(), distanceKm: z.number().int().optional(), days: z.number().int().min(1), preferences: z.record(z.any()).optional(), stops: z.array(z.object({ name: z.string(), category: z.string(), sort: z.number().int(), latitude: z.number().optional(), longitude: z.number().optional(), metadata: z.record(z.any()).optional() })).default([]), schedule: z.array(z.object({ day: z.number().int(), location: z.string(), events: z.array(z.record(z.any())) })).default([]), userId: z.string().min(1) }).parse(request.body)
  return prisma.trip.create({ data: { title: body.title, origin: body.origin, destination: body.destination, distanceKm: body.distanceKm, days: body.days, preferences: body.preferences, members: { create: { userId: body.userId, role: 'owner' } }, stops: { create: body.stops }, schedule: { create: body.schedule } }, include: { stops: true, schedule: true } })
})

app.get('/api/trips/:id', async (request, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const trip = await prisma.trip.findUnique({ where: { id }, include: { stops: { orderBy: { sort: 'asc' } }, schedule: { orderBy: { day: 'asc' } }, members: { include: { user: true } } } }); if (!trip) return reply.notFound('行程不存在'); return trip })

app.post('/api/favorites', async (request) => { const body = z.object({ userId: z.string(), placeName: z.string(), category: z.string().optional(), metadata: z.record(z.any()).optional() }).parse(request.body); return prisma.favorite.upsert({ where: { userId_placeName: { userId: body.userId, placeName: body.placeName } }, update: body, create: body }) })
app.delete('/api/favorites', async (request) => { const body = z.object({ userId: z.string(), placeName: z.string() }).parse(request.body); await prisma.favorite.delete({ where: { userId_placeName: body } }); return { ok: true } })
app.post('/api/invitations', async (request) => { const body = z.object({ tripId: z.string(), inviterId: z.string(), inviteeName: z.string().min(1) }).parse(request.body); return prisma.invitation.create({ data: body }) })

app.get('/api/amap/nearby', async (request, reply) => { const q = z.object({ location: z.string(), keywords: z.string().default('加油站|充电站'), radius: z.coerce.number().default(5000) }).parse(request.query); if (!process.env.AMAP_KEY) return reply.serviceUnavailable('AMAP_KEY 尚未配置'); const url = `https://restapi.amap.com/v3/place/around?key=${process.env.AMAP_KEY}&location=${encodeURIComponent(q.location)}&keywords=${encodeURIComponent(q.keywords)}&radius=${q.radius}&extensions=all`; const response = await fetch(url); return response.json() })

const port = Number(process.env.PORT || 8080)
await app.listen({ port, host: '0.0.0.0' })
