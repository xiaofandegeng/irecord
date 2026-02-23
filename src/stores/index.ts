import { defineStore } from 'pinia'

// 测试 Store
export const useMainStore = defineStore('main', {
    state: () => ({
        initialized: false
    }),
    actions: {
        initApp() {
            this.initialized = true
        }
    },
    persist: true // 使用 pinia-plugin-persistedstate
})
