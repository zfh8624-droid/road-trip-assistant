<template>
  <div class="explore-page">
    <header class="top-bar">
      <div class="brand">
        <div class="brand-mark">路</div>
        <div>
          <h1>行野</h1>
          <small>WANDER ON YOUR TERMS</small>
        </div>
      </div>
      <van-icon name="bell" size="22" />
    </header>

    <main class="content">
      <div class="eyebrow">下一站 · 自由出发</div>
      <h2 class="hero-title">把风景装进<br><span>每一公里</span></h2>

      <!-- 路线切换 -->
      <div class="switch-row">
        <span>为你精选 3 条自驾路线</span>
        <van-button size="small" type="primary" color="#ff8b4d" @click="store.switchRoute()">
          <van-icon name="refresh" /> 换一条路线
        </van-button>
      </div>

      <!-- 路线卡片 -->
      <div class="route-card">
        <div class="route-cover">
          <div class="route-label">推荐路线 · {{ store.currentRoute.no }}</div>
          <div class="route-caption">
            <div>
              <strong>{{ store.currentRoute.name }}</strong>
              <small>{{ store.routePath }}</small>
            </div>
            <div class="route-stats">
              <b>{{ store.currentRoute.distance }}</b>
              <small>建议 {{ store.currentRoute.days }} 日</small>
            </div>
          </div>
        </div>
        <div class="route-details">
          <div class="route-stat" @click="showRouteForm = true">
            <span>出发地 · 可选</span>
            <b>{{ store.origin }} ›</b>
          </div>
          <div class="route-stat">
            <span>途经</span>
            <b>{{ store.currentRoute.stops.length }} 个目的地</b>
          </div>
          <div class="route-stat">
            <span>路况</span>
            <b style="color: var(--mint-strong)">畅通</b>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <van-button round block type="primary" color="#102d2a" :loading="store.planning" loading-text="规划中..." @click="generateTrip">
          生成我的行程
        </van-button>
        <van-button round block plain color="#102d2a" @click="showDestination = true">
          设置目的地
        </van-button>
      </div>
      <div class="invite-row">
        <van-button size="small" @click="showInvite = true">
          <van-icon name="user-plus" /> 邀请好友同行
        </van-button>
        <van-button size="small" @click="showProfile = true">
          <van-icon name="friends-o" /> 同行人 {{ store.friends.length }}
        </van-button>
      </div>

      <!-- 沿途景点 -->
      <div class="section-head">
        <h2>沿途值得去</h2>
        <span class="link" @click="store.filter = '全部'">查看全部 ›</span>
      </div>
      <div class="chips">
        <span
          v-for="chip in ['全部', '景点', '美食']"
          :key="chip"
          :class="['chip', { active: store.filter === chip }]"
          @click="store.filter = chip"
        >{{ chip }}</span>
      </div>
      <div class="spot-grid">
        <div
          v-for="spot in store.filteredSpots"
          :key="spot.name"
          class="spot"
          @click="showSpotDetail(spot)"
        >
          <van-image :src="spot.image" fit="cover" height="150" radius="9" />
          <span class="spot-tag">{{ spot.type }}</span>
          <van-icon
            :name="store.isFavorite(spot.name) ? 'heart' : 'heart-o'"
            :color="store.isFavorite(spot.name) ? '#ff7651' : '#9aaba4'"
            class="heart-btn"
            @click.stop="store.toggleFavorite(spot.name)"
          />
          <h3>{{ spot.name }}</h3>
          <p>{{ spot.info }}</p>
        </div>
      </div>

      <!-- 日程 -->
      <div class="section-head">
        <h2>为你排好的日程</h2>
        <span class="link" @click="generateTrip">重新生成 ›</span>
      </div>
      <div class="schedule">
        <div class="schedule-top">
          <div>
            <h2>{{ store.currentRoute.name }} · {{ store.currentRoute.days }}日</h2>
            <small>轻松驾驶 · 自然风光 · 不赶路</small>
          </div>
          <van-button size="small" plain hairline color="#dff6eb" @click="showRouteForm = true">
            调整偏好
          </van-button>
        </div>
        <div class="day-tabs">
          <span
            v-for="(day, i) in store.schedule"
            :key="day.day"
            :class="['day-tab', { active: store.activeDay === i }]"
            @click="store.activeDay = i"
          >
            DAY<b>{{ day.day }}</b>
          </span>
        </div>
        <div class="timeline">
          <div v-for="event in store.currentEvents" :key="event.time" class="event">
            <time>{{ event.time }}</time>
            <div>
              <strong>{{ event.title }}</strong>
              <small>{{ event.desc }}</small>
            </div>
            <van-icon :name="event.icon" />
          </div>
        </div>
      </div>

      <!-- 沿途补给 -->
      <div class="section-head">
        <h2>DAY {{ store.currentDayLabel }} · {{ store.currentLocation }}附近补给</h2>
        <a
          class="link"
          :href="`https://uri.amap.com/search?keyword=${store.currentLocation} 加油站 充电站&view=map&callnative=1`"
          target="_blank"
        >打开高德地图 ›</a>
      </div>
      <a
        class="supply"
        :href="`https://uri.amap.com/search?keyword=${store.currentLocation} 加油站&view=map&callnative=1`"
        target="_blank"
      >
        <div class="supply-icon fuel"><van-icon name="fuel-pump" /></div>
        <div>
          <h3>{{ store.currentLocation }}附近加油站</h3>
          <p>查看营业状态、油号与实时距离</p>
        </div>
        <div class="supply-rating">高德<span>实时结果</span></div>
      </a>
      <a
        class="supply"
        :href="`https://uri.amap.com/search?keyword=${store.currentLocation} 充电站&view=map&callnative=1`"
        target="_blank"
      >
        <div class="supply-icon charge"><van-icon name="logistics" /></div>
        <div>
          <h3>{{ store.currentLocation }}附近充电站</h3>
          <p>查看快充类型、空闲数量与实时距离</p>
        </div>
        <div class="supply-rating charge-text">高德<span>实时结果</span></div>
      </a>
    </main>

    <!-- 路线偏好弹窗 -->
    <van-popup v-model:show="showRouteForm" position="bottom" round :style="{ height: '60%' }">
      <div class="popup-content">
        <h3>自定义路线</h3>
        <van-field
          v-model="store.origin"
          label="出发城市"
          placeholder="成都市"
          :rules="[{ required: true }]"
        />
        <van-field
          v-model="store.destination"
          label="目的地"
          placeholder="稻城"
        />
        <div class="field-label">单日驾驶强度</div>
        <van-radio-group v-model="store.drivePreference" direction="horizontal">
          <van-radio name="轻松">轻松 2-3h</van-radio>
          <van-radio name="适中">适中 4-5h</van-radio>
          <van-radio name="高效">高效 6h+</van-radio>
        </van-radio-group>
        <div class="field-label">路线偏好</div>
        <van-checkbox-group v-model="store.selectedPreferences" direction="horizontal">
          <van-checkbox name="自然风光">自然风光</van-checkbox>
          <van-checkbox name="当地美食">当地美食</van-checkbox>
          <van-checkbox name="亲子友好">亲子友好</van-checkbox>
          <van-checkbox name="小众秘境">小众秘境</van-checkbox>
          <van-checkbox name="充电便利">充电便利</van-checkbox>
          <van-checkbox name="避开高原">避开高原</van-checkbox>
        </van-checkbox-group>
        <div class="popup-actions">
          <van-button round block type="primary" color="#102d2a" :loading="store.planning" loading-text="规划中..." @click="saveRoute">
            保存并重新生成
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 设置目的地 -->
    <van-popup v-model:show="showDestination" position="bottom" round :style="{ height: '40%' }">
      <div class="popup-content">
        <h3>设置目的地</h3>
        <van-field v-model="store.destination" label="目的地" placeholder="输入城市或景区" />
        <div class="popup-actions">
          <van-button round block type="primary" color="#102d2a" @click="confirmDestination">
            确认目的地
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 邀请好友 -->
    <van-popup v-model:show="showInvite" position="bottom" round :style="{ height: '40%' }">
      <div class="popup-content">
        <h3>邀请好友同行</h3>
        <p class="invite-desc">分享当前路线给好友，好友确认后可一起选择路线、查看日程和补给信息。</p>
        <van-field v-model="friendName" label="同行人昵称" placeholder="输入好友昵称" />
        <div class="popup-actions">
          <van-button round block type="primary" color="#102d2a" @click="sendInvite">
            生成并分享邀请
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 个人中心 -->
    <van-popup v-model:show="showProfile" position="bottom" round :style="{ height: '55%' }">
      <div class="popup-content">
        <h3>我的自驾空间</h3>
        <div class="profile-header">
          <div class="avatar">我</div>
          <div>
            <b>自驾旅行者</b>
            <p>轻松驾驶 · 自然风光 · 当地美食</p>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat"><b>1</b><span>我的行程</span></div>
          <div class="stat"><b>{{ store.favorites.length }}</b><span>收藏地点</span></div>
          <div class="stat"><b>{{ store.friends.length }}</b><span>同行好友</span></div>
        </div>
        <div v-if="store.friends.length" class="friend-list">
          <div v-for="f in store.friends" :key="f.name" class="friend">
            <div class="avatar-sm">{{ f.avatar }}</div>
            <div>
              <b>{{ f.name }}</b>
              <span>已加入当前行程</span>
            </div>
          </div>
        </div>
        <div class="popup-actions">
          <van-button round block plain color="#102d2a" @click="showInvite = true; showProfile = false">
            邀请好友加入行程
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { useRouteStore, type Spot } from '../stores/route'

const store = useRouteStore()

const showRouteForm = ref(false)
const showDestination = ref(false)
const showInvite = ref(false)
const showProfile = ref(false)
const friendName = ref('')

async function generateTrip() {
  store.activeDay = 0
  const res = await store.planTrip()
  if (res.ok) {
    showToast('已生成专属行程')
  } else {
    showToast(res.error || '规划失败，请稍后重试')
  }
}

async function saveRoute() {
  showRouteForm.value = false
  await generateTrip()
}

async function confirmDestination() {
  showDestination.value = false
  const res = await store.planTrip()
  if (res.ok) {
    showToast(`已按 ${store.destination} 重新规划`)
  } else {
    showToast(res.error || '规划失败')
  }
}

function sendInvite() {
  const text = `邀请你加入我的自驾行程：${store.routePath}，建议 ${store.currentRoute.days} 日`
  if (friendName.value) {
    store.addFriend(friendName.value)
    friendName.value = ''
  }
  showInvite.value = false
  if (navigator.share) {
    navigator.share({ title: '行野自驾同行邀请', text }).catch(() => {})
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('邀请文案已复制')
    }).catch(() => {})
  }
}

function showSpotDetail(spot: Spot) {
  showToast(spot.info)
}
</script>

<style scoped>
.explore-page { min-height: 100vh; }
.top-bar {
  padding: 22px 20px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.eyebrow { font-size: 11px; color: var(--mint-strong); font-weight: 700; letter-spacing: 1.6px; margin: 15px 0 6px; }
.hero-title { font-size: 29px; line-height: 1.18; margin: 0 0 17px; letter-spacing: -1.2px; }
.hero-title span { color: var(--orange); }

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--muted);
}
.switch-row :deep(.van-button) { font-size: 11px; height: 30px; }

.route-card {
  border-radius: 17px;
  overflow: hidden;
  background: var(--white);
  box-shadow: var(--shadow);
  border: 1px solid #edf2ef;
}
.route-cover {
  height: 155px;
  position: relative;
  background: linear-gradient(180deg, rgba(12,40,37,.04), rgba(12,40,37,.42)),
    url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80') center/cover;
}
.route-label {
  position: absolute;
  left: 15px; top: 14px;
  background: rgba(255,255,255,.88);
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 11px;
  font-weight: 700;
}
.route-caption {
  position: absolute;
  left: 16px; right: 16px; bottom: 14px;
  color: #fff;
  display: flex;
  align-items: end;
  justify-content: space-between;
}
.route-caption strong { font-size: 21px; display: block; line-height: 1.15; }
.route-caption small { font-size: 11px; opacity: .88; }
.route-stats { text-align: right; }
.route-stats b { font-size: 18px; display: block; }
.route-stats small { font-size: 11px; }

.route-details {
  padding: 13px 15px 15px;
  display: flex;
  gap: 9px;
}
.route-stat {
  flex: 1;
  background: #f5f8f6;
  padding: 9px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.route-stat span { display: block; color: var(--muted); font-size: 10px; margin-bottom: 3px; }
.route-stat b { font-size: 13px; }

.action-row {
  margin-top: 11px;
  display: flex;
  gap: 10px;
}
.action-row :deep(.van-button) { font-size: 13px; }

.invite-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.invite-row :deep(.van-button) {
  flex: 1;
  font-size: 11px;
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--line);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 25px 0 12px;
}
.section-head h2 { font-size: 17px; margin: 0; }
.link { font-size: 12px; color: var(--mint-strong); font-weight: 600; cursor: pointer; text-decoration: none; }

.chips { display: flex; gap: 7px; overflow: auto; padding-bottom: 2px; }
.chips::-webkit-scrollbar { display: none; }
.chip {
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--muted);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}
.chip.active { background: var(--ink); border-color: var(--ink); color: #fff; }

.spot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.spot {
  background: #fff;
  border-radius: 13px;
  padding: 9px;
  border: 1px solid #edf2ef;
  position: relative;
  cursor: pointer;
}
.spot-tag {
  position: absolute;
  left: 16px; top: 16px;
  background: rgba(255,255,255,.86);
  font-size: 9px;
  padding: 4px 6px;
  border-radius: 6px;
}
.heart-btn {
  position: absolute;
  right: 14px; top: 14px;
  font-size: 18px;
}
.spot h3 { font-size: 13px; margin: 9px 2px 3px; }
.spot p { font-size: 10px; color: var(--muted); margin: 0 2px; }

.schedule {
  background: var(--ink);
  border-radius: 16px;
  padding: 16px;
  color: #fff;
}
.schedule-top {
  display: flex;
  justify-content: space-between;
  align-items: start;
}
.schedule-top h2 { font-size: 16px; margin: 0 0 3px; }
.schedule-top small { font-size: 11px; color: #a9c0b7; }
.schedule-top :deep(.van-button) {
  font-size: 10px;
  height: 28px;
}

.day-tabs {
  display: flex;
  gap: 6px;
  margin: 15px 0;
  overflow-x: auto;
  padding-bottom: 3px;
}
.day-tabs::-webkit-scrollbar { display: none; }
.day-tab {
  flex: 0 0 52px;
  text-align: center;
  background: rgba(255,255,255,.09);
  border-radius: 9px;
  padding: 7px 2px;
  color: #aac2b7;
  font-size: 10px;
  cursor: pointer;
}
.day-tab b { display: block; font-size: 13px; color: #fff; margin-top: 2px; }
.day-tab.active { background: var(--orange); color: #fff; }

.timeline { border-top: 1px solid rgba(255,255,255,.12); padding-top: 8px; }
.event {
  display: grid;
  grid-template-columns: 39px 1fr 17px;
  gap: 8px;
  padding: 10px 0;
  align-items: center;
}
.event time { color: #a9c0b7; font-size: 10px; }
.event strong { font-size: 12px; display: block; }
.event small { font-size: 10px; color: #a9c0b7; display: block; margin-top: 2px; }
.event + .event { border-top: 1px dashed rgba(255,255,255,.11); }

.supply {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 13px;
  text-decoration: none;
  color: inherit;
  margin-bottom: 9px;
}
.supply-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex: none;
}
.supply-icon.fuel { background: #fff0e9; color: var(--orange); }
.supply-icon.charge { background: #e4f6ed; color: var(--mint-strong); }
.supply h3 { font-size: 12px; margin: 0 0 3px; }
.supply p { font-size: 10px; color: var(--muted); margin: 0; }
.supply-rating { margin-left: auto; text-align: right; font-size: 11px; color: var(--orange); font-weight: 700; }
.supply-rating span { display: block; font-size: 10px; color: var(--muted); font-weight: 400; }
.supply-rating.charge-text { color: var(--mint-strong); }

/* Popup */
.popup-content { padding: 20px; }
.popup-content h3 { font-size: 19px; margin: 0 0 17px; }
.field-label {
  font-size: 11px;
  font-weight: 700;
  margin: 13px 0 6px;
  padding: 0 16px;
}
.popup-actions { margin-top: 20px; }
.invite-desc { font-size: 12px; color: var(--muted); line-height: 1.7; margin: 0 0 15px; }

.profile-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.avatar {
  width: 46px; height: 46px;
  border-radius: 50%;
  background: var(--mint);
  display: grid;
  place-items: center;
  color: #176746;
  font-weight: 700;
}
.profile-header b { display: block; }
.profile-header p { margin: 3px 0; color: var(--muted); font-size: 11px; }

.profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; }
.stat { background: #f4f8f6; border-radius: 10px; padding: 11px; text-align: center; }
.stat b { font-size: 17px; display: block; }
.stat span { color: var(--muted); font-size: 10px; }

.friend-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.friend { display: flex; align-items: center; gap: 9px; padding: 10px; background: #f7faf8; border-radius: 10px; font-size: 12px; }
.avatar-sm {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--mint);
  display: grid;
  place-items: center;
  color: #176746;
  font-weight: 700;
}
.friend span { display: block; color: var(--muted); font-size: 10px; }
</style>