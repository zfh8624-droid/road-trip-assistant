import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/explore'
    },
    {
      path: '/explore',
      name: 'explore',
      component: () => import('../views/ExploreView.vue'),
      meta: { title: '探索' }
    },
    {
      path: '/trips',
      name: 'trips',
      component: () => import('../views/TripsView.vue'),
      meta: { title: '行程' }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue'),
      meta: { title: '收藏' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: '我的' }
    }
  ]
})

// hash 路由首次加载时 redirect 可能不触发，加守卫兜底
router.beforeEach((to) => {
  if (to.path === '/') return '/explore'
})

export default router