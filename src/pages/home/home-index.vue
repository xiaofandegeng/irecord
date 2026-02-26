<template>
  <div class="icost-home-container">
    <!-- 顶部 Header 区 -->
    <div class="header-section">
      <div class="header-tools">
        <!-- 账本切换 -->
        <div class="ledger-switch" @click="showLedgerPicker = true">
          <van-icon :name="ledgerStore.currentLedger.icon" />
          <span>{{ ledgerStore.currentLedger.name }}</span>
          <van-icon name="arrow-down" class="arrow" />
        </div>
        
        <!-- iCost 风格中心切换器 -->
        <div class="type-switch-pill">
          <div 
            class="pill-item" 
            :class="{ active: recordType === 1 }" 
            @click="recordType = 1"
          >支出</div>
          <div 
            class="pill-item" 
            :class="{ active: recordType === 2 }" 
            @click="recordType = 2"
          >收入</div>
          <div 
            class="pill-item" 
            :class="{ active: recordType === 3 }" 
            @click="recordType = 3"
          >转账</div>
        </div>
        
        <div class="right-placeholder">
          <!-- 预留右侧按钮位置，目前可用以展示预算极简提示或什么都不放 -->
        </div>
      </div>
    </div>

    <!-- 中间：分类滚动区 或 转账账户区 -->
    <div class="category-scroll-area">
      <template v-if="recordType !== 3">
        <!-- 如果有模板，也可以像 tags 一样横向滑动展现在顶部 -->
        <div class="template-bar" v-if="currentTypeTemplates.length > 0">
          <div class="template-scroll">
            <van-tag
              v-for="tpl in currentTypeTemplates"
              :key="tpl.id"
              round type="primary" plain closeable
              @click="applyTemplate(tpl)"
              @close.stop="onDeleteTemplate(tpl)"
              class="tpl-tag"
            >
              {{ tpl.name }}
            </van-tag>
          </div>
        </div>

        <div class="category-grid">
          <div 
            v-for="cat in currentCategories" 
            :key="cat.id"
            class="category-item"
            :class="{ active: selectedCategoryId === cat.id }"
            @click="selectCategory(cat.id)"
          >
            <div class="icon-wrap">
              <van-icon :name="cat.icon" size="26" />
            </div>
            <span class="name">{{ cat.name }}</span>
          </div>
          
          <!-- 管理分类入口 -->
          <div class="category-item" @click="openCategoryManage">
            <div class="icon-wrap dashed-wrap">
              <van-icon name="setting-o" size="24" />
            </div>
            <span class="name text-secondary">设置</span>
          </div>
        </div>
      </template>

      <!-- 转账特有界面 -->
      <template v-else>
        <div class="transfer-accounts-wrapper">
          <div class="transfer-account-item" @click="showAccountPicker = true">
            <span class="label text-secondary">转出账户</span>
            <div class="value-wrap">
              <span class="value" :style="{ color: currentAccount?.color || '#333' }">{{ currentAccount?.name || '选择账户' }}</span>
              <van-icon name="arrow" color="#ccc" />
            </div>
          </div>
          <div class="transfer-swap-icon" @click="swapAccounts">
            <van-icon name="exchange" size="28" color="var(--van-primary-color)" />
          </div>
          <div class="transfer-account-item" @click="showToAccountPicker = true">
            <span class="label text-secondary">转入账户</span>
            <div class="value-wrap">
              <span class="value" :style="{ color: currentToAccount?.color || '#333' }">{{ currentToAccount?.name || '选择账户' }}</span>
              <van-icon name="arrow" color="#ccc" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部：固定操作与键盘区 -->
    <div class="bottom-action-area">
      <!-- 快捷工具行 (横向可滑动) -->
      <div class="tools-row">
        <div class="tool-pill" @click="showCalendar = true">
          <van-icon name="clock-o" />
          <span>{{ displayDate }}</span>
        </div>
        <div class="tool-pill" @click="showAccountPicker = true" v-if="recordType !== 3">
          <van-icon name="gold-coin-o" />
          <span>{{ currentAccount?.name || '选择账户' }}</span>
        </div>
        <div class="tool-pill" @click="showGoalPicker = true" v-if="recordType === 1 && goalStore.goals.length > 0">
          <van-icon name="flag-o" />
          <span>{{ currentGoal?.name || '心愿单' }}</span>
        </div>
        <div class="tool-pill" @click="showCurrencyPicker = true" v-if="selectedCurrency !== (ledgerStore.currentLedger.baseCurrency || 'CNY')">
          <van-icon name="exchange" />
          <span>{{ selectedCurrency }} 汇率:</span>
          <input type="number" v-model="exchangeRate" class="inline-input" />
        </div>
        <!-- 报销开关 -->
        <div class="tool-pill no-bg" v-if="recordType === 1">
          <van-checkbox v-model="isReimbursable" shape="square" icon-size="14px" checked-color="var(--van-primary-color)">
            <span class="checkbox-label">可报销</span>
          </van-checkbox>
        </div>
        <!-- 存为模板按钮 -->
        <div class="tool-pill" @click="showSaveTemplate = true" v-if="amountVal !== '0'">
          <van-icon name="star-o" />
          <span>设为模板</span>
        </div>
        <div class="tool-pill" v-if="recordType === 1">
          <van-uploader v-model="fileList" multiple :max-count="3" :after-read="onAfterRead">
            <div class="flex-center">
              <van-icon name="photograph" />
              <span style="margin-left:4px">小票/识别</span>
            </div>
          </van-uploader>
        </div>
      </div>

      <!-- 核心栏: 类别、备注与金额展示 -->
      <div class="input-bar">
        <div class="selected-cat">
          <div class="icon-indicator" v-if="recordType !== 3">
            <van-icon :name="selectedCategoryData?.icon || 'apps-o'" size="20" />
          </div>
          <div class="icon-indicator transfer" v-else>
            <van-icon name="exchange" size="20" />
          </div>
          <span class="name">{{ recordType === 3 ? '内部转账' : (selectedCategoryData?.name || '默认') }}</span>
        </div>
        
        <div class="remark-wrapper">
          <input type="text" v-model="remark" placeholder="写点备注..." class="remark-input" />
        </div>

        <div class="amount-display-wrapper">
          <span class="currency-symbol">{{ currentCurrencySymbol }}</span>
          <span class="amount-value" :class="{'is-zero': amountVal === '0'}">{{ amountVal }}</span>
        </div>
      </div>

      <!-- 常驻底部的键盘 -->
      <div class="keyboard-wrapper">
        <CustomKeyboard 
          v-model="amountVal"
          @confirm="submitRecord"
        />
      </div>
    </div>

    <!-- 各种弹出层与联动组件 -->
    <van-calendar v-model:show="showCalendar" @confirm="onConfirmDate" :min-date="minDate" :max-date="maxDate" color="var(--van-primary-color)" />
    <van-action-sheet v-model:show="showAccountPicker" :actions="accountActions" cancel-text="取消" @select="onSelectAccount" title="选择转出账户" />
    <van-action-sheet v-model:show="showToAccountPicker" :actions="toAccountActions" cancel-text="取消" @select="onSelectToAccount" title="选择转入账户" />
    <van-action-sheet v-model:show="showLedgerPicker" :actions="ledgerActions" cancel-text="取消" @select="onSelectLedger" />
    <van-action-sheet v-model:show="showGoalPicker" :actions="goalActions" cancel-text="不存入任何心愿单" @select="onSelectGoal" @cancel="onCancelGoal" />
    <van-dialog v-model:show="showSaveTemplate" title="存为快速记账模板" show-cancel-button @confirm="onConfirmSaveTemplate">
      <van-field v-model="templateName" label="模板名称" placeholder="例如：每日早餐" />
    </van-dialog>
    <van-action-sheet v-model:show="showCurrencyPicker" :actions="currencyActions" cancel-text="取消" close-on-click-action @cancel="showCurrencyPicker = false" @select="onSelectCurrency" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import { useLedgerStore } from '@/stores/ledger'
import { useGoalStore } from '@/stores/goal'
import { useTemplateStore, type TemplateItem } from '@/stores/template'
import CustomKeyboard from '@/components/CustomKeyboard.vue'
import { playHaptic } from '@/utils/haptics'

dayjs.extend(isToday)

const store = useRecordStore()
const accountStore = useAccountStore()
const ledgerStore = useLedgerStore()
const goalStore = useGoalStore()
const templateStore = useTemplateStore()
const router = useRouter()

// 状态
const recordType = ref<1 | 2 | 3>(1)
const amountVal = ref('0')
const remark = ref('')
const selectedCategoryId = ref('')
const selectedTags = ref<string[]>([])
const isReimbursable = ref(false)
const fileList = ref<any[]>([])

// 日期管理
const showCalendar = ref(false)
const selectedDate = ref<Date>(new Date())
const minDate = new Date(2010, 0, 1)
const maxDate = new Date()

const displayDate = computed(() => {
  if (dayjs(selectedDate.value).isToday()) return '今天'
  return dayjs(selectedDate.value).format('MM-DD')
})

const onConfirmDate = (date: Date) => {
  selectedDate.value = date
  showCalendar.value = false
}

const openCategoryManage = () => {
  router.push('/category-manage')
}

const currencyOptions = [
  { text: '人民币 (CNY)', value: 'CNY', symbol: '¥', defaultRate: 1 },
  { text: '美元 (USD)', value: 'USD', symbol: '$', defaultRate: 7.2 },
  { text: '日元 (JPY)', value: 'JPY', symbol: '¥', defaultRate: 0.048 },
  { text: '欧元 (EUR)', value: 'EUR', symbol: '€', defaultRate: 7.8 },
  { text: '英镑 (GBP)', value: 'GBP', symbol: '£', defaultRate: 9.1 },
  { text: '港币 (HKD)', value: 'HKD', symbol: 'HK$', defaultRate: 0.92 },
]
const showCurrencyPicker = ref(false)
const selectedCurrency = ref(ledgerStore.currentLedger.baseCurrency || 'CNY')
const exchangeRate = ref(1)

const selectedAccountId = ref('a1')
const showAccountPicker = ref(false)

const accountActions = computed(() => accountStore.accounts.map(a => ({
  name: a.name, value: a.id, color: selectedAccountId.value === a.id ? 'var(--van-primary-color)' : undefined
})))

const currentAccount = computed(() => accountStore.accounts.find(a => a.id === selectedAccountId.value))
const onSelectAccount = (action: any) => {
  selectedAccountId.value = action.value
  showAccountPicker.value = false
}

// 转账专用：转入账户
const selectedToAccountId = ref('a2')
const showToAccountPicker = ref(false)

const toAccountActions = computed(() => accountStore.accounts.map(a => ({
  name: a.name, value: a.id, color: selectedToAccountId.value === a.id ? 'var(--van-primary-color)' : undefined
})))

const currentToAccount = computed(() => accountStore.accounts.find(a => a.id === selectedToAccountId.value))
const onSelectToAccount = (action: any) => {
  selectedToAccountId.value = action.value
  showToAccountPicker.value = false
}

const swapAccounts = () => {
    playHaptic('light')
    const temp = selectedAccountId.value
    selectedAccountId.value = selectedToAccountId.value
    selectedToAccountId.value = temp
}

// 账本及币种
const showLedgerPicker = ref(false)
const ledgerActions = computed(() => ledgerStore.ledgers.map(l => ({
  name: l.name, value: l.id, color: ledgerStore.currentLedgerId === l.id ? 'var(--van-primary-color)' : undefined
})))

const onSelectLedger = (action: any) => {
  ledgerStore.switchLedger(action.value)
  showLedgerPicker.value = false
}

watch(() => ledgerStore.currentLedgerId, () => {
  selectedCurrency.value = ledgerStore.currentLedger.baseCurrency || 'CNY'
  exchangeRate.value = 1
}, { immediate: true })

const currentCurrencySymbol = computed(() => {
  const c = currencyOptions.find(o => o.value === selectedCurrency.value)
  return c ? c.symbol : '¥'
})

const currencyActions = computed(() => currencyOptions.map(c => ({
  name: c.text, value: c.value, defaultRate: c.defaultRate, color: selectedCurrency.value === c.value ? 'var(--van-primary-color)' : undefined
})))

const onSelectCurrency = (action: any) => {
  selectedCurrency.value = action.value
  exchangeRate.value = action.defaultRate
  showCurrencyPicker.value = false
}

// 心愿单
const selectedGoalId = ref('')
const showGoalPicker = ref(false)
const goalActions = computed(() => goalStore.goals.map(g => ({
  name: g.name, value: g.id, color: selectedGoalId.value === g.id ? 'var(--van-primary-color)' : undefined
})))
const currentGoal = computed(() => goalStore.goals.find(g => g.id === selectedGoalId.value))

const onSelectGoal = (action: any) => {
  selectedGoalId.value = action.value
  showGoalPicker.value = false
}
const onCancelGoal = () => {
  selectedGoalId.value = ''
  showGoalPicker.value = false
}

// 模板
const currentTypeTemplates = computed(() => templateStore.templates.filter(t => t.type === recordType.value))
const showSaveTemplate = ref(false)
const templateName = ref('')

const onConfirmSaveTemplate = () => {
  if (!templateName.value) {
    showToast('请输入模板名称')
    return
  }
  templateStore.addTemplate({
    name: templateName.value, type: recordType.value, amount: parseFloat(amountVal.value),
    categoryId: selectedCategoryId.value, accountId: selectedAccountId.value, remark: remark.value,
    tags: [...selectedTags.value]
  })
  showToast('保存模板成功')
  templateName.value = ''
}

const applyTemplate = (tpl: TemplateItem) => {
  recordType.value = tpl.type
  amountVal.value = tpl.amount.toString()
  selectedCategoryId.value = tpl.categoryId
  if (tpl.accountId) selectedAccountId.value = tpl.accountId
  remark.value = tpl.remark
  if (tpl.tags) selectedTags.value = [...tpl.tags]
}

const onDeleteTemplate = (tpl: TemplateItem) => {
  showConfirmDialog({ title: '确认删除', message: `确认删除模板 ${tpl.name} 吗？` })
    .then(() => templateStore.deleteTemplate(tpl.id)).catch(() => {})
}

// 分类
const currentCategories = computed(() => recordType.value === 1 ? store.expenseCategories : store.incomeCategories)

// 根据选择的类目ID获取类目详情，主要用于展示在 Input Bar 左侧
const selectedCategoryData = computed(() => currentCategories.value.find(c => c.id === selectedCategoryId.value))

watch(recordType, () => {
  if (currentCategories.value.length > 0) {
    selectedCategoryId.value = currentCategories.value[0].id
  }
}, { immediate: true })

const selectCategory = (id: string) => {
  selectedCategoryId.value = id
}

// 小票识别 Mock
const onAfterRead = (_file: any) => {
  showLoadingToast({ message: '正在 AI 识别小票...', forbidClick: true, duration: 0 })
  setTimeout(() => {
    closeToast()
    const mockAmounts = ['128.50', '39.90', '458.00', '12.00']
    const mockRemarks = ['星巴克咖啡厅', '世纪联华', '滴滴出行', '外卖']
    amountVal.value = mockAmounts[Math.floor(Math.random() * mockAmounts.length)]
    remark.value = mockRemarks[Math.floor(Math.random() * mockRemarks.length)]
    showToast({ message: '识别成功', icon: 'passed' })
  }, 1000)
}

const submitRecord = () => {
  const amount = parseFloat(amountVal.value)
  if (amount <= 0 && amountVal.value !== '0') {
    showToast('请输入有效金额')
    return
  }
  if (recordType.value !== 3 && !selectedCategoryId.value) {
    showToast('请选择分类')
    return
  }
  if (recordType.value === 3) {
    if (selectedAccountId.value === selectedToAccountId.value) {
      showToast('转出和转入账户不能相同')
      return
    }
  }

  selectedTags.value.forEach(t => store.addTag(t))

  store.addRecord({
    type: recordType.value,
    amount: amount,
    categoryId: recordType.value === 3 ? 'transfer' : selectedCategoryId.value,
    accountId: selectedAccountId.value, 
    toAccountId: recordType.value === 3 ? selectedToAccountId.value : undefined,
    recordTime: selectedDate.value.getTime(),
    remark: remark.value || (recordType.value === 3 ? '内部转账' : ''),
    tags: [...selectedTags.value],
    goalId: recordType.value === 1 && selectedGoalId.value ? selectedGoalId.value : undefined,
    reimbursable: recordType.value === 1 ? isReimbursable.value : undefined,
    attachments: fileList.value.map(f => f.content).filter(Boolean),
    currency: selectedCurrency.value,
    exchangeRate: Number(exchangeRate.value) || 1
  })
  
  showToast({ message: '记账成功', icon: 'success' })
  
  amountVal.value = '0'
  remark.value = ''
  selectedTags.value = []
  selectedDate.value = new Date()
  selectedGoalId.value = ''
  isReimbursable.value = false
  fileList.value = []
}
</script>

<style lang="scss" scoped>
.icost-home-container {
  display: flex;
  flex-direction: column;
  height: 100vh; // 满屏不原生滚动
  overflow: hidden;
  background-color: var(--bg-color-primary); // 纯粹干净底色

  /* === Top Header === */
  .header-section {
    padding: 16px 20px;
    background-color: var(--bg-color-primary);
    
    .header-tools {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .ledger-switch, .right-placeholder {
        width: 60px; // 保持居中平衡
        display: flex;
        align-items: center;
      }
      
      .ledger-switch {
        font-size: 14px;
        color: var(--text-color-primary);
        font-weight: 500;
        
        .van-icon { margin-right: 4px; }
        .arrow { font-size: 12px; margin-left: 2px; color: var(--text-color-secondary); }
      }

      .type-switch-pill {
        display: flex;
        background-color: var(--bg-color-secondary);
        border-radius: 8px;
        padding: 4px;
        width: 140px;
        
        .pill-item {
          flex: 1;
          text-align: center;
          padding: 6px 0;
          font-size: 14px;
          border-radius: 6px;
          color: var(--text-color-secondary);
          transition: all 0.2s ease;
          
          &.active {
            background-color: var(--van-primary-color);
            color: #fff;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        }
      }
    }
  }

  /* === Middle Category Grid / Transfer === */
  .category-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px; // 留出一点内边距
    background-color: var(--bg-color-primary);
    
    // 隐藏滚动条
    &::-webkit-scrollbar {
      display: none;
    }

    .template-bar {
      margin-top: 8px;
      margin-bottom: 16px;
      .template-scroll {
        display: flex;
        overflow-x: auto;
        gap: 8px;
        &::-webkit-scrollbar { display: none; }
        .tpl-tag { flex-shrink: 0; }
      }
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px 10px;
      padding-top: 10px;
      
      .category-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        cursor: pointer;
        
        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 24px; // 大圆角或纯圆
          background-color: var(--bg-color-secondary);
          color: var(--text-color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          
          &.dashed-wrap {
            background-color: transparent;
            border: 1px dashed var(--border-color);
          }
        }
        
        .name {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-color-regular);
          transition: color 0.2s;
        }

        &.active {
          .icon-wrap {
            background-color: var(--van-primary-color);
            color: #fff;
            transform: scale(1.1);
            box-shadow: 0 4px 10px rgba(var(--van-primary-color-rgb, 100, 100, 100), 0.3);
          }
          .name {
            color: var(--text-color-primary);
            font-weight: 600;
          }
        }
        
        .text-secondary {
          color: var(--text-color-secondary);
        }
      }
    }
  }

  /* === Bottom Fixed Area === */
  .bottom-action-area {
    background-color: var(--bg-color-primary);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);

    .tools-row {
      display: flex;
      overflow-x: auto;
      padding: 10px 16px;
      gap: 10px;
      align-items: center;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-color-primary);
      
      &::-webkit-scrollbar { display: none; }
      
      .tool-pill {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        background-color: var(--bg-color-secondary);
        color: var(--text-color-secondary);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 13px;

        &.no-bg {
          background-color: transparent;
          padding: 0;
        }
        
        .van-icon {
          margin-right: 4px;
          font-size: 14px;
        }

        .inline-input {
          width: 40px; 
          background: transparent; 
          border: none; 
          border-bottom: 1px dashed var(--text-color-secondary); 
          color: var(--text-color-primary); 
          outline: none; 
          margin-left: 4px;
          font-size: 13px;
        }

        .flex-center {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          color: var(--text-color-secondary);
          font-size: 13px;
        }
      }
    }

    .input-bar {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--bg-color-primary);
      
      .selected-cat {
        display: flex;
        align-items: center;
        margin-right: 12px;
        flex-shrink: 0;
        
        .icon-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--van-primary-color);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .name {
          margin-left: 8px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-color-primary);
        }
      }

      .remark-wrapper {
        flex: 1;
        
        .remark-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 15px;
          color: var(--text-color-primary);
          outline: none;
          
          &::placeholder {
            color: var(--text-color-secondary);
          }
        }
      }

      .amount-display-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: base-line;
        justify-content: flex-end;
        color: var(--text-color-primary);
        
        .currency-symbol {
          font-size: 20px;
          font-weight: bold;
          margin-right: 4px;
          margin-bottom: 2px;
          align-self: flex-end;
        }
        
        .amount-value {
          font-size: 36px;
          font-weight: bold;
          font-family: 'Din', 'Arial', sans-serif;
          // Tabular nums 避免变动时宽度跳动
          font-variant-numeric: tabular-nums; 
          line-height: 1;
          
          &.is-zero {
            color: var(--text-color-secondary);
            opacity: 0.5;
          }
        }
      }
    }

    .keyboard-wrapper {
      // 在 iPhone 底部小黑条之上的安全距离
      background-color: var(--bg-color-primary);
    }
  }
}
</style>
