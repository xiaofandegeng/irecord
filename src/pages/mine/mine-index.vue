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
    
    <!-- 存钱目标横向滑动区 -->
    <div class="goals-section" v-if="goalStore.goals.length > 0">
      <div class="section-header">
        <span class="title">存钱计划</span>
        <span class="action" @click="router.push('/goal-manage')">管理 <van-icon name="arrow" /></span>
      </div>
      <div class="goals-scroll">
        <div class="goal-item" v-for="goal in goalStore.goals" :key="goal.id" @click="router.push('/goal-manage')">
          <div class="g-icon"><van-icon :name="goal.icon" /></div>
          <div class="g-info">
            <div class="g-name">{{ goal.name }}</div>
            <div class="g-progress">
              <span class="g-current">{{ accountStore.privacyMode ? '****' : goal.currentAmount.toFixed(0) }}</span> 
              / {{ accountStore.privacyMode ? '****' : goal.targetAmount.toFixed(0) }}
            </div>
            <van-progress 
              :percentage="Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)" 
              stroke-width="4" 
              color="var(--van-primary-color)" 
              :show-pivot="false"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分类预算超支预警 -->
    <div class="budget-alert-card" v-if="overBudgetCategories.length > 0">
      <div class="alert-title"><van-icon name="warning-o" /> 子预算预警</div>
      <div class="alert-item" v-for="cat in overBudgetCategories" :key="cat.id">
        <div class="cat-info">
          <van-icon :name="cat.icon" class="cat-icon" /> 
          <span class="cat-name">{{ cat.name }}</span>
        </div>
        <div class="budget-info">
          已用: <span class="danger">{{ cat.spent.toFixed(2) }}</span> / {{ cat.budgetLimit }}
        </div>
        <!-- 进度条 -->
        <div class="progress">
          <div class="fill danger-bg" :style="{ width: `${Math.min(100, (cat.spent / cat.budgetLimit) * 100)}%` }"></div>
        </div>
      </div>
    </div>
    
    <div class="settings-list">
      <van-cell-group inset>
        <van-cell title="多账本管理 (隔离独立数据)" is-link to="/ledger-manage" />
        <van-cell title="心愿单与存钱计划" is-link to="/goal-manage" />
        <van-cell title="月度总预算" is-link :value="store.budget > 0 ? `¥ ${store.budget}` : '去设置'" @click="showBudget = true" />
        <van-cell title="周期自动记账 (定投/房租)" is-link to="/recurring-manage" />
        <van-cell title="资产账户管理" is-link to="/account-manage" />
        <van-cell title="数据总计" :value="`${store.currentLedgerRecords.length} 笔`" />
        <van-cell title="自定义分类配置" is-link to="/category-manage" />
      </van-cell-group>
      
      <div class="space"></div>
      
      <van-cell-group inset>
        <van-cell title="隐私模式 (隐藏金额)" center>
          <template #right-icon>
            <van-switch v-model="accountStore.privacyMode" size="24" />
          </template>
        </van-cell>
        <van-cell title="导入账单数据 (CSV)" is-link to="/import" />
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
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import { useGoalStore } from '@/stores/goal'

const router = useRouter()
const store = useRecordStore()
const accountStore = useAccountStore()
const goalStore = useGoalStore()

const showBudget = ref(false)
const tempBudget = ref(store.budget ? String(store.budget) : '')

const onConfirmBudget = () => {
  const val = parseFloat(tempBudget.value) || 0
  store.setBudget(val)
  showToast(val > 0 ? '预算设置成功' : '已取消预算')
}

// 计算本月各个分类是否超支
const overBudgetCategories = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // 仅计算本月的支出
  const monthRecords = store.currentLedgerRecords.filter(r => {
    if (r.type !== 1) return false
    const d = new Date(r.recordTime)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // 按分类汇总
  const spentMap: Record<string, number> = {}
  monthRecords.forEach(r => {
    if (!spentMap[r.categoryId]) spentMap[r.categoryId] = 0
    spentMap[r.categoryId] += r.amount
  })

  const overList: any[] = []
  store.categories.forEach(cat => {
    if (cat.budgetLimit && cat.budgetLimit > 0) {
      const spent = spentMap[cat.id] || 0
      if (spent >= cat.budgetLimit * 0.8) { // 达到 80% 即预警
        overList.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          budgetLimit: cat.budgetLimit,
          spent: spent
        })
      }
    }
  })
  
  return overList.sort((a, b) => (b.spent / b.budgetLimit) - (a.spent / a.budgetLimit))
})

// 坚持天数简单计算(以第一笔记录为准)
const totalDays = computed(() => {
  if (store.currentLedgerRecords.length === 0) return 0
  const firstRecord = store.currentLedgerRecords[store.currentLedgerRecords.length - 1]
  const diffTime = Math.abs(Date.now() - firstRecord.createTime)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const isDarkMode = ref(false)

const exportData = () => {
  if (store.currentLedgerRecords.length === 0) {
    showToast('暂无数据可导出')
    return
  }
  
  // 简易 CSV 导出逻辑
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += "时间,类型,金额,分类,备注\n"
  
  store.currentLedgerRecords.forEach(r => {
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
    message: '确认清空当前账本所有记账数据吗？清空后无法恢复。',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    store.records = store.records.filter(r => r.ledgerId !== store.currentLedgerRecords[0]?.ledgerId && r.ledgerId !== 'ledger_default')
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

  .goals-section {
    margin: 0 16px 16px;
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      .title { font-weight: bold; font-size: 15px; }
      .action { font-size: 13px; color: var(--text-color-secondary); display: flex; align-items: center; }
    }

    .goals-scroll {
      display: flex;
      overflow-x: auto;
      gap: 12px;
      padding-bottom: 4px;
      &::-webkit-scrollbar { display: none; }
      
      .goal-item {
        flex: 0 0 140px;
        background-color: var(--bg-color-secondary);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        
        .g-icon { margin-bottom: 8px; font-size: 20px; color: var(--van-primary-color); }
        .g-info {
          .g-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .g-progress { font-size: 11px; color: var(--text-color-secondary); margin-bottom: 6px; }
          .g-current { color: var(--text-color-primary); font-weight: bold; }
        }
      }
    }
  }

  .budget-alert-card {
    background-color: #fff;
    margin: 0 16px 16px;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);

    .alert-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--van-danger-color);
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .van-icon {
        margin-right: 6px;
      }
    }

    .alert-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .cat-info {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .cat-icon {
          color: var(--van-primary-color);
          margin-right: 6px;
        }
        .cat-name {
          font-size: 14px;
          color: var(--text-color-primary);
        }
      }

      .budget-info {
        font-size: 12px;
        color: var(--text-color-secondary);
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;

        .danger {
          color: var(--van-danger-color);
          font-weight: 500;
        }
      }

      .progress {
        height: 6px;
        background-color: var(--bg-color-secondary);
        border-radius: 3px;
        overflow: hidden;

        .fill.danger-bg {
          height: 100%;
          background-color: var(--van-danger-color);
          transition: width 0.3s;
        }
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
