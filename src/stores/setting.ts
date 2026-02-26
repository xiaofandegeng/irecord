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

    // --- 安全隐私 ---
    const enablePasscode = ref(false)
    const passcode = ref('')

    const savedEnablePasscode = localStorage.getItem('irecord_enable_passcode')
    if (savedEnablePasscode) {
        enablePasscode.value = savedEnablePasscode === 'true'
    }

    const savedPasscode = localStorage.getItem('irecord_passcode')
    if (savedPasscode) {
        passcode.value = savedPasscode
    }

    watch(enablePasscode, (newVal) => {
        localStorage.setItem('irecord_enable_passcode', String(newVal))
    })

    watch(passcode, (newVal) => {
        localStorage.setItem('irecord_passcode', newVal)
    })

    const setPasscodeContext = (enable: boolean, code: string) => {
        enablePasscode.value = enable
        passcode.value = code
    }

    // --- 自定义记账起始日 ---
    const billingStartDay = ref(1) // 默认每月1日
    const savedBillingStartDay = localStorage.getItem('irecord_billing_start_day')
    if (savedBillingStartDay) {
        billingStartDay.value = parseInt(savedBillingStartDay, 10) || 1
    }

    watch(billingStartDay, (newVal) => {
        localStorage.setItem('irecord_billing_start_day', String(newVal))
    })

    const setBillingStartDay = (day: number) => {
        if (day >= 1 && day <= 28) {
            billingStartDay.value = day
        }
    }

    // --- 高级预算结转 ---
    const rolloverBudget = ref(false)
    const savedRollover = localStorage.getItem('irecord_rollover_budget')
    if (savedRollover) {
        rolloverBudget.value = savedRollover === 'true'
    }

    watch(rolloverBudget, (newVal) => {
        localStorage.setItem('irecord_rollover_budget', String(newVal))
    })

    const toggleRollover = (val: boolean) => {
        rolloverBudget.value = val
    }

    return {
        theme,
        isDark,
        setTheme,
        primaryColor,
        setPrimaryColor,
        enablePasscode,
        passcode,
        setPasscodeContext,
        billingStartDay,
        setBillingStartDay,
        rolloverBudget,
        toggleRollover
    }
})
