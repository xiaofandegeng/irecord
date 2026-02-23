import { defineStore } from 'pinia'

export interface Category {
    id: string
    name: string
    icon: string
    type: 1 | 2 // 1-支出 2-收入
    sort: number
    isSystem: boolean
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
}

// 默认内置分类
const defaultCategories: Category[] = [
    { id: 'c1', name: '餐饮', icon: 'shop-o', type: 1, sort: 1, isSystem: true },
    { id: 'c2', name: '交通', icon: 'logistics', type: 1, sort: 2, isSystem: true },
    { id: 'c3', name: '购物', icon: 'cart-o', type: 1, sort: 3, isSystem: true },
    { id: 'c4', name: '日用', icon: 'bag-o', type: 1, sort: 4, isSystem: true },
    { id: 'c5', name: '娱乐', icon: 'smile-o', type: 1, sort: 5, isSystem: true },
    { id: 'c6', name: '工资', icon: 'balance-o', type: 2, sort: 1, isSystem: true },
    { id: 'c7', name: '红包', icon: 'gift-o', type: 2, sort: 2, isSystem: true }
]

export const useRecordStore = defineStore('record', {
    state: () => ({
        categories: [...defaultCategories] as Category[],
        records: [] as RecordItem[],
        budget: 0 // 月度预算
    }),
    getters: {
        expenseCategories: (state) => state.categories.filter(c => c.type === 1).sort((a, b) => a.sort - b.sort),
        incomeCategories: (state) => state.categories.filter(c => c.type === 2).sort((a, b) => a.sort - b.sort)
    },
    actions: {
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
