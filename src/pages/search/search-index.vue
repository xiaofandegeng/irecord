<template>
  <div class="search-container">
    <van-search
      v-model="keyword"
      show-action
      placeholder="输入备注或金额进行搜索"
      background="var(--van-primary-color)"
      @cancel="onCancel"
    />
    
    <div class="result-area">
      <template v-if="filteredRecords.length > 0">
        <div class="summary-line">
          共找到 {{ filteredRecords.length }} 笔记录，总计 ¥ {{ accountStore.privacyMode ? '****' : totalSum.toFixed(2) }}
        </div>
        
        <van-cell-group>
          <van-cell 
            v-for="record in filteredRecords" 
            :key="record.id"
            center
          >
            <template #icon>
              <div class="icon-wrap" :class="{'is-income': record.type === 2}">
                <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
              </div>
            </template>
            <template #title>
              <div class="top-line">
                <span class="name">{{ getCategoryName(record.categoryId) }}</span>
                <span class="amount" :class="{'is-income': record.type === 2}">
                  {{ record.type === 1 ? '-' : '+' }}{{ accountStore.privacyMode ? '****' : record.amount.toFixed(2) }}
                </span>
              </div>
            </template>
            <template #label>
              <div class="bottom-line">
                <span class="time">{{ formatTime(record.recordTime) }}</span>
                <span class="remark" v-if="record.remark">{{ record.remark }}</span>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </template>
      
      <div v-else-if="keyword" class="empty-state">
        <van-empty image="search" description="未搜索到相关账单" />
      </div>
      
      <div v-else class="empty-state placeholder">
        输入关键字搜一搜历史痕迹...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'

const router = useRouter()
const store = useRecordStore()
const accountStore = useAccountStore()

const keyword = ref('')

const filteredRecords = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  
  return store.records.filter(r => {
    const remarkMatch = (r.remark || '').toLowerCase().includes(kw)
    const amountMatch = String(r.amount).includes(kw)
    const catMatch = getCategoryName(r.categoryId).toLowerCase().includes(kw)
    return remarkMatch || amountMatch || catMatch
  })
})

const totalSum = computed(() => {
  return filteredRecords.value.reduce((sum, r) => {
    return sum + (r.type === 1 ? -r.amount : r.amount)
  }, 0)
})

const getCategoryName = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.name : '未知'
}

const getCategoryIcon = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.icon : 'question-o'
}

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const onCancel = () => {
  router.back()
}
</script>

<style lang="scss" scoped>
.search-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  
  :deep(.van-search__content) {
    border-radius: 8px;
  }
  :deep(.van-search__action) {
    color: #fff;
  }
  
  .result-area {
    flex: 1;
    overflow-y: auto;
    
    .summary-line {
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text-color-secondary);
    }
    
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
    
    .top-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .name {
        font-size: 15px;
        color: var(--text-color-primary);
      }
      .amount {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        &.is-income {
          color: var(--brand-income);
        }
      }
    }
    
    .bottom-line {
      display: flex;
      font-size: 12px;
      color: var(--text-color-secondary);
      
      .time {
        margin-right: 12px;
      }
    }
    
    .empty-state {
      margin-top: 60px;
      
      &.placeholder {
        text-align: center;
        color: var(--text-color-secondary);
        font-size: 14px;
        opacity: 0.6;
      }
    }
  }
}
</style>
