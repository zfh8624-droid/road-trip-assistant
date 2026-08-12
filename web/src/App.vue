<template>
  <div class="app">
    <router-view />
    <van-tabbar v-model="activeTab" route placeholder>
      <van-tabbar-item icon="compass" to="/explore">探索</van-tabbar-item>
      <van-tabbar-item icon="calendar-o" to="/trips">行程</van-tabbar-item>
      <van-tabbar-item icon="heart-o" to="/favorites">收藏</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref(0)

const tabMap: Record<string, number> = {
  explore: 0, trips: 1, favorites: 2, profile: 3
}
watch(() => route.name, (name) => {
  if (name && typeof name === 'string') {
    activeTab.value = tabMap[name] ?? 0
  }
}, { immediate: true })
</script>

<style>
:root {
  --ink: #102d2a;
  --muted: #72827f;
  --line: #e8efec;
  --mint: #dff6eb;
  --mint-strong: #30a979;
  --orange: #ff8b4d;
  --paper: #f7faf8;
  --white: #fff;
  --shadow: 0 18px 45px rgba(32, 82, 63, .09);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #edf4f1;
  color: var(--ink);
  font-family: 'DM Sans', 'Noto Sans SC', -apple-system, sans-serif;
}
.app {
  width: min(100%, 430px);
  min-height: 100vh;
  margin: 0 auto;
  background: var(--paper);
  position: relative;
  padding-bottom: 50px;
}
@media (min-width: 600px) {
  .app {
    margin: 25px auto;
    min-height: calc(100vh - 50px);
    border-radius: 26px;
    box-shadow: 0 25px 70px rgba(24, 64, 49, .15);
  }
}

/* Vant tabbar 覆盖 */
:root {
  --van-tabbar-height: 50px;
  --van-tabbar-background: rgba(255, 255, 255, .96);
  --van-tabbar-item-active-color: #30a979;
  --van-tabbar-item-text-color: #9aaba4;
}
</style>