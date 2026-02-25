import { defineStore } from 'pinia'
import { ref } from 'vue'
import { showToast } from 'vant'

export const useSyncStore = defineStore('sync', () => {
    const defaultUrl = 'https://dav.jianguoyun.com/dav/'
    const config = ref({
        url: localStorage.getItem('sync_url') || defaultUrl,
        username: localStorage.getItem('sync_username') || '',
        password: localStorage.getItem('sync_password') || ''
    })

    const lastSyncTime = ref(localStorage.getItem('sync_last_time') || '')

    // 监听变化持久化
    const saveConfig = () => {
        localStorage.setItem('sync_url', config.value.url)
        localStorage.setItem('sync_username', config.value.username)
        localStorage.setItem('sync_password', config.value.password)
    }

    const getAuthHeader = () => {
        return 'Basic ' + window.btoa(`${config.value.username}:${config.value.password}`)
    }

    // 提供测试连通性
    const testConnection = async () => {
        if (!config.value.username || !config.value.password || !config.value.url) {
            throw new Error('完善配置才能测试')
        }
        try {
            const res = await fetch(config.value.url, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Depth': '0'
                }
            })
            if (res.ok || res.status === 207) {
                return true
            } else {
                throw new Error(`连接失败状态码: ${res.status}`)
            }
        } catch (err: any) {
            throw new Error('网络异常或认证失败: ' + err.message)
        }
    }

    // 组合所有业务数据
    const collectLocalData = () => {
        return {
            record: localStorage.getItem('record') || '{}',
            ledger: localStorage.getItem('ledger') || '{}',
            account: localStorage.getItem('account') || '{}',
            recurring: localStorage.getItem('recurring') || '{}',
            debt: localStorage.getItem('debt') || '{}',
            goal: localStorage.getItem('goal') || '{}',
            template: localStorage.getItem('template') || '{}',
            irecord_theme: localStorage.getItem('irecord_theme') || 'auto'
        }
    }

    // 覆盖所有业务数据并重载
    const overwriteLocalData = (data: any) => {
        if (data.record) localStorage.setItem('record', data.record)
        if (data.ledger) localStorage.setItem('ledger', data.ledger)
        if (data.account) localStorage.setItem('account', data.account)
        if (data.recurring) localStorage.setItem('recurring', data.recurring)
        if (data.debt) localStorage.setItem('debt', data.debt)
        if (data.goal) localStorage.setItem('goal', data.goal)
        if (data.template) localStorage.setItem('template', data.template)
        if (data.irecord_theme) localStorage.setItem('irecord_theme', data.irecord_theme)

        showToast('恢复完成，即将刷新应用生效')
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }

    // 执行备份
    const backupToCloud = async () => {
        saveConfig()
        const payload = JSON.stringify(collectLocalData())
        const fileUrl = config.value.url.endsWith('/') ? `${config.value.url}irecord_backup.json` : `${config.value.url}/irecord_backup.json`

        try {
            const res = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: payload
            })
            if (res.ok || res.status === 201 || res.status === 204) {
                const now = new Date().toLocaleString()
                lastSyncTime.value = now
                localStorage.setItem('sync_last_time', now)
                showToast('备份至云端成功')
                return true
            } else {
                throw new Error(`上传失败: ${res.status}`)
            }
        } catch (error: any) {
            showToast('备份失败: ' + error.message)
            throw error
        }
    }

    // 执行恢复
    const restoreFromCloud = async () => {
        saveConfig()
        const fileUrl = config.value.url.endsWith('/') ? `${config.value.url}irecord_backup.json` : `${config.value.url}/irecord_backup.json`

        try {
            // 加上随机时间戳防缓存
            const res = await fetch(`${fileUrl}?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Authorization': getAuthHeader()
                }
            })
            if (res.ok) {
                const data = await res.json()
                overwriteLocalData(data)
                const now = new Date().toLocaleString()
                lastSyncTime.value = now
                localStorage.setItem('sync_last_time', now)
                return true
            } else if (res.status === 404) {
                throw new Error('未在云端找到备份文件')
            } else {
                throw new Error(`下载失败: ${res.status}`)
            }
        } catch (error: any) {
            showToast('恢复失败: ' + error.message)
            throw error
        }
    }

    return {
        config,
        lastSyncTime,
        saveConfig,
        testConnection,
        backupToCloud,
        restoreFromCloud
    }
})
