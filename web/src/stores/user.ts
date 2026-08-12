import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('xingye-token'))
  const userId = ref<string | null>(localStorage.getItem('xingye-uid'))
  const nickname = ref(localStorage.getItem('xingye-nickname') || '旅行者')
  const avatar = ref(localStorage.getItem('xingye-avatar') || '行')
  const loading = ref(false)
  const ready = ref(false)

  function applyUser(u: { id: string; nickname: string; avatar: string }) {
    userId.value = u.id
    nickname.value = u.nickname
    avatar.value = u.avatar
    localStorage.setItem('xingye-uid', u.id)
    localStorage.setItem('xingye-nickname', u.nickname)
    localStorage.setItem('xingye-avatar', u.avatar)
  }

  async function ensureLogin() {
    if (token.value && userId.value) {
      ready.value = true
      return
    }
    loading.value = true
    try {
      // 优先复用本地token，否则匿名登录拿一个
      let res = token.value ? await authApi.me() : null
      if (!res?.ok) {
        res = await authApi.guestLogin()
        if (res.ok && res.data?.token) {
          token.value = res.data.token
          localStorage.setItem('xingye-token', res.data.token)
        }
      }
      if (res?.ok && res.data?.user) applyUser(res.data.user)
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  async function updateProfile(nick?: string, ava?: string) {
    const res = await authApi.updateProfile(nick, ava)
    if (res.ok && res.data) applyUser(res.data)
  }

  function logout() {
    token.value = null
    userId.value = null
    localStorage.removeItem('xingye-token')
    localStorage.removeItem('xingye-uid')
  }

  // 自动初始化
  onMounted(() => { ensureLogin() })

  return { token, userId, nickname, avatar, loading, ready, ensureLogin, updateProfile, logout }
})
