import { isChinaSso } from '@/config/region'
import { createApp } from 'vue'
import './assets/styles/global.scss'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')


// Domestic login must never load Google or Apple SDKs.
if (!isChinaSso) {
  for (const src of ['https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', 'https://accounts.google.com/gsi/client']) {
    const script = document.createElement('script'); script.src = src; script.async = true; document.head.appendChild(script)
  }
}
