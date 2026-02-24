import request from './request'
import { RecordItem } from '@/stores/record'

// 提炼 Record 相关的 RESTful API
export const recordApi = {
    /**
     * 获取某账本下的全量流水日志
     */
    getList(ledgerId: string) {
        return request.get<any, RecordItem[]>('/records', { params: { ledgerId } })
    },

    /**
     * 新增一笔流水
     */
    add(data: Omit<RecordItem, 'id' | 'createTime'>) {
        return request.post<any, RecordItem>('/records', data)
    },

    /**
     * 更新一笔流水
     */
    update(id: string, data: Partial<RecordItem>) {
        return request.put<any, RecordItem>(`/records/${id}`, data)
    },

    /**
     * 删除一笔流水
     */
    remove(id: string) {
        return request.delete<any, boolean>(`/records/${id}`)
    }
}
