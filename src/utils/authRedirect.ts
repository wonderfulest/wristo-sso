import router from '@/router'

let isRedirectingToAuth = false

export function clearLocalAuthState() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
}

export function redirectToAuthPage() {
  if (isRedirectingToAuth) {
    return
  }
  isRedirectingToAuth = true

  clearLocalAuthState()

  if (router.currentRoute.value.path !== '/auth') {
    router.replace('/auth')
  }
}
