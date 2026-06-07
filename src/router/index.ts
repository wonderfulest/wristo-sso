import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getRouteLocaleParam, SUPPORTED_LOCALES, useLocaleStore } from '@/store/locale'

const langPattern = SUPPORTED_LOCALES.join('|')

const baseRoutes: RouteRecordRaw[] = [
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
  { path: '/login', redirect: to => ({ path: '/auth', query: to.query }) },
  { path: '/forgot-password', redirect: to => ({ path: '/auth', query: to.query }) },
  { path: '/reset-password', redirect: to => ({ path: '/auth', query: to.query }) },
]

const localizedRoutes: RouteRecordRaw[] = baseRoutes
  .filter(route => route.path !== '/')
  .map(route => ({
    ...route,
    path: `/:lang(${langPattern})${route.path}`,
    name: route.name ? `${String(route.name)}Lang` : undefined,
    redirect: typeof route.redirect === 'function'
      ? (to: any) => {
          const redirect = route.redirect
          if (typeof redirect !== 'function') return undefined
          const result = redirect(to)
          if (typeof result === 'string') return `/${to.params.lang}${result}`
          if (result && typeof result === 'object' && 'path' in result) {
            return { ...result, path: `/${to.params.lang}${result.path}` }
          }
          return result
        }
      : route.redirect
  } as RouteRecordRaw))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: `/:lang(${langPattern})`,
      redirect: to => ({ path: `/${to.params.lang}/auth`, query: to.query })
    },
    ...localizedRoutes,
    ...baseRoutes,
  ]
})

router.beforeEach((to, _from, next) => {
  const localeStore = useLocaleStore()
  const routeLang = Array.isArray(to.params.lang) ? to.params.lang[0] : to.params.lang
  const normalizedRouteLang = getRouteLocaleParam(routeLang)
  if (normalizedRouteLang && normalizedRouteLang !== localeStore.currentLocale) {
    localeStore.setLocale(normalizedRouteLang)
  } else {
    localeStore.syncDocumentLang()
  }

  if (to.meta.requiresAuth === false) {
    next()
  } else {
    const token = localStorage.getItem('token')
    if (!token) {
      const authPath = normalizedRouteLang ? `/${normalizedRouteLang}/auth` : '/auth'
      next(authPath)
    } else {
      next()
    }
  }
})

export default router
