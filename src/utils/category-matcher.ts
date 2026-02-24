import { useRecordStore } from '@/stores/record'

/**
 * 智能分类提取引擎
 * @param remark 账单条目的商品描述/备注
 * @param type 收支类型 1:支出 2:收入
 * @returns 命中的 categoryId，如果全未命中则返回对应收支类型的默认第一个 categoryId
 */
export function matchCategory(remark: string, type: 1 | 2): string {
    const store = useRecordStore()

    // 按照支出/收入分别匹配
    const candidates = type === 1 ? store.expenseCategories : store.incomeCategories

    // 如果没有任何该类型分类，则兜底防错
    if (candidates.length === 0) return ''

    // 1. 遍历所有带关键词的类别
    for (const cat of candidates) {
        if (cat.keywords && cat.keywords.length > 0) {
            for (const kw of cat.keywords) {
                // 大小写不敏感的精确包含判定
                if (remark.toLowerCase().includes(kw.toLowerCase())) {
                    return cat.id
                }
            }
        }
    }

    // 2. 全部落空，返回该类型的 default 兜底分类
    return candidates[0].id
}
