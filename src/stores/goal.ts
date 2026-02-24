import { defineStore } from 'pinia'

export interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline?: number // timestamp
    createdAt: number
    icon: string
}

export const useGoalStore = defineStore('goal', {
    state: () => ({
        goals: [] as Goal[]
    }),
    getters: {
        totalTarget: (state) => state.goals.reduce((sum, g) => sum + g.targetAmount, 0),
        totalCurrent: (state) => state.goals.reduce((sum, g) => sum + g.currentAmount, 0)
    },
    actions: {
        addGoal(name: string, targetAmount: number, deadline?: number, icon: string = 'flag-o') {
            this.goals.push({
                id: crypto.randomUUID(),
                name,
                targetAmount,
                currentAmount: 0,
                deadline,
                createdAt: Date.now(),
                icon
            })
        },
        updateGoalProgress(id: string, amount: number) {
            const goal = this.goals.find(g => g.id === id)
            if (goal) {
                goal.currentAmount += amount
                if (goal.currentAmount < 0) goal.currentAmount = 0
            }
        },
        deleteGoal(id: string) {
            this.goals = this.goals.filter(g => g.id !== id)
        },
        editGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>>) {
            const goal = this.goals.find(g => g.id === id)
            if (goal) {
                Object.assign(goal, updates)
            }
        }
    },
    persist: true
})
