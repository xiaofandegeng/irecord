import type { RecordItem } from '@/stores/record'

/**
 * 极简账单解析器
 * 尝试解析常见的支付宝/微信账单导出格式
 */
export function parseBillCsv(csvText: string): Partial<RecordItem>[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0)
    const results: Partial<RecordItem>[] = []

    let isDataRow = false
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]
        // 简单清洗，去掉首尾可能多余的空格或不可见字符
        const line = rawLine.trim().replace(/^"/, '').replace(/"ls$/, '')

        // 很多账单会在数据区开始前有明显的表头行
        if (line.includes('交易时间') && line.includes('金额') && (line.includes('收支') || line.includes('收/支'))) {
            isDataRow = true
            continue
        }

        if (isDataRow) {
            // 假设是以英文逗号分隔，注意真实情况CSV可能包含带逗号的引号括起来的字符串
            // 这里用简化的正则按照逗号分割(不完美应对嵌套引号内的逗号，但在多数普通账单下可用)
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"(.*)"$/, '$1').trim())

            if (cols.length < 5) continue

            // 抽取逻辑 (以微信和支付宝的经验为主)
            // 我们在前面的步骤里寻找关键列：时间、收支类型、金额、备注/商品
            let recordTimeStr = ''
            let typeStr = ''
            let amountStr = ''
            let remarkStr = ''

            // 简单判断列模式
            if (line.includes('支付宝') || cols[0].length >= 19) {
                // 大概率是支付宝格式: 交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态...
                // 这里只是经验截取，真实环境下需要严格定义 mapping
                recordTimeStr = cols[0]
                remarkStr = `${cols[2] || ''} - ${cols[4] || ''}`
                typeStr = cols[5] || ''
                amountStr = cols[6] || ''
            } else {
                // 微信格式: 交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态...
                recordTimeStr = cols[0]
                remarkStr = `${cols[2] || ''} - ${cols[3] || ''}`
                typeStr = cols[4] || ''
                amountStr = cols[5] || ''
            }

            // 金额去掉可能存在的 '¥' 符号
            const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''))

            // 时间解析
            const recordTime = new Date(recordTimeStr.replace(/-/g, '/')).getTime()

            // 收支判定
            let type: 1 | 2 = 1 // 默认支出
            if (typeStr.includes('收入') || amountStr.startsWith('+')) {
                type = 2
            } else if (typeStr === '不计收支' || typeStr.includes('退款')) {
                // 跳过不计收支的项目
                continue
            }

            if (!isNaN(amount) && !isNaN(recordTime) && amount > 0) {
                results.push({
                    type,
                    amount,
                    recordTime,
                    remark: remarkStr.trim()
                })
            }
        }
    }

    return results
}
