<template>
  <div class="goal-manage-container">
    <van-nav-bar
      title="心愿单与存钱计划"
      left-arrow
      @click-left="onClickLeft"
      class="transparent-nav"
      :border="false"
    />
    
    <div class="goal-list">
      <div class="summary-card" v-if="store.goals.length > 0">
        <div class="label">总目标存钱</div>
        <div class="value din-font">¥ {{ store.totalTarget.toFixed(2) }}</div>
        <div class="sub-label">已存入 ¥ <span class="din-font">{{ store.totalCurrent.toFixed(2) }}</span></div>
      </div>

      <van-empty v-if="store.goals.length === 0" image="search" description="暂无心愿单，快去定个小目标吧！" />

      <div v-for="goal in store.goals" :key="goal.id" class="goal-card">
        <div class="header">
          <div class="icon-wrap"><van-icon :name="goal.icon" /></div>
          <div class="name">{{ goal.name }}</div>
          <div class="actions">
            <span class="btn deposit" @click="openDeposit(goal)">存钱</span>
            <span class="btn edit" @click="openEdit(goal)">编辑</span>
            <span class="btn delete" @click="onDelete(goal)">删除</span>
          </div>
        </div>
        
        <div class="progress-info">
          <div class="amounts">
            <span class="current din-font">¥ {{ goal.currentAmount.toFixed(2) }}</span>
            <span class="target din-font"> / {{ goal.targetAmount.toFixed(2) }}</span>
          </div>
          <div class="percentage din-font">{{ Math.min(100, (goal.currentAmount / goal.targetAmount) * 100).toFixed(1) }}%</div>
        </div>
        
        <van-progress 
          :percentage="Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)" 
          stroke-width="8" 
          color="var(--van-primary-color)" 
        />
        
        <div class="deadline" v-if="goal.deadline">
          目标日: {{ new Date(goal.deadline).toLocaleDateString() }}
        </div>
      </div>
    </div>
    
    <div class="bottom-action">
      <van-button block round type="primary" class="add-btn" @click="openAdd">新建存钱目标</van-button>
    </div>

    <!-- 添加/编辑 心愿单 -->
    <van-dialog v-model:show="showEditDialog" :title="isEdit ? '编辑目标' : '新建存钱目标'" show-cancel-button @confirm="onConfirmSave">
      <van-field v-model="tempGoal.name" label="目标名称" placeholder="如: 买电脑、备用金" maxlength="15" />
      <van-field v-model="tempGoal.targetAmount" type="number" label="目标金额" placeholder="输入金额" />
      
      <van-field
        v-model="deadlineText"
        is-link
        readonly
        name="datePicker"
        label="目标日期"
        placeholder="选择目标达成日期(可选)"
        @click="showDatePicker = true"
      />
      
      <div class="icon-picker">
        <div class="picker-label">选择图标</div>
        <div class="icon-grid">
          <div 
            class="icon-cell" 
            v-for="icon in iconList" 
            :key="icon"
            :class="{ active: tempGoal.icon === icon }"
            @click="tempGoal.icon = icon"
          >
            <van-icon :name="icon" size="24" />
          </div>
        </div>
      </div>
    </van-dialog>
    
    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker 
        title="选择目标日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onConfirmDate" 
        @cancel="showDatePicker = false" 
      />
    </van-popup>

    <!-- 存入资金弹窗 -->
    <van-dialog v-model:show="showDepositDialog" title="存入资金" show-cancel-button @confirm="onConfirmDeposit">
      <div class="deposit-tip">为 <strong>{{ activeGoal?.name }}</strong> 存入一笔钱</div>
      <van-field v-model="depositAmount" type="number" label="存入金额" placeholder="输入金额" auto-focus />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useGoalStore, type Goal } from '@/stores/goal'

const router = useRouter()
const store = useGoalStore()

const onClickLeft = () => {
  router.back()
}

// 图标库
const iconList = [
  'gem-o', 'flag-o', 'gift-o', 'tv-o', 'shopping-cart-o', 'music-o', 'home-o', 'smile-o'
]

// 添加 / 编辑 表单
const showEditDialog = ref(false)
const isEdit = ref(false)
const activeGoalId = ref('')
const tempGoal = reactive({
  name: '',
  targetAmount: '',
  icon: 'flag-o',
  deadline: undefined as number | undefined
})

const deadlineText = ref('')
const showDatePicker = ref(false)
const minDate = new Date()
const maxDate = new Date()
maxDate.setFullYear(maxDate.getFullYear() + 10)

const onConfirmDate = ({ selectedValues }: any) => {
  const [year, month, day] = selectedValues
  deadlineText.value = `${year}-${month}-${day}`
  tempGoal.deadline = new Date(`${year}-${month}-${day}`).getTime()
  showDatePicker.value = false
}

const openAdd = () => {
  isEdit.value = false
  tempGoal.name = ''
  tempGoal.targetAmount = ''
  tempGoal.icon = 'flag-o'
  tempGoal.deadline = undefined
  deadlineText.value = ''
  showEditDialog.value = true
}

const openEdit = (goal: Goal) => {
  isEdit.value = true
  activeGoalId.value = goal.id
  tempGoal.name = goal.name
  tempGoal.targetAmount = String(goal.targetAmount)
  tempGoal.icon = goal.icon || 'flag-o'
  tempGoal.deadline = goal.deadline
  if (goal.deadline) {
    const d = new Date(goal.deadline)
    deadlineText.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  } else {
    deadlineText.value = ''
  }
  showEditDialog.value = true
}

const onConfirmSave = () => {
  if (!tempGoal.name.trim()) {
    showToast('请输入名称')
    return false
  }
  const target = parseFloat(tempGoal.targetAmount)
  if (isNaN(target) || target <= 0) {
    showToast('请输入有效的目标金额')
    return false
  }
  
  if (isEdit.value) {
    store.editGoal(activeGoalId.value, {
      name: tempGoal.name.trim(),
      targetAmount: target,
      icon: tempGoal.icon,
      deadline: tempGoal.deadline
    })
    showToast('修改成功')
  } else {
    store.addGoal(tempGoal.name.trim(), target, tempGoal.deadline, tempGoal.icon)
    showToast('创建成功')
  }
}

// 删除
const onDelete = (goal: Goal) => {
  showConfirmDialog({
    title: '删除心愿单',
    message: `确定要删除 [${goal.name}] 吗？已存入的金额记录将被解绑。`
  }).then(() => {
    store.deleteGoal(goal.id)
    showToast('已删除')
  }).catch(() => {})
}

// 存入资金
const showDepositDialog = ref(false)
const depositAmount = ref('')
const activeGoal = ref<Goal | null>(null)

const openDeposit = (goal: Goal) => {
  activeGoal.value = goal
  depositAmount.value = ''
  showDepositDialog.value = true
}

const onConfirmDeposit = () => {
  const amount = parseFloat(depositAmount.value)
  if (isNaN(amount) || amount <= 0) {
    showToast('请输入有效金额')
    return false
  }
  if (activeGoal.value) {
    store.updateGoalProgress(activeGoal.value.id, amount)
    showToast('存入成功！离目标更近一步！')
  }
}
</script>

<style lang="scss" scoped>
.goal-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  
  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title, .van-icon {
      color: var(--text-color-primary);
    }
  }
  
  .goal-list {
    padding: 16px;
    
    .summary-card {
      background: linear-gradient(135deg, var(--van-primary-color), #23d47a);
      color: #fff;
      border-radius: 16px;
      padding: 24px 20px;
      margin-bottom: 20px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(7, 193, 96, 0.2);
      
      .label {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
        font-weight: 500;
      }
      .value {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .sub-label {
        font-size: 13px;
        opacity: 0.8;
      }
    }
    
    .goal-card {
      background-color: var(--bg-color-primary);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      
      [data-theme='dark'] & {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      }
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        
        .icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: rgba(var(--van-primary-color-rgb, 25, 137, 250), 0.1);
          color: var(--van-primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 12px;
          font-size: 18px;
        }
        
        .name {
          flex: 1;
          font-size: 16px;
          font-weight: 500;
        }
        
        .actions {
          display: flex;
          gap: 12px;
          
          .btn {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            
            &.deposit {
              color: #fff;
              background-color: var(--van-primary-color);
            }
            &.edit {
              color: var(--van-primary-color);
              background-color: rgba(var(--van-primary-color-rgb, 25, 137, 250), 0.1);
            }
            &.delete {
              color: var(--van-danger-color);
              background-color: rgba(var(--van-danger-color-rgb, 238, 10, 36), 0.1);
            }
          }
        }
      }
      
      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 8px;
        
        .amounts {
          .current {
            font-size: 18px;
            font-weight: bold;
            color: var(--text-color-primary);
          }
          .target {
            font-size: 14px;
            color: var(--text-color-secondary);
          }
        }
        
        .percentage {
          font-size: 14px;
          font-weight: 500;
          color: var(--van-primary-color);
        }
      }
      
      .deadline {
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-color-secondary);
        display: flex;
        justify-content: flex-end;
      }
    }
  }
  
  .bottom-action {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px 16px;
    background-color: transparent;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  
  .icon-picker {
    padding: 0 16px 16px;
    
    .picker-label {
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--text-color-secondary);
    }
    
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      
      .icon-cell {
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        background-color: var(--bg-color-secondary);
        color: var(--text-color-secondary);
        transition: all 0.2s;
        
        &.active {
          background-color: var(--van-primary-color);
          color: #fff;
        }
      }
    }
  }
  
  .deposit-tip {
    text-align: center;
    padding: 16px 16px 0;
    font-size: 14px;
    color: var(--text-color-secondary);
    strong {
      color: var(--text-color-primary);
    }
  }
}
</style>
