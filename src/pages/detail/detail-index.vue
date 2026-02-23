<template>
  <div class="detail-container">
    <div class="header">
      <div class="title">账单明细</div>
      <div class="summary">
        <div class="item">
          <span class="label">总支出</span>
          <span class="value">¥ {{ totalExpense.toFixed(2) }}</span>
        </div>
        <div class="item">
          <span class="label">总收入</span>
          <span class="value">¥ {{ totalIncome.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="list-area">
      <template v-if="Object.keys(groupedRecords).length > 0">
        <div v-for="(records, dateKey) in groupedRecords" :key="dateKey" class="date-group">
          <div class="date-header">
            <span class="date">{{ formatHeaderDate(dateKey) }}</span>
            <span class="daily-sum">{{ getDailySum(records) }}</span>
          </div>
          
          <div class="record-list">
            <van-swipe-cell v-for="record in records" :key="record.id">
              <div class="record-item">
                <div class="icon-wrap" :class="{'is-income': record.type === 2}">
                  <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
                </div>
                <div class="content">
                  <div class="top-line">
                    <span class="name">{{ getCategoryName(record.categoryId) }}</span>
                    <span class="amount" :class="{'is-income': record.type === 2}">
                      {{ record.type === 1 ? '-' : '+' }}{{ record.amount.toFixed(2) }}
                    </span>
                  </div>
                  <div class="bottom-line" v-if="record.remark || record.recordTime">
                    <span class="time">{{ formatTime(record.recordTime) }}</span>
                    <span class="remark" v-if="record.remark">{{ record.remark }}</span>
                  </div>
                </div>
              </div>
              
              <template #right>
                <van-button square text="删除" type="danger" class="delete-button" @click="onDelete(record.id)" />
              </template>
            </van-swipe-cell>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <van-empty description="暂无账单数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { showConfirmDialog } from 'vant'
import { useRecordStore, type RecordItem } from '@/stores/record'

const store = useRecordStore()

// 取所有记账记录
const allRecords = computed(() => store.records)

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
  return allRecords.value.filter(r => r.type === 1).reduce((sum, r) => sum + r.amount, 0)
})
const totalIncome = computed(() => {
  return allRecords.value.filter(r => r.type === 2).reduce((sum, r) => sum + r.amount, 0)
})

// 按日期分组格式: YYYY-MM-DD
const groupedRecords = computed(() => {
  const groups: Record<string, RecordItem[]> = {}
  
  // records 因为是在 unshift 插入的，所以直接按原本顺序遍历即可
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
    if (r.type === 1) exp += r.amount
    else inc += r.amount
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
    
    .title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
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
        background-color: #fff;
        
        .icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #f7f8fa;
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
            
            .time {
              margin-right: 8px;
            }
          }
        }
      }
    }
    
    .delete-button {
      height: 100%;
    }
  }
}
</style>
