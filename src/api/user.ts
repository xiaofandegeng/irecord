import request from './request'
import { UserInfo } from '@/stores/user'

interface LoginResponse {
    token: string
    user: UserInfo
}

export const userApi = {
    /**
     * 账号密码登录
     */
    login(data: any) {
        return request.post<any, LoginResponse>('/auth/login', data)
    },

    /**
     * 注册新账号
     */
    register(data: any) {
        return request.post<any, LoginResponse>('/auth/register', data)
    },

    /**
     * 获取当前用户信息
     */
    getProfile() {
        return request.get<any, UserInfo>('/auth/profile')
    }
}
