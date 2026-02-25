<template>
  <div class="detail-container">
    <div class="header">
      <div class="title-bar">
        <div class="title">账单明细</div>
        <div class="actions">
          <span class="batch-btn" @click="toggleBatchMode" v-if="viewMode === 'list'">{{ isBatchMode ? '完成' : '批量管理' }}</span>
          <van-icon :name="viewMode === 'list' ? 'calendar-o' : 'orders-o'" size="22" class="action-icon" @click="toggleViewMode" />
          <van-icon name="search" size="22" class="action-icon" @click="goSearch" />
        </div>
      </div>
      <div class="summary">
        <div class="item">
          <span class="label">总支出</span>
          <span class="value">¥ {{ accountStore.privacyMode ? '****' : totalExpense.toFixed(2) }}</span>
        </div>
        <div class="item">
          <span class="label">总收入</span>
          <span class="value">¥ {{ accountStore.privacyMode ? '****' : totalIncome.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div class="list-area" v-if="viewMode === 'list'">
      <transition-group name="list" tag="div" class="list-wrapper" v-if="Object.keys(groupedRecords).length > 0">
        <div v-for="(records, dateKey) in groupedRecords" :key="dateKey" class="date-group">
          <div class="date-header">
            <span class="date">{{ formatHeaderDate(dateKey) }}</span>
            <span class="daily-sum" v-if="accountStore.privacyMode">****</span>
            <span class="daily-sum" v-else>{{ getDailySum(records) }}</span>
          </div>
          
          <transition-group name="list" tag="div" class="record-list">
            <van-swipe-cell v-for="record in records" :key="record.id" :disabled="isBatchMode">
              <div class="record-item" :class="{ 'is-batch': isBatchMode }" @click="toggleSelection(record.id)">
                <div class="batch-checkbox" v-if="isBatchMode">
                  <van-checkbox :name="record.id" :model-value="selectedRecordIds.includes(record.id)" @click.stop="toggleSelection(record.id)" shape="square" checked-color="var(--van-primary-color)" />
                </div>
                <div class="icon-wrap" :class="{'is-income': record.type === 2}">
                  <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
                </div>
                <div class="content">
                  <div class="top-line">
                    <span class="name">{{ getCategoryName(record.categoryId) }}</span>
                    <span class="amount" :class="{'is-income': record.type === 2}">
                      {{ record.type === 1 ? '-' : '+' }}{{ accountStore.privacyMode ? '****' : record.amount.toFixed(2) }}
                    </span>
                  </div>
                  <div class="bottom-line" v-if="record.remark || record.recordTime || (record.tags && record.tags.length > 0)">
                    <span class="time">{{ formatTime(record.recordTime) }}</span>
                    <span class="remark" v-if="record.remark">{{ record.remark }}</span>
                  </div>
                  <div class="tags-line" v-if="record.tags && record.tags.length > 0">
                    <van-tag 
                      v-for="tag in record.tags" 
                      :key="tag" 
                      plain 
                      type="primary" 
                      size="medium"
                      class="mini-tag"
                    >
                      #{{ tag }}
                    </van-tag>
                  </div>
                  <div class="attachments-line" v-if="record.attachments && record.attachments.length > 0">
                    <van-image
                      v-for="(img, idx) in record.attachments"
                      :key="idx"
                      :src="img"
                      width="40px"
                      height="40px"
                      fit="cover"
                      radius="4px"
                      class="attach-thumb"
                      @click.stop="previewImage(record.attachments, idx)"
                    />
                  </div>
                </div>
              </div>
              
              <template #right>
                <van-button v-if="record.type === 1 && !record.refundForId && record.amount > 0" square text="退款" type="warning" class="refund-button" @click="onRefund(record)" />
                <van-button square text="删除" type="danger" class="delete-button" @click="onDelete(record.id)" />
              </template>
            </van-swipe-cell>
          </transition-group>
        </div>
      </transition-group>
      <div v-else class="empty-state">
        <van-empty image="search" description="暂无账单数据" />
      </div>
    </div>

    <!-- 日历视图 / 活跃热力图 -->
    <div class="calendar-area" v-else>
      <ContributionHeatmap :grouped-records="groupedRecords" />
    </div>

    <!-- 批量操作底栏 -->
    <van-action-bar v-if="isBatchMode && viewMode === 'list'">
      <van-action-bar-button type="default" :text="selectedRecordIds.length === allRecords.length ? '取消全选' : '全选'" @click="selectAll" />
      <van-action-bar-button type="warning" text="修改分类" @click="showBatchCategoryPicker = true" :disabled="selectedRecordIds.length === 0" />
      <van-action-bar-button type="danger" text="删除" @click="onBatchDelete" :disabled="selectedRecordIds.length === 0" />
    </van-action-bar>

    <van-action-sheet v-model:show="showBatchCategoryPicker" :actions="batchCategoryActions" cancel-text="取消" @select="onSelectBatchCategory" />

    <!-- 退款操作弹窗 -->
    <van-dialog v-model:show="showRefund" title="记录退款" show-cancel-button @confirm="onConfirmRefund">
      <div style="padding: 16px; font-size: 14px; color: #666; text-align: center;">
        原支出：{{ currentRefundRecord?.amount.toFixed(2) }} 
        <span v-if="currentRefundRecord?.currency">{{ currentRefundRecord.currency }}</span>
      </div>
      <van-field v-model="refundAmount" type="number" label="退款金额" placeholder="请输入退回的金额" />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showImagePreview, showToast } from 'vant'
import { useRecordStore, type RecordItem } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import ContributionHeatmap from '@/components/ContributionHeatmap.vue'

const store = useRecordStore()
const accountStore = useAccountStore()
const router = useRouter()

const viewMode = ref<'list' | 'calendar'>('list')
const isBatchMode = ref(false)
const selectedRecordIds = ref<string[]>([])

const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  selectedRecordIds.value = []
}

const toggleSelection = (id: string) => {
  if (!isBatchMode.value) return
  if (selectedRecordIds.value.includes(id)) {
    selectedRecordIds.value = selectedRecordIds.value.filter(i => i !== id)
  } else {
    selectedRecordIds.value.push(id)
  }
}

const selectAll = () => {
  if (selectedRecordIds.value.length === allRecords.value.length) {
    selectedRecordIds.value = []
  } else {
    selectedRecordIds.value = allRecords.value.map(r => r.id)
  }
}

const showBatchCategoryPicker = ref(false)
const batchCategoryActions = computed(() => {
  return store.categories.map(c => ({
    name: c.name + (c.type === 1 ? ' (支出)' : ' (收入)'),
    value: c.id
  }))
})

const onSelectBatchCategory = (action: any) => {
  const cat = store.categories.find(c => c.id === action.value)
  if (cat) {
    selectedRecordIds.value.forEach(id => {
      const r = store.records.find(re => re.id === id)
      if (r) {
        r.categoryId = cat.id
        r.type = cat.type
      }
    })
    showToast('批量修改分类成功')
  }
  showBatchCategoryPicker.value = false
  toggleBatchMode()
}

const onBatchDelete = () => {
  if (selectedRecordIds.value.length === 0) return
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除选中的 ${selectedRecordIds.value.length} 条记录吗？`
  }).then(() => {
    const ids = [...selectedRecordIds.value]
    ids.forEach(id => {
      store.deleteRecord(id)
    })
    showToast('批量删除成功')
    toggleBatchMode()
  }).catch(() => {})
}

const showRefund = ref(false)
const currentRefundRecord = ref<RecordItem | null>(null)
const refundAmount = ref('')

const onRefund = (record: RecordItem) => {
  currentRefundRecord.value = record
  refundAmount.value = String(record.amount)
  showRefund.value = true
}

const onConfirmRefund = () => {
  if (currentRefundRecord.value) {
    const val = parseFloat(refundAmount.value) || 0
    if (val <= 0 || val > currentRefundRecord.value.amount) {
      showToast('退款金额无效(不能大于原支出金额)')
      return
    }
    
    const refundRecord: RecordItem = {
      ...currentRefundRecord.value,
      id: 'r_' + Date.now(),
      amount: -val,
      remark: `退款: ${currentRefundRecord.value.remark || '无备注'}`,
      recordTime: Date.now(),
      createTime: Date.now(),
      refundForId: currentRefundRecord.value.id
    }
    
    store.addRecord(refundRecord)
    showToast('退款入账成功')
  }
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'calendar' : 'list'
}

const goSearch = () => {
  router.push('/search')
}

// 取当前账本的所有记账记录
const allRecords = computed(() => store.currentLedgerRecords)

// 获取分类信息辅助函数
const getCategoryName = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.name : '未知'
}
const getCategoryIcon = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.icon : 'question-o'
}

// 总计
const totalExpense = computed(() => {
  return allRecords.value.filter(r => r.type === 1).reduce((sum, r) => sum + (r.amount * (r.exchangeRate || 1)), 0)
})
const totalIncome = computed(() => {
  return allRecords.value.filter(r => r.type === 2).reduce((sum, r) => sum + (r.amount * (r.exchangeRate || 1)), 0)
})

// 按日期分组格式: YYYY-MM-DD
const groupedRecords = computed(() => {
  const groups: Record<string, RecordItem[]> = {}
  
  allRecords.value.forEach(record => {
    const d = new Date(record.recordTime)
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  })
  
  return groups
})

// 计算单日聚合总计
const getDailySum = (records: RecordItem[]) => {
  let exp = 0
  let inc = 0
  records.forEach(r => {
    const amt = r.amount * (r.exchangeRate || 1)
    if (r.type === 1) exp += amt
    else inc += amt
  })
  let res = []
  if (exp > 0) res.push(`支 ${exp.toFixed(2)}`)
  if (inc > 0) res.push(`收 ${inc.toFixed(2)}`)
  return res.length > 0 ? res.join(' | ') : '0.00'
}

// 格式化展示日期头部
const formatHeaderDate = (dateStr: string) => {
  const parts = dateStr.split('-')
  return `${parts[1]}月${parts[2]}日`
}

// 格式化具体时间
const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const onDelete = (id: string) => {
  showConfirmDialog({
    title: '提示',
    message: '确认删除该笔账单吗？'
  }).then(() => {
    store.deleteRecord(id)
  }).catch(() => {})
}

// 预览大图
const previewImage = (images: string[], startPosition: number) => {
  showImagePreview({
    images,
    startPosition,
    closeable: true
  })
}

// ================= 日历相关 ================= //
// 已移除原本的 Vant vanilla calendar 逻辑，改为内部封装的 ContributionHeatmap 接受数据源渲染
</script>

<style lang="scss" scoped>
.detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .header {
    padding: 20px 16px;
    background-color: var(--van-primary-color);
    color: #fff;
    
    .title-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-bottom: 16px;
      
      .title {
        font-size: 18px;
        font-weight: 500;
      }
      
      .actions {
        position: absolute;
        right: 0;
        display: flex;
        gap: 16px;
        
        .action-icon {
          // padding to make it easier to click
          padding: 4px;
        }

        .batch-btn {
          font-size: 14px;
          display: flex;
          align-items: center;
          padding: 4px;
          cursor: pointer;
          opacity: 0.9;
        }
      }
    }
    
    .summary {
      display: flex;
      justify-content: space-around;
      
      .item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        
        .value {
          font-size: 20px;
          font-weight: 500;
        }
      }
    }
  }
  
  .list-area {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg-color-secondary);
    
    .date-group {
      margin-bottom: 12px;
      background-color: var(--bg-color-primary);
      
      .date-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        font-size: 12px;
        color: var(--text-color-secondary);
        border-bottom: 1px solid #f0f0f0;
      }
      
      .record-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background-color: var(--bg-color-primary);
          transition: background-color 0.2s;
          
          &.is-batch {
            cursor: pointer;
            &:active {
              background-color: #f5f5f5;
            }
          }

          .batch-checkbox {
            margin-right: 12px;
            display: flex;
            align-items: center;
          }
          
          .icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--bg-color-secondary);
          color: var(--van-primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          
          &.is-income {
            color: #ff976a; 
          }
        }
        
        .content {
          flex: 1;
          
          .top-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            
            .name {
              font-size: 15px;
              color: var(--text-color-primary);
            }
            .amount {
              font-size: 16px;
              font-weight: 500;
              color: var(--text-color-primary);
              &.is-income {
                color: var(--brand-income); // 其实设计上可以定义收入为绿色，支流为黑色
              }
            }
          }
          
          .bottom-line {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: var(--text-color-secondary);
            margin-bottom: 4px;
            
            .time {
              margin-right: 8px;
            }
          }
          .tags-line {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 4px;
            
            .mini-tag {
              font-size: 10px;
              padding: 0 4px;
              border-radius: 4px;
            }
          }
          
          .attachments-line {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            
            .attach-thumb {
              border: 1px solid var(--van-gray-2);
              background: var(--bg-color-secondary);
            }
          }
        }
      }
    }
    
    .delete-button {
      height: 100%;
    }
  }

  .calendar-area {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg-color-secondary);
    padding-top: 12px;
  }
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
