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
      <h2 class="page-title">我的自驾空间</h2>

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

      <div class="section-head">
        <h2>同行人</h2>
        <span class="link" @click="showInvite = true">邀请好友 ›</span>
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
      <van-empty v-else description="暂无同行人" />

      <van-button round block type="primary" color="#102d2a" @click="showInvite = true">
        邀请好友加入行程
      </van-button>
    </main>

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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { useRouteStore } from '../stores/route'

const store = useRouteStore()
const showInvite = ref(false)
const friendName = ref('')

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

.section-head { display: flex; align-items: center; justify-content: space-between; margin: 17px 0 9px; }
.section-head h2 { font-size: 17px; margin: 0; }
.link { font-size: 12px; color: var(--mint-strong); font-weight: 600; cursor: pointer; }

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

.popup-content { padding: 20px; }
.popup-content h3 { font-size: 19px; margin: 0 0 17px; }
.invite-desc { font-size: 12px; color: var(--muted); line-height: 1.7; margin: 0 0 15px; }
.popup-actions { margin-top: 20px; }
</style>