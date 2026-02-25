import type { RecordItem } from '@/stores/record'

/**
 * 极简账单解析器
 * 尝试解析常见的支付宝/微信账单导出格式
 */
export function parseBillCsv(csvText: string): Partial<RecordItem>[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0)
    const results: Partial<RecordItem>[] = []

    if (lines.length === 0) return results

    // 判断是否为 iRecord 原生导出格式
    const headerLine = lines[0].replace(/"/g, '').trim()
    const isIRecordFormat = headerLine.startsWith('id,type,amount,categoryId,accountId,recordTime')

    if (isIRecordFormat) {
        const headers = headerLine.split(',')
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => {
                let val = c.trim()
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1).replace(/""/g, '"')
                }
                return val
            })
            if (cols.length < headers.length) continue

            const record: any = {}
            headers.forEach((h, idx) => {
                const val = cols[idx]
                if (val === '') return

                if (['type', 'amount', 'recordTime', 'createTime', 'exchangeRate'].includes(h)) {
                    record[h] = Number(val)
                } else if (['reimbursable', 'isArchived'].includes(h)) {
                    record[h] = val === 'true'
                } else if (h === 'tags') {
                    record[h] = val.split('|').filter(Boolean)
                } else {
                    record[h] = val
                }
            })
            if (record.amount && record.recordTime) {
                results.push(record)
            }
        }
        return results
    }

    // fallback 到微信/支付宝解析
    let isDataRow = false
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]
        const line = rawLine.trim().replace(/^"/, '').replace(/"ls$/, '')

        if (line.includes('交易时间') && line.includes('金额') && (line.includes('收支') || line.includes('收/支'))) {
            isDataRow = true
            continue
        }

        if (isDataRow) {
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"(.*)"$/, '$1').trim())

            if (cols.length < 5) continue

            let recordTimeStr = ''
            let typeStr = ''
            let amountStr = ''
            let remarkStr = ''

            if (line.includes('支付宝') || cols[0].length >= 19) {
                recordTimeStr = cols[0]
                remarkStr = `${cols[2] || ''} - ${cols[4] || ''}`
                typeStr = cols[5] || ''
                amountStr = cols[6] || ''
            } else {
                recordTimeStr = cols[0]
                remarkStr = `${cols[2] || ''} - ${cols[3] || ''}`
                typeStr = cols[4] || ''
                amountStr = cols[5] || ''
            }

            const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''))
            const recordTime = new Date(recordTimeStr.replace(/-/g, '/')).getTime()

            let type: 1 | 2 = 1
            if (typeStr.includes('收入') || amountStr.startsWith('+')) {
                type = 2
            } else if (typeStr === '不计收支' || typeStr.includes('退款')) {
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
