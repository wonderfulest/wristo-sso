import { createRouter, createWebHistory } from 'vue-router'

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
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/ResetPassword.vue'),
      meta: { requiresAuth: false }
    },
  ]
})

// 定义白名单路径（不需要登录）
const whiteList = ['/login', '/register', '/forgot-password', '/reset-password']

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log(from, to)
  if (whiteList.includes(to.path)) {
    // 白名单路径，直接放行
    next()
  } else {
    const token = localStorage.getItem('token')
    if (!token) {
      // 如果 token 不存在，则跳转到登录页面
      next('/login')
    } else {
      // 如果 token 存在，则放行
      next()
    }
  }
})

export default router
