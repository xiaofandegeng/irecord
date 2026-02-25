import { defineStore } from 'pinia'

export interface Ledger {
    id: string
    name: string
    icon: string
    isDefault?: boolean // 默认账本不能删
    baseCurrency?: string // 基准货币 (如 CNY, USD)
    createdAt: number
}

// 默认生成一个“日常账本”
const defaultLedgers: Ledger[] = [
    {
        id: 'ledger_default',
        name: '日常账本',
        icon: 'shop-o',
        isDefault: true,
        baseCurrency: 'CNY',
        createdAt: Date.now()
    }
]

export const useLedgerStore = defineStore('ledger', {
    state: () => ({
        ledgers: [...defaultLedgers] as Ledger[],
        currentLedgerId: 'ledger_default'
    }),
    getters: {
        currentLedger: (state) => state.ledgers.find(l => l.id === state.currentLedgerId) || state.ledgers[0]
    },
    actions: {
        addLedger(ledgerName: string, iconStr: string = 'label-o') {
            const newLedger: Ledger = {
                id: `ledger_${Date.now()}`,
                name: ledgerName,
                icon: iconStr,
                baseCurrency: 'CNY',
                createdAt: Date.now()
            }
            this.ledgers.push(newLedger)
            return newLedger
        },
        switchLedger(id: string) {
            if (this.ledgers.find(l => l.id === id)) {
                this.currentLedgerId = id
            }
        },
        deleteLedger(id: string) {
            const index = this.ledgers.findIndex(l => l.id === id)
            if (index > -1 && !this.ledgers[index].isDefault) {
                this.ledgers.splice(index, 1)
                // 如果恰好删除了当前账本，切回到默认账本
                if (this.currentLedgerId === id) {
                    this.currentLedgerId = 'ledger_default'
                }
            }
        },
        updateLedger(id: string, name: string, icon: string, baseCurrency?: string) {
            const l = this.ledgers.find(l => l.id === id)
            if (l) {
                l.name = name
                if (icon) l.icon = icon
                if (baseCurrency) l.baseCurrency = baseCurrency
            }
        }
    },
    persist: true
})
