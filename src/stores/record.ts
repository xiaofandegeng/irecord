import { defineStore } from 'pinia'

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
    type: 1 | 2
    amount: number
    categoryId: string
    accountId?: string // 新增：关联的资产账户ID
    recordTime: number
    createTime: number
    remark: string
    tags?: string[] // 新增：为单一流水追加多维度的标签阵列
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
        budget: 0, // 月度预算
        globalTags: [] as string[] // 全局已被创建出来的所有标签库
    }),
    getters: {
        expenseCategories: (state) => state.categories.filter(c => c.type === 1).sort((a, b) => a.sort - b.sort),
        incomeCategories: (state) => state.categories.filter(c => c.type === 2).sort((a, b) => a.sort - b.sort)
    },
    actions: {
        addTag(tag: string) {
            if (tag && !this.globalTags.includes(tag)) {
                this.globalTags.push(tag)
            }
        },
        setBudget(amount: number) {
            this.budget = amount
        },
        addRecord(record: Omit<RecordItem, 'id' | 'createTime'>) {
            const newRecord: RecordItem = {
                ...record,
                id: crypto.randomUUID(),
                createTime: Date.now()
            }
            // 插入到最前面
            this.records.unshift(newRecord)

            // 同步更新资产账户余额
            if (record.accountId) {
                import('./account').then(module => {
                    const accountStore = module.useAccountStore()
                    const delta = record.type === 1 ? -record.amount : record.amount
                    accountStore.updateBalance(record.accountId!, delta)
                })
            }
        },
        deleteRecord(id: string) {
            const idx = this.records.findIndex(r => r.id === id)
            if (idx !== -1) {
                const deleted = this.records[idx]
                // 同步回滚资产账户余额
                if (deleted.accountId) {
                    import('./account').then(module => {
                        const accountStore = module.useAccountStore()
                        const delta = deleted.type === 1 ? deleted.amount : -deleted.amount
                        accountStore.updateBalance(deleted.accountId!, delta)
                    })
                }
                this.records.splice(idx, 1)
            }
        }
    },
    persist: true
})
