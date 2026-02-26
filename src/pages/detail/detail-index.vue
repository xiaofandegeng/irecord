<template>
  <div class="detail-container">
    <div class="header glassmorphic">
      <div class="title-bar">
        <div class="title">账务明细</div>
        <div class="actions">
          <span class="batch-btn" @click="toggleBatchMode" v-if="viewMode === 'list'">{{ isBatchMode ? '完成' : '管理' }}</span>
          <van-icon :name="viewMode === 'list' ? 'calendar-o' : 'orders-o'" size="20" class="action-icon" @click="toggleViewMode" />
          <van-icon name="search" size="20" class="action-icon" @click="goSearch" />
        </div>
      </div>
      <div class="hero-summary">
        <div class="item">
          <span class="label">本期支出</span>
          <span class="value din-font bold">{{ accountStore.privacyMode ? '****' : totalExpense.toFixed(2) }}</span>
        </div>
        <div class="divider"></div>
        <div class="item">
          <span class="label">本期收入</span>
          <span class="value din-font">{{ accountStore.privacyMode ? '****' : totalIncome.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div class="list-area" v-if="viewMode === 'list'">
      <transition-group name="list" tag="div" class="list-wrapper" v-if="Object.keys(groupedRecords).length > 0">
        <div v-for="(records, dateKey) in groupedRecords" :key="dateKey" class="date-card">
          <div class="date-card-header">
            <span class="date">{{ formatHeaderDate(dateKey) }}</span>
            <span class="daily-sum" v-if="accountStore.privacyMode">****</span>
            <span class="daily-sum" v-else>{{ getDailySum(records) }}</span>
          </div>
          
          <transition-group name="list" tag="div" class="record-list">
            <van-swipe-cell v-for="(record, index) in records" :key="record.id" :disabled="isBatchMode">
              <div 
                class="record-item" 
                :class="{ 
                  'is-batch': isBatchMode, 
                  'is-last': index === records.length - 1 
                }" 
                @click="toggleSelection(record.id)"
              >
                <div class="batch-checkbox" v-if="isBatchMode">
                  <van-checkbox :name="record.id" :model-value="selectedRecordIds.includes(record.id)" @click.stop="toggleSelection(record.id)" shape="round" checked-color="var(--van-primary-color)" />
                </div>
                
                <div class="icon-wrap" :class="{'is-income': record.type === 2}">
                  <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
                </div>
                
                <div class="content">
                  <div class="top-line">
                    <span class="name">{{ getCategoryName(record.categoryId) }}</span>
                    <span class="amount din-font" :class="{'is-income': record.type === 2}">
                      {{ record.type === 1 ? '-' : '+' }}{{ accountStore.privacyMode ? '****' : record.amount.toFixed(2) }}
                    </span>
                  </div>
                  <div class="bottom-line" v-if="record.remark || record.recordTime || (record.tags && record.tags.length > 0)">
                    <span class="time">{{ formatTime(record.recordTime) }}</span>
                    <span class="remark text-ellipsis" v-if="record.remark">{{ record.remark }}</span>
                  </div>
                  <div class="tags-line" v-if="record.tags && record.tags.length > 0">
                    <span class="mini-tag" v-for="tag in record.tags" :key="tag">
                      #{{ tag }}
                    </span>
                  </div>
                  <div class="attachments-line" v-if="record.attachments && record.attachments.length > 0">
                    <van-image
                      v-for="(img, idx) in record.attachments"
                      :key="idx"
                      :src="img"
                      width="36px"
                      height="36px"
                      fit="cover"
                      radius="4px"
                      class="attach-thumb"
                      @click.stop="previewImage(record.attachments, idx)"
                    />
                  </div>
                </div>
              </div>
              
              <template #right>
                <van-button v-if="record.type === 1 && !record.refundForId && record.amount > 0" square text="退款" type="warning" class="action-button refund-button" @click="onRefund(record)" />
                <van-button square text="删除" type="danger" class="action-button delete-button" @click="onDelete(record.id)" />
              </template>
            </van-swipe-cell>
          </transition-group>
        </div>
      </transition-group>
      <div v-else class="empty-state">
        <EmptyState type="search" description="暂无账单数据" />
      </div>
      
      <!-- 底部防遮挡 -->
      <div class="bottom-padding"></div>
    </div>

    <!-- 日历视图 / 活跃热力图 -->
    <div class="calendar-area" v-else>
      <ContributionHeatmap :grouped-records="groupedRecords" />
      <div class="bottom-padding"></div>
    </div>

    <!-- 批量操作底栏 -->
    <van-action-bar v-if="isBatchMode && viewMode === 'list'" class="batch-action-bar">
      <van-action-bar-button type="default" :text="selectedRecordIds.length === allRecords.length ? '取消全选' : '全选'" @click="selectAll" />
      <van-action-bar-button type="warning" text="修改分类" @click="showBatchCategoryPicker = true" :disabled="selectedRecordIds.length === 0" />
      <van-action-bar-button type="danger" text="删除" @click="onBatchDelete" :disabled="selectedRecordIds.length === 0" />
    </van-action-bar>

    <van-action-sheet v-model:show="showBatchCategoryPicker" :actions="batchCategoryActions" cancel-text="取消" @select="onSelectBatchCategory" round />

    <!-- 退款操作弹窗 -->
    <van-dialog v-model:show="showRefund" title="记录退款" show-cancel-button @confirm="onConfirmRefund" class="custom-dialog">
      <div class="dialog-tips">
        原支出：{{ currentRefundRecord?.amount.toFixed(2) }} 
        <span v-if="currentRefundRecord?.currency">{{ currentRefundRecord.currency }}</span>
      </div>
      <van-field v-model="refundAmount" type="number" label="退款金额" placeholder="请输入退回的金额" :border="false" />
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
import { playHaptic } from '@/utils/haptics'

const store = useRecordStore()
const accountStore = useAccountStore()
const router = useRouter()

const viewMode = ref<'list' | 'calendar'>('list')
const isBatchMode = ref(false)
const selectedRecordIds = ref<string[]>([])

const toggleBatchMode = () => {
  playHaptic('medium')
  isBatchMode.value = !isBatchMode.value
  selectedRecordIds.value = []
}

const toggleSelection = (id: string) => {
  playHaptic('light')
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
  height: 100vh;
  background-color: var(--bg-color-secondary);
  
  .header {
    padding: 16px 16px 24px;
    color: var(--text-color-primary);
    position: relative;
    z-index: 10;
    
    &.glassmorphic {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      
      [data-theme='dark'] & {
        background: rgba(30, 30, 30, 0.75);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
    }
    
    .title-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-bottom: 24px;
      
      .title {
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      
      .actions {
        position: absolute;
        right: 0;
        display: flex;
        gap: 16px;
        align-items: center;
        
        .action-icon {
          padding: 4px;
          cursor: pointer;
          color: var(--text-color-primary);
          transition: opacity 0.2s;
          
          &:active {
            opacity: 0.6;
          }
        }

        .batch-btn {
          font-size: 14px;
          color: var(--van-primary-color);
          font-weight: 500;
          padding: 4px;
          cursor: pointer;
          transition: opacity 0.2s;
          
          &:active {
            opacity: 0.6;
          }
        }
      }
    }
    
    .hero-summary {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      
      .divider {
        width: 1px;
        height: 30px;
        background-color: var(--van-gray-3);
        opacity: 0.5;
      }
      
      .item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .label {
          font-size: 12px;
          color: var(--text-color-secondary);
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .value {
          font-size: 24px;
          color: var(--text-color-primary);
          
          &.bold {
            font-weight: bold;
          }
        }
      }
    }
  }
  
  .list-area, .calendar-area {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    .bottom-padding {
      height: 80px; /* Account for bottom tab bar */
    }
  }
  
  .list-area {
    .date-card {
      background-color: var(--bg-color-primary);
      border-radius: 16px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      
      [data-theme='dark'] & {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .date-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px 8px;
        font-size: 12px;
        color: var(--text-color-secondary);
        font-weight: 500;
        
        .date {
          color: var(--text-color-primary);
          font-weight: 600;
          font-size: 13px;
        }
        
        .daily-sum {
          background: var(--bg-color-secondary);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
        }
      }
      
      .record-list {
        .record-item {
          display: flex;
          align-items: flex-start;
          padding: 14px 16px;
          background-color: var(--bg-color-primary);
          position: relative;
          
          @media (hover: hover) {
            &:hover {
              background-color: var(--van-active-color);
            }
          }
          &:active {
            background-color: var(--van-active-color);
          }
          
          &:not(.is-last)::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 64px; /* Align with text content */
            right: 16px;
            height: 1px;
            background-color: var(--van-gray-2);
            transform: scaleY(0.5);
            
            [data-theme='dark'] & {
              background-color: rgba(255, 255, 255, 0.08);
            }
          }
          
          &.is-batch {
            cursor: pointer;
            align-items: center;
          }

          .batch-checkbox {
            margin-right: 14px;
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
            flex-shrink: 0;
            
            &.is-income {
              color: var(--brand-income, #ff976a); 
              background-color: rgba(255, 151, 106, 0.1);
            }
          }
          
          .content {
            flex: 1;
            min-width: 0;
            
            .top-line {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
              
              .name {
                font-size: 15px;
                font-weight: 500;
                color: var(--text-color-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-right: 8px;
              }
              
              .amount {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-color-primary);
                flex-shrink: 0;
                
                &.is-income {
                  color: var(--brand-income, #ff976a);
                }
              }
            }
            
            .bottom-line {
              display: flex;
              align-items: center;
              font-size: 12px;
              color: var(--text-color-secondary);
              margin-bottom: 2px;
              
              .time {
                margin-right: 8px;
                flex-shrink: 0;
              }
              
              .remark {
                flex: 1;
              }
            }
            
            .tags-line {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-top: 6px;
              
              .mini-tag {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                color: var(--van-primary-color);
                background-color: var(--bg-color-secondary);
                font-weight: 500;
              }
            }
            
            .attachments-line {
              margin-top: 8px;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              
              .attach-thumb {
                border: 1px solid var(--van-gray-2);
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                
                [data-theme='dark'] & {
                  border-color: rgba(255, 255, 255, 0.1);
                }
              }
            }
          }
        }
      }
    }
  }

  .action-button {
    height: 100%;
    
    &.refund-button {
      background-color: #ff976a;
      border-color: #ff976a;
    }
  }
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-dialog {
  .dialog-tips {
    padding: 16px 16px 0;
    font-size: 14px;
    color: var(--text-color-secondary);
    text-align: center;
  }
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
