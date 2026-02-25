<template>
  <div class="home-container">
    <div class="top-section">
      <div class="header-tools">
        <div class="ledger-switch" @click="showLedgerPicker = true">
          <van-icon :name="ledgerStore.currentLedger.icon" />
          <span>{{ ledgerStore.currentLedger.name }}</span>
          <van-icon name="arrow-down" class="arrow" />
        </div>
        <div class="type-switch">
          <van-tabs v-model:active="recordType" type="card" color="var(--van-primary-color)">
            <van-tab title="支出" :name="1"></van-tab>
            <van-tab title="收入" :name="2"></van-tab>
          </van-tabs>
        </div>
      </div>
      
      <div class="amount-display">
        <span class="currency" @click="showCurrencyPicker = true">
          {{ currentCurrencySymbol }} <van-icon name="arrow-down" style="font-size: 14px;" />
        </span>
        <span class="value">{{ amountVal }}</span>
        <van-icon name="star-o" class="save-tpl-btn" @click="showSaveTemplate = true" v-if="amountVal !== '0'" />
      </div>

      <!-- 快捷模板 (Template Bar) -->
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
      
      <div class="info-bar">
        <div class="info-item">
          <van-icon name="clock-o" />
          <span>今天</span>
        </div>
        <div class="info-item" @click="showAccountPicker = true">
          <van-icon name="gold-coin-o" />
          <span>{{ currentAccount?.name || '选择账户' }}</span>
        </div>
        <div class="info-item" @click="showGoalPicker = true" v-if="recordType === 1 && goalStore.goals.length > 0">
          <van-icon name="flag-o" />
          <span>{{ currentGoal?.name || '不存入心愿' }}</span>
        </div>
        <!-- 报销开关 -->
        <div class="info-item reimbursable-switch" v-if="recordType === 1">
          <van-checkbox v-model="isReimbursable" shape="square" icon-size="14px" checked-color="var(--van-primary-color)">
            <span style="color: #fff; font-size: 13px;">可报销</span>
          </van-checkbox>
        </div>
        <!-- 汇率输入 -->
        <div class="info-item" v-if="selectedCurrency !== (ledgerStore.currentLedger.baseCurrency || 'CNY')">
          <van-icon name="exchange" />
          <span>汇率:</span>
          <input type="number" v-model="exchangeRate" style="width: 50px; background: transparent; border: none; border-bottom: 1px dashed rgba(255,255,255,0.4); color: #fff; outline: none; margin-left: 4px;" />
        </div>
        <div class="info-item remark-input">
          <van-icon name="edit" />
          <input type="text" v-model="remark" placeholder="写点备注..." />
        </div>
      </div>
      
      <!-- Tags Input -->
      <div class="tags-bar">
        <div class="tags-list" v-if="selectedTags.length > 0">
          <van-tag 
            v-for="t in selectedTags" 
            :key="t" 
            closeable 
            size="medium" 
            type="primary" 
            @close="removeTag(t)"
          >
            #{{ t }}
          </van-tag>
        </div>
        <div class="tag-input-wrap">
          <van-icon name="label-o" />
          <input 
            type="text" 
            v-model="newTagInput" 
            placeholder="打个标签 (空格/回车确认)" 
            @keydown.enter="addTag"
            @keydown.space.prevent="addTag"
          />
        </div>
      </div>
      
      <!-- 多媒体凭证附件 与 小票识别 -->
      <div class="attachments-bar" v-if="recordType === 1"> <!-- 改为仅支出时显示，且放宽条件，不仅金额>0时显示 -->
        <div class="attach-title">
          <van-icon name="photograph" /> 附加凭证小票 / 智能识别
        </div>
        <van-uploader 
          v-model="fileList" 
          multiple 
          :max-count="3" 
          :after-read="onAfterRead"
        >
          <div class="ocr-upload-btn">
            <van-icon name="scan" size="24" />
            <span>拍小票</span>
          </div>
        </van-uploader>
      </div>
      
      <!-- 预算进度 -->
      <div class="budget-bar" v-if="store.budget > 0">
        <div class="budget-texts">
          <span>本月剩余: {{ accountStore.privacyMode ? '****' : `¥ ${remainingBudget}` }}</span>
          <span class="pct">{{ budgetProgress.toFixed(0) }}% 已用</span>
        </div>
        <van-progress 
          :percentage="budgetProgress" 
          :show-pivot="false" 
          color="#ff976a" 
          track-color="rgba(255,255,255,0.3)" 
          stroke-width="6" 
        />
      </div>
    </div>

    <div class="category-section">
      <div class="category-grid">
        <div 
          v-for="cat in currentCategories" 
          :key="cat.id"
          class="category-item"
          :class="{ active: selectedCategoryId === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <div class="icon-wrap">
            <van-icon :name="cat.icon" size="24" />
          </div>
          <span class="name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <CustomKeyboard 
      v-model="amountVal"
      class="fixed-keyboard"
      @confirm="submitRecord"
    />

    <!-- 选择账户 -->
    <van-action-sheet 
      v-model:show="showAccountPicker" 
      :actions="accountActions" 
      cancel-text="取消"
      @select="onSelectAccount" 
    />

    <!-- 选择账本 -->
    <van-action-sheet 
      v-model:show="showLedgerPicker" 
      :actions="ledgerActions" 
      cancel-text="取消"
      @select="onSelectLedger" 
    />

    <!-- 选择心愿单 -->
    <van-action-sheet 
      v-model:show="showGoalPicker" 
      :actions="goalActions" 
      cancel-text="不存入任何心愿单"
      @select="onSelectGoal" 
      @cancel="onCancelGoal"
    />

    <!-- 保存模板弹窗 -->
    <van-dialog v-model:show="showSaveTemplate" title="存为快速记账模板" show-cancel-button @confirm="onConfirmSaveTemplate">
      <van-field v-model="templateName" label="模板名称" placeholder="例如：每日早餐" />
    </van-dialog>

    <!-- 多币种选择面板 -->
    <van-action-sheet 
      v-model:show="showCurrencyPicker" 
      :actions="currencyActions" 
      cancel-text="取消" 
      close-on-click-action 
      @cancel="showCurrencyPicker = false" 
      @select="onSelectCurrency" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import { useLedgerStore } from '@/stores/ledger'
import { useGoalStore } from '@/stores/goal'
import { useTemplateStore, type TemplateItem } from '@/stores/template'
import CustomKeyboard from '@/components/CustomKeyboard.vue'

const store = useRecordStore()
const accountStore = useAccountStore()
const ledgerStore = useLedgerStore()
const goalStore = useGoalStore()
const templateStore = useTemplateStore()

// 状态
const recordType = ref<1 | 2>(1)
const amountVal = ref('0')
const remark = ref('')
const selectedCategoryId = ref('')
const newTagInput = ref('')
const selectedTags = ref<string[]>([])
const isReimbursable = ref(false)
const fileList = ref<any[]>([])

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

const accountActions = computed(() => {
  return accountStore.accounts.map(a => ({
    name: a.name,
    value: a.id,
    color: selectedAccountId.value === a.id ? 'var(--van-primary-color)' : undefined
  }))
})

const showLedgerPicker = ref(false)
const ledgerActions = computed(() => {
  return ledgerStore.ledgers.map(l => ({
    name: l.name,
    value: l.id,
    color: ledgerStore.currentLedgerId === l.id ? 'var(--van-primary-color)' : undefined
  }))
})

const onSelectLedger = (action: any) => {
  ledgerStore.switchLedger(action.value)
  showLedgerPicker.value = false
}

// 监视账本切换，预置基准货币
watch(() => ledgerStore.currentLedgerId, () => {
  selectedCurrency.value = ledgerStore.currentLedger.baseCurrency || 'CNY'
  exchangeRate.value = 1
}, { immediate: true })

const currentCurrencySymbol = computed(() => {
  const c = currencyOptions.find(o => o.value === selectedCurrency.value)
  return c ? c.symbol : '¥'
})

const currencyActions = computed(() => {
  return currencyOptions.map(c => ({
    name: c.text,
    value: c.value,
    defaultRate: c.defaultRate,
    color: selectedCurrency.value === c.value ? 'var(--van-primary-color)' : undefined
  }))
})

const onSelectCurrency = (action: any) => {
  selectedCurrency.value = action.value
  exchangeRate.value = action.defaultRate
  showCurrencyPicker.value = false
}

const currentAccount = computed(() => {
  return accountStore.accounts.find(a => a.id === selectedAccountId.value)
})

const onSelectAccount = (action: any) => {
  selectedAccountId.value = action.value
  showAccountPicker.value = false
}

// 心愿单
const selectedGoalId = ref('')
const showGoalPicker = ref(false)
const goalActions = computed(() => {
  return goalStore.goals.map(g => ({
    name: g.name,
    value: g.id,
    color: selectedGoalId.value === g.id ? 'var(--van-primary-color)' : undefined
  }))
})
const currentGoal = computed(() => goalStore.goals.find(g => g.id === selectedGoalId.value))

const onSelectGoal = (action: any) => {
  selectedGoalId.value = action.value
  showGoalPicker.value = false
}
const onCancelGoal = () => {
  selectedGoalId.value = ''
  showGoalPicker.value = false
}

// 模板处理
const currentTypeTemplates = computed(() => {
  return templateStore.templates.filter(t => t.type === recordType.value)
})

const showSaveTemplate = ref(false)
const templateName = ref('')

const onConfirmSaveTemplate = () => {
  if (!templateName.value) {
    showToast('请输入模板名称')
    return
  }
  templateStore.addTemplate({
    name: templateName.value,
    type: recordType.value,
    amount: parseFloat(amountVal.value),
    categoryId: selectedCategoryId.value,
    accountId: selectedAccountId.value,
    remark: remark.value,
    tags: [...selectedTags.value]
  })
  showToast('包存模板成功')
  templateName.value = ''
}

const applyTemplate = (tpl: TemplateItem) => {
  recordType.value = tpl.type
  amountVal.value = tpl.amount.toString()
  selectedCategoryId.value = tpl.categoryId
  if (tpl.accountId) selectedAccountId.value = tpl.accountId
  remark.value = tpl.remark
  if (tpl.tags) selectedTags.value = [...tpl.tags]
  showToast('模板已载入')
}

const onDeleteTemplate = (tpl: TemplateItem) => {
  showConfirmDialog({
    title: '确认删除',
    message: `确认删除模板 ${tpl.name} 吗？`,
  }).then(() => {
    templateStore.deleteTemplate(tpl.id)
  }).catch(() => {})
}

// 获取当前类型下的分类列表
const currentCategories = computed(() => {
  return recordType.value === 1 ? store.expenseCategories : store.incomeCategories
})

// 监听类型变化，重置选中分类
watch(recordType, () => {
  if (currentCategories.value.length > 0) {
    selectedCategoryId.value = currentCategories.value[0].id
  }
}, { immediate: true })

const selectCategory = (id: string) => {
  selectedCategoryId.value = id
}

// 标签操作
const addTag = () => {
  const val = newTagInput.value.trim().replace(/^#/, '')
  if (val && !selectedTags.value.includes(val)) {
    selectedTags.value.push(val)
  }
  newTagInput.value = ''
}

const removeTag = (tag: string) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

// 智能小票识别 (Mock)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onAfterRead = (_file: any | any[]) => {
  // 模拟 OCR 扫描延迟
  showLoadingToast({
    message: '正在 AI 识别小票...',
    forbidClick: true,
    duration: 0,
  })

  setTimeout(() => {
    closeToast()
    // Mock 识别结果
    const mockAmounts = ['128.50', '39.90', '458.00', '12.00']
    const mockRemarks = ['星巴克咖啡厅', '世纪联华超市购物', '滴滴出行', '美团外卖']
    
    amountVal.value = mockAmounts[Math.floor(Math.random() * mockAmounts.length)]
    remark.value = mockRemarks[Math.floor(Math.random() * mockRemarks.length)]
    
    // 如果还没选分类，尝试猜一个餐饮分类
    if (!selectedCategoryId.value || selectedCategoryId.value === currentCategories.value[0]?.id) {
      const foodCat = currentCategories.value.find(c => c.name.includes('餐饮') || c.name.includes('饮食'))
      if (foodCat) {
        selectedCategoryId.value = foodCat.id
      }
    }

    showToast({
      message: '识别成功，已自动填入',
      icon: 'passed'
    })
  }, 1500)
}

// 预算计算
const currentMonthExpense = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  return store.currentLedgerRecords
    .filter(r => r.type === 1)
    .filter(r => {
      if (r.accountId) {
        const acc = accountStore.accounts.find(a => a.id === r.accountId)
        if (acc && acc.type === 4) return false
      }
      const d = new Date(r.recordTime)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .reduce((sum, r) => sum + (r.amount * (r.exchangeRate || 1)), 0)
})

const budgetProgress = computed(() => {
  if (store.budget <= 0) return 0
  const pct = (currentMonthExpense.value / store.budget) * 100
  return Math.min(pct, 100)
})

const remainingBudget = computed(() => {
  return (store.budget - currentMonthExpense.value).toFixed(2)
})

// 提交保存
const submitRecord = () => {
  const amount = parseFloat(amountVal.value)
  if (amount <= 0 && amountVal.value !== '0') {
    showToast('请输入有效金额')
    return
  }
  
  if (!selectedCategoryId.value) {
    showToast('请选择分类')
    return
  }
  
  // 保存全局标签记录
  selectedTags.value.forEach(t => {
    store.addTag(t)
  })

  store.addRecord({
    type: recordType.value,
    amount: amount,
    categoryId: selectedCategoryId.value,
    accountId: selectedAccountId.value, // 使用手动选中的关联账户
    recordTime: Date.now(),
    remark: remark.value,
    tags: [...selectedTags.value],
    goalId: recordType.value === 1 && selectedGoalId.value ? selectedGoalId.value : undefined, // 如果选了心愿单且是支出，绑定
    reimbursable: recordType.value === 1 ? isReimbursable.value : undefined, // 仅支出支持标记为待报销
    attachments: fileList.value.map(f => f.content).filter(Boolean),
    currency: selectedCurrency.value,
    exchangeRate: Number(exchangeRate.value) || 1
  })
  
  showToast({
    message: '记账成功',
    icon: 'success'
  })
  
  // 重置状态
  amountVal.value = '0'
  remark.value = ''
  selectedTags.value = []
  newTagInput.value = ''
  selectedGoalId.value = '' // 清除刚才绑定的心愿单
  isReimbursable.value = false // 重置待报销状态
  fileList.value = [] // 清空附件
  selectedCurrency.value = ledgerStore.currentLedger.baseCurrency || 'CNY'
  exchangeRate.value = 1
}
</script>

<style lang="scss" scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .top-section {
    padding: 16px 16px 0;
    background-color: var(--van-primary-color);
    color: #fff;
    
    .header-tools {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      .ledger-switch {
        display: flex;
        align-items: center;
        font-size: 14px;
        background-color: rgba(255,255,255,0.15);
        padding: 4px 10px;
        border-radius: 12px;
        
        .van-icon {
          margin-right: 4px;
        }
        .arrow {
          margin-left: 2px;
          margin-right: 0;
          font-size: 12px;
          opacity: 0.8;
        }
      }

      .type-switch {
        display: flex;
        justify-content: center;
        
        :deep(.van-tabs__nav--card) {
          border-color: #fff;
          .van-tab {
            color: #fff;
            border-right-color: #fff;
            &.van-tab--active {
              color: var(--van-primary-color);
              background-color: var(--bg-color-primary);
            }
          }
        }
      }
    }
    
    .amount-display {
      font-size: 36px;
      font-weight: 500;
      display: flex;
      align-items: baseline;
      margin-bottom: 16px;
      position: relative;
      
      .currency {
        font-size: 24px;
        margin-right: 4px;
      }

      .save-tpl-btn {
        font-size: 20px;
        margin-left: 12px;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        &:active { opacity: 0.6; }
      }
    }

    .template-bar {
      margin-bottom: 12px;
      width: 100%;
      overflow-x: auto;
      
      // hide scrollbar
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
      
      .template-scroll {
        display: flex;
        gap: 10px;
        padding: 2px 0;
        
        .tpl-tag {
          font-size: 12px;
          padding: 4px 10px;
          background-color: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          white-space: nowrap;
          
          :deep(.van-tag__close) {
            margin-left: 6px;
            opacity: 0.7;
          }
        }
      }
    }
    
      .info-bar {
        display: flex;
        align-items: center;
        padding-bottom: 12px;
        font-size: 14px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        
        .info-item {
          display: flex;
          align-items: center;
          margin-right: 16px;
          
          .van-icon {
            margin-right: 4px;
          }
        }
        
        .reimbursable-switch {
          margin-right: 12px;
          opacity: 0.9;
          :deep(.van-checkbox__label) {
            margin-left: 4px;
          }
        }
        
        .remark-input {
          flex: 1;
          input {
            flex: 1;
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            &::placeholder {
              color: rgba(255,255,255,0.6);
            }
          }
        }
      }

      .tags-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 8px 0;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.2);

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag-input-wrap {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 120px;
          font-size: 13px;
          
          .van-icon {
            margin-right: 4px;
            opacity: 0.8;
          }

          input {
            flex: 1;
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            &::placeholder {
              color: rgba(255,255,255,0.6);
            }
          }
        }
      }
      
      .attachments-bar {
        padding: 12px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        
        .attach-title {
          font-size: 13px;
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          opacity: 0.9;
          
          .van-icon {
            margin-right: 4px;
          }
        }

        :deep(.van-uploader__preview-image) {
          border-radius: 8px;
        }
        
        .ocr-upload-btn {
          width: 80px;
          height: 80px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          gap: 6px;
          border: 1px dashed rgba(255,255,255,0.3);
          
          span {
            font-size: 11px;
            opacity: 0.9;
          }
        }
      }
      
      .budget-bar {
        padding: 12px 0 16px;
        
        .budget-texts {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
          opacity: 0.9;
          
          .pct {
            font-size: 11px;
            opacity: 0.8;
          }
        }
      }
    }
  
  .category-section {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg-color-primary);
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px 0;
      padding: 16px 0;
      
      .category-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-color-primary);
        
        .icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--bg-color-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
          transition: all 0.2s;
        }
        
        .name {
          font-size: 12px;
        }
        
        &:active {
          transform: scale(0.92);
          opacity: 0.8;
        }
        
        &.active {
          .icon-wrap {
            background-color: var(--van-primary-color);
            color: #fff;
            transform: scale(1.1);
          }
          .name {
            color: var(--van-primary-color);
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .fixed-keyboard {
    position: sticky;
    bottom: 0;
    width: 100%;
    z-index: 100;
  }
}
</style>
