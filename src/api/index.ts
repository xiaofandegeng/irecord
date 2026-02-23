import request from '@/utils/request'
import type { RecordItem } from '@/stores/record'
import type { AccountEntity } from '@/stores/account'

// 以下为可选的服务端接入 API 定义

/**
 * 示例：全量同步账单数据到云端
 */
export const syncRecordsToServer = (records: RecordItem[]) => {
    return request({
        url: '/sync/records',
        method: 'post',
        data: records
    })
}

/**
 * 示例：从云端拉取全量账单数据
 */
export const fetchRecordsFromServer = () => {
    return request({
        url: '/sync/records',
        method: 'get'
    })
}

/**
 * 示例：同步资产账户数据
 */
export const syncAccountsToServer = (accounts: AccountEntity[]) => {
    return request({
        url: '/sync/accounts',
        method: 'post',
        data: accounts
    })
}
