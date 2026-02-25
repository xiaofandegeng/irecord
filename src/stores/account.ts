import { defineStore } from 'pinia'

export interface AccountEntity {
    id: string
    name: string
    type: 1 | 2 | 3 | 4 // 1-储蓄卡/现金, 2-信用贷记卡, 3-其他, 4-投资理财
    balance: number
    color: string
}

const defaultAccounts: AccountEntity[] = [
    { id: 'a1', name: '现金', type: 1, balance: 0, color: '#fba414' },
    { id: 'a2', name: '微信支付', type: 1, balance: 0, color: '#07c160' },
    { id: 'a3', name: '支付宝', type: 1, balance: 0, color: '#1677ff' },
    { id: 'a4', name: '信用卡', type: 2, balance: 0, color: '#ee0a24' },
    { id: 'a5', name: '股票/理财', type: 4, balance: 0, color: '#8a2be2' }
]

export const useAccountStore = defineStore('account', {
    state: () => ({
        accounts: [...defaultAccounts] as AccountEntity[],
        privacyMode: false // 隐私模式开关
    }),
    getters: {
        totalNetAsset: (state) => {
            return state.accounts.reduce((sum, acc) => sum + acc.balance, 0)
        },
        totalDebt: (state) => {
            // 假设余额小于0或者信用卡的负债部分为债务
            return Math.abs(state.accounts.filter(a => a.balance < 0).reduce((sum, acc) => sum + acc.balance, 0))
        }
    },
    actions: {
        togglePrivacy() {
            this.privacyMode = !this.privacyMode
        },
        updateBalance(id: string, delta: number) {
            const acc = this.accounts.find(a => a.id === id)
            if (acc) {
                acc.balance += delta
            }
        }
    },
    persist: true
})
