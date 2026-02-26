<template>
  <div class="mine-container">
    <!-- 顶部超级资产大盘卡 -->
    <div class="hero-asset-card">
      <div class="user-info" @click="router.push('/profile-edit')">
        <div class="avatar-wrap">
          <van-image round width="56" height="56" :src="userStore.userInfo?.avatar" />
        </div>
        <div class="text-info">
          <div class="main-title">
            <span class="name">{{ userStore.userInfo?.username }}</span>
            <van-icon name="arrow" color="var(--text-color-secondary)" size="14" />
          </div>
          <div class="gamify-badges">
            <div class="badge"><van-icon name="points" /> 已记账 {{ totalDays }} 天</div>
            <div class="badge"><van-icon name="orders-o" /> 共 {{ store.currentLedgerRecords.length }} 笔记录</div>
          </div>
        </div>
      </div>
      
      <div class="net-asset-section">
        <div class="label">流动净资产</div>
        <div class="value din-font">{{ accountStore.privacyMode ? '****' : (accountStore.totalNetAsset - investmentAsset).toFixed(2) }}</div>
      </div>
      
      <div class="sub-assets-row">
        <div class="asset-col" @click="router.push('/account-manage')">
          <span class="col-label">投资理财 <van-icon name="arrow" /></span>
          <span class="col-val din-font">{{ accountStore.privacyMode ? '****' : investmentAsset.toFixed(2) }}</span>
        </div>
        <div class="divider"></div>
        <div class="asset-col" @click="router.push('/debt-manage?type=1')">
          <span class="col-label">待收(借出) <van-icon name="arrow" /></span>
          <span class="col-val din-font green">{{ accountStore.privacyMode ? '****' : debtStore.getLedgerTotals().lent.toFixed(2) }}</span>
        </div>
        <div class="divider"></div>
        <div class="asset-col" @click="router.push('/debt-manage?type=2')">
          <span class="col-label">待还(借入) <van-icon name="arrow" /></span>
          <span class="col-val din-font red">{{ accountStore.privacyMode ? '****' : debtStore.getLedgerTotals().borrowed.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 存钱目标横向滑动区 -->
    <div class="widget-section" v-if="goalStore.goals.length > 0">
      <div class="section-header">
        <span class="title">存钱计划 <span class="count">({{ goalStore.goals.length }})</span></span>
        <span class="action" @click="router.push('/goal-manage')">查看全部 <van-icon name="arrow" /></span>
      </div>
      <div class="snap-scroll-row">
        <div class="snap-card" v-for="goal in goalStore.goals" :key="goal.id" @click="router.push('/goal-manage')">
          <div class="card-top">
            <div class="icon-box"><van-icon :name="goal.icon" /></div>
            <div class="name">{{ goal.name }}</div>
          </div>
          <div class="card-mid din-font">
            <span class="current">{{ accountStore.privacyMode ? '****' : goal.currentAmount.toFixed(0) }}</span>
            <span class="slash">/</span>
            <span class="target">{{ accountStore.privacyMode ? '****' : goal.targetAmount.toFixed(0) }}</span>
          </div>
          <div class="card-bot">
            <div class="progress-bar">
              <div class="fill pattern-bg" :style="{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分类预算超支预警横向滑动区 -->
    <div class="widget-section" v-if="overBudgetCategories.length > 0">
      <div class="section-header">
        <span class="title" style="color: var(--van-danger-color);">超支预警 <span class="count">({{ overBudgetCategories.length }})</span></span>
      </div>
      <div class="snap-scroll-row">
        <div class="snap-card alert-card" v-for="cat in overBudgetCategories" :key="cat.id">
          <div class="card-top">
            <div class="icon-box danger-box"><van-icon :name="cat.icon" /></div>
            <div class="name">{{ cat.name }}</div>
          </div>
          <div class="card-mid din-font">
            <span class="current danger-text">{{ cat.spent.toFixed(0) }}</span>
            <span class="slash">/</span>
            <span class="target">{{ cat.budgetLimit }}</span>
          </div>
          <div class="card-bot">
            <div class="progress-bar">
              <div class="fill danger-bg" :style="{ width: `${Math.min(100, (cat.spent / cat.budgetLimit) * 100)}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-list">
      <van-cell-group inset class="custom-inset-group">
        <van-cell title="预算中心 (分类结转定投)" is-link to="/budget-index" icon="chart-trending-o" />
        <van-cell title="多账本管理 (隔离独立数据)" is-link to="/ledger-manage" icon="apps-o" />
        <van-cell title="心愿单与存钱计划" is-link to="/goal-manage" icon="flag-o" />
        <van-cell title="报销与垫付单管理" is-link to="/reimburse-manage" icon="cash-back-record" />
        <van-cell title="周期自动记账 (定投/房租)" is-link to="/recurring-manage" icon="clock-o" />
        <van-cell title="自定义分类配置" is-link to="/category-manage" icon="setting-o" />
      </van-cell-group>
      
      <van-cell-group inset class="custom-inset-group">
        <van-cell title="数据总计" :value="`${store.currentLedgerRecords.length} 笔`" icon="chart-trending-o" />
        <van-cell title="月度总预算" is-link :value="store.budget > 0 ? `¥ ${store.budget}` : '去设置'" @click="showBudget = true" icon="balance-list-o" />
      </van-cell-group>
      
      <van-cell-group inset class="custom-inset-group">
        <van-cell title="WebDAV 云端数据同步" is-link to="/sync-manage" icon="cloud-o" />
        <van-cell title="年度数据冷温结转归档" is-link @click="showArchive = true" icon="box-o" />
        <van-cell title="导入账单数据 (CSV)" is-link to="/import" icon="down" />
        <van-cell title="导出数据 (CSV)" is-link @click="exportData" icon="share-o" />
      </van-cell-group>
      
      <van-cell-group inset class="custom-inset-group">
        <van-cell title="隐私模式 (隐藏金额)" center icon="closed-eye">
          <template #right-icon>
            <van-switch v-model="accountStore.privacyMode" size="20" />
          </template>
        </van-cell>
        <van-cell title="深色模式 (重体验段)" center icon="moon-o">
          <template #right-icon>
            <van-switch v-model="isDarkMode" size="20" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-cell-group inset class="custom-inset-group">
        <van-cell title="退出登录" is-link @click="handleLogout" icon="revoke" class="logout-cell" />
        <van-cell title="清空所有单机数据" is-link @click="clearAll" icon="delete-o" class="danger-cell" />
      </van-cell-group>
      
      <div class="bottom-padding"></div>
    </div>

    <!-- 预算设置弹窗 -->
    <van-dialog v-model:show="showBudget" title="设置月度预算" show-cancel-button @confirm="onConfirmBudget" class="custom-dialog">
      <van-field v-model="tempBudget" type="number" label="预算金额" placeholder="请输入每月预算" :border="false" />
    </van-dialog>

    <!-- 归档设置弹窗 -->
    <van-dialog v-model:show="showArchive" title="年度记录归档" show-cancel-button @confirm="onConfirmArchive" class="custom-dialog">
      <div class="dialog-tips">
        将指定年度及之前的账单封存入历史。此操作会在次年初自动生成一笔【期初结转】保证总资产不变。
      </div>
      <van-field v-model="archiveYear" type="digit" label="结转至年份" placeholder="如 2024" :border="false" />
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
import { useUserStore } from '@/stores/user'
import { useSettingStore } from '@/stores/setting'
import { getCustomBillingMonthRange } from '@/utils/date'
import { useDebtStore } from '@/stores/debt'

const router = useRouter()
const store = useRecordStore()
const accountStore = useAccountStore()
const goalStore = useGoalStore()
const debtStore = useDebtStore()
const userStore = useUserStore()

const showBudget = ref(false)
const tempBudget = ref(store.budget ? String(store.budget) : '')

const showArchive = ref(false)
const archiveYear = ref(String(new Date().getFullYear() - 1))

const onConfirmArchive = async () => {
  const y = parseInt(archiveYear.value)
  if (!y || isNaN(y)) {
    showToast('请输入正确的年份缩写如 2024')
    return
  }
  const count = await store.archiveYear(y)
  if (count > 0) {
    showToast(`成功归档冻结 ${y} 年的 ${count} 笔流水`)
  } else {
    showToast('该年度暂无可归档数据')
  }
}

const onConfirmBudget = () => {
  const val = parseFloat(tempBudget.value) || 0
  store.setBudget(val)
  showToast(val > 0 ? '预算设置成功' : '已取消预算')
}

// 投资理财总计
const investmentAsset = computed(() => {
  return accountStore.accounts.filter(a => a.type === 4).reduce((sum, a) => sum + a.balance, 0)
})

// 计算本月各个分类是否超支
const overBudgetCategories = computed(() => {
  const settingStore = useSettingStore()
  const startDay = settingStore.billingStartDay
  const now = new Date()
  const { start, end } = getCustomBillingMonthRange(now, startDay)
  
  // 仅计算本月的支出
  const monthRecords = store.currentLedgerRecords.filter(r => {
    if (r.type !== 1) return false
    if (r.accountId) {
      const acc = accountStore.accounts.find(a => a.id === r.accountId)
      if (acc && acc.type === 4) return false
    }
    return r.recordTime >= start && r.recordTime <= end
  })

  // 按分类汇总
  const spentMap: Record<string, number> = {}
  monthRecords.forEach(r => {
    if (!spentMap[r.categoryId]) spentMap[r.categoryId] = 0
    spentMap[r.categoryId] += (r.amount * (r.exchangeRate || 1))
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

const settingStore = useSettingStore()
const isDarkMode = computed({
  get: () => settingStore.theme === 'dark',
  set: (val: boolean) => {
    settingStore.setTheme(val ? 'dark' : 'light')
    showToast(val ? '已开启深色模式' : '已关闭深色模式')
  }
})

const exportData = () => {
  if (store.currentLedgerRecords.length === 0) {
    showToast('暂无数据可导出')
    return
  }
  
  // 全量 CSV 导出逻辑
  const headers = [
    'id', 'type', 'amount', 'categoryId', 'accountId', 
    'recordTime', 'createTime', 'remark', 'tags', 'ledgerId', 
    'goalId', 'reimbursable', 'reimbursableId', 'creatorId', 
    'currency', 'exchangeRate', 'refundForId', 'isArchived'
  ]
  
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += headers.join(",") + "\n"
  
  store.currentLedgerRecords.forEach(r => {
    const row = headers.map(key => {
      let val = (r as any)[key]
      if (val === undefined || val === null) return ''
      if (Array.isArray(val)) return `"${val.join('|')}"` // tags 数组用 | 分隔
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
      return val
    })
    csvContent += row.join(",") + "\n"
  })
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "irecord_data.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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

const handleLogout = () => {
  showConfirmDialog({
    title: '退出登录',
    message: '确认要退出当前账号吗？'
  }).then(() => {
    userStore.logout()
    router.replace('/login')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.mine-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color-secondary);
  overflow-y: auto;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  
  // 底部留白，防止被 Tabbar 和全局浮动按钮挡住
  .bottom-padding {
    height: 150px;
  }
  
  // 统一的 Din 字体
  .din-font {
    font-family: 'Din', 'Arial', sans-serif;
  }

  // ==== 1. 超级资产大盘卡 ====
  .hero-asset-card {
    margin: 16px 16px 20px;
    padding: 24px 20px 20px;
    background: linear-gradient(145deg, var(--bg-color-primary), var(--bg-color-secondary));
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(var(--van-primary-color-rgb), 0.1);
    position: relative;
    overflow: hidden;

    // 装饰性光晕背景
    &::after {
      content: '';
      position: absolute;
      top: -30%;
      right: -20%;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(var(--van-primary-color-rgb), 0.1) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      
      .avatar-wrap {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background-color: var(--bg-color-secondary);
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 16px;
        border: 2px solid var(--bg-color-primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);

        .default-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--van-primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      .text-info {
        flex: 1;
        .main-title {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          
          .name {
            font-size: 22px;
            font-weight: 600;
            color: var(--text-color-primary);
            margin-right: 8px;
          }
        }
        
        .gamify-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            background-color: rgba(var(--van-primary-color-rgb), 0.1);
            color: var(--van-primary-color);
            font-weight: 500;
          }
        }
      }
    }

    .net-asset-section {
      text-align: center;
      margin-bottom: 24px;
      
      .label {
        font-size: 13px;
        color: var(--text-color-secondary);
        margin-bottom: 4px;
      }
      .value {
        font-size: 36px;
        font-weight: bold;
        color: var(--text-color-primary);
        line-height: 1.1;
      }
    }

    .sub-assets-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px dashed var(--border-color);
      
      .asset-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.2s;
        
        &:active {
          transform: scale(0.95);
          opacity: 0.7;
        }
        
        .col-label {
          font-size: 12px;
          color: var(--text-color-secondary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          
          .van-icon {
            font-size: 10px;
            margin-left: 2px;
            opacity: 0.5;
          }
        }
        .col-val {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color-primary);
          
          &.green { color: var(--van-success-color); }
          &.red { color: var(--van-danger-color); }
        }
      }

      .divider {
        width: 1px;
        height: 24px;
        background-color: var(--border-color);
      }
    }
  }

  // ==== 2. 横向滑动组件块 ====
  .widget-section {
    margin-bottom: 20px;

    .section-header {
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-color-primary);
        display: flex;
        align-items: center;
        
        .count {
          font-size: 12px;
          font-weight: normal;
          opacity: 0.6;
          margin-left: 4px;
        }
      }
      
      .action {
        font-size: 12px;
        color: var(--text-color-secondary);
        display: flex;
        align-items: center;
        
        .van-icon { margin-left: 2px; }
        
        &:active { opacity: 0.6; }
      }
    }

    .snap-scroll-row {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 0 16px 8px;
      gap: 12px;
      
      &::-webkit-scrollbar { display: none; }

      .snap-card {
        scroll-snap-align: start;
        flex: 0 0 160px;
        background-color: var(--bg-color-primary);
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s;
        border: 1px solid rgba(0,0,0,0.02);
        
        &:active { transform: scale(0.97); }

        .card-top {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          
          .icon-box {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background-color: rgba(var(--van-primary-color-rgb), 0.1);
            color: var(--van-primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-right: 8px;
            
            &.danger-box {
              background-color: rgba(var(--van-danger-color-rgb), 0.1);
              color: var(--van-danger-color);
            }
          }
          
          .name {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-color-primary);
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .card-mid {
          display: flex;
          align-items: baseline;
          margin-bottom: 12px;
          
          .current {
            font-size: 18px;
            font-weight: bold;
            color: var(--text-color-primary);
            
            &.danger-text { color: var(--van-danger-color); }
          }
          .slash {
            margin: 0 4px;
            font-size: 12px;
            color: var(--text-color-secondary);
            font-family: sans-serif;
          }
          .target {
            font-size: 13px;
            color: var(--text-color-secondary);
          }
        }

        .card-bot {
          .progress-bar {
            height: 6px;
            background-color: var(--bg-color-secondary);
            border-radius: 3px;
            overflow: hidden;

            .fill {
              height: 100%;
              border-radius: 3px;
              transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              
              &.pattern-bg {
                background: var(--van-primary-color);
                background-image: linear-gradient(
                  45deg, 
                  rgba(255,255,255,0.15) 25%, 
                  transparent 25%, 
                  transparent 50%, 
                  rgba(255,255,255,0.15) 50%, 
                  rgba(255,255,255,0.15) 75%, 
                  transparent 75%, 
                  transparent
                );
                background-size: 10px 10px;
              }
              
              &.danger-bg {
                background-color: var(--van-danger-color);
              }
            }
          }
        }
      }
    }
  }

  // ==== 3. 设置列表区 (Inset Cells) ====
  .settings-list {
    padding-bottom: 20px; // extra padding top of bottom-padding
    
    .custom-inset-group {
      margin: 0 16px 16px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.03);
      background-color: var(--bg-color-primary);
      
      .van-cell {
        background-color: transparent;
        padding: 16px 20px;
        font-size: 15px;
        align-items: center;
        
        // 左边 icon 调色
        :deep(.van-cell__left-icon) {
          font-size: 18px;
          margin-right: 12px;
          color: var(--van-primary-color);
          opacity: 0.9;
        }
        
        // 覆盖按下时的颜色，使用更柔和的灰色
        &:active {
          background-color: var(--bg-color-secondary);
        }
        
        // 退出登录与清空数据特殊样式
        &.logout-cell :deep(.van-cell__left-icon),
        &.danger-cell :deep(.van-cell__left-icon) {
          color: var(--van-danger-color);
        }
        
        &.logout-cell .van-cell__title,
        &.danger-cell .van-cell__title {
          color: var(--van-danger-color);
        }
      }
    }
  }

  // ==== 4. 弹窗美化 ====
  .custom-dialog {
    border-radius: 20px;
    
    .van-dialog__header {
      padding-top: 24px;
      font-weight: 600;
    }
    
    .dialog-tips {
      padding: 16px 24px 0;
      font-size: 13px;
      color: var(--text-color-secondary);
      line-height: 1.6;
      text-align: center;
    }
    
    .van-field {
      margin: 16px 24px 24px;
      background-color: var(--bg-color-secondary);
      border-radius: 12px;
      padding: 12px 16px;
      width: auto;
    }
  }
}
</style>
