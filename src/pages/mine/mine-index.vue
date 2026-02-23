<template>
  <div class="mine-container">
    <div class="user-card">
      <div class="avatar">
        <van-icon name="smile" size="40" color="#fff" />
      </div>
      <div class="info">
        <div class="name">记账达人</div>
        <div class="desc">已经坚持记账 {{ totalDays }} 天</div>
      </div>
    </div>
    
    <div class="asset-card">
      <div class="asset-row">
        <div class="asset-item">
          <span class="label">净资产</span>
          <span class="value">{{ accountStore.privacyMode ? '****' : accountStore.totalNetAsset.toFixed(2) }}</span>
        </div>
        <div class="divider"></div>
        <div class="asset-item">
          <span class="label">总负债</span>
          <span class="value">{{ accountStore.privacyMode ? '****' : accountStore.totalDebt.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <div class="settings-list">
      <van-cell-group inset>
        <van-cell title="月度总预算" is-link :value="store.budget > 0 ? `¥ ${store.budget}` : '去设置'" @click="showBudget = true" />
        <van-cell title="资产账户管理" is-link to="/account-manage" />
        <van-cell title="数据总计" :value="`${store.records.length} 笔`" />
        <van-cell title="自定义分类配置" is-link to="/category-manage" />
      </van-cell-group>
      
      <div class="space"></div>
      
      <van-cell-group inset>
        <van-cell title="隐私模式 (隐藏金额)" center>
          <template #right-icon>
            <van-switch v-model="accountStore.privacyMode" size="24" />
          </template>
        </van-cell>
        <van-cell title="导出数据 (CSV)" is-link @click="exportData" />
        <van-cell title="深色模式" center>
          <template #right-icon>
            <van-switch v-model="isDarkMode" size="24" @change="toggleTheme" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <div class="space"></div>
      
      <van-cell-group inset>
        <van-cell title="清空所有数据" is-link class="danger-text" @click="clearAll" />
      </van-cell-group>
    </div>

    <!-- 预算设置弹窗 -->
    <van-dialog v-model:show="showBudget" title="设置月度预算" show-cancel-button @confirm="onConfirmBudget">
      <van-field v-model="tempBudget" type="number" label="预算金额" placeholder="请输入每月预算" />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'

const store = useRecordStore()
const accountStore = useAccountStore()

const showBudget = ref(false)
const tempBudget = ref(store.budget ? String(store.budget) : '')

const onConfirmBudget = () => {
  const val = parseFloat(tempBudget.value) || 0
  store.setBudget(val)
  showToast(val > 0 ? '预算设置成功' : '已取消预算')
}

// 坚持天数简单计算(以第一笔记录为准)
const totalDays = computed(() => {
  if (store.records.length === 0) return 0
  const firstRecord = store.records[store.records.length - 1]
  const diffTime = Math.abs(Date.now() - firstRecord.createTime)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const isDarkMode = ref(false)

const exportData = () => {
  if (store.records.length === 0) {
    showToast('暂无数据可导出')
    return
  }
  
  // 简易 CSV 导出逻辑
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += "时间,类型,金额,分类,备注\n"
  
  store.records.forEach(r => {
    const date = new Date(r.recordTime).toLocaleString()
    const type = r.type === 1 ? '支出' : '收入'
    const cat = store.categories.find(c => c.id === r.categoryId)?.name || '未知'
    const remark = r.remark || ''
    const row = `"${date}","${type}",${r.amount},"${cat}","${remark}"`
    csvContent += row + "\n"
  })
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "irecord_data.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const toggleTheme = (val: boolean) => {
  if (val) {
    document.documentElement.style.setProperty('--bg-color-primary', '#1c1c1e')
    document.documentElement.style.setProperty('--bg-color-secondary', '#000000')
    document.documentElement.style.setProperty('--text-color-primary', '#ffffff')
    showToast('已开启深色模式')
  } else {
    document.documentElement.style.setProperty('--bg-color-primary', '#ffffff')
    document.documentElement.style.setProperty('--bg-color-secondary', '#f7f8fa')
    document.documentElement.style.setProperty('--text-color-primary', '#323233')
  }
}

const clearAll = () => {
  showConfirmDialog({
    title: '危险操作',
    message: '确认清空所有记账数据吗？清空后无法恢复。',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    store.records = []
    showToast('数据已清空')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.mine-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color-secondary);
  
  .user-card {
    display: flex;
    align-items: center;
    padding: 30px 20px 40px;
    background: linear-gradient(135deg, var(--van-primary-color), #23d47a);
    color: #fff;
    margin-bottom: -20px;
    
    .avatar {
      width: 60px;
      height: 60px;
      background-color: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 16px;
    }
    
    .info {
      .name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .desc {
        font-size: 13px;
        opacity: 0.8;
      }
    }
  }
  
  .asset-card {
    background-color: #fff;
    margin: 0 16px 16px;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    z-index: 10;
    
    .asset-row {
      display: flex;
      align-items: center;
      justify-content: space-around;
      
      .asset-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .label {
          font-size: 13px;
          color: var(--text-color-secondary);
          margin-bottom: 8px;
        }
        
        .value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-color-primary);
          
          &.text-danger {
            color: var(--van-danger-color);
          }
        }
      }
      
      .divider {
        width: 1px;
        height: 30px;
        background-color: #ebedf0;
      }
    }
  }
  
  .settings-list {
    flex: 1;
    z-index: 10;
    
    .space {
      height: 12px;
    }
    
    .danger-text {
      color: var(--van-danger-color);
    }
  }
}
</style>
