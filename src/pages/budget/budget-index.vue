<template>
  <div class="budget-container">
    <van-nav-bar
      title="预算中心"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
      class="custom-nav-bar"
    />

    <!-- 顶部全局概览卡片 -->
    <div class="budget-hero-card">
      <div class="header-row">
        <span>本月总预算</span>
        <div class="settings-wrap" @click="showGlobalBudgetEdit = true">
          <span class="din-font">{{ settingStore.rolloverBudget ? '结转已开启' : '总额设定' }}</span>
          <van-icon name="edit" />
        </div>
      </div>
      <div class="budget-display din-font">
        <span class="currency">¥</span>
        <span class="amount">{{ totalMonthlyBudget }}</span>
      </div>
      
      <div class="progress-section">
        <div class="info-row">
          <span>{{ remainingBudget >= 0 ? '剩余可用' : '已超支' }}</span>
          <span class="din-font percentage">{{ budgetPercentage }}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div 
            class="progress-fill" 
            :class="{ 'is-danger': remainingBudget < 0, 'is-warning': remainingBudget >= 0 && remainingBudget < totalMonthlyBudget * 0.2 }"
            :style="{ width: `${Math.min(100, (currentMonthExpense / (totalMonthlyBudget || 1)) * 100)}%` }"
          ></div>
        </div>
        <div class="stats-row din-font">
          <div class="stat-item">
            <span class="label">已用</span>
            <span class="val">{{ currentMonthExpense.toFixed(2) }}</span>
          </div>
          <div class="stat-item end">
            <span class="label">剩余</span>
            <span class="val" :class="{'danger-text': remainingBudget < 0}">{{ remainingBudget.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 高级结转开关 -->
    <div class="rollover-switch-card">
      <div class="info">
        <div class="title"><van-icon name="exchange" size="18" /> 预算自动结转</div>
        <div class="desc">上月未用完的预算将自动计入本月</div>
      </div>
      <van-switch v-model="settingStore.rolloverBudget" size="24px" active-color="var(--van-primary-color)" />
    </div>

    <!-- 分类独立子预算 -->
    <div class="category-budget-section">
      <div class="section-title">分类子预算</div>
      
      <van-cell-group inset class="budget-list">
        <template v-for="cat in categoryBudgets" :key="cat.id">
          <van-cell class="budget-cell" @click="onEditCategoryBudget(cat)">
            <template #title>
              <div class="cat-title">
                <div class="icon-wrap"><van-icon :name="cat.icon" /></div>
                <span>{{ cat.name }}</span>
              </div>
            </template>
            <template #label>
              <div class="mini-progress">
                <div class="mini-fill" 
                     :class="{'is-danger': cat.spent > cat.budgetLimit}"
                     :style="{width: `${Math.min(100, (cat.spent / cat.budgetLimit) * 100)}%`}"></div>
              </div>
              <div class="mini-stats din-font">
                已用 {{ cat.spent.toFixed(0) }} / 剩 {{ (cat.budgetLimit - cat.spent).toFixed(0) }}
              </div>
            </template>
            <template #value>
              <div class="limit-val din-font">{{ cat.budgetLimit }} <van-icon name="edit" /></div>
            </template>
          </van-cell>
        </template>
        
        <van-cell v-if="unsetCategories.length > 0" class="add-cat-btn" is-link @click="showAddCategoryPicker = true">
          <template #title>
            <span class="add-text"><van-icon name="plus" /> 为某个分类添加预算限额</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 弹窗：全局预算设定 -->
    <van-dialog v-model:show="showGlobalBudgetEdit" title="设定全局月度预算" show-cancel-button @confirm="onConfirmGlobalBudget">
      <div class="dialog-content">
        <van-field v-model="tempGlobalBudget" type="number" placeholder="请输入本月预算金额..." input-align="center" class="budget-input" />
      </div>
    </van-dialog>

    <!-- 弹窗：分类子预算设定 -->
    <van-dialog v-model:show="showCategoryEdit" :title="`设定 [${currentEditingCategory?.name}] 额度`" show-cancel-button @confirm="onConfirmCategoryBudget">
      <div class="dialog-content">
        <van-field v-model="tempCategoryLimit" type="number" placeholder="金额（输入 0 则移除）" input-align="center" class="budget-input" />
        <div class="tip">如该子分类预算不足，也可超额支出。总计入全局预算。</div>
      </div>
    </van-dialog>

    <!-- 分类选择器 -->
    <van-action-sheet 
      v-model:show="showAddCategoryPicker" 
      :actions="addCategoryActions" 
      cancel-text="取消" 
      @select="onSelectAddCategory"
      title="选择一个分类" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore, type Category } from '@/stores/record'
import { useSettingStore } from '@/stores/setting'
import { getCustomBillingMonthRange } from '@/utils/date'
import dayjs from 'dayjs'
import { showToast } from 'vant'

const router = useRouter()
const store = useRecordStore()
const settingStore = useSettingStore()

// 基础统计
const now = new Date()
const startDay = settingStore.billingStartDay
const { start: currentMonthStart, end: currentMonthEnd } = getCustomBillingMonthRange(now, startDay)
const { start: lastMonthStart, end: lastMonthEnd } = getCustomBillingMonthRange(dayjs(now).subtract(1, 'month').toDate(), startDay)

const getMonthExpense = (start: number, end: number) => {
  return store.currentLedgerRecords.reduce((acc, r) => {
    if (r.type === 1 && r.recordTime >= start && r.recordTime <= end) {
      return acc + r.amount * (r.exchangeRate || 1)
    }
    return acc
  }, 0)
}

const currentMonthExpense = computed(() => getMonthExpense(currentMonthStart, currentMonthEnd))
const lastMonthExpense = computed(() => getMonthExpense(lastMonthStart, lastMonthEnd))

// 如果开启了结转，总预算 = 设定预算 + (上月设定的预算 - 上月消费) 
// (简化为仅结转一个月盈余，不追溯历史)
const totalMonthlyBudget = computed(() => {
  let baseBudget = store.budget || 0
  if (baseBudget <= 0) return 0
  
  if (settingStore.rolloverBudget) {
    const lastSurplus = baseBudget - lastMonthExpense.value
    if (lastSurplus > 0) {
      return baseBudget + lastSurplus
    }
  }
  return baseBudget
})

const remainingBudget = computed(() => {
  return totalMonthlyBudget.value - currentMonthExpense.value
})

const budgetPercentage = computed(() => {
  if (totalMonthlyBudget.value <= 0) return 0
  return Math.min(100, Math.round((currentMonthExpense.value / totalMonthlyBudget.value) * 100))
})


// 分类预算计算
const categoriesExpenseMap = computed(() => {
  const map: Record<string, number> = {}
  store.currentLedgerRecords.forEach(r => {
    if (r.type === 1 && r.recordTime >= currentMonthStart && r.recordTime <= currentMonthEnd) {
      map[r.categoryId] = (map[r.categoryId] || 0) + r.amount * (r.exchangeRate || 1)
    }
  })
  return map
})

const categoryBudgets = computed(() => {
  return store.expenseCategories
    .filter(c => c.budgetLimit && c.budgetLimit > 0)
    .map(c => ({
      ...c,
      budgetLimit: c.budgetLimit!,
      spent: categoriesExpenseMap.value[c.id] || 0
    }))
})

const unsetCategories = computed(() => {
  return store.expenseCategories.filter(c => !c.budgetLimit || c.budgetLimit <= 0)
})

// 全局预算设定
const showGlobalBudgetEdit = ref(false)
const tempGlobalBudget = ref('')
const onConfirmGlobalBudget = () => {
  const val = parseFloat(tempGlobalBudget.value)
  if (!isNaN(val) && val >= 0) {
    store.setBudget(val)
    showToast('更新成功')
  } else {
    showToast('请输入有效金额')
  }
  tempGlobalBudget.value = ''
}

// 分类预算设定
const showCategoryEdit = ref(false)
const currentEditingCategory = ref<Category | null>(null)
const tempCategoryLimit = ref('')

const onEditCategoryBudget = (cat: any) => {
  currentEditingCategory.value = cat
  tempCategoryLimit.value = String(cat.budgetLimit || '')
  showCategoryEdit.value = true
}

const onConfirmCategoryBudget = () => {
  const val = parseFloat(tempCategoryLimit.value)
  if (currentEditingCategory.value) {
    if (!isNaN(val) && val >= 0) {
      store.setCategoryBudgetLimit(currentEditingCategory.value.id, val)
    } else {
      store.setCategoryBudgetLimit(currentEditingCategory.value.id, 0)
    }
    showToast('分类限额更新成功')
  }
  tempCategoryLimit.value = ''
  currentEditingCategory.value = null
}

const showAddCategoryPicker = ref(false)
const addCategoryActions = computed(() => {
  return unsetCategories.value.map(c => ({
    name: c.name,
    value: c.id
  }))
})

const onSelectAddCategory = (action: any) => {
  showAddCategoryPicker.value = false
  const cat = store.categories.find(c => c.id === action.value)
  if (cat) {
    onEditCategoryBudget(cat)
  }
}
</script>

<style lang="scss" scoped>
.budget-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .budget-hero-card {
    margin: 16px;
    padding: 24px 20px;
    background: linear-gradient(135deg, var(--van-primary-color) 0%, #039f4e 100%);
    border-radius: 20px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(7, 193, 96, 0.25);
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      opacity: 0.9;
      
      .settings-wrap {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.15);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        backdrop-filter: blur(4px);
        
        .van-icon {
          margin-left: 4px;
        }
      }
    }
    
    .budget-display {
      margin-top: 12px;
      .currency { font-size: 24px; margin-right: 4px; }
      .amount { font-size: 44px; font-weight: bold; letter-spacing: -0.5px; }
    }
    
    .progress-section {
      margin-top: 24px;
      
      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 8px;
        .percentage { font-weight: bold; }
      }
      
      .progress-bar-wrap {
        height: 8px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background-color: #fff;
          border-radius: 4px;
          transition: width 0.5s ease;
          
          &.is-warning { background-color: #ff976a; }
          &.is-danger { background-color: #ee0a24; }
        }
      }
      
      .stats-row {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 16px;
        
        .stat-item {
          display: flex;
          flex-direction: column;
          
          .label {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 4px;
          }
          .val { font-weight: bold; }
          .danger-text { color: #ffe1e1; } // 红色偏粉以适应绿色背景
          
          &.end { text-align: right; }
        }
      }
    }
  }

  .rollover-switch-card {
    margin: 0 16px 16px;
    padding: 16px 20px;
    background-color: var(--bg-color-primary);
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    
    .info {
      .title { 
        font-size: 16px; 
        font-weight: 600; 
        display: flex; 
        align-items: center;
        color: var(--text-color-primary);
        .van-icon { margin-right: 6px; color: var(--van-primary-color); }
      }
      .desc { 
        font-size: 13px; 
        color: var(--text-color-secondary); 
        margin-top: 4px; 
      }
    }
  }

  .category-budget-section {
    margin: 0 16px;
    
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 12px;
      margin-left: 4px;
    }
    
    .budget-list {
      background-color: transparent;
      
      .budget-cell {
        margin-bottom: 12px;
        border-radius: 16px;
        overflow: visible;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        
        .cat-title {
          display: flex;
          align-items: center;
          font-weight: 500;
          font-size: 15px;
          color: var(--text-color-primary);
          
          .icon-wrap {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--bg-color-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            color: var(--text-color-regular);
          }
        }
        
        .mini-progress {
          margin-top: 8px;
          height: 4px;
          background-color: var(--bg-color-secondary);
          border-radius: 2px;
          
          .mini-fill {
            height: 100%;
            background-color: var(--van-primary-color);
            border-radius: 2px;
            
            &.is-danger { background-color: var(--van-danger-color); }
          }
        }
        
        .mini-stats {
          margin-top: 4px;
          font-size: 11px;
          color: var(--text-color-secondary);
        }
        
        .limit-val {
          font-size: 16px;
          color: var(--text-color-primary);
          font-weight: bold;
          margin-top: 6px;
          
          .van-icon {
            font-size: 14px;
            color: var(--text-color-secondary);
            margin-left: 2px;
          }
        }
      }
      
      .add-cat-btn {
        border-radius: 16px;
        text-align: center;
        background-color: var(--bg-color-primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        
        .add-text {
          color: var(--van-primary-color);
          font-weight: 500;
        }
      }
    }
  }

  .dialog-content {
    padding: 24px 20px;
    
    .budget-input {
      font-size: 24px;
      font-weight: bold;
      background-color: var(--bg-color-secondary);
      border-radius: 12px;
      padding: 12px;
      font-family: 'Din', 'Arial', sans-serif;
    }
    
    .tip {
      margin-top: 12px;
      font-size: 12px;
      color: var(--text-color-secondary);
      text-align: center;
      line-height: 1.4;
    }
  }
}
</style>
