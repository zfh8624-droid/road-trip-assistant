import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { inputTips, searchAround, searchText, poiDetail, type Tip } from '../services/amap.js'
import { getSupplyNearby } from '../services/planner.js'

export async function amapRoutes(app: FastifyInstance) {
  // 输入提示（出发地/目的地搜素补全）
  app.get('/api/amap/tips', async (request) => {
    const q = z.object({
      keywords: z.string().min(1),
      city: z.string().optional()
    }).parse(request.query)
    const tips: Tip[] = await inputTips(q.keywords, q.city)
    return { tips }
  })

  // 周边搜索
  app.get('/api/amap/nearby', async (request, reply) => {
    const q = z.object({
      location: z.string(),
      keywords: z.string().optional(),
      types: z.string().optional(),
      radius: z.coerce.number().default(5000),
      page: z.coerce.number().default(1),
      offset: z.coerce.number().default(20)
    }).parse(request.query)
    const result = await searchAround(q.location, q.keywords, q.types, q.radius, q.page, q.offset)
    return result
  })

  // 关键字搜索
  app.get('/api/amap/search', async (request) => {
    const q = z.object({
      keywords: z.string().min(1),
      city: z.string().optional(),
      types: z.string().optional(),
      page: z.coerce.number().default(1),
      offset: z.coerce.number().default(20)
    }).parse(request.query)
    const result = await searchText(q.keywords, q.city, q.types, q.page, q.offset)
    return result
  })

  // POI 详情
  app.get('/api/amap/poi/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const poi = await poiDetail(id)
    if (!poi) return reply.notFound('POI不存在')
    return poi
  })

  // 附近补给（加油站+充电站）
  app.get('/api/amap/supply', async (request) => {
    const q = z.object({
      location: z.string(),
      type: z.enum(['gas', 'charge', 'all']).default('all'),
      radius: z.coerce.number().default(5000)
    }).parse(request.query)
    return getSupplyNearby(q.location, q.type, q.radius)
  })
}
