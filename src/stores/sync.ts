import { defineStore } from 'pinia'

export const useSyncStore = defineStore('sync', {
    state: () => ({
        webdavUrl: '',
        username: '',
        password: '',
        filename: 'irecord_backup.json',
        lastSyncTime: 0
    }),
    actions: {
        updateConfig(url: string, user: string, pass: string, file: string) {
            this.webdavUrl = url
            this.username = user
            this.password = pass
            this.filename = file
        },
        updateSyncTime() {
            this.lastSyncTime = Date.now()
        }
    },
    persist: true
})
