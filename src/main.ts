import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './assets/style.scss'
import App from './App.vue'

import 'vant/lib/index.css'
import router from './router'

import EmptyState from '@/components/EmptyState.vue'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.component('EmptyState', EmptyState)
app.use(pinia)
app.use(router)

app.mount('#app')
