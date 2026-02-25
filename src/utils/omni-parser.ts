import { Category } from '@/stores/record'

export interface OmniParsedData {
    amount: number
    categoryId: string
    remark: string
    type: 1 | 2
}

/**
 * 智能解析器：提炼金额、分类和备注
 * @param input 用户输入的自然语言命令，例如： "@餐饮 麦当劳 35" 或 "打车 20"
 * @param categories 当前账本所有可用的分类库
 */
export function parseOmniCommand(input: string, categories: Category[]): OmniParsedData | null {
    if (!input || !input.trim()) return null

    const text = input.trim()

    // 1. 提取金额（寻找第一串数字，支持小数）
    const amountMatch = text.match(/\d+(\.\d{1,2})?/)
    if (!amountMatch) {
        // 如果没有数字，说明格式不对
        return null
    }
    const amount = parseFloat(amountMatch[0])

    // 把金额从原文本剥离
    let remainText = text.replace(amountMatch[0], '').trim()

    // 2. 匹配分类
    let matchedCategory: Category | undefined

    // 2.1 显式指定模式 (例如: @餐饮)
    const exactMatch = remainText.match(/@(\S+)/)
    if (exactMatch) {
        const catName = exactMatch[1]
        // 通过名字匹配
        matchedCategory = categories.find(c => c.name === catName)
        if (matchedCategory) {
            remainText = remainText.replace(exactMatch[0], '').trim()
        }
    }

    // 2.2 隐式关键字模式 (例如: 麦当劳)
    if (!matchedCategory) {
        // 全文本扫描所有的类别的 keywords
        for (const cat of categories) {
            if (cat.keywords && cat.keywords.some(kw => text.includes(kw))) {
                matchedCategory = cat
                break
            }
        }
    }

    // 2.3 降级处理: 默认取第一个支出类别
    if (!matchedCategory) {
        matchedCategory = categories.find(c => c.type === 1) || categories[0]
    }

    return {
        amount,
        categoryId: matchedCategory.id,
        type: matchedCategory.type,
        remark: remainText || 'Omni 速记'
    }
}
