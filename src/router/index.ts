import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false }
    },
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log('from', from.path)
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !userStore.token) {
    next('/login')
  } else if (
    userStore.token &&
    (to.path === '/login' || to.path === '/register')
  ) {
    next('/')
  } else {
    next()
  }
})

export default router
