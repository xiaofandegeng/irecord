import { defineStore } from 'pinia'

export interface TemplateItem {
    id: string
    name: string // 模板名称，如“早餐包子”
    type: 1 | 2
    amount: number
    categoryId: string
    accountId?: string
    remark: string
    tags?: string[]
}

export const useTemplateStore = defineStore('template', {
    state: () => ({
        templates: [] as TemplateItem[]
    }),
    actions: {
        addTemplate(item: Omit<TemplateItem, 'id'>) {
            this.templates.push({
                ...item,
                id: `tpl_${Date.now()}`
            })
        },
        deleteTemplate(id: string) {
            this.templates = this.templates.filter(t => t.id !== id)
        }
    },
    persist: true
})
