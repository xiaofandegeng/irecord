import request from './request'
import { Ledger } from '@/stores/ledger'

export const ledgerApi = {
    /**
     * 获取用户的账本列表
     */
    getList() {
        return request.get<any, Ledger[]>('/ledgers')
    },

    /**
     * 创建新账本
     */
    add(data: Omit<Ledger, 'id' | 'createdAt'>) {
        return request.post<any, Ledger>('/ledgers', data)
    },

    /**
     * 共享账本邀请成员 (V8.0 核心家庭功能)
     */
    inviteMember(ledgerId: string, memberId: string) {
        return request.post<any, boolean>(`/ledgers/${ledgerId}/invite`, { memberId })
    }
}
