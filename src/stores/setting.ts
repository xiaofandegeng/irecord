import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const useSettingStore = defineStore('setting', () => {
    const theme = ref<ThemeMode>('auto')
    const isDark = ref(false)

    // 从 localStorage 恢复
    const saved = localStorage.getItem('irecord_theme')
    if (saved && ['auto', 'light', 'dark'].includes(saved)) {
        theme.value = saved as ThemeMode
    }

    // 持久化并应用
    watch(theme, (newVal) => {
        localStorage.setItem('irecord_theme', newVal)
        applyTheme(newVal)
    }, { immediate: true })

    function applyTheme(mode: ThemeMode) {
        const dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        isDark.value = dark

        if (dark) {
            document.documentElement.setAttribute('data-theme', 'dark')
            // Vant 4 官方原生黑暗模式类名/属性
            document.documentElement.classList.add('van-theme-dark')
        } else {
            document.documentElement.removeAttribute('data-theme')
            document.documentElement.classList.remove('van-theme-dark')
        }
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme.value === 'auto') {
            applyTheme('auto')
        }
    })

    const setTheme = (mode: ThemeMode) => {
        theme.value = mode
    }

    return {
        theme,
        isDark,
        setTheme
    }
})
