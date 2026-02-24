import { defineStore } from 'pinia'

export interface UserInfo {
    id: string
    username: string
    avatar?: string
}

export const useUserStore = defineStore('user', {
    state: () => ({
        token: '' as string,
        userInfo: null as UserInfo | null
    }),
    getters: {
        isLoggedIn: (state) => !!state.token
    },
    actions: {
        setToken(token: string) {
            this.token = token
        },
        setUserInfo(info: UserInfo) {
            this.userInfo = info
        },
        logout() {
            this.token = ''
            this.userInfo = null
        }
    },
    persist: true
})
