<template>
  <div class="recurring-container">
    <van-nav-bar
      title="周期账单"
      left-arrow
      @click-left="onClickLeft"
      class="transparent-nav"
      :border="false"
    />
    
    <div class="list-area">
      <van-cell-group inset class="custom-inset-group" v-if="recurringStore.rules.length > 0">
        <van-swipe-cell v-for="rule in recurringStore.rules" :key="rule.id">
          <van-cell center class="rule-cell">
            <template #title>
              <div class="title-row">
                <div class="icon-wrap" :class="{'is-income': rule.type === 2}">
                  <van-icon :name="getCategoryIcon(rule.categoryId)" size="20" />
                </div>
                <div class="info">
                  <span class="name">{{ getCategoryName(rule.categoryId) }}</span>
                  <span class="remark" v-if="rule.remark">({{ rule.remark }})</span>
                </div>
              </div>
            </template>
            <template #label>
              <div class="meta-row">
                <van-tag type="primary" plain>每月 {{ rule.cronDayOfMonth }} 号</van-tag>
                <van-tag v-if="rule.isInstallment && rule.totalInstallments" type="warning" plain style="margin-left: 8px;">
                  进度: {{ rule.paidInstallments || 0 }}/{{ rule.totalInstallments }}
                </van-tag>
                <span class="amount" :class="{'is-income': rule.type === 2}">
                  ¥ {{ rule.amount.toFixed(2) }}
                </span>
              </div>
            </template>
            <template #right-icon>
              <van-switch 
                :model-value="rule.isActive" 
                size="20" 
                @change="(val: boolean) => onToggleRule(rule.id, val)" 
              />
            </template>
          </van-cell>
          
          <template #right>
            <van-button square text="删除" type="danger" class="delete-button" @click="onDeleteRule(rule.id)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>
      <div class="empty-state" v-else>
        <EmptyState type="calendar" description="暂无自动化账单，去添加吧" />
      </div>
    </div>
    
    <div class="bottom-action">
      <van-button type="primary" block round @click="showAdd = true">添加周期账单</van-button>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round style="height: 80%">
      <div class="add-panel">
        <div class="panel-header">新建自动记账</div>
        
        <van-tabs v-model:active="newRuleType" type="card" class="type-tabs">
          <van-tab title="支出" :name="1"></van-tab>
          <van-tab title="收入" :name="2"></van-tab>
        </van-tabs>

        <van-field v-model="newRuleAmount" type="number" label="自动金额" placeholder="0.00" />
        
        <van-field
          v-model="newRuleCategoryName"
          is-link
          readonly
          label="记账分类"
          placeholder="请选择"
          @click="showCategoryPicker = true"
        />
        
        <van-field
          v-model="newRuleDateDisplay"
          is-link
          readonly
          label="每月触发日"
          placeholder="请选择日期 (1-28号)"
          @click="showDatePicker = true"
        />

        <van-field v-model="newRuleRemark" label="自动备注" placeholder="例如：房租" />
        
        <van-cell title="作为分期记录 (有限期数)" center style="padding: 10px 16px;">
          <template #right-icon>
            <van-switch v-model="newRuleIsInstallment" size="20" />
          </template>
        </van-cell>
        
        <van-field
          v-if="newRuleIsInstallment"
          v-model="newRuleTotalInstallments"
          type="digit"
          label="分期总数"
          placeholder="例如：24"
        />
        <van-field
          v-if="newRuleIsInstallment"
          v-model="newRulePaidInstallments"
          type="digit"
          label="已付期数"
          placeholder="默认：0"
        />

        <div class="submit-wrap">
          <van-button type="primary" block round @click="onConfirmAdd">保存自动规则</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 分类选择器 -->
    <van-action-sheet v-model:show="showCategoryPicker" title="选择分类">
      <div class="category-grid">
        <div 
          class="cat-item" 
          v-for="cat in availableCategories" 
          :key="cat.id"
          @click="onSelectCategory(cat)"
        >
          <div class="icon-wrap" :class="{'is-active': newRuleCategoryId === cat.id, 'is-income': cat.type === 2}">
            <van-icon :name="cat.icon" size="24" />
          </div>
          <span>{{ cat.name }}</span>
        </div>
      </div>
    </van-action-sheet>

    <!-- 日期选择器 (1-28) -->
    <van-picker-group
      title="选择每月日"
      :tabs="['指定几号']"
      @confirm="onConfirmDate"
      @cancel="showDatePicker = false"
      v-model:show="showDatePicker"
    >
      <van-picker
        :columns="dateColumns"
      />
    </van-picker-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useRecurringStore } from '@/stores/recurring'
import { useRecordStore } from '@/stores/record'

const router = useRouter()
const recurringStore = useRecurringStore()
const recordStore = useRecordStore()

const onClickLeft = () => router.back()

const getCategoryIcon = (id: string) => recordStore.categories.find(c => c.id === id)?.icon || 'question-o'
const getCategoryName = (id: string) => recordStore.categories.find(c => c.id === id)?.name || '未知'

// 列表操作
const onToggleRule = (id: string, val: boolean) => {
  recurringStore.toggleRule(id, val)
}

const onDeleteRule = (id: string) => {
  showConfirmDialog({
    title: '提示',
    message: '确定要删除这条定投/周期规则吗？'
  }).then(() => {
    recurringStore.deleteRule(id)
  }).catch(() => {})
}

// 新建弹窗
const showAdd = ref(false)
const newRuleType = ref<1 | 2>(1)
const newRuleAmount = ref('')
const newRuleRemark = ref('')

const newRuleIsInstallment = ref(false)
const newRuleTotalInstallments = ref('')
const newRulePaidInstallments = ref('')

const showCategoryPicker = ref(false)
const newRuleCategoryId = ref('')
const newRuleCategoryName = ref('')

const availableCategories = computed(() => {
  return recordStore.categories.filter(c => c.type === newRuleType.value)
})

const onSelectCategory = (cat: any) => {
  newRuleCategoryId.value = cat.id
  newRuleCategoryName.value = cat.name
  showCategoryPicker.value = false
}

// 日期选择 1-28 极简策略（因为 29,30,31 不是每个月都有）
const showDatePicker = ref(false)
const newRuleDate = ref(1)
const newRuleDateDisplay = ref('')
const dateColumns = Array.from({length: 28}, (_, i) => ({ text: `${i + 1}号`, value: i + 1 }))

const onConfirmDate = (values: any) => {
  const selected = values[0].selectedValues[0]
  newRuleDate.value = selected
  newRuleDateDisplay.value = `每月 ${selected} 号`
  showDatePicker.value = false
}

const onConfirmAdd = () => {
  if (!newRuleAmount.value || !newRuleCategoryId.value || !newRuleDateDisplay.value) {
    showToast('请完善所有信息')
    return
  }

  recurringStore.addRule({
    type: newRuleType.value,
    amount: parseFloat(newRuleAmount.value),
    categoryId: newRuleCategoryId.value,
    cronDayOfMonth: newRuleDate.value,
    remark: newRuleRemark.value,
    lastTriggerTime: 0, // 设为 0 以便下次启动必定检测一次（并记录当下的触发时间）
    isActive: true,
    isInstallment: newRuleIsInstallment.value,
    totalInstallments: newRuleIsInstallment.value ? parseInt(newRuleTotalInstallments.value) : undefined,
    paidInstallments: newRuleIsInstallment.value ? (parseInt(newRulePaidInstallments.value) || 0) : undefined
  })

  showToast('添加成功')
  showAdd.value = false
  
  // reset
  newRuleAmount.value = ''
  newRuleRemark.value = ''
  newRuleCategoryId.value = ''
  newRuleCategoryName.value = ''
  newRuleDateDisplay.value = ''
  newRuleIsInstallment.value = false
  newRuleTotalInstallments.value = ''
  newRulePaidInstallments.value = ''
}
</script>

<style lang="scss" scoped>
.recurring-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  
  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title, .van-icon {
      color: var(--text-color-primary);
    }
  }
  
  .list-area {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    
    .custom-inset-group {
      margin: 0 16px 20px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      
      [data-theme='dark'] & {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      }
    }
    
    .rule-cell {
      background-color: var(--bg-color-primary);
      padding: 16px;
      transition: background-color 0.2s;
      
      &:active {
        background-color: var(--van-active-color);
      }
      
      .title-row {
        display: flex;
        align-items: center;
        
        .icon-wrap {
          width: 32px;
          height: 32px;
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
        
        .info {
          font-size: 15px;
          color: var(--text-color-primary);
          
          .remark {
            font-size: 12px;
            color: var(--text-color-secondary);
            margin-left: 6px;
          }
        }
      }
      
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        
        .amount {
          font-size: 15px;
          font-weight: bold;
          color: var(--text-color-primary);
          
          &.is-income {
            color: var(--brand-income);
          }
        }
      }
    }
  }

  .bottom-action {
    padding: 24px 16px;
    background-color: transparent;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  
  .add-panel {
    padding: 20px 16px;
    
    .panel-header {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .type-tabs {
      margin-bottom: 20px;
    }
    
    .submit-wrap {
      margin-top: 30px;
    }
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 20px;
    gap: 16px;
    
    .cat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: var(--bg-color-secondary);
        color: var(--text-color-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        transition: all 0.2s;
        
        &.is-active {
          background-color: var(--van-primary-color);
          color: #fff;
          
          &.is-income {
            background-color: #ff976a;
          }
        }
      }
      
      span {
        font-size: 12px;
        color: var(--text-color-secondary);
      }
    }
  }
  
  .delete-button {
    height: 100%;
  }
}
</style>
