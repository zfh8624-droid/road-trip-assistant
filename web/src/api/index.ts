import { http } from '../utils/request'

// ====== 高德服务 ======
export interface Tip { id: string; name: string; district?: string; address?: string; location: string }
export interface Poi { id: string; name: string; type: string; address: string; location: string; distance?: number }

export const amapApi = {
  tips: (keywords: string, city?: string) =>
    http.get<Tip[]>(`/api/amap/tips?keywords=${encodeURIComponent(keywords)}${city ? '&city=' + encodeURIComponent(city) : ''}`),
  geocode: (address: string) =>
    http.get<{ location: string; formattedAddress: string }>(`/api/amap/geocode?address=${encodeURIComponent(address)}`),
  around: (location: string, type: 'gas' | 'ev' | 'food' | 'scenic' = 'gas', radius = 5000) =>
    http.get<Poi[]>(`/api/amap/around?location=${location}&type=${type}&radius=${radius}`),
}

// ====== 经典路线模板 ======
export interface RouteTemplate {
  id: string
  name: string
  origin: string
  destination: string
  days: number
  distanceKm: number
  tags: string[]
  coverImage: string
  summary: string
}

export const templateApi = {
  list: () => http.get<RouteTemplate[]>('/api/templates'),
  detail: (id: string) => http.get<any>(`/api/templates/${id}`),
}

// ====== 行程规划 ======
export interface PlanInput {
  title?: string
  origin: string
  destination: string
  days: number
  drivePref?: '轻松' | '适中' | '高效'
  vehicleType?: 'gas' | 'ev'
  preferences?: string[]
  customNeed?: string
  templateId?: string
}

export const tripApi = {
  list: () => http.get<{ trips: any[] }>('/api/trips'),
  get: (id: string) => http.get<any>(`/api/trips/${id}`),
  plan: (input: PlanInput) => http.post<any>('/api/trips/plan', input),
  create: (data: any) => http.post<any>('/api/trips', data),
  remove: (id: string) => http.delete(`/api/trips/${id}`),
}

// ====== 收藏 ======
export const favoriteApi = {
  list: () => http.get<any[]>('/api/favorites'),
  toggle: (poiId: string, poiName: string, poiType: string, location?: string, address?: string) =>
    http.post<{ favorited: boolean }>('/api/favorites/toggle', { poiId, poiName, poiType, location, address }),
}

// ====== 协作邀请 ======
export const invitationApi = {
  create: (tripId: string, inviteeName: string, permission: 'view' | 'edit' = 'view') =>
    http.post<any>('/api/invitations', { tripId, inviteeName, permission }),
  accept: (token: string) => http.post<any>(`/api/invitations/accept/${token}`),
}

// ====== 认证（匿名登录兜底） ======
export const authApi = {
  guestLogin: (nickname?: string) =>
    http.post<{ token: string; user: { id: string; nickname: string; avatar: string } }>('/api/auth/guest', nickname ? { nickname } : {}),
  me: () => http.get<{ id: string; nickname: string; avatar: string }>('/api/auth/me'),
  updateProfile: (nickname?: string, avatar?: string) =>
    http.patch('/api/auth/me', { nickname, avatar }),
}
