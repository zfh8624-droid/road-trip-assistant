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
      <h2 class="page-title">我的收藏</h2>
      <van-empty v-if="favoriteSpots.length === 0" description="还没有收藏地点" />
      <div v-else class="spot-grid">
        <div
          v-for="spot in favoriteSpots"
          :key="spot.name"
          class="spot"
          @click="showToast(spot.info)"
        >
          <van-image :src="spot.image" fit="cover" height="150" radius="9" />
          <span class="spot-tag">{{ spot.type }}</span>
          <van-icon
            name="heart"
            color="#ff7651"
            class="heart-btn"
            @click.stop="store.toggleFavorite(spot.name)"
          />
          <h3>{{ spot.name }}</h3>
          <p>{{ spot.info }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { useRouteStore } from '../stores/route'

const store = useRouteStore()

onMounted(() => { store.loadFavorites() })

const favoriteSpots = computed(() => {
  return store.routesList.flatMap(r => r.spots).filter(s => store.isFavorite(s.name))
})
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
</style>