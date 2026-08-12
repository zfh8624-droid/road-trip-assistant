import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { userIdFromReq } from './auth.js'
import crypto from 'node:crypto'

export async function invitationRoutes(app: FastifyInstance) {
  // ========== 创建邀请链接 ==========
  app.post('/api/invitations', async (request, reply) => {
    const uid = userIdFromReq(request)
    const body = z.object({
      tripId: z.string(),
      inviterId: z.string().optional(),
      inviteeName: z.string().min(1).optional(),
      permission: z.enum(['view', 'edit']).default('edit'),
    }).parse(request.body)

    const inviter = uid || body.inviterId
    if (!inviter) return reply.code(401).send({ error: '请先登录' })

    // 必须是该行程成员
    const isMember = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: body.tripId, userId: inviter } },
    })
    if (!isMember) return reply.code(403).send({ error: '你不是此行程的成员，无法邀请' })

    const token = crypto.createHash('sha1').update(`${body.tripId}-${inviter}-${Date.now()}`).digest('hex').slice(0, 16)
    const invitation = await prisma.invitation.create({
      data: {
        tripId: body.tripId,
        inviterId: inviter,
        inviteeName: body.inviteeName,
        token,
        permission: body.permission,
        status: 'pending',
      },
    })
    return { ok: true, data: { ...invitation, link: `/invite/${invitation.id}?t=${token}` } }
  })

  // ========== 接受邀请（将用户加入行程） ==========
  app.post('/api/invitations/accept/:id', async (request, reply) => {
    const uid = userIdFromReq(request)
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const body = z.object({
      userId: z.string().optional(),
      token: z.string().optional(),
    }).parse(request.body || {})

    const invitee = uid || body.userId
    if (!invitee) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const invitation = await prisma.invitation.findUnique({ where: { id } })
    if (!invitation) return reply.code(404).send({ error: '邀请不存在' })
    if (invitation.status !== 'pending') return reply.code(400).send({ error: '邀请已处理' })
    if (body.token && invitation.token && body.token !== invitation.token) {
      return reply.code(403).send({ error: '邀请码无效' })
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: 'accepted', inviteeId: invitee },
    })

    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: invitation.tripId, userId: invitee } },
    })
    if (!existing) {
      await prisma.tripMember.create({
        data: { tripId: invitation.tripId, userId: invitee, role: invitation.permission === 'view' ? 'viewer' : 'member' },
      })
    }
    return { ok: true, data: { tripId: invitation.tripId } }
  })

  // 旧版兼容路径
  app.post('/api/invitations/:id/accept', async (request) => {
    const { id } = request.params as any
    return app.inject({
      method: 'POST',
      url: `/api/invitations/accept/${id}`,
      headers: request.headers,
      payload: request.body,
    }).then(r => JSON.parse(r.payload))
  })

  // ========== 获取行程的邀请列表 ==========
  app.get('/api/invitations', async (request, reply) => {
    const uid = userIdFromReq(request)
    const q = z.object({ tripId: z.string() }).parse(request.query)

    // 必须是该行程成员才能看邀请列表
    if (uid) {
      const m = await prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId: q.tripId, userId: uid } },
      })
      if (!m) return reply.code(403).send({ error: '你不是此行程的成员' })
    }
    const invitations = await prisma.invitation.findMany({
      where: { tripId: q.tripId },
      include: { inviter: true, invitee: true },
      orderBy: { createdAt: 'desc' },
    })
    return { ok: true, data: { invitations } }
  })
}
