import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tripApi, favoriteApi, type PlanInput } from '../api'

export interface Spot {
  name: string
  type: string
  info: string
  image: string
}

export interface RouteConfig {
  no: string
  name: string
  origin: string
  destination: string
  distance: string
  days: number
  stops: string[]
  spots: Spot[]
  /** 后端返回的完整数据（智能规划结果），如果存在则 schedule 优先使用它 */
  _backend?: {
    tripId?: string
    originLoc?: string
    destLoc?: string
    polyline?: any
    totalDistance?: number
    totalDuration?: number
    days: Array<{
      dayIndex: number
      date?: string
      startLocation?: string
      endLocation: string
      distanceKm?: number
      driveMinutes?: number
      stops?: any[]
      supply?: any[]
      events: Array<{ time: string; title: string; desc: string; icon: string; poiId?: string; location?: string; category?: string }>
    }>
  }
}

export interface ScheduleEvent {
  time: string
  title: string
  desc: string
  icon: string
}

export interface DaySchedule {
  day: string
  location: string
  events: ScheduleEvent[]
}

export interface Friend {
  name: string
  avatar: string
}

// ====== 内置经典路线（本地兜底 & 默认展示） ======
const builtinRoutes: RouteConfig[] = [
  {
    no: '01', name: '川西小环线', origin: '成都市', destination: '稻城', distance: '1,240 km', days: 7,
    stops: ['都江堰', '映秀', '四姑娘山', '丹巴', '八美', '新都桥', '理塘', '稻城'],
    spots: [
      { name: '四姑娘山 · 双桥沟', type: '景点', info: '游玩 4h · 门票 ¥150', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80' },
      { name: '牦牛肉火锅', type: '美食', info: '日隆镇 · 人均 ¥86', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80' },
      { name: '墨石公园', type: '景点', info: '游玩 2h · 海拔 3500m', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
      { name: '新都桥 · 光影长廊', type: '景点', info: '免费 · 摄影推荐', image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    no: '02', name: '滇川秘境线', origin: '昆明市', destination: '新都桥', distance: '1,680 km', days: 9,
    stops: ['昆明', '楚雄', '攀枝花', '西昌', '雅安', '成都', '都江堰', '四姑娘山', '新都桥'],
    spots: [
      { name: '昆明 · 滇池', type: '景点', info: '游玩 2h · 免费', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80' },
      { name: '云南菌子火锅', type: '美食', info: '当季山珍 · 人均 ¥120', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
      { name: '西昌 · 邛海', type: '景点', info: '环湖自驾 · 免费', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80' },
      { name: '西昌火盆烧烤', type: '美食', info: '本地必吃 · 人均 ¥70', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    no: '03', name: '甘南草原线', origin: '兰州市', destination: '四姑娘山', distance: '1,520 km', days: 8,
    stops: ['兰州', '临夏', '夏河', '合作', '若尔盖', '红原', '马尔康', '小金', '四姑娘山'],
    spots: [
      { name: '兰州黄河风情线', type: '景点', info: '游玩 2h · 免费', image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80' },
      { name: '兰州牛肉面', type: '美食', info: '推荐早餐 · 人均 ¥12', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
      { name: '若尔盖大草原', type: '景点', info: '沿途观景 · 海拔 3400m', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80' },
      { name: '藏式土火锅', type: '美食', info: '牦牛肉汤底 · 人均 ¥85', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80' }
    ]
  }
]

export const useRouteStore = defineStore('route', () => {
  // 可扩展的路线列表（默认含内置经典路线，后续可追加后端规划结果/模板/用户行程）
  const routesList = ref<RouteConfig[]>([...builtinRoutes])
  const routeIndex = ref(0)
  const origin = ref('成都市')
  const destination = ref('稻城')
  const filter = ref('全部')
  const activeDay = ref(0)
  const favorites = ref<string[]>(JSON.parse(localStorage.getItem('xingye-favorites') || '[]'))
  const friends = ref<Friend[]>(JSON.parse(localStorage.getItem('xingye-friends') || '[]'))
  const selectedPreferences = ref<string[]>(['自然风光', '当地美食'])
  const drivePreference = ref<'轻松' | '适中' | '高效'>('轻松')
  const customNeed = ref('')
  const vehicleType = ref<'gas' | 'ev'>('gas')
  const planning = ref(false)
  const planError = ref('')
  const planCounter = ref(0) // 规划路线计数，用于生成 no

  const currentRoute = computed(() => routesList.value[routeIndex.value] || routesList.value[0])

  const filteredSpots = computed(() => {
    if (filter.value === '全部') return currentRoute.value.spots
    return currentRoute.value.spots.filter(s => s.type === filter.value)
  })

  const routePath = computed(() => {
    const r = currentRoute.value
    return `${r.origin.replace(/市$/, '')} → ${r.stops.slice(1, -1).join(' → ')} → ${r.destination}`
  })

  // ====== 本地兜底行程构建（当无后端数据时使用，保持原有 UI 表现） ======
  function buildSchedule(route: RouteConfig, orig: string, dest: string): DaySchedule[] {
    const stops = [orig.replace(/市$/, ''), ...route.stops]
    stops[stops.length - 1] = dest
    return Array.from({ length: route.days }, (_, i) => {
      const fromIndex = Math.floor(i * (stops.length - 1) / route.days)
      const toIndex = Math.max(fromIndex + 1, Math.floor((i + 1) * (stops.length - 1) / route.days))
      const from = stops[fromIndex]
      const to = stops[Math.min(toIndex, stops.length - 1)]
      const spot = route.spots.find((_, j) => i === Math.round((j + 1) * route.days / 5) - 1)
      const events: ScheduleEvent[] = i === 0 ? [
        { time: '07:30', title: `从家出发 · ${from} → ${to}`, desc: '直接进入导航，不在出发地停留', icon: 'car-front' },
        { time: '10:30', title: '服务区短暂休息', desc: '检查车辆状态，按需补给', icon: 'fuel-pump' },
        { time: '12:30', title: `沿途午餐 · ${to}`, desc: '到达目的地附近后用餐', icon: 'utensils' },
        { time: '17:00', title: `抵达并入住 ${to}`, desc: '查看次日路况，早点休息', icon: 'bed' }
      ] : [
        { time: '08:30', title: `${from} → ${to}`, desc: `导航前往 ${to}`, icon: 'car-front' },
        { time: '12:30', title: spot && spot.type === '美食' ? `午餐 · ${spot.name}` : `沿途午餐 · ${to}`, desc: '预留一小时用餐和休息', icon: 'utensils' },
        { time: '15:00', title: spot && spot.type === '景点' ? spot.name : `${to} 沿途观景`, desc: spot ? spot.info : '根据到达时间灵活停留', icon: 'map-pin' },
        { time: '18:30', title: `入住 ${to}`, desc: '补充燃油或充电', icon: 'bed' }
      ]
      return { day: String(i + 1).padStart(2, '0'), location: to, events }
    })
  }

  // ====== 优先使用后端返回的日程 ======
  const schedule = computed<DaySchedule[]>(() => {
    const r = currentRoute.value
    if (r._backend && r._backend.days.length > 0) {
      return r._backend.days.map(d => ({
        day: String(d.dayIndex + 1).padStart(2, '0'),
        location: d.endLocation,
        events: d.events.map(e => ({ time: e.time, title: e.title, desc: e.desc, icon: e.icon }))
      }))
    }
    return buildSchedule(r, origin.value, destination.value)
  })

  const currentEvents = computed(() => {
    if (schedule.value.length === 0) return []
    const idx = Math.min(activeDay.value, schedule.value.length - 1)
    return schedule.value[idx].events
  })

  const currentLocation = computed(() => {
    if (schedule.value.length === 0) return ''
    const idx = Math.min(activeDay.value, schedule.value.length - 1)
    return schedule.value[idx].location
  })

  const currentDayLabel = computed(() => {
    if (schedule.value.length === 0) return '01'
    const idx = Math.min(activeDay.value, schedule.value.length - 1)
    return schedule.value[idx].day
  })

  // 当前路线的后端原始数据（供地图/导航/邀请协作者等扩展使用）
  const currentBackendData = computed(() => currentRoute.value._backend || null)
  const totalDistanceKm = computed(() => {
    const b = currentRoute.value._backend?.totalDistance
    if (b) return Math.round(b / 1000)
    return parseInt(currentRoute.value.distance.replace(/[^0-9]/g, '')) || 0
  })

  function switchRoute() {
    routeIndex.value = (routeIndex.value + 1) % routesList.value.length
    activeDay.value = 0
  }

  function selectRoute(index: number) {
    if (index >= 0 && index < routesList.value.length) {
      routeIndex.value = index
      activeDay.value = 0
    }
  }

  async function toggleFavorite(spotName: string) {
    const idx = favorites.value.indexOf(spotName)
    const isFav = idx === -1 // 将要变成收藏
    if (isFav) {
      favorites.value.push(spotName)
    } else {
      favorites.value.splice(idx, 1)
    }
    localStorage.setItem('xingye-favorites', JSON.stringify(favorites.value))
    // 同步后端
    try {
      const res = await favoriteApi.toggle(spotName, spotName, 'spot')
      if (!res.ok) {
        // 回滚
        if (isFav) {
          favorites.value = favorites.value.filter(f => f !== spotName)
        } else {
          favorites.value.push(spotName)
        }
        localStorage.setItem('xingye-favorites', JSON.stringify(favorites.value))
      }
    } catch {
      // 网络失败保持本地状态
    }
  }

  /** 从后端加载收藏列表并合并到本地 */
  async function loadFavorites() {
    try {
      const res = await favoriteApi.list()
      if (res.ok && Array.isArray(res.data)) {
        const backendNames = res.data.map((f: any) => f.poiName || f.name)
        // 合并后端数据到本地
        backendNames.forEach((name: string) => {
          if (!favorites.value.includes(name)) favorites.value.push(name)
        })
        localStorage.setItem('xingye-favorites', JSON.stringify(favorites.value))
      }
    } catch {
      // 静默失败
    }
  }

  function isFavorite(spotName: string): boolean {
    return favorites.value.includes(spotName)
  }

  function addFriend(name: string) {
    if (!friends.value.find(f => f.name === name)) {
      friends.value.push({ name, avatar: name.slice(0, 1) })
      localStorage.setItem('xingye-friends', JSON.stringify(friends.value))
    }
  }

  /**
   * 调用后端智能规划 API，并将结果转成 RouteConfig 追加到 routesList 头部并切换
   * 保持现有 UI 不变，但行程数据来自真实地理计算。
   */
  async function planTrip(input?: Partial<PlanInput>): Promise<{ ok: boolean; error?: string }> {
    planning.value = true
    planError.value = ''
    try {
      const payload: PlanInput = {
        origin: input?.origin ?? origin.value,
        destination: input?.destination ?? destination.value,
        days: input?.days ?? currentRoute.value.days,
        drivePref: input?.drivePref ?? drivePreference.value,
        vehicleType: input?.vehicleType ?? vehicleType.value,
        preferences: input?.preferences ?? selectedPreferences.value,
        customNeed: input?.customNeed ?? customNeed.value,
        title: input?.title,
        templateId: input?.templateId,
      }
      const res = await tripApi.plan(payload)
      if (!res.ok || !res.data) {
        planError.value = res.error || '规划失败'
        return { ok: false, error: planError.value }
      }
      const p = res.data

      // 转换 spots：直接用后端返回的 spots（PlanSpot 数组）
      const spots: Spot[] = (p.spots || []).slice(0, 8).map((s: any) => ({
        name: s.name,
        type: s.type || '景点',
        info: s.info || '',
        image: s.image || (s.type === '美食'
          ? 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'),
      }))

      // 转换 stops：提取所有天落脚点名称，去重
      const stopNames: string[] = []
      const stopsFromSchedule: string[] = []
      ;(p.schedule || []).forEach((d: any) => {
        if (d.location && !stopsFromSchedule.includes(d.location)) stopsFromSchedule.push(d.location)
      })
      ;(p.stops || []).forEach((s: any) => {
        if (s.name && !stopNames.includes(s.name)) stopNames.push(s.name)
      })
      const stops = stopsFromSchedule.length > 0 ? stopsFromSchedule : (stopNames.length > 0 ? stopNames : [payload.origin, payload.destination])

      planCounter.value += 1
      const newRoute: RouteConfig = {
        no: `P${planCounter.value}`.padStart(2, '0'),
        name: p.title || `${payload.origin} → ${payload.destination}`,
        origin: p.origin || payload.origin,
        destination: p.destination || payload.destination,
        distance: `${(p.totalDistance || 0).toLocaleString()} km`,
        days: p.schedule?.length || payload.days,
        stops,
        spots: spots.length > 0 ? spots : currentRoute.value.spots,
        _backend: {
          tripId: p.tripId,
          originLoc: p.originLoc,
          destLoc: p.destLoc,
          polyline: p.polyline,
          totalDistance: (p.totalDistance || 0) * 1000, // km → 米，对齐原有字段语义
          totalDuration: (p.totalDuration || 0) * 60,     // 分钟 → 秒
          days: (p.schedule || []).map((d: any) => ({
            dayIndex: (d.day || 1) - 1,
            date: d.date,
            startLocation: d.startLocation,
            endLocation: d.location,
            distanceKm: d.distanceKm,
            driveMinutes: d.driveMinutes,
            stops: (p.stops || []).filter((s: any) => s.sort === undefined || true),
            supply: [],
            events: (d.events || []).map((e: any) => ({
              time: e.time,
              title: e.title,
              desc: e.desc,
              icon: e.icon,
              poiId: e.poiId,
              location: e.location,
              category: e.category,
            })),
          })),
        },
      }

      // 更新 store 里的 origin/destination，保证默认值跟随最新规划
      origin.value = payload.origin
      destination.value = payload.destination
      drivePreference.value = payload.drivePref as any
      vehicleType.value = payload.vehicleType as any
      if (payload.preferences) selectedPreferences.value = payload.preferences
      if (payload.customNeed !== undefined) customNeed.value = payload.customNeed

      // 插入到最前面并切换
      routesList.value.unshift(newRoute)
      routeIndex.value = 0
      activeDay.value = 0
      return { ok: true }
    } catch (e: any) {
      planError.value = e?.message || '规划异常'
      return { ok: false, error: planError.value }
    } finally {
      planning.value = false
    }
  }

  return {
    // 原有 state（保持兼容）
    routesList,
    routeIndex, origin, destination, filter, activeDay,
    favorites, friends, selectedPreferences, drivePreference, customNeed,
    // 新增 state
    vehicleType, planning, planError,
    // computed（保持兼容 + 新增）
    currentRoute, filteredSpots, routePath, schedule, currentEvents,
    currentLocation, currentDayLabel, currentBackendData, totalDistanceKm,
    // methods（保持兼容 + 新增）
    switchRoute, selectRoute, toggleFavorite, isFavorite, addFriend, loadFavorites, planTrip,
  }
})

/** @deprecated 兼容旧版直接 import 的写法，新代码请通过 store.routesList 访问 */
export const routes: RouteConfig[] = builtinRoutes
