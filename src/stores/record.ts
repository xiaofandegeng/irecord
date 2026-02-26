import { defineStore } from 'pinia'
import { recordApi } from '@/api/record'
import { getCustomBillingMonthRange } from '@/utils/date'
import dayjs from 'dayjs'
import { useSettingStore } from './setting'

export interface Category {
    id: string
    name: string
    icon: string
    type: 1 | 2 // 1-支出 2-收入
    sort: number
    isSystem: boolean
    keywords?: string[] // 新增：用于智能记账的匹配关键字列表
    budgetLimit?: number // 新增：分类独立预算阀值
}

export interface RecordItem {
    id: string
    type: 1 | 2 | 3 // 1-支出 2-收入 3-转账
    amount: number
    categoryId: string
    accountId?: string // 对于转账记录，这表示转出账户ID (From)
    toAccountId?: string // 新增：对于转账记录，这表示转入账户ID (To)
    recordTime: number
    createTime: number
    remark: string
    tags?: string[] // 新增：为单一流水追加多维度的标签阵列
    ledgerId?: string // 新增：支持多账本隔离
    goalId?: string // 新增：支持计入存钱目标
    attachments?: string[] // 新增：支持多媒体凭证图片 Base64
    reimbursable?: boolean // 新增：是否可报销
    reimbursableId?: string // 新增：如果是一笔报销收款入账，关联的原始支出的ID
    creatorId?: string // 新增：记录录入人的用户ID（面向家庭共享场景）
    currency?: string // 新增：多币种记账时对应的货币符号（如 JPY, USD）
    exchangeRate?: number // 新增：多币种记账时的汇率（转换为基准货币的比例）
    refundForId?: string // 新增：退款关联的原支出记录ID，用于抵消报表总额
    isArchived?: boolean // 新增：冷温分层，标明是否被年度结转归档
}

// 默认内置分类
const defaultCategories: Category[] = [
    { id: 'c1', name: '餐饮', icon: 'shop-o', type: 1, sort: 1, isSystem: true, keywords: ['美团', '饿了么', '餐饮', '麦当劳', '肯德基', '星巴克', '瑞幸', '喜茶'] },
    { id: 'c2', name: '交通', icon: 'logistics', type: 1, sort: 2, isSystem: true, keywords: ['滴滴', '打车', '地铁', '公交', '火车', '12306', '机票', '携程'] },
    { id: 'c3', name: '购物', icon: 'cart-o', type: 1, sort: 3, isSystem: true, keywords: ['淘宝', '京东', '拼多多', '超市', '便利店', '购物'] },
    { id: 'c4', name: '日用', icon: 'bag-o', type: 1, sort: 4, isSystem: true, keywords: ['话费', '电费', '水费', '燃气费', '物业'] },
    { id: 'c5', name: '娱乐', icon: 'smile-o', type: 1, sort: 5, isSystem: true, keywords: ['电影', '猫眼', '网易云', 'B站', '爱奇艺', '腾讯视频', '游戏', 'Steam'] },
    { id: 'c6', name: '工资', icon: 'balance-o', type: 2, sort: 1, isSystem: true, keywords: ['工资', '薪水', '代发', '发薪'] },
    { id: 'c7', name: '红包', icon: 'gift-o', type: 2, sort: 2, isSystem: true, keywords: ['红包', '转账'] }
]

export const useRecordStore = defineStore('record', {
    state: () => ({
        categories: [...defaultCategories] as Category[],
        records: [] as RecordItem[],
        archivedRecords: [] as RecordItem[], // 冷数据集合
        budget: 0, // 月度预算
        globalTags: [] as string[] // 全局已被创建出来的所有标签库
    }),
    getters: {
        currentLedgerRecords: (state) => {
            // Need to defer ledger store get to avoid pinia init loops or simply use an action when needed.
            // However, Pinia getters can use other stores if imported inside the getter.
            const ledgerStore = JSON.parse(localStorage.getItem('ledger') || '{}')
            const currentLedgerId = ledgerStore.currentLedgerId || 'ledger_default'

            return state.records.filter(r => (r.ledgerId || 'ledger_default') === currentLedgerId)
        },
        expenseCategories: (state) => state.categories.filter(c => c.type === 1).sort((a, b) => a.sort - b.sort),
        incomeCategories: (state) => state.categories.filter(c => c.type === 2).sort((a, b) => a.sort - b.sort),
        financialInsight(state): { score: number, messages: string[] } {
            const records: RecordItem[] = (this as any).currentLedgerRecords
            let score = 80
            const messages: string[] = []

            const settingStore = useSettingStore()
            const startDay = settingStore.billingStartDay

            const now = new Date()
            const { start: currentMonthStart, end: currentMonthEnd } = getCustomBillingMonthRange(now, startDay)
            const { start: lastMonthStart, end: lastMonthEnd } = getCustomBillingMonthRange(dayjs(now).subtract(1, 'month').toDate(), startDay)

            let currentMonthExpense = 0
            let lastMonthExpense = 0
            const categoryExpenses: Record<string, number> = {}

            records.forEach(r => {
                if (r.type === 1) { // 支出 (含退款为负值)
                    // 简单规避投资账户（如果是 a5 则忽略，为了更精准。这里先按全局标准）
                    const t = r.recordTime
                    const actualAmount = r.amount * (r.exchangeRate || 1)

                    if (t >= currentMonthStart && t <= currentMonthEnd) {
                        currentMonthExpense += actualAmount
                        categoryExpenses[r.categoryId] = (categoryExpenses[r.categoryId] || 0) + actualAmount
                    } else if (t >= lastMonthStart && t <= lastMonthEnd) {
                        lastMonthExpense += actualAmount
                    }
                }
            })

            // 预算压力
            if (state.budget > 0) {
                const ratio = currentMonthExpense / state.budget
                if (ratio > 0.9) {
                    score -= 20
                    messages.push('本月全局预算已告急，请注意控制开销！')
                } else if (ratio > 0.7) {
                    score -= 10
                    messages.push('本月预算已消耗大半，需合理规划后续支出。')
                } else {
                    score += 10
                    messages.push('本月预算控制得非常好，继续保持。')
                }
            }

            // 环比消费
            if (lastMonthExpense > 0) {
                if (currentMonthExpense > lastMonthExpense * 1.2) {
                    score -= 15
                    messages.push(`本月支出较上月同期显著增长了 ${Math.round((currentMonthExpense / lastMonthExpense - 1) * 100)}%。`)
                } else if (currentMonthExpense < lastMonthExpense * 0.8) {
                    score += 10
                    messages.push(`本月支出较上月有所下降，节流效果明显。`)
                }
            }

            // 分类子预算压力
            state.categories.forEach(c => {
                if (c.budgetLimit && c.budgetLimit > 0) {
                    const spent = categoryExpenses[c.id] || 0
                    if (spent > c.budgetLimit) {
                        score -= 5
                        messages.push(`【${c.name}】超出了预设子预算限额！`)
                    }
                }
            })

            // 数据极少时
            if (currentMonthExpense === 0 && lastMonthExpense === 0) {
                score = 100
                messages.push('欢迎使用！多记录几笔账单以获取更精准的洞察。')
            }

            if (score > 100) score = 100
            if (score < 0) score = 0

            // 兜底语句
            if (messages.length === 0) {
                if (score >= 80) messages.push('目前财务状况健康，各项指标平稳。')
                else messages.push('财务状况一般，请关注近期大额支出。')
            }

            return { score, messages }
        }
    },
    actions: {
        addCategory(category: Omit<Category, 'id' | 'sort' | 'isSystem'>) {
            const list = category.type === 1 ? this.expenseCategories : this.incomeCategories;
            const sort = list.length > 0 ? list[list.length - 1].sort + 1 : 1;
            this.categories.push({
                ...category,
                id: `c_custom_${Date.now()}`,
                sort,
                isSystem: false
            });
        },
        removeCategory(categoryId: string, type: 1 | 2) {
            const idx = this.categories.findIndex(c => c.id === categoryId && c.type === type);
            if (idx !== -1 && !this.categories[idx].isSystem) {
                this.categories.splice(idx, 1);
            }
        },
        addTag(tag: string) {
            if (tag && !this.globalTags.includes(tag)) {
                this.globalTags.push(tag)
            }
        },
        setBudget(amount: number) {
            this.budget = amount
        },
        async addRecord(record: Omit<RecordItem, 'id' | 'createTime'>) {
            import('./ledger').then(async module => {
                const ledgerStore = module.useLedgerStore()
                let newRecord: RecordItem = {
                    ...record,
                    id: crypto.randomUUID(),
                    createTime: Date.now(),
                    ledgerId: record.ledgerId || ledgerStore.currentLedgerId // 绑定到当前所在账本
                }

                try {
                    // 对接 Mock API 进行网络请求，模拟写入服务端
                    const responseRecord = await recordApi.add(newRecord)
                    if (responseRecord) {
                        newRecord = responseRecord;
                    }
                    // 插入到最前面
                    this.records.unshift(newRecord)
                } catch (e) {
                    console.error('Failed to add record via API', e)
                    // 为了保证单机演示依然顺畅，这里 fallback
                    this.records.unshift(newRecord)
                }
            })

            // 同步更新资产账户余额
            if (record.accountId) {
                import('./account').then(module => {
                    const accountStore = module.useAccountStore()
                    if (record.type === 3) {
                        // 转账
                        accountStore.updateBalance(record.accountId!, -record.amount)
                        if (record.toAccountId) {
                            accountStore.updateBalance(record.toAccountId, record.amount)
                        }
                    } else {
                        const delta = record.type === 1 ? -record.amount : record.amount
                        accountStore.updateBalance(record.accountId!, delta)
                    }
                })
            }

            // 同步心愿单目标
            if (record.goalId) {
                import('./goal').then(module => {
                    const delta = record.type === 1 ? record.amount : -record.amount
                    module.useGoalStore().updateGoalProgress(record.goalId!, delta)
                })
            }
        },
        async deleteRecord(id: string) {
            const idx = this.records.findIndex(r => r.id === id)
            if (idx !== -1) {
                try {
                    // 请求服务端删除
                    await recordApi.remove(id)
                } catch (e) {
                    console.warn('API remove failed, proceeding with local remove', e)
                }
                const deleted = this.records[idx]
                // 同步回滚资产账户余额
                if (deleted.accountId) {
                    import('./account').then(module => {
                        const accountStore = module.useAccountStore()
                        if (deleted.type === 3) {
                            accountStore.updateBalance(deleted.accountId!, deleted.amount)
                            if (deleted.toAccountId) {
                                accountStore.updateBalance(deleted.toAccountId, -deleted.amount)
                            }
                        } else {
                            const delta = deleted.type === 1 ? deleted.amount : -deleted.amount
                            accountStore.updateBalance(deleted.accountId!, delta)
                        }
                    })
                }

                if (deleted.goalId) {
                    import('./goal').then(module => {
                        const delta = deleted.type === 1 ? -deleted.amount : deleted.amount
                        module.useGoalStore().updateGoalProgress(deleted.goalId!, delta)
                    })
                }

                // 若删除的是一笔“报销入账”（reimbursableId 存在），则需要将原支出账单恢复为“未报销”状态
                if (deleted.reimbursableId) {
                    const originalExpense = this.records.find(r => r.id === deleted.reimbursableId)
                    if (originalExpense) {
                        originalExpense.reimbursable = true // 重新变成可报销
                    }
                }

                // 如果删除的是原始可报销支出，且它已经被报销了（reimbursable === false），
                // 严谨做法是同时删除由它产生的报销入账，或者给予提示。这里暂为了简单直接删除。

                this.records.splice(idx, 1)
            }
        },
        // 核心一键报销逻辑
        reimburseRecord(expenseId: string, incomeAccountId?: string) {
            const expense = this.records.find(r => r.id === expenseId)
            if (!expense || expense.type !== 1 || expense.reimbursable === false) return

            // 1. 将原支出标记为已报销 (不再视为 reimbursable 待报销)
            expense.reimbursable = false

            // 2. 生成一笔对应的报销入账
            const incomeRecord: RecordItem = {
                id: crypto.randomUUID(),
                type: 2, // 收入
                amount: expense.amount,
                categoryId: 'c6', // 暂定存入内置类别（这里可以用专用的分类，我们用内置类别或者新增类别）
                accountId: incomeAccountId,
                recordTime: Date.now(),
                createTime: Date.now(),
                remark: `(报销) ${expense.remark || expense.categoryId}`,
                ledgerId: expense.ledgerId,
                reimbursableId: expense.id // 绑定关系
            }

            // 存入入账
            this.records.unshift(incomeRecord)

            // 3. 更新资产余额 (如选择了入账账户)
            if (incomeAccountId) {
                import('./account').then(module => {
                    module.useAccountStore().updateBalance(incomeAccountId, incomeRecord.amount)
                })
            }
        },
        async archiveYear(year: number) {
            const nextYearStart = new Date(year + 1, 0, 1).getTime()

            const toArchive = this.records.filter(r => {
                const y = new Date(r.recordTime).getFullYear()
                return y <= year
            })

            if (toArchive.length === 0) return 0

            let netSum = 0
            toArchive.forEach(r => {
                r.isArchived = true
                const actual = r.amount * (r.exchangeRate || 1)
                if (r.type === 2) netSum += actual
                else if (r.type === 1) netSum -= actual
            })

            this.archivedRecords.push(...toArchive)
            this.records = this.records.filter(r => !toArchive.includes(r))

            // 插入一条汇总的“期初结转”记录到次年1月1日，代表往年结余 (不触发真实Account余额变动)
            const rolloverRecord: RecordItem = {
                id: crypto.randomUUID(),
                type: netSum >= 0 ? 2 : 1,
                amount: Math.abs(netSum),
                categoryId: netSum >= 0 ? 'c6' : 'c4', // Fallback
                recordTime: nextYearStart,
                createTime: Date.now(),
                remark: `${year}及更早年度期初结转`,
                isArchived: false,
                ledgerId: 'ledger_default'
            }

            this.records.push(rolloverRecord)
            this.records.sort((a, b) => b.recordTime - a.recordTime)

            return toArchive.length
        }
    },
    persist: true
})
