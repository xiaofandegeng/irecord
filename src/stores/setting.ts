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

    // --- 主题控制 --- 
    const primaryColor = ref('#07c160')
    const savedColor = localStorage.getItem('irecord_primary_color')
    if (savedColor) {
        primaryColor.value = savedColor
    }

    watch(primaryColor, (newColor) => {
        localStorage.setItem('irecord_primary_color', newColor)
        document.documentElement.style.setProperty('--van-primary-color', newColor)

        // 可选：也能支持一些特定透明度用于组件内部阴影/背景
        // 比如借款卡片的渐变等，我们统一使用单色或原色
    }, { immediate: true })

    const setPrimaryColor = (color: string) => {
        primaryColor.value = color
    }

    return {
        theme,
        isDark,
        setTheme,
        primaryColor,
        setPrimaryColor
    }
})
