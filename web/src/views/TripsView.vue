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
      <div class="schedule">
        <div class="schedule-top">
          <div>
            <h2>{{ store.currentRoute.name }} · {{ store.currentRoute.days }}日</h2>
            <small>轻松驾驶 · 自然风光 · 不赶路</small>
          </div>
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

      <div class="section-head">
        <h2>DAY {{ store.currentDayLabel }} · {{ store.currentLocation }}附近补给</h2>
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
  </div>
</template>

<script setup lang="ts">
import { useRouteStore } from '../stores/route'
const store = useRouteStore()
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

.section-head { margin: 25px 0 12px; }
.section-head h2 { font-size: 17px; margin: 0; }

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
</style>