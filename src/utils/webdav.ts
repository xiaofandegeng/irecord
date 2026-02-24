import { createClient, WebDAVClient } from 'webdav'

export interface SyncConfig {
    url: string
    username?: string
    password?: string
    syncFilename: string
}

const DEFAULT_FILENAME = 'irecord_backup.json'

let client: WebDAVClient | null = null

export function initWebdavClient(config: SyncConfig) {
    client = createClient(config.url, {
        username: config.username,
        password: config.password,
    })
    return client
}

export function getClient(): WebDAVClient {
    if (!client) {
        throw new Error('WebDAV client is not initialized')
    }
    return client
}

// 检查连通性 (获取目录内容测试)
export async function checkConnection(): Promise<boolean> {
    try {
        const c = getClient()
        await c.getDirectoryContents('/')
        return true
    } catch (e) {
        console.error('WebDAV connection failed:', e)
        return false
    }
}

// 上传数据 (备份)
export async function uploadData(filename: string, data: string): Promise<boolean> {
    try {
        const c = getClient()
        await c.putFileContents(`/${filename || DEFAULT_FILENAME}`, data, { overwrite: true })
        return true
    } catch (e) {
        console.error('WebDAV upload failed:', e)
        return false
    }
}

// 下载数据 (恢复)
export async function downloadData(filename: string): Promise<string | null> {
    try {
        const c = getClient()
        const fileExists = await c.exists(`/${filename || DEFAULT_FILENAME}`)
        if (!fileExists) {
            console.warn('Backup file does not exist on server')
            return null
        }
        const data = await c.getFileContents(`/${filename || DEFAULT_FILENAME}`, { format: 'text' })
        return data as string
    } catch (e) {
        console.error('WebDAV download failed:', e)
        return null
    }
}
