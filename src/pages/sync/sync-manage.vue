<template>
  <div class="sync-manage-container">
    <van-nav-bar
      title="数据同步管理"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <van-notice-bar
      left-icon="info-o"
      text="配置 WebDAV 账户可实现跨设备备份与恢复。支持坚果云、Nextcloud 等。"
    />

    <van-form @submit="onSaveConfig">
      <van-cell-group inset title="WebDAV 账户配置">
        <van-field
          v-model="syncStore.webdavUrl"
          name="url"
          label="服务器地址"
          placeholder="如 https://dav.jianguoyun.com/dav/"
          :rules="[{ required: true, message: '请填写服务器地址' }]"
        />
        <van-field
          v-model="syncStore.username"
          name="username"
          label="账号/邮箱"
          placeholder="WebDAV 账号"
          :rules="[{ required: true, message: '请填写账号' }]"
        />
        <van-field
          v-model="syncStore.password"
          type="password"
          name="password"
          label="应用密码"
          placeholder="WebDAV 密码/应用密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <van-field
          v-model="syncStore.filename"
          name="filename"
          label="云端文件名"
          placeholder="irecord_backup.json"
        />
      </van-cell-group>
      
      <div style="margin: 16px; display: flex; gap: 10px;">
        <van-button block type="primary" native-type="submit">
          保存配置并测试连接
        </van-button>
      </div>
    </van-form>

    <van-cell-group inset title="同步操作" class="action-group">
      <van-cell title="上次同步时间" :value="formatTime(syncStore.lastSyncTime)" />
      
      <div class="sync-actions">
        <van-button plain type="success" icon="upgrade" @click="handleUpload" :loading="uploading">
          备份到云端
        </van-button>
        <van-button plain type="warning" icon="download" @click="handleDownload" :loading="downloading">
          从云端恢复
        </van-button>
      </div>
    </van-cell-group>
    
    <div class="tips">
      <p>提示：</p>
      <p>1. 备份到云端会覆盖云端对应的文件。</p>
      <p>2. 从云端恢复将覆盖本地全部数据，操作不可逆，请谨慎！</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { useSyncStore } from '@/stores/sync'
import { initWebdavClient, checkConnection, uploadData, downloadData } from '@/utils/webdav'

const router = useRouter()
const syncStore = useSyncStore()

const uploading = ref(false)
const downloading = ref(false)

const onClickLeft = () => {
  router.back()
}

const formatTime = (ts: number) => {
  if (!ts) return '从未同步'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const initClient = () => {
  if (!syncStore.webdavUrl || !syncStore.username || !syncStore.password) return false
  initWebdavClient({
    url: syncStore.webdavUrl,
    username: syncStore.username,
    password: syncStore.password,
    syncFilename: syncStore.filename
  })
  return true
}

const onSaveConfig = async () => {
  if (!initClient()) return
  showToast({ type: 'loading', message: '正在测试连接...', duration: 0 })
  const ok = await checkConnection()
  if (ok) {
    showToast({ type: 'success', message: '连接成功！' })
  } else {
    showToast({ type: 'fail', message: '连接失败，请检查配置' })
  }
}

// 统一收集所有状态以进行备份
const gatherState = () => {
  const accountStr = localStorage.getItem('account') || '{}'
  const categoryStr = localStorage.getItem('category') || '{}'
  const goalStr = localStorage.getItem('goal') || '{}'
  const ledgerStr = localStorage.getItem('ledger') || '{}'
  const recordStr = localStorage.getItem('record') || '{}'
  const recurringStr = localStorage.getItem('recurring') || '{}'
  const settingsStr = localStorage.getItem('settings') || '{}'
  
  return JSON.stringify({
    version: '1.0',
    exportTime: Date.now(),
    data: {
      account: JSON.parse(accountStr),
      category: JSON.parse(categoryStr),
      goal: JSON.parse(goalStr),
      ledger: JSON.parse(ledgerStr),
      record: JSON.parse(recordStr),
      recurring: JSON.parse(recurringStr),
      settings: JSON.parse(settingsStr)
    }
  })
}

// 恢复状态到 localStorage 并重载页面
const restoreState = (jsonStr: string) => {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.data) throw new Error('无效的数据格式')
    
    if (parsed.data.account) localStorage.setItem('account', JSON.stringify(parsed.data.account))
    if (parsed.data.category) localStorage.setItem('category', JSON.stringify(parsed.data.category))
    if (parsed.data.goal) localStorage.setItem('goal', JSON.stringify(parsed.data.goal))
    if (parsed.data.ledger) localStorage.setItem('ledger', JSON.stringify(parsed.data.ledger))
    if (parsed.data.record) localStorage.setItem('record', JSON.stringify(parsed.data.record))
    if (parsed.data.recurring) localStorage.setItem('recurring', JSON.stringify(parsed.data.recurring))
    if (parsed.data.settings) localStorage.setItem('settings', JSON.stringify(parsed.data.settings))
    
    showDialog({
      title: '恢复成功',
      message: '数据已成功从云端恢复，应用即将刷新以应用最新数据。'
    }).then(() => {
      window.location.reload()
    })
  } catch (e) {
    console.error('Failed to parse restore data', e)
    showToast('数据格式错误，恢复失败')
  }
}

const handleUpload = async () => {
  if (!initClient()) {
    showToast('请先配置并保存 WebDAV 账户')
    return
  }
  
  uploading.value = true
  try {
    const dataStr = gatherState()
    const ok = await uploadData(syncStore.filename, dataStr)
    if (ok) {
      syncStore.updateSyncTime()
      showToast({ type: 'success', message: '云端备份成功！' })
    } else {
      showToast({ type: 'fail', message: '备份失败，请检查网络或配置' })
    }
  } finally {
    uploading.value = false
  }
}

const handleDownload = async () => {
  if (!initClient()) {
    showToast('请先配置并保存 WebDAV 账户')
    return
  }
  
  showConfirmDialog({
    title: '危险操作',
    message: '从云端恢复将覆盖本地所有的现有数据，该操作不可逆！\n您确定要继续吗？',
    confirmButtonColor: 'var(--van-danger-color)'
  }).then(async () => {
    downloading.value = true
    try {
      const dataStr = await downloadData(syncStore.filename)
      if (dataStr) {
        syncStore.updateSyncTime()
        restoreState(dataStr)
      } else {
        showToast({ type: 'fail', message: '云端找不到该文件，恢复失败' })
      }
    } finally {
      downloading.value = false
    }
  }).catch(() => {})
}

</script>

<style lang="scss" scoped>
.sync-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-primary);
  
  .action-group {
    margin-top: 16px;
    padding-bottom: 16px;
    
    .sync-actions {
      display: flex;
      gap: 12px;
      padding: 16px;
      
      .van-button {
        flex: 1;
      }
    }
  }
  
  .tips {
    padding: 16px;
    font-size: 13px;
    color: var(--text-color-secondary);
    line-height: 1.8;
  }
}
</style>
