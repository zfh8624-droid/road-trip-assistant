import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { planTrip, type PlanInput } from '../services/planner.js'
import { userIdFromReq } from './auth.js'

export async function tripRoutes(app: FastifyInstance) {
  // ========== 智能规划行程 ==========
  // - 如果带了 token → 规划结果直接落库（Trip/TripDay/TripEvent/TripStop/TripMember 全创建）
  // - 如果没 token  → 只返回计算结果（不入库）
  app.post('/api/trips/plan', async (request) => {
    const body = z.object({
      title: z.string().optional(),
      origin: z.string().min(1),
      destination: z.string().min(1),
      days: z.coerce.number().int().min(1).max(30).default(7),
      drivePref: z.enum(['轻松', '适中', '高效']).default('适中'),
      preferences: z.array(z.string()).default(['自然风光', '当地美食']),
      templateId: z.string().optional(),
      vehicleType: z.enum(['gas', 'ev']).default('gas'),
      customNeed: z.string().optional(),
    }).parse(request.body)

    const plan = await planTrip(body as PlanInput)

    const uid = userIdFromReq(request)
    let tripId: string | undefined
    if (uid) {
      try {
        // 1. 创建 Trip + Owner Member
        const trip = await prisma.trip.create({
          data: {
            title: plan.title,
            origin: plan.origin,
            destination: plan.destination,
            originLoc: plan.originLoc,
            destLoc: plan.destLoc,
            distanceKm: plan.totalDistance,
            totalDistance: plan.totalDistance * 1000,
            totalDuration: plan.totalDuration * 60,
            days: plan.schedule.length,
            drivePref: body.drivePref,
            vehicleType: body.vehicleType,
            preferences: body.preferences as any,
            polyline: plan.polyline as any,
            coverImage: plan.coverImage,
            status: 'planning',
            members: { create: { userId: uid, role: 'owner' } },
          },
        })
        tripId = trip.id

        // 2. schedule → TripDay（events 直接存 Json 列，不再需要单独的 Event 表）
        const scheduleData = plan.schedule.map((d: any) => ({
          day: d.day,
          date: d.date ? new Date(d.date) : null,
          startLocation: d.startLocation,
          distanceKm: d.distanceKm,
          driveMinutes: d.driveMinutes,
          location: d.location,
          events: d.events && d.events.length ? d.events : [],
        }))
        await prisma.tripDay.createMany({ data: scheduleData.map(d => ({ ...d, tripId })) })

        // 3. stops → TripStop
        if (plan.stops && plan.stops.length) {
          await prisma.tripStop.createMany({
            data: plan.stops.map(s => ({
              tripId,
              name: s.name,
              category: s.category || '途经',
              type: s.category,
              sort: s.sort,
              poiId: s.poiId || undefined,
              address: s.address || undefined,
              latitude: s.latitude,
              longitude: s.longitude,
              location: (s.longitude != null && s.latitude != null) ? `${s.longitude},${s.latitude}` : undefined,
              arrivalTime: s.arrivalTime,
              stayMinutes: s.stayMinutes,
              image: s.image,
              info: s.info,
            })),
          })
        }
      } catch (dbErr: any) {
        request.log.warn({ err: dbErr?.message }, '规划结果入库失败，已跳过（不影响前端展示）')
      }
    }

    return { ok: true, data: { ...plan, tripId } }
  })

  // ========== 创建行程（规划后保存到数据库） ==========
  app.post('/api/trips', async (request, reply) => {
    const uid = userIdFromReq(request)
    const body = z.object({
      userId: z.string().optional(),
      title: z.string(),
      origin: z.string(),
      destination: z.string(),
      originLoc: z.string().optional(),
      destLoc: z.string().optional(),
      totalDistance: z.number().int().optional(),
      days: z.number().int().min(1),
      drivePref: z.string().optional(),
      vehicleType: z.string().optional(),
      preferences: z.any().optional(),
      polyline: z.any().optional(),
      coverImage: z.string().optional(),
      stops: z.array(z.object({
        name: z.string(),
        category: z.string(),
        sort: z.number().int(),
        poiId: z.string().optional(),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        stayMinutes: z.number().int().optional(),
        arrivalTime: z.string().optional(),
        image: z.string().optional(),
        info: z.string().optional(),
      })).default([]),
      schedule: z.array(z.object({
        day: z.number().int(),
        location: z.string(),
        startLocation: z.string().optional(),
        distanceKm: z.number().int().optional(),
        driveMinutes: z.number().int().optional(),
        events: z.array(z.any()),
      })).default([]),
    }).parse(request.body)

    const owner = uid || body.userId
    if (!owner) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const trip = await prisma.trip.create({
      data: {
        title: body.title,
        origin: body.origin,
        destination: body.destination,
        originLoc: body.originLoc,
        destLoc: body.destLoc,
        distanceKm: body.totalDistance,
        totalDistance: body.totalDistance,
        totalDuration: body.schedule.reduce((sum: number, d: any) => sum + (d.driveMinutes || 0), 0) * 60,
        days: body.days,
        drivePref: body.drivePref,
        vehicleType: body.vehicleType,
        preferences: body.preferences,
        polyline: body.polyline,
        coverImage: body.coverImage,
        members: { create: { userId: owner, role: 'owner' } },
        stops: { create: body.stops },
        schedule: {
          create: body.schedule.map(d => ({
            day: d.day,
            startLocation: d.startLocation,
            distanceKm: d.distanceKm,
            driveMinutes: d.driveMinutes,
            location: d.location,
            events: d.events && d.events.length ? d.events : [],
          })),
        },
      },
      include: { stops: true, schedule: { orderBy: { day: 'asc' } }, members: true },
    })
    return { ok: true, data: trip }
  })

  // ========== 获取用户行程列表 ==========
  // 支持两种鉴权方式：
  //   a. Header: Authorization: Bearer <token>  → 取 token 里的 userId
  //   b. Query: ?userId=<id>                      → 显式传 userId（调试/兼容旧版）
  app.get('/api/trips', async (request, reply) => {
    const q = z.object({
      userId: z.string().optional(),
      status: z.string().optional(),
    }).parse(request.query)
    const uid = userIdFromReq(request) || q.userId
    if (!uid) return reply.code(401).send({ error: '请先登录或提供 userId' })

    const trips = await prisma.trip.findMany({
      where: {
        members: { some: { userId: uid } },
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { schedule: true, stops: true } },
      },
    })
    return { ok: true, data: { trips } }
  })

  // ========== 获取单个行程详情 ==========
  app.get('/api/trips/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const uid = userIdFromReq(request)

    const where: any = { id }
    if (uid) where.members = { some: { userId: uid } } // 登录后只允许看自己的
    const trip = await prisma.trip.findUnique({
      where,
      include: {
        stops: { orderBy: { sort: 'asc' } },
        schedule: { orderBy: { day: 'asc' } },
        members: { include: { user: true } },
      },
    })
    if (!trip) return reply.code(404).send({ error: '行程不存在或无权查看' })
    return { ok: true, data: trip }
  })

  // ========== 更新行程状态/标题 ==========
  app.patch('/api/trips/:id', async (request, reply) => {
    const uid = userIdFromReq(request)
    if (!uid) return reply.code(401).send({ error: '请先登录' })

    const { id } = z.object({ id: z.string() }).parse(request.params)
    const body = z.object({
      status: z.enum(['draft', 'planning', 'ongoing', 'completed']).optional(),
      title: z.string().optional(),
    }).parse(request.body)

    const member = await prisma.tripMember.findFirst({ where: { tripId: id, userId: uid } })
    if (!member) return reply.code(403).send({ error: '无权修改此行程' })

    const trip = await prisma.trip.update({ where: { id }, data: body })
    return { ok: true, data: trip }
  })

  // ========== 删除行程 ==========
  app.delete('/api/trips/:id', async (request, reply) => {
    const uid = userIdFromReq(request)
    if (!uid) return reply.code(401).send({ error: '请先登录' })

    const { id } = z.object({ id: z.string() }).parse(request.params)
    const member = await prisma.tripMember.findFirst({ where: { tripId: id, userId: uid } })
    if (!member || member.role !== 'owner') return reply.code(403).send({ error: '只有创建者可删除' })

    await prisma.trip.delete({ where: { id } })
    return { ok: true }
  })
}
