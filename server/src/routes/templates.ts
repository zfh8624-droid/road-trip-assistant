import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getRouteTemplates, getRouteTemplateById } from '../data/route-templates.js'

export async function templateRoutes(app: FastifyInstance) {
  // 获取所有路线模板
  app.get('/api/templates', async () => {
    const templates = getRouteTemplates().map(t => ({
      id: t.id,
      no: t.no,
      name: t.name,
      origin: t.origin,
      destination: t.destination,
      distanceKm: t.distanceKm,
      days: t.days,
      tags: t.tags,
      coverImage: t.coverImage,
      summary: t.summary,
      highlightsCount: t.highlights.length,
    }))
    return { templates }
  })

  // 获取单个模板详情
  app.get('/api/templates/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const tpl = getRouteTemplateById(id)
    if (!tpl) return reply.notFound('路线模板不存在')
    return tpl
  })
}
