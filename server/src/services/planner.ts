import { geocode, driving, searchAlongRoute, parsePolyline, searchAround, type AmapPoi } from './amap.js'
import { getRouteTemplateById, routeTemplates, type RouteTemplate } from '../data/route-templates.js'

// ==================== 类型定义 ====================
export interface PlanInput {
  title?: string
  origin: string         // 出发地名称
  destination: string    // 目的地名称
  days: number           // 天数
  drivePref?: '轻松' | '适中' | '高效'
  preferences?: string[] // 偏好标签
  templateId?: string    // 基于模板创建（可选）
  vehicleType?: 'gas' | 'ev'
  customNeed?: string    // 用户自定义备注/特殊需求
}

export interface PlanEvent {
  time: string
  title: string
  desc: string
  icon: string
  poiId?: string
  location?: string
  category?: string
}

export interface PlanDay {
  day: number
  dayLabel: string       // "01"
  location: string       // 当天落脚点
  startLocation?: string
  distanceKm: number
  driveMinutes: number
  events: PlanEvent[]
  polyline?: string
}

export interface PlanStop {
  name: string
  category: string
  sort: number
  poiId?: string
  address?: string
  latitude?: number
  longitude?: number
  stayMinutes?: number
  arrivalTime?: string
  image?: string
  info?: string
}

export interface PlanSpot {
  name: string
  type: '景点' | '美食'
  info: string
  image?: string
  poiId?: string
  location?: string
  address?: string
  rating?: number
}

export interface PlanResult {
  title: string
  origin: string
  destination: string
  originLoc?: string
  destLoc?: string
  totalDistance: number  // km
  totalDuration: number  // 分钟
  days: number
  drivePref: string
  vehicleType: string
  preferences: string[]
  polyline: string[]
  stops: PlanStop[]
  schedule: PlanDay[]
  spots: PlanSpot[]
  coverImage?: string
}

// ==================== 驾驶强度配置 ====================
const DRIVE_CONFIG = {
  '轻松': { maxDailyMinutes: 240, label: '轻松驾驶' },  // 4h
  '适中': { maxDailyMinutes: 330, label: '适中驾驶' },  // 5.5h
  '高效': { maxDailyMinutes: 420, label: '高效驾驶' },  // 7h
}

const DAY_START_HOUR = 8     // 早上 8 点出发
const LUNCH_HOUR = 12        // 12 点午餐
const LUNCH_DURATION = 90    // 午餐+休息 1.5h
const CHECKIN_HOUR = 17      // 17 点入住
const SPOT_DURATION = 120    // 景点停留 2h

// ==================== 辅助函数 ====================
function formatMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

function formatTime(totalMinFromMidnight: number): string {
  const h = Math.floor(totalMinFromMidnight / 60)
  const m = Math.round(totalMinFromMidnight % 60 / 5) * 5
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function kmBetween(loc1: string, loc2: string): number {
  const [lng1, lat1] = loc1.split(',').map(Number)
  const [lng2, lat2] = loc2.split(',').map(Number)
  return Math.sqrt(((lng2 - lng1) * 111) ** 2 + ((lat2 - lat1) * 102) ** 2)
}

// ==================== 核心规划逻辑 ====================
export async function planTrip(input: PlanInput): Promise<PlanResult> {
  const drivePref = input.drivePref || '适中'
  const prefs = input.preferences || ['自然风光', '当地美食']
  const vehicleType = input.vehicleType || 'gas'
  const driveCfg = DRIVE_CONFIG[drivePref]

  // 1. 地理编码：获取起终点坐标
  const originGeo = await geocode(input.origin)
  const destGeo = await geocode(input.destination)
  const originLoc = originGeo?.location || '104.0668,30.5728'
  const destLoc = destGeo?.location || originLoc
  const originName = originGeo?.formattedAddress?.replace(/^中国/, '') || input.origin
  const destName = destGeo?.formattedAddress?.replace(/^中国/, '') || input.destination

  // 2. 选择基础路线
  let template: RouteTemplate | undefined
  if (input.templateId) {
    template = getRouteTemplateById(input.templateId)
  } else {
    // 智能匹配：找起点最近的模板，或者用第一个
    let bestTemplate = routeTemplates[0]
    let bestDist = Infinity
    for (const t of routeTemplates) {
      const d = kmBetween(originLoc, t.originLoc)
      if (d < bestDist) { bestDist = d; bestTemplate = t }
    }
    template = bestTemplate
  }

  // 3. 路径规划（起终点驾车路线）
  const route = await driving(originLoc, destLoc)
  const totalDistanceKm = route ? Math.round(route.distance / 1000) : Math.round(kmBetween(originLoc, destLoc) * 1.4)
  const totalDurationMin = route ? Math.round(route.duration / 60) : Math.round(totalDistanceKm / 60 * 60)

  // 实际使用天数：如果用户给的天数明显不够（每天超过7小时），自动调整建议
  let actualDays = input.days
  const minDaysByDist = Math.ceil(totalDurationMin / DRIVE_CONFIG['高效'].maxDailyMinutes)
  if (actualDays < minDaysByDist) actualDays = Math.max(minDaysByDist, 1)

  // 4. 计算每日落脚点
  const dailyPoints = await computeDailyStops(originLoc, destLoc, originName, destName, actualDays, driveCfg.maxDailyMinutes, template)

  // 5. 生成每日日程和景点
  const schedule: PlanDay[] = []
  const allStops: PlanStop[] = []
  const allSpots: PlanSpot[] = []
  let sortOrder = 0

  // 加入起点
  allStops.push({ name: originName, category: '起点', sort: sortOrder++, latitude: Number(originLoc.split(',')[1]), longitude: Number(originLoc.split(',')[0]) })

  const templateHighlights = template?.highlights || []
  const availableHighlights = [...templateHighlights]

  for (let i = 0; i < dailyPoints.length; i++) {
    const day = dailyPoints[i]
    const isFirstDay = i === 0
    const isLastDay = i === dailyPoints.length - 1

    const events: PlanEvent[] = []
    let currentTime = isFirstDay ? 7 * 60 + 30 : 8 * 60 + 30  // 第一天7:30出发，其余8:30
    const startLabel = isFirstDay ? originName : dailyPoints[i - 1].name

    // 出发事件
    events.push({
      time: formatTime(currentTime),
      title: isFirstDay ? `从家出发 · ${startLabel} → ${day.name}` : `${startLabel} → ${day.name}`,
      desc: isFirstDay ? '直接进入导航，不在出发地停留' : `导航前往 ${day.name}，预计驾驶 ${formatMinutes(day.driveMinutes)}，里程 ${day.distanceKm}km`,
      icon: 'car-front',
      location: day.loc,
      category: 'driving'
    })
    currentTime += day.driveMinutes

    // 服务区休息（长距离时添加）
    if (day.driveMinutes > 180) {
      const restTime = currentTime - Math.round(day.driveMinutes / 2)
      events.push({
        time: formatTime(restTime),
        title: '服务区短暂休息',
        desc: '检查车辆状态，按需补给',
        icon: 'fuel-pump',
      })
    }

    // 午餐事件（如果时间在11:00-14:00之间）
    currentTime = Math.max(currentTime, LUNCH_HOUR * 60)
    let lunchSpot: PlanSpot | undefined
    const lunchIdx = availableHighlights.findIndex(h => h.type === '美食')
    if (lunchIdx > -1) {
      lunchSpot = availableHighlights[lunchIdx]
      availableHighlights.splice(lunchIdx, 1)
    }
    events.push({
      time: formatTime(LUNCH_HOUR * 60 + 30),
      title: lunchSpot ? `午餐 · ${lunchSpot.name}` : `沿途午餐 · ${day.name}`,
      desc: lunchSpot ? lunchSpot.info : '预留一个半小时用餐和休息',
      icon: 'utensils',
      poiId: lunchSpot?.poiId,
      location: lunchSpot?.location,
      category: 'food'
    })
    if (lunchSpot && !allSpots.find(s => s.name === lunchSpot.name)) allSpots.push(lunchSpot)
    currentTime = (LUNCH_HOUR * 60 + 30) + LUNCH_DURATION

    // 景点事件（下午）
    const scenicSpots = availableHighlights.filter(h => h.type === '景点')
    const scenicSpot = scenicSpots[0]
    if (scenicSpot) {
      const idx = availableHighlights.indexOf(scenicSpot)
      if (idx > -1) availableHighlights.splice(idx, 1)
    }
    const spotTime = Math.max(currentTime, 14 * 60)
    if (scenicSpot && spotTime < CHECKIN_HOUR * 60) {
      events.push({
        time: formatTime(spotTime),
        title: scenicSpot.name,
        desc: scenicSpot.info,
        icon: 'map-pin',
        poiId: scenicSpot.poiId,
        location: scenicSpot.location,
        category: 'scenic'
      })
      if (!allSpots.find(s => s.name === scenicSpot.name)) allSpots.push(scenicSpot)
      currentTime = spotTime + SPOT_DURATION
    } else if (!isLastDay) {
      events.push({
        time: formatTime(spotTime),
        title: `${day.name}沿途观景`,
        desc: '根据到达时间灵活停留',
        icon: 'map-pin'
      })
    }

    // 补给+入住事件
    const supplyDesc = vehicleType === 'ev' ? '补充充电，入住休息' : '补充燃油，入住休息'
    events.push({
      time: formatTime(CHECKIN_HOUR * 60),
      title: `抵达并入住 ${day.name}`,
      desc: isLastDay ? '到达目的地，旅途愉快！' : supplyDesc + '，查看次日路况',
      icon: 'bed',
      location: day.loc,
      category: 'hotel'
    })

    // 当天停留点
    allStops.push({
      name: day.name,
      category: isLastDay ? '终点' : '住宿',
      sort: sortOrder++,
      latitude: Number(day.loc.split(',')[1]),
      longitude: Number(day.loc.split(',')[0]),
      arrivalTime: formatTime(CHECKIN_HOUR * 60),
      stayMinutes: 720, // 过夜 12h
    })

    schedule.push({
      day: i + 1,
      dayLabel: String(i + 1).padStart(2, '0'),
      location: day.name,
      startLocation: startLabel,
      distanceKm: day.distanceKm,
      driveMinutes: day.driveMinutes,
      events,
    })
  }

  // 剩余未使用的highlights也加到spots里展示
  for (const h of availableHighlights) {
    if (!allSpots.find(s => s.name === h.name)) allSpots.push(h)
  }

  const coverImage = template?.coverImage
  const title = input.title || (template ? `${template.name}（${originName}→${destName}）` : `${originName} → ${destName} 自驾行程`)

  return {
    title,
    origin: originName,
    destination: destName,
    originLoc,
    destLoc,
    totalDistance: totalDistanceKm,
    totalDuration: totalDurationMin,
    days: actualDays,
    drivePref: driveCfg.label,
    vehicleType,
    preferences: prefs,
    polyline: route?.polyline ? route.polyline.split(';') : [],
    stops: allStops,
    schedule,
    spots: allSpots,
    coverImage,
  }
}

// ==================== 每日落脚点计算 ====================
async function computeDailyStops(
  originLoc: string,
  destLoc: string,
  originName: string,
  destName: string,
  days: number,
  maxDailyMin: number,
  template?: RouteTemplate
): Promise<Array<{ name: string; loc: string; distanceKm: number; driveMinutes: number }>> {

  // 如果有模板，优先用模板的stops
  if (template && template.stops.length >= days - 1) {
    const result = []
    const stops = template.stops
    const stopsPerDay = Math.max(1, Math.floor(stops.length / days))

    for (let i = 0; i < days; i++) {
      const isLast = i === days - 1
      if (isLast) {
        // 最后一天到目的地
        const prevLoc: string = result.length === 0 ? originLoc : result[result.length - 1].loc
        result.push({
          name: destName,
          loc: destLoc,
          distanceKm: Math.round(kmBetween(prevLoc, destLoc) * 1.4),
          driveMinutes: Math.min(maxDailyMin, Math.round(kmBetween(prevLoc, destLoc) * 1.4 / 60 * 60))
        })
      } else {
        const stopIdx = Math.min((i + 1) * stopsPerDay - 1, stops.length - 2)
        const s = stops[Math.min(stopIdx, stops.length - 1)]
        const prevLoc = result.length === 0 ? originLoc : result[result.length - 1].loc
        const distKm = Math.round(kmBetween(prevLoc, s.location) * 1.4)
        result.push({
          name: s.name,
          loc: s.location,
          distanceKm: distKm,
          driveMinutes: Math.min(maxDailyMin, Math.round(distKm / 60 * 60))
        })
      }
    }
    return result
  }

  // 无模板时：按总距离均分，沿直线插值（真实路径有key时会更准确）
  const [olng, olat] = originLoc.split(',').map(Number)
  const [dlng, dlat] = destLoc.split(',').map(Number)
  const result = []
  const totalKm = Math.round(kmBetween(originLoc, destLoc) * 1.4)
  const perDayKm = Math.ceil(totalKm / days)
  const perDayMin = Math.min(maxDailyMin, Math.round(perDayKm / 60 * 60))

  for (let i = 1; i <= days; i++) {
    const ratio = i / days
    const lng = olng + (dlng - olng) * ratio
    const lat = olat + (dlat - olat) * ratio
    const loc = `${lng.toFixed(4)},${lat.toFixed(4)}`
    const name = i === days ? destName : `第${i}天落脚点`
    result.push({
      name,
      loc,
      distanceKm: perDayKm,
      driveMinutes: perDayMin,
    })
  }
  return result
}

/**
 * 查询某地附近补给（加油站/充电站）
 */
export async function getSupplyNearby(location: string, type: 'gas' | 'charge' | 'all' = 'all', radius: number = 5000) {
  if (type === 'gas') {
    return searchAround(location, '加油站', undefined, radius)
  } else if (type === 'charge') {
    return searchAround(location, '充电站', undefined, radius)
  } else {
    const [gas, charge] = await Promise.all([
      searchAround(location, '加油站', undefined, radius),
      searchAround(location, '充电站', undefined, radius),
    ])
    return {
      gas: gas.pois,
      charge: charge.pois,
    }
  }
}
