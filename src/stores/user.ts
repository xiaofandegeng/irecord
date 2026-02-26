import { defineStore } from 'pinia'

export interface UserInfo {
    id: string
    username: string
    avatar?: string
}

export const DEFAULT_AVATARS = [
    'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka&backgroundColor=c0aede',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Jack&backgroundColor=d1d4f9',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Jude&backgroundColor=ffd5dc',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Avery&backgroundColor=b6e3f4',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Liliana&backgroundColor=c0aede',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Leo&backgroundColor=d1d4f9',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Bella&backgroundColor=ffd5dc',
    'https://api.dicebear.com/9.x/notionists/svg?seed=George&backgroundColor=b6e3f4',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Jasper&backgroundColor=c0aede',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Mia&backgroundColor=d1d4f9'
]

export const useUserStore = defineStore('user', {
    state: () => ({
        token: '' as string,
        userInfo: {
            id: 'u_local_1001',
            username: '记账达人',
            avatar: DEFAULT_AVATARS[1]
        } as UserInfo | null
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
        updateProfile(username: string, avatar: string) {
            if (this.userInfo) {
                this.userInfo.username = username
                this.userInfo.avatar = avatar
            } else {
                this.userInfo = {
                    id: 'u_local_1001',
                    username,
                    avatar
                }
            }
        },
        logout() {
            this.token = ''
            this.userInfo = null
        }
    },
    persist: true
})
