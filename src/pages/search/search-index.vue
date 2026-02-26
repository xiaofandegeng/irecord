<template>
  <div class="search-container">
    <van-search
      v-model="keyword"
      show-action
      shape="round"
      placeholder="输入备注或金额进行搜索"
      background="transparent"
      @cancel="onCancel"
    >
      <template #action>
        <div class="header-actions">
          <span class="filter-btn" @click.stop="showFilter = true">
            <van-icon name="filter-o" />
            <span class="badged" v-if="hasFilter"></span>
            筛选
          </span>
          <span @click="onCancel">取消</span>
        </div>
      </template>
    </van-search>
    
    <div class="result-area">
      <template v-if="filteredRecords.length > 0">
        <div class="summary-line">
          共找到 {{ filteredRecords.length }} 笔记录，总计 ¥ {{ accountStore.privacyMode ? '****' : totalSum.toFixed(2) }}
        </div>
        
        <van-cell-group inset class="custom-inset-group">
          <van-cell 
            v-for="record in filteredRecords" 
            :key="record.id"
            center
            class="record-cell"
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
            </template>
          </van-cell>
        </van-cell-group>
      </template>
      
      <div v-else-if="keyword" class="empty-state">
        <van-empty image="search" description="未搜索到相关账单" />
      </div>
      
      <div v-else class="empty-state placeholder">
        输入关键字或使用高级筛选搜一搜历史痕迹...
      </div>
    </div>

    <!-- 高级筛选侧边栏 -->
    <van-popup v-model:show="showFilter" position="right" :style="{ width: '85%', height: '100%' }">
      <div class="filter-drawer">
        <div class="drawer-header">高级筛选</div>
        <div class="drawer-body">
           <!-- Type -->
           <div class="filter-group">
             <div class="g-title">收支类型</div>
             <div class="tag-list">
               <van-tag :plain="filterState.type !== 0" :type="filterState.type === 0 ? 'primary' : 'default'" size="large" @click="filterState.type = 0">全部</van-tag>
               <van-tag :plain="filterState.type !== 1" :type="filterState.type === 1 ? 'primary' : 'default'" size="large" @click="filterState.type = 1">支出</van-tag>
               <van-tag :plain="filterState.type !== 2" :type="filterState.type === 2 ? 'primary' : 'default'" size="large" @click="filterState.type = 2">收入</van-tag>
             </div>
           </div>
           
           <!-- Accounts -->
           <div class="filter-group">
             <div class="g-title">挂载资产账户</div>
             <div class="tag-list">
                <van-tag 
                  v-for="acc in accountStore.accounts" 
                  :key="acc.id"
                  :plain="!filterState.accounts.includes(acc.id)"
                  :type="filterState.accounts.includes(acc.id) ? 'primary' : 'default'"
                  size="large"
                  @click="toggleAccount(acc.id)"
                >{{ acc.name }}</van-tag>
             </div>
           </div>

           <!-- Amount Range -->
           <div class="filter-group">
             <div class="g-title">金额区间 (元)</div>
             <div class="amount-inputs">
               <van-field v-model="filterState.minAmount" type="number" placeholder="最低" class="amt-input" />
               <span class="sep">-</span>
               <van-field v-model="filterState.maxAmount" type="number" placeholder="最高" class="amt-input" />
             </div>
           </div>
           
           <!-- Tags filter -->
           <div class="filter-group" v-if="store.globalTags && store.globalTags.length > 0">
             <div class="g-title">包含标签 (并集)</div>
             <div class="tag-list">
                <van-tag 
                  v-for="tag in store.globalTags" 
                  :key="tag"
                  :plain="!filterState.tags.includes(tag)"
                  :type="filterState.tags.includes(tag) ? 'primary' : 'default'"
                  size="large"
                  @click="toggleTag(tag)"
                >#{{ tag }}</van-tag>
             </div>
           </div>
        </div>
        <div class="drawer-footer">
          <van-button class="btn" plain @click="resetFilter">重置</van-button>
          <van-button class="btn" type="primary" @click="showFilter = false">查看结果</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'

const router = useRouter()
const store = useRecordStore()
const accountStore = useAccountStore()

const keyword = ref('')

const filterState = reactive({
  type: 0,
  accounts: [] as string[],
  minAmount: '',
  maxAmount: '',
  tags: [] as string[]
})
const showFilter = ref(false)

const toggleAccount = (id: string) => {
  const idx = filterState.accounts.indexOf(id)
  if (idx > -1) filterState.accounts.splice(idx, 1)
  else filterState.accounts.push(id)
}

const toggleTag = (tag: string) => {
  const idx = filterState.tags.indexOf(tag)
  if (idx > -1) filterState.tags.splice(idx, 1)
  else filterState.tags.push(tag)
}

const resetFilter = () => {
  filterState.type = 0
  filterState.accounts = []
  filterState.minAmount = ''
  filterState.maxAmount = ''
  filterState.tags = []
}

const hasFilter = computed(() => {
  return filterState.type !== 0 || filterState.accounts.length > 0 || filterState.minAmount !== '' || filterState.maxAmount !== '' || filterState.tags.length > 0
})

const filteredRecords = computed(() => {
  if (!keyword.value && !hasFilter.value) return []
  
  let list = store.currentLedgerRecords

  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(r => {
      const remarkMatch = (r.remark || '').toLowerCase().includes(kw)
      const amountMatch = String(r.amount).includes(kw)
      const catMatch = getCategoryName(r.categoryId).toLowerCase().includes(kw)
      const tagMatch = (r.tags || []).some(t => t.toLowerCase().includes(kw))
      
      return remarkMatch || amountMatch || catMatch || tagMatch
    })
  }
  
  if (filterState.type !== 0) {
    list = list.filter(r => r.type === filterState.type)
  }
  if (filterState.accounts.length > 0) {
    list = list.filter(r => r.accountId && filterState.accounts.includes(r.accountId))
  }
  if (filterState.minAmount) {
    const min = parseFloat(filterState.minAmount)
    if (!isNaN(min)) list = list.filter(r => r.amount >= min)
  }
  if (filterState.maxAmount) {
    const max = parseFloat(filterState.maxAmount)
    if (!isNaN(max)) list = list.filter(r => r.amount <= max)
  }
  if (filterState.tags.length > 0) {
    list = list.filter(r => r.tags && filterState.tags.some(t => r.tags!.includes(t)))
  }

  return list.sort((a,b) => b.recordTime - a.recordTime)
})

const totalSum = computed(() => {
  return filteredRecords.value.reduce((sum, r) => {
    return sum + ((r.type === 1 ? -r.amount : r.amount) * (r.exchangeRate || 1))
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
  
  :deep(.van-search) {
    padding-top: max(12px, env(safe-area-inset-top));
  }
  
  :deep(.van-search__content) {
    border-radius: 16px;
  }
  :deep(.van-search__action) {
    color: var(--text-color-primary);
  }
  
  .result-area {
    flex: 1;
    overflow-y: auto;
    
    .summary-line {
      padding: 12px 20px;
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .custom-inset-group {
      margin: 0 16px 20px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      
      [data-theme='dark'] & {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      }
    }
    
    .record-cell {
      background-color: var(--bg-color-primary);
      padding: 14px 16px;
      transition: background-color 0.2s;
      
      &:active {
        background-color: var(--van-active-color);
      }
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
      margin-bottom: 4px;
      
      .time {
        margin-right: 12px;
      }
    }

    .tags-line {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      
      .mini-tag {
        font-size: 10px;
        padding: 0 4px;
        border-radius: 4px;
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--text-color-primary);
    cursor: pointer;
    font-size: 14px;
    
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      position: relative;
      
      .badged {
        position: absolute;
        top: 0;
        right: 28px;
        width: 6px;
        height: 6px;
        background-color: #ee0a24;
        border-radius: 50%;
      }
    }
  }
  
  .filter-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--bg-color-secondary);
    
    .drawer-header {
      padding: 16px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      background-color: var(--van-primary-color);
      color: #fff;
    }
    
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      .filter-group {
        margin-bottom: 24px;
        
        .g-title {
          font-size: 14px;
          color: var(--text-color-secondary);
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .amount-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .amt-input {
            flex: 1;
            background-color: rgba(0,0,0,0.02);
            border-radius: 4px;
            padding: 4px 8px;
          }
          .sep {
            color: var(--text-color-secondary);
          }
        }
      }
    }
    
    .drawer-footer {
      display: flex;
      padding: 12px 16px;
      gap: 12px;
      border-top: 1px solid rgba(0,0,0,0.05);
      background-color: var(--bg-color-primary);
      
      .btn {
        flex: 1;
      }
    }
  }
}
</style>
