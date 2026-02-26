<template>
  <div class="sync-manage-container">
    <van-nav-bar
      title="WebDAV 云同步"
      left-arrow
      @click-left="onClickLeft"
      class="transparent-nav"
      :border="false"
    />

    <div class="intro">
      <van-icon name="cloud-o" size="48" color="var(--van-primary-color)" />
      <h3>跨设备数据同步</h3>
      <p>配置您的 WebDAV 账户（支持坚果云、Nextcloud等），将您的所有账本数据安全地备份至个人云端。</p>
    </div>

    <van-form @submit="onSave">
      <van-cell-group inset class="custom-inset-group">
        <van-field
          v-model="syncStore.config.url"
          name="url"
          label="服务器地址"
          placeholder="https://dav.jianguoyun.com/dav/"
          :rules="[{ required: true, message: '请填写 WebDAV 地址' }]"
        />
        <van-field
          v-model="syncStore.config.username"
          name="username"
          label="云盘账号"
          placeholder="您的邮箱或用户名"
          :rules="[{ required: true, message: '请填写账号' }]"
        />
        <van-field
          v-model="syncStore.config.password"
          type="password"
          name="password"
          label="应用密码"
          placeholder="请填写应用授权密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          保存配置
        </van-button>
      </div>
    </van-form>

    <div class="action-panel" v-if="syncStore.config.username">
      <div class="status-text" v-if="syncStore.lastSyncTime">
        上次同步时间：{{ syncStore.lastSyncTime }}
      </div>
      <div class="status-text" v-else>
        暂无云端备份记录
      </div>

      <div class="btn-group">
        <van-button icon="passed" type="default" size="small" :loading="isTesting" @click="handleTest">
          测试连接
        </van-button>
        <van-button icon="back-top" type="success" size="small" :loading="isBackingUp" @click="handleBackup">
          一键备份
        </van-button>
        <van-button icon="down" type="danger" size="small" :loading="isRestoring" @click="handleRestore">
          从云端恢复
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useSyncStore } from '@/stores/sync'

const router = useRouter()
const syncStore = useSyncStore()

const isTesting = ref(false)
const isBackingUp = ref(false)
const isRestoring = ref(false)

const onClickLeft = () => {
  router.back()
}

const onSave = () => {
  syncStore.saveConfig()
  showToast('配置已保存')
}

const handleTest = async () => {
  isTesting.value = true
  try {
    await syncStore.testConnection()
    showToast({ type: 'success', message: '连接成功！' })
  } catch (error: any) {
    showToast({ type: 'fail', message: error.message || '连接失败' })
  } finally {
    isTesting.value = false
  }
}

const handleBackup = async () => {
  showConfirmDialog({
    title: '确认备份',
    message: '此操作将用当前设备的全部数据覆盖云端的备份文件，确认执行？'
  }).then(async () => {
    isBackingUp.value = true
    try {
      await syncStore.backupToCloud()
    } catch (e) {
      // 错误已在 store 中 toast
    } finally {
      isBackingUp.value = false
    }
  }).catch(() => {})
}

const handleRestore = async () => {
  showConfirmDialog({
    title: '危险操作',
    message: '此操作将用云端备份覆盖本地的所有资产、账单和设置，本地当前未备份的新增数据将永久丢失。强烈建议先「一键备份」一次。确认覆盖本地？'
  }).then(async () => {
    isRestoring.value = true
    try {
      await syncStore.restoreFromCloud()
    } catch (e) {
      // 错误已在 store 中 toast
    } finally {
      isRestoring.value = false
    }
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.sync-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);

  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title, .van-icon {
      color: var(--text-color-primary);
    }
  }

  .intro {
    margin: 16px;
    border-radius: 16px;
    padding: 32px 16px;
    text-align: center;
    background-color: var(--bg-color-primary);
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
    
    [data-theme='dark'] & {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    h3 {
      margin: 16px 0 8px;
      font-size: 18px;
      color: var(--text-color-primary);
    }
    
    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-color-secondary);
      line-height: 1.5;
      padding: 0 16px;
    }
  }

  :deep(.custom-inset-group) {
    margin: 0 16px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    
    [data-theme='dark'] & {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }

  .action-panel {
    margin: 24px 16px;
    border-radius: 16px;
    padding: 24px 16px;
    background-color: var(--bg-color-primary);
    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
    
    [data-theme='dark'] & {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
    
    .status-text {
      text-align: center;
      font-size: 13px;
      color: var(--text-color-secondary);
      margin-bottom: 20px;
    }

    .btn-group {
      display: flex;
      justify-content: space-around;
      gap: 12px;
      
      .van-button {
        flex: 1;
      }
    }
  }
}
</style>
