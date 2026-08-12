<template>
  <div class="page">
    <header class="top-bar">
      <div class="brand">
        <div class="brand-mark">路</div>
        <div>
          <h1>行野</h1>
          <small>WANDER ON YOUR TERMS</small>
        </div>
      </div>
    </header>
    <main class="content">
      <h2 class="page-title">我的行程</h2>

      <!-- 加载中 -->
      <van-loading v-if="loading" class="loading" />

      <!-- 空状态 -->
      <van-empty v-else-if="trips.length === 0" description="还没有行程，去探索页规划一条吧" />

      <!-- 行程列表 -->
      <div v-else class="trip-list">
        <div
          v-for="trip in trips"
          :key="trip.id"
          class="trip-card"
          @click="showTripDetail(trip)"
        >
          <div class="trip-cover">
            <div class="trip-status" :class="'status-' + (trip.status || 'draft')">
              {{ statusLabel(trip.status) }}
            </div>
            <div class="trip-caption">
              <strong>{{ trip.title }}</strong>
              <small>{{ trip.origin }} → {{ trip.destination }}</small>
            </div>
          </div>
          <div class="trip-meta">
            <span>{{ trip.days || '-' }} 天</span>
            <span>{{ trip.distanceKm ? (trip.distanceKm + ' km') : '-' }}</span>
            <span>{{ trip._count?.schedule || 0 }} 日程</span>
            <span>{{ trip._count?.stops || 0 }} 途经点</span>
          </div>
          <div class="trip-actions">
            <van-button size="small" plain type="danger" @click.stop="deleteTrip(trip.id)">
              删除
            </van-button>
          </div>
        </div>
      </div>

      <!-- 也显示当前规划中未保存的路线 -->
      <div v-if="store.routesList.length && store.routesList.some(r => !r._backend?.tripId)" class="section-head">
        <h2>未保存的规划</h2>
      </div>
      <div
        v-for="route in store.routesList.filter(r => !r._backend?.tripId)"
        :key="route.no"
        class="trip-card"
        @click="store.selectRoute(store.routesList.indexOf(route))"
      >
        <div class="trip-cover">
          <div class="trip-status status-draft">未保存</div>
          <div class="trip-caption">
            <strong>{{ route.name }}</strong>
            <small>{{ route.origin }} → {{ route.destination }}</small>
          </div>
        </div>
        <div class="trip-meta">
          <span>{{ route.days }} 天</span>
          <span>{{ route.distance }}</span>
          <span>{{ route.stops.length }} 途经点</span>
        </div>
      </div>
    </main>

    <!-- 行程详情弹窗 -->
    <van-popup v-model:show="showDetail" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-content" v-if="detailTrip">
        <h3>{{ detailTrip.title }}</h3>
        <p class="trip-detail-path">{{ detailTrip.origin }} → {{ detailTrip.destination }}</p>
        <div class="trip-detail-stats">
          <div class="stat"><b>{{ detailTrip.days || '-' }}</b><span>天数</span></div>
          <div class="stat"><b>{{ detailTrip.distanceKm || '-' }} km</b><span>里程</span></div>
          <div class="stat"><b>{{ statusLabel(detailTrip.status) }}</b><span>状态</span></div>
        </div>
        <div class="section-head">
          <h2>每日日程</h2>
        </div>
        <div v-if="detailTrip.schedule?.length" class="day-tabs">
          <span
            v-for="(day, i) in detailTrip.schedule"
            :key="day.day"
            :class="['day-tab', { active: detailDayIdx === i }]"
            @click="detailDayIdx = i"
          >
            DAY<b>{{ String(day.day).padStart(2, '0') }}</b>
          </span>
        </div>
        <div v-if="detailTrip.schedule?.[detailDayIdx]?.events?.length" class="timeline">
          <div v-for="event in detailTrip.schedule[detailDayIdx].events" :key="event.time" class="event">
            <time>{{ event.time }}</time>
            <div>
              <strong>{{ event.title }}</strong>
              <small>{{ event.desc }}</small>
            </div>
            <van-icon :name="event.icon || 'map-pin'" />
          </div>
        </div>
        <van-empty v-else description="暂无日程详情" />
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { tripApi } from '../api'
import { useRouteStore } from '../stores/route'

const store = useRouteStore()
const loading = ref(true)
const trips = ref<any[]>([])
const showDetail = ref(false)
const detailTrip = ref<any>(null)
const detailDayIdx = ref(0)

function statusLabel(s: string) {
  const map: Record<string, string> = { draft: '草稿', planning: '规划中', ongoing: '进行中', completed: '已完成' }
  return map[s] || '草稿'
}

async function loadTrips() {
  loading.value = true
  try {
    const res = await tripApi.list()
    if (res.ok && res.data) {
      // 后端返回 { trips: [...] }
      trips.value = res.data.trips || res.data || []
    }
  } catch {
    // 静默失败
  } finally {
    loading.value = false
  }
}

async function showTripDetail(trip: any) {
  detailDayIdx.value = 0
  // 先展示列表级别的数据
  detailTrip.value = trip
  showDetail.value = true
  // 再拉取完整详情（含 schedule）
  try {
    const res = await tripApi.get(trip.id)
    if (res.ok && res.data) {
      detailTrip.value = res.data
    }
  } catch {
    // 列表数据已展示，拉详情失败不覆盖
  }
}

async function deleteTrip(id: string) {
  try {
    await showConfirmDialog({ title: '确认删除', message: '删除后不可恢复' })
    const res = await tripApi.remove(id)
    if (res.ok) {
      showToast('已删除')
      trips.value = trips.value.filter(t => t.id !== id)
    } else {
      showToast(res.error || '删除失败')
    }
  } catch {
    // 取消删除
  }
}

onMounted(() => { loadTrips() })
</script>

<style scoped>
.page { min-height: 100vh; }
.top-bar {
  padding: 22px 20px 15px;
  display: flex;
  align-items: center;
  background: rgba(247, 250, 248, .92);
  position: sticky;
  top: 0;
  z-index: 4;
  backdrop-filter: blur(14px);
}
.brand { display: flex; align-items: center; gap: 9px; }
.brand-mark {
  width: 33px; height: 33px;
  border-radius: 11px;
  background: var(--ink);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
}
.brand h1 { font-size: 18px; margin: 0; font-weight: 800; }
.brand small { display: block; color: var(--muted); font-size: 10px; }

.content { padding: 0 20px; }
.page-title { font-size: 22px; margin: 10px 0 18px; }
.loading { display: block; margin: 60px auto; }

.trip-list { display: flex; flex-direction: column; gap: 12px; }

.trip-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #edf2ef;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.trip-cover {
  height: 110px;
  position: relative;
  background: linear-gradient(180deg, rgba(12,40,37,.04), rgba(12,40,37,.5)),
    url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80') center/cover;
}
.trip-status {
  position: absolute;
  left: 12px; top: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}
.status-draft { background: rgba(255,255,255,.85); color: #72827f; }
.status-planning { background: rgba(48,169,121,.85); color: #fff; }
.status-ongoing { background: rgba(255,139,77,.85); color: #fff; }
.status-completed { background: rgba(16,45,42,.85); color: #fff; }

.trip-caption {
  position: absolute;
  left: 12px; right: 12px; bottom: 10px;
  color: #fff;
}
.trip-caption strong { font-size: 16px; display: block; }
.trip-caption small { font-size: 11px; opacity: .85; }

.trip-meta {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  font-size: 11px;
  color: var(--muted);
}
.trip-actions {
  padding: 0 12px 10px;
  display: flex;
  justify-content: flex-end;
}

.section-head { margin: 20px 0 10px; }
.section-head h2 { font-size: 17px; margin: 0; }

/* 详情弹窗 */
.popup-content { padding: 20px; overflow-y: auto; max-height: 100%; }
.popup-content h3 { font-size: 19px; margin: 0 0 5px; }
.trip-detail-path { font-size: 13px; color: var(--muted); margin: 0 0 14px; }
.trip-detail-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.stat { background: #f4f8f6; border-radius: 10px; padding: 10px; text-align: center; }
.stat b { font-size: 16px; display: block; }
.stat span { color: var(--muted); font-size: 10px; }

.day-tabs { display: flex; gap: 6px; margin: 10px 0; overflow-x: auto; }
.day-tabs::-webkit-scrollbar { display: none; }
.day-tab {
  flex: 0 0 52px; text-align: center;
  background: #f0f4f2; border-radius: 9px;
  padding: 7px 2px; color: #72827f; font-size: 10px;
  cursor: pointer;
}
.day-tab b { display: block; font-size: 13px; color: #102d2a; margin-top: 2px; }
.day-tab.active { background: var(--orange); color: #fff; }
.day-tab.active b { color: #fff; }

.timeline { border-top: 1px solid #e8efec; padding-top: 8px; }
.event {
  display: grid; grid-template-columns: 39px 1fr 17px; gap: 8px;
  padding: 10px 0; align-items: center;
}
.event time { color: #72827f; font-size: 10px; }
.event strong { font-size: 12px; display: block; }
.event small { font-size: 10px; color: #72827f; display: block; margin-top: 2px; }
.event + .event { border-top: 1px dashed #e8efec; }
</style>