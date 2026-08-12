import { config, hasAmapKey } from '../lib/config.js'
import { prisma } from '../lib/prisma.js'

// ==================== 类型定义 ====================
export interface AmapPoi {
  id: string
  name: string
  location: string // lng,lat
  address: string
  tel?: string
  type?: string
  typecode?: string
  rating?: number
  photos?: { url: string }[]
  province?: string
  city?: string
  district?: string
  distance?: number
}

export interface DrivingRoute {
  origin: string
  destination: string
  distance: number // 米
  duration: number // 秒
  tolls?: number
  polyline: string // 高德 polyline 字符串
  steps: { instruction: string; distance: number; duration: number; polyline: string }[]
}

export interface Tip {
  id: string
  name: string
  district: string
  address: string
  location: string
}

// ==================== HTTP 调用封装 ====================
async function amapGet(path: string, params: Record<string, string | number | undefined> = {}): Promise<any> {
  const url = new URL(config.amapBaseUrl + path)
  url.searchParams.set('key', config.amapKey)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString())
  return res.json()
}

// ==================== POI 缓存 ====================
async function cachePoi(poi: AmapPoi, type: string) {
  await prisma.poiCache.upsert({
    where: { poiId: poi.id },
    update: { name: poi.name, location: poi.location, address: poi.address || null, tel: poi.tel || null, rating: poi.rating, type, province: poi.province, city: poi.city, district: poi.district, photos: poi.photos as any },
    create: { poiId: poi.id, name: poi.name, location: poi.location, address: poi.address || null, tel: poi.tel || null, rating: poi.rating, type, province: poi.province, city: poi.city, district: poi.district, photos: poi.photos as any }
  })
}

function parseAmapPoi(p: any): AmapPoi {
  const rawPhotos = p.photos?.map((ph: any) => ph.url).filter(Boolean) || []
  const photos = rawPhotos.map((url: string) => {
    // 高德可能返回带协议或不带协议的URL，统一处理
    if (url.startsWith('http://') || url.startsWith('https://')) return { url }
    return { url: `https://${url}` }
  })
  // tel 可能是空数组 [] 或字符串
  const tel = Array.isArray(p.tel) ? (p.tel.length ? String(p.tel[0]) : undefined) : (p.tel || undefined)
  // address 可能为空
  const address = p.address || [p.pname, p.cityname, p.adname].filter(Boolean).join('')
  return {
    id: p.id,
    name: p.name,
    location: p.location,
    address,
    tel,
    type: p.type,
    typecode: p.typecode,
    rating: p.biz_ext?.rating ? Number(p.biz_ext.rating) : undefined,
    photos: photos.length ? photos : undefined,
    province: p.pname,
    city: p.cityname,
    district: p.adname,
    distance: p.distance ? Number(p.distance) : undefined,
  }
}

// ==================== 公开 API ====================

/**
 * 输入提示（出发地/目的地实时搜索补全）
 */
export async function inputTips(keywords: string, city?: string): Promise<Tip[]> {
  if (!hasAmapKey()) return mockInputTips(keywords)
  const data = await amapGet('/assistant/inputtips', { keywords, city, datatype: 'poi' })
  if (data.status !== '1') return []
  return (data.tips || [])
    .filter((t: any) => t.location && t.location.length > 2)
    .map((t: any) => ({ id: t.id, name: t.name, district: t.district, address: t.address, location: t.location }))
}

/**
 * 地理编码（地名 → 经纬度）
 */
export async function geocode(address: string, city?: string): Promise<{ location: string; formattedAddress: string } | null> {
  if (!hasAmapKey()) return mockGeocode(address)
  const data = await amapGet('/geocode/geo', { address, city })
  if (data.status !== '1' || !data.geocodes?.length) return null
  const g = data.geocodes[0]
  return { location: g.location, formattedAddress: g.formatted_address }
}

/**
 * 驾车路径规划
 */
export async function driving(origin: string, destination: string, waypoints?: string): Promise<DrivingRoute | null> {
  if (!hasAmapKey()) return mockDriving(origin, destination)
  const data = await amapGet('/direction/driving', { origin, destination, waypoints, strategy: 0, extensions: 'all' })
  if (data.status !== '1' || !data.route?.paths?.length) return null
  const path = data.route.paths[0]
  const steps = (path.steps || []).map((s: any) => ({
    instruction: s.instruction,
    distance: Number(s.distance),
    duration: Number(s.duration),
    polyline: s.polyline || '',
  }))
  // 拼接所有 step 的 polyline 为完整路线
  const fullPolyline = steps.map((s: { polyline: string }) => s.polyline).filter(Boolean).join(';')
  return {
    origin,
    destination,
    distance: Number(path.distance),
    duration: Number(path.duration),
    tolls: path.tolls ? Number(path.tolls) : undefined,
    polyline: fullPolyline,
    steps,
  }
}

/**
 * 周边搜索
 */
export async function searchAround(location: string, keywords?: string, types?: string, radius: number = 5000, page: number = 1, offset: number = 20): Promise<{ pois: AmapPoi[]; total: number }> {
  if (!hasAmapKey()) return mockSearchAround(location, keywords, types)
  const data = await amapGet('/place/around', { location, keywords, types, radius, page, offset, extensions: 'all' })
  if (data.status !== '1') return { pois: [], total: 0 }
  const pois: AmapPoi[] = (data.pois || []).map(parseAmapPoi)
  // 异步缓存热门类型的POI
  const cacheType = types?.includes('0111') ? (types.includes('011101') ? '充电站' : '加油站') : (keywords?.includes('美食') ? '美食' : '景点')
  for (const p of pois.slice(0, 5)) cachePoi(p, cacheType).catch(() => {})
  return { pois, total: Number(data.count) || 0 }
}

/**
 * 关键字搜索
 */
export async function searchText(keywords: string, city?: string, types?: string, page: number = 1, offset: number = 20): Promise<{ pois: AmapPoi[]; total: number }> {
  if (!hasAmapKey()) return mockSearchText(keywords)
  const data = await amapGet('/place/text', { keywords, city, types, page, offset, extensions: 'all' })
  if (data.status !== '1') return { pois: [], total: 0 }
  const pois: AmapPoi[] = (data.pois || []).map(parseAmapPoi)
  return { pois, total: Number(data.count) || 0 }
}

/**
 * POI 详情
 */
export async function poiDetail(id: string): Promise<AmapPoi | null> {
  // 先查缓存
  const cached = await prisma.poiCache.findUnique({ where: { poiId: id } })
  if (cached) return { id: cached.poiId, name: cached.name, location: cached.location, address: cached.address!, tel: cached.tel!, rating: cached.rating!, photos: cached.photos as any, type: cached.type, province: cached.province!, city: cached.city!, district: cached.district! }
  if (!hasAmapKey()) return null
  const data = await amapGet('/place/detail', { id, extensions: 'all' })
  if (data.status !== '1' || !data.pois?.length) return null
  const poi = parseAmapPoi(data.pois[0])
  await cachePoi(poi, '景点')
  return poi
}

/**
 * 沿路线搜索 POI（简化：按路线上若干采样点做周边搜索并去重）
 */
export async function searchAlongRoute(polylinePoints: Array<{ lng: number; lat: number }>, keywords?: string, types?: string, perPointLimit: number = 3): Promise<AmapPoi[]> {
  if (!polylinePoints.length) return []
  // 采样：起终点+中间每隔几个点取一个
  const sampled: Array<{ lng: number; lat: number }> = []
  const step = Math.max(1, Math.floor(polylinePoints.length / 8))
  for (let i = 0; i < polylinePoints.length; i += step) sampled.push(polylinePoints[i])
  sampled.push(polylinePoints[polylinePoints.length - 1])
  const seen = new Set<string>()
  const results: AmapPoi[] = []
  for (const pt of sampled) {
    const { pois } = await searchAround(`${pt.lng},${pt.lat}`, keywords, types, 8000, 1, perPointLimit)
    for (const p of pois) {
      if (!seen.has(p.id)) { seen.add(p.id); results.push(p) }
    }
  }
  return results
}

/**
 * 解析高德 polyline 字符串为坐标点数组
 * 高德 polyline 格式: "lng1,lat1;lng2,lat2;..."
 */
export function parsePolyline(polylineStr: string): Array<{ lng: number; lat: number }> {
  if (!polylineStr) return []
  return polylineStr.split(';').filter(Boolean).map(pair => {
    const [lng, lat] = pair.split(',').map(Number)
    return { lng, lat }
  })
}

// ==================== Mock 数据（无 AMAP_KEY 时使用） ====================
function mockInputTips(keywords: string): Tip[] {
  const cities: Record<string, Tip[]> = {
    '成都': [{ id: 'mock_cd', name: '成都市', district: '四川省', address: '四川省成都市', location: '104.0668,30.5728' }],
    '稻城': [{ id: 'mock_dc', name: '稻城县', district: '四川省甘孜州', address: '四川省甘孜藏族自治州稻城县', location: '100.3035,28.4831' }],
    '昆明': [{ id: 'mock_km', name: '昆明市', district: '云南省', address: '云南省昆明市', location: '102.8329,24.8801' }],
    '兰州': [{ id: 'mock_lz', name: '兰州市', district: '甘肃省', address: '甘肃省兰州市', location: '103.8343,36.0611' }],
    '丽江': [{ id: 'mock_lj', name: '丽江市', district: '云南省', address: '云南省丽江市', location: '100.2330,26.8721' }],
    '拉萨': [{ id: 'mock_ls', name: '拉萨市', district: '西藏自治区', address: '西藏自治区拉萨市', location: '91.1322,29.6604' }],
    '北京': [{ id: 'mock_bj', name: '北京市', district: '北京市', address: '北京市', location: '116.4075,39.9040' }],
    '上海': [{ id: 'mock_sh', name: '上海市', district: '上海市', address: '上海市', location: '121.4737,31.2304' }],
    '重庆': [{ id: 'mock_cq', name: '重庆市', district: '重庆市', address: '重庆市', location: '106.5516,29.5630' }],
    '西安': [{ id: 'mock_xa', name: '西安市', district: '陕西省', address: '陕西省西安市', location: '108.9398,34.3416' }],
  }
  const results: Tip[] = []
  for (const [key, val] of Object.entries(cities)) {
    if (key.includes(keywords) || keywords.includes(key) || keywords.length < 2) results.push(...val)
  }
  return results.slice(0, 10)
}

function mockGeocode(address: string): { location: string; formattedAddress: string } | null {
  const tips = mockInputTips(address)
  if (tips.length) return { location: tips[0].location, formattedAddress: tips[0].address }
  // 默认回成都
  return { location: '104.0668,30.5728', formattedAddress: '四川省成都市' }
}

function mockDriving(origin: string, destination: string): DrivingRoute {
  // 粗略估算：用坐标差值算直线距离 * 1.4 系数作为路网距离
  const [olng, olat] = origin.split(',').map(Number)
  const [dlng, dlat] = destination.split(',').map(Number)
  const straightKm = Math.sqrt(((dlng - olng) * 111) ** 2 + ((dlat - olat) * 102) ** 2)
  const roadKm = Math.round(straightKm * 1.4)
  const distance = roadKm * 1000
  const duration = Math.round(roadKm / 60 * 3600) // 平均60km/h
  return {
    origin,
    destination,
    distance,
    duration,
    polyline: `${origin};${destination}`,
    steps: [
      { instruction: `从起点出发向目的地行驶`, distance, duration, polyline: `${origin};${destination}` }
    ]
  }
}

const mockScenicSpots: AmapPoi[] = [
  { id: 'mock_s1', name: '四姑娘山 · 双桥沟', location: '102.6,31.1', address: '四川省阿坝州小金县', type: '风景名胜', rating: 4.8, photos: [{ url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80' }] },
  { id: 'mock_s2', name: '墨石公园', location: '101.5,30.5', address: '四川省甘孜州道孚县', type: '风景名胜', rating: 4.6, photos: [{ url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }] },
  { id: 'mock_s3', name: '新都桥 · 光影长廊', location: '101.4,30.1', address: '四川省甘孜州康定市', type: '风景名胜', rating: 4.7, photos: [{ url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80' }] },
]

const mockFoods: AmapPoi[] = [
  { id: 'mock_f1', name: '牦牛肉火锅（本地特色）', location: '102.9,31.0', address: '日隆镇', type: '餐饮服务', rating: 4.5 },
  { id: 'mock_f2', name: '藏式土火锅', location: '101.8,30.8', address: '当地特色餐厅', type: '餐饮服务', rating: 4.3 },
  { id: 'mock_f3', name: '菌子火锅', location: '102.7,25.1', address: '当季山珍', type: '餐饮服务', rating: 4.6 },
]

function mockSearchAround(location: string, keywords?: string, types?: string): { pois: AmapPoi[]; total: number } {
  const isGas = keywords?.includes('加油') || types?.includes('011100')
  const isCharge = keywords?.includes('充电') || types?.includes('011101')
  if (isGas) {
    return {
      pois: [
        { id: 'mock_g1', name: '中国石化加油站', location, address: '距您约 1.2km', tel: '', type: '加油加气站', distance: 1200 },
        { id: 'mock_g2', name: '中国石油加油站', location, address: '距您约 2.8km', tel: '', type: '加油加气站', distance: 2800 },
        { id: 'mock_g3', name: '壳牌加油站', location, address: '距您约 3.5km', tel: '', type: '加油加气站', distance: 3500 },
      ],
      total: 8
    }
  }
  if (isCharge) {
    return {
      pois: [
        { id: 'mock_c1', name: '国家电网充电站', location, address: '距您约 0.8km · 快充 4 个', tel: '', type: '充电站', distance: 800 },
        { id: 'mock_c2', name: '特来电充电站', location, address: '距您约 2.1km · 快充 6 个', tel: '', type: '充电站', distance: 2100 },
        { id: 'mock_c3', name: '星星充电', location, address: '距您约 3.3km', tel: '', type: '充电站', distance: 3300 },
      ],
      total: 5
    }
  }
  return { pois: [...mockScenicSpots, ...mockFoods], total: mockScenicSpots.length + mockFoods.length }
}

function mockSearchText(keywords: string): { pois: AmapPoi[]; total: number } {
  if (keywords.includes('景点') || keywords.includes('风景')) return { pois: mockScenicSpots, total: mockScenicSpots.length }
  if (keywords.includes('美食') || keywords.includes('吃')) return { pois: mockFoods, total: mockFoods.length }
  return { pois: [...mockScenicSpots, ...mockFoods], total: mockScenicSpots.length + mockFoods.length }
}
