<template>
  <div class="reimburse-manage-container">
    <van-nav-bar
      title="报销与垫付"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <div class="summary-card">
      <div class="title">待报销总额</div>
      <div class="amount">¥ {{ totalPendingAmount.toFixed(2) }}</div>
      <div class="sub-text">共 {{ pendingRecords.length }} 笔报销项</div>
    </div>

    <van-tabs v-model:active="activeTab" sticky color="var(--van-primary-color)">
      <van-tab title="待报销" name="pending">
        <div class="list-container" v-if="pendingRecords.length > 0">
          <van-swipe-cell v-for="record in pendingRecords" :key="record.id">
            <van-cell center class="record-cell">
              <template #icon>
                <div class="icon-wrap">
                  <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
                </div>
              </template>
              <template #title>
                <div class="cell-title">
                  <span>{{ getCategoryName(record.categoryId) }}</span>
                  <van-tag type="primary" plain size="medium" v-if="record.tags?.length">
                    {{ record.tags[0] }}
                  </van-tag>
                </div>
              </template>
              <template #label>
                <div class="cell-label">
                  <div>{{ formatTime(record.recordTime) }}</div>
                  <div class="remark">{{ record.remark || '无备注' }}</div>
                </div>
              </template>
              <template #value>
                <span class="expense-amount">-{{ record.amount.toFixed(2) }}</span>
              </template>
            </van-cell>
            
            <template #right>
              <van-button square type="success" text="一键平账" class="reimburse-btn" @click="handleReimburse(record)" />
            </template>
          </van-swipe-cell>
        </div>
        <van-empty v-else image="search" description="暂无待报销项目" />
      </van-tab>
      
      <van-tab title="已报销" name="done">
        <div class="list-container" v-if="doneRecords.length > 0">
          <van-cell v-for="record in doneRecords" :key="record.id" center class="record-cell">
            <template #icon>
              <div class="icon-wrap done-icon">
                <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
              </div>
            </template>
            <template #title>
              <div class="cell-title">
                <span>{{ getCategoryName(record.categoryId) }}</span>
                <span class="done-mark" style="font-size: 12px; color: #07c160; margin-left: 8px;">(已平账)</span>
              </div>
            </template>
            <template #label>
              <div class="cell-label">
                <div>{{ formatTime(record.recordTime) }}</div>
                <div class="remark">{{ record.remark }}</div>
              </div>
            </template>
            <template #value>
              <span class="expense-amount" style="color: #999;">{{ record.amount.toFixed(2) }}</span>
            </template>
          </van-cell>
        </div>
        <van-empty v-else image="search" description="暂无已报销项目" />
      </van-tab>
    </van-tabs>

    <!-- 选择收款账户弹窗 -->
    <van-action-sheet v-model:show="showAccountPicker" :title="'报销收款入账账户'">
      <div class="action-sheet-content">
        <van-radio-group v-model="selectedAccountId">
          <van-cell-group inset>
            <van-cell v-for="acc in accountStore.accounts" :key="acc.id" :title="acc.name" clickable @click="selectedAccountId = acc.id">
              <template #right-icon>
                <van-radio :name="acc.id" checked-color="var(--van-primary-color)" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
        <div style="padding: 16px;">
          <van-button type="primary" block @click="confirmReimburse">确认收款平账</van-button>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'

const router = useRouter()
const recordStore = useRecordStore()
const accountStore = useAccountStore()

const activeTab = ref('pending')

// 过滤当前账本的报销相关流水
const reimbursableRecords = computed(() => {
  return recordStore.currentLedgerRecords.filter(r => r.reimbursable !== undefined)
})

const pendingRecords = computed(() => {
  return reimbursableRecords.value
    .filter(r => r.reimbursable === true)
    .sort((a, b) => b.recordTime - a.recordTime)
})

const doneRecords = computed(() => {
  return reimbursableRecords.value
    .filter(r => r.reimbursable === false)
    .sort((a, b) => b.recordTime - a.recordTime)
})

const totalPendingAmount = computed(() => {
  return pendingRecords.value.reduce((sum, r) => sum + r.amount, 0)
})

// 平账流程
const showAccountPicker = ref(false)
const selectedAccountId = ref('a1')
const currentReimburseRecord = ref<any>(null)

const handleReimburse = (record: any) => {
  currentReimburseRecord.value = record
  selectedAccountId.value = accountStore.accounts[0]?.id || ''
  showAccountPicker.value = true
}

const confirmReimburse = () => {
  if (!currentReimburseRecord.value) return
  if (!selectedAccountId.value) {
    showToast('请选择收款账户')
    return
  }

  showConfirmDialog({
    title: '确认平账',
    message: `确认将 ${currentReimburseRecord.value.amount} 元以“报销”存入所选账户吗？`
  }).then(() => {
    recordStore.reimburseRecord(currentReimburseRecord.value.id, selectedAccountId.value)
    showToast('平账成功')
    showAccountPicker.value = false
    currentReimburseRecord.value = null
  }).catch(() => {})
}

// 辅助方法
const onClickLeft = () => {
  router.back()
}

const getCategoryName = (id: string) => {
  const cat = recordStore.categories.find(c => c.id === id)
  return cat ? cat.name : '未知'
}

const getCategoryIcon = (id: string) => {
  const cat = recordStore.categories.find(c => c.id === id)
  return cat ? cat.icon : 'question-o'
}

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}
</script>

<style lang="scss" scoped>
.reimburse-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-primary);

  .summary-card {
    background: linear-gradient(135deg, var(--van-primary-color), #5c9ce6);
    color: #fff;
    padding: 24px 20px;
    text-align: center;
    
    .title {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .sub-text {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .list-container {
    padding-bottom: 30px;
  }

  .record-cell {
    background-color: var(--bg-color-secondary);
    border-bottom: 1px solid rgba(0,0,0,0.05);

    .icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: var(--van-primary-color);
      
      &.done-icon {
        color: #999;
        background-color: #f9f9f9;
      }
    }

    .cell-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-color-primary);
    }
    
    .cell-label {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .remark {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background-color: rgba(0,0,0,0.04);
        padding: 0 4px;
        border-radius: 4px;
      }
    }

    .expense-amount {
      font-weight: 600;
      font-size: 16px;
      color: #ee0a24;
    }
  }

  .reimburse-btn {
    height: 100%;
  }
}
</style>
