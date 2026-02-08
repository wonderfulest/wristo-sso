import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/auth'
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/Auth.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/change-email',
      name: 'ChangeEmail',
      component: () => import('@/views/ChangeEmail.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/set-password',
      name: 'SetPassword',
      component: () => import('@/views/SetPassword.vue'),
      meta: { requiresAuth: false }
    },
    // Legacy routes redirect to /auth
    { path: '/login', redirect: '/auth' },
    { path: '/forgot-password', redirect: '/auth' },
    { path: '/reset-password', redirect: '/auth' },
  ]
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth === false) {
    next()
  } else {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/auth')
    } else {
      next()
    }
  }
})

export default router
