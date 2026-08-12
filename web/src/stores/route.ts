import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const routes: RouteConfig[] = [
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
  const routeIndex = ref(0)
  const origin = ref('成都市')
  const destination = ref('稻城')
  const filter = ref('全部')
  const activeDay = ref(0)
  const favorites = ref<string[]>(JSON.parse(localStorage.getItem('xingye-favorites') || '[]'))
  const friends = ref<Friend[]>(JSON.parse(localStorage.getItem('xingye-friends') || '[]'))
  const selectedPreferences = ref<string[]>(['自然风光', '当地美食'])
  const drivePreference = ref('轻松')
  const customNeed = ref('')

  const currentRoute = computed(() => routes[routeIndex.value])

  const filteredSpots = computed(() => {
    if (filter.value === '全部') return currentRoute.value.spots
    return currentRoute.value.spots.filter(s => s.type === filter.value)
  })

  const routePath = computed(() => {
    const r = currentRoute.value
    return `${r.origin.replace(/市$/, '')} → ${r.stops.slice(1, -1).join(' → ')} → ${r.destination}`
  })

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

  const schedule = computed(() => buildSchedule(currentRoute.value, origin.value, destination.value))

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

  function switchRoute() {
    routeIndex.value = (routeIndex.value + 1) % routes.length
    activeDay.value = 0
  }

  function toggleFavorite(spotName: string) {
    const idx = favorites.value.indexOf(spotName)
    if (idx > -1) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(spotName)
    }
    localStorage.setItem('xingye-favorites', JSON.stringify(favorites.value))
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

  return {
    routeIndex, origin, destination, filter, activeDay,
    favorites, friends, selectedPreferences, drivePreference, customNeed,
    currentRoute, filteredSpots, routePath, schedule, currentEvents,
    currentLocation, currentDayLabel,
    switchRoute, toggleFavorite, isFavorite, addFriend
  }
})