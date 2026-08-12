import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { config } from '../lib/config.js'

/**
 * 简易 JWT（无外部依赖，使用 HMAC-SHA256，payload 放 userId）
 * 生产环境建议换成 jsonwebtoken 库或接入真实 OAuth/OIDC
 */
import crypto from 'node:crypto'

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30天
const SECRET = config.tokenSecret

function sign(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: userId, exp: Date.now() + TOKEN_TTL_MS }))
  const toSign = `${header}.${payload}`
  const sig = crypto.createHmac('sha256', SECRET).update(toSign).digest('base64url')
  return `${toSign}.${sig}`
}

function verify(token: string): string | null {
  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return null
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf-8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload.sub as string
  } catch {
    return null
  }
}

export function userIdFromReq(req: FastifyRequest): string | undefined {
  const hdr = req.headers.authorization
  if (!hdr?.startsWith('Bearer ')) return undefined
  const tok = hdr.slice(7)
  return verify(tok) || undefined
}

function userResp(user: { id: string; nickname: string; avatarUrl?: string | null }) {
  const avatar = user.avatarUrl || user.nickname.slice(0, 1) || '行'
  return {
    token: sign(user.id),
    user: { id: user.id, nickname: user.nickname, avatar },
  }
}

export async function authRoutes(app: FastifyInstance) {
  // ====== 微信小程序登录 ======
  app.post('/api/auth/wechat', async (request, reply) => {
    const body = z.object({
      code: z.string().min(1),
      nickname: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    }).parse(request.body)

    if (!config.wechatAppid || !config.wechatSecret) {
      return reply.code(503).send({ error: '微信登录尚未配置 WECHAT_APPID / WECHAT_SECRET' })
    }

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechatAppid}&secret=${config.wechatSecret}&js_code=${encodeURIComponent(body.code)}&grant_type=authorization_code`
    )
    const data = (await response.json()) as { openid?: string; errcode?: number; errmsg?: string }
    if (!data.openid) return reply.code(400).send({ error: data.errmsg || '微信登录失败' })

    const user = await prisma.user.upsert({
      where: { openid: data.openid },
      update: { nickname: body.nickname, avatarUrl: body.avatarUrl },
      create: { openid: data.openid, nickname: body.nickname || '自驾旅行者', avatarUrl: body.avatarUrl },
    })
    return { ok: true, data: userResp(user) }
  })

  // ====== 匿名/游客登录（Web端冷启动默认模式） ======
  app.post('/api/auth/guest', async (request) => {
    const body = z.object({
      nickname: z.string().optional().default('自驾旅行者'),
    }).parse(request.body || {})

    // 已登录用户直接刷新 token
    const existing = userIdFromReq(request)
    if (existing) {
      const u = await prisma.user.findUnique({ where: { id: existing } })
      if (u) return { ok: true, data: userResp(u) }
    }

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const user = await prisma.user.create({
      data: { openid: guestId, nickname: body.nickname },
    })
    return { ok: true, data: userResp(user) }
  })

  // 匿名登录兼容别名
  app.post('/api/auth/anon', async (request) => app.inject({
    method: 'POST',
    url: '/api/auth/guest',
    headers: request.headers,
    payload: request.body,
  }).then(r => JSON.parse(r.payload)))

  // ====== 获取当前用户资料 ======
  app.get('/api/auth/me', async (request, reply) => {
    const uid = userIdFromReq(request)
    if (!uid) return reply.code(401).send({ error: '请先登录' })
    const user = await prisma.user.findUnique({ where: { id: uid } })
    if (!user) return reply.code(401).send({ error: '用户不存在' })
    return { ok: true, data: userResp(user).user }
  })

  // ====== 修改资料 ======
  app.patch('/api/auth/me', async (request, reply) => {
    const uid = userIdFromReq(request)
    if (!uid) return reply.code(401).send({ error: '请先登录' })
    const body = z.object({
      nickname: z.string().optional(),
      avatar: z.string().optional(),
    }).parse(request.body || {})

    const data: any = {}
    if (body.nickname) data.nickname = body.nickname
    if (body.avatar) data.avatarUrl = body.avatar

    const user = await prisma.user.update({ where: { id: uid }, data })
    return { ok: true, data: userResp(user).user }
  })
}
