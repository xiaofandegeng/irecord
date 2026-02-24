import { defineStore } from 'pinia'

export interface DebtItem {
    id: string
    type: 1 | 2 // 1-我借出的(应收) 2-我借入的(应付)
    amount: number // 总借款金额
    repaidAmount: number // 已还款金额
    person: string // 债务人/债权人
    recordTime: number // 借款日期
    deadline?: number // 预计还款日期 (可选)
    remark: string
    isCleared: boolean // 是否已结清
    ledgerId?: string // 默认跟随主账本
}

export interface RepaymentRecord {
    id: string
    debtId: string
    amount: number
    recordTime: number
    remark?: string
}

export const useDebtStore = defineStore('debt', {
    state: () => ({
        debts: [] as DebtItem[],
        repayments: [] as RepaymentRecord[]
    }),
    getters: {
        currentLedgerDebts: (state) => {
            const ledgerStore = JSON.parse(localStorage.getItem('ledger') || '{}')
            const currentLedgerId = ledgerStore.currentLedgerId || 'ledger_default'
            return state.debts.filter(d => (d.ledgerId || 'ledger_default') === currentLedgerId)
        },
        totalLent: () => {
            return 0
        },
        totalBorrowed: () => {
            return 0
        }
    },
    actions: {
        addDebt(debt: Omit<DebtItem, 'id' | 'repaidAmount' | 'isCleared'>) {
            import('./ledger').then(module => {
                const ledgerStore = module.useLedgerStore()
                const newDebt: DebtItem = {
                    ...debt,
                    id: crypto.randomUUID(),
                    repaidAmount: 0,
                    isCleared: false,
                    ledgerId: debt.ledgerId || ledgerStore.currentLedgerId
                }
                this.debts.unshift(newDebt)
            })
        },
        addRepayment(debtId: string, amount: number, accountId?: string, remark?: string) {
            const debt = this.debts.find(d => d.id === debtId)
            if (!debt || debt.isCleared) return

            // 保护：不能超过待还总额
            const remaining = debt.amount - debt.repaidAmount
            const actualAmount = Math.min(amount, remaining)

            // 1. 添加还款记录
            const repayment: RepaymentRecord = {
                id: crypto.randomUUID(),
                debtId,
                amount: actualAmount,
                recordTime: Date.now(),
                remark
            }
            this.repayments.push(repayment)

            // 2. 更新债务主体已还金额
            debt.repaidAmount += actualAmount
            if (debt.repaidAmount >= debt.amount) {
                debt.isCleared = true
            }

            // 3. (可选) 同步生成一笔对应的流水入账/出账
            // *借出*还款(type=1): 我收到了钱 -> 产生流水收入
            // *借入*还款(type=2): 我还了钱 -> 产生流水支出
            // 这里为了模块解耦，可以单独处理，或者在此处直接调用 recordStore
            import('./record').then(rStoreModule => {
                const rStore = rStoreModule.useRecordStore()
                const type = debt.type === 1 ? 2 : 1 // 反向
                rStore.addRecord({
                    type: type,
                    amount: actualAmount,
                    categoryId: 'c6', // TODO: 借贷专用内置分类
                    accountId: accountId,
                    recordTime: Date.now(),
                    remark: `(还款) ${debt.person} - ${remark || ''}`,
                    ledgerId: debt.ledgerId
                })
            })

            // 4. 更新资产余额 (已经交由 addRecord 统一处理 if accountId is provided in addRecord action)
        },
        deleteDebt(id: string) {
            const idx = this.debts.findIndex(d => d.id === id)
            if (idx !== -1) {
                // 删除关联的还款明细
                this.repayments = this.repayments.filter(r => r.debtId !== id)
                this.debts.splice(idx, 1)
            }
        },
        // getters dynamic helper
        getLedgerTotals() {
            const ledgerStore = JSON.parse(localStorage.getItem('ledger') || '{}')
            const currentLedgerId = ledgerStore.currentLedgerId || 'ledger_default'
            const currentDebts = this.debts.filter(d => (d.ledgerId || 'ledger_default') === currentLedgerId && !d.isCleared)

            const lent = currentDebts.filter(d => d.type === 1).reduce((sum, d) => sum + (d.amount - d.repaidAmount), 0)
            const borrowed = currentDebts.filter(d => d.type === 2).reduce((sum, d) => sum + (d.amount - d.repaidAmount), 0)

            return { lent, borrowed }
        }
    },
    persist: true
})
