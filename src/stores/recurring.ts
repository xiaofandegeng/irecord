import { defineStore } from 'pinia'
import { useRecordStore } from './record'

export interface RecurringRule {
    id: string
    type: 1 | 2
    amount: number
    categoryId: string
    accountId?: string
    tags?: string[]
    remark: string

    // cron 表达可以简化，比如这里我们支持 '每月X号' 或 '每周几' 等等
    // 为了极简，我们定义 cronRule 为一个数字表示每月几号 (1-28)
    cronDayOfMonth: number

    lastTriggerTime: number // 上次触发事件戳
    isActive: boolean

    // 分期/订阅扩展
    isInstallment?: boolean // 是否为分期付款或有限期订阅
    totalInstallments?: number // 总期数
    paidInstallments?: number // 已付期数
}

export const useRecurringStore = defineStore('recurring', {
    state: () => ({
        rules: [] as RecurringRule[]
    }),
    actions: {
        addRule(rule: Omit<RecurringRule, 'id'>) {
            this.rules.push({
                ...rule,
                id: `rec_${Date.now()}`
            })
        },
        deleteRule(id: string) {
            this.rules = this.rules.filter(r => r.id !== id)
        },
        toggleRule(id: string, isActive: boolean) {
            const rule = this.rules.find(r => r.id === id)
            if (rule) {
                rule.isActive = isActive
            }
        },
        checkAndTrigger() {
            // App 每次启动时调用
            const now = new Date()
            const currentYear = now.getFullYear()
            const currentMonth = now.getMonth()
            const currentDay = now.getDate()

            let triggeredCount = 0
            const recordStore = useRecordStore()

            this.rules.forEach(rule => {
                if (!rule.isActive) return

                // 检查是否在当前月已经触发过
                const lastDate = new Date(rule.lastTriggerTime)
                const isSameMonth = lastDate.getFullYear() === currentYear && lastDate.getMonth() === currentMonth

                // 如果今天已经达到或超过了设定的日期，且本月还没触发过
                if (currentDay >= rule.cronDayOfMonth && !isSameMonth) {
                    const currentInstallment = (rule.paidInstallments || 0) + 1
                    const installmentText = rule.isInstallment && rule.totalInstallments ? `(${currentInstallment}/${rule.totalInstallments})` : ''

                    // 记录一下这笔账
                    recordStore.addRecord({
                        type: rule.type,
                        amount: rule.amount,
                        categoryId: rule.categoryId,
                        accountId: rule.accountId,
                        tags: rule.tags,
                        remark: `[自动记账] ${rule.remark} ${installmentText}`.trim(),
                        recordTime: Date.now() // 使用当下触发时间作为入账时间
                    })

                    // 更新触发时间
                    rule.lastTriggerTime = Date.now()

                    if (rule.isInstallment) {
                        rule.paidInstallments = currentInstallment
                        if (rule.totalInstallments && rule.paidInstallments >= rule.totalInstallments) {
                            rule.isActive = false // 分期已完结，自动关闭
                        }
                    }

                    triggeredCount++
                }
            })

            return triggeredCount
        }
    },
    persist: true
})
