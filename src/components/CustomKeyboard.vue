<template>
  <div class="custom-keyboard">
    <!-- 附加工具栏 (如日期选择、备注) 将在外层包装，这里纯粹是按键区域 -->
    <div class="keyboard-grid">
      <div class="key num-key" @click="onKey('7')">7</div>
      <div class="key num-key" @click="onKey('8')">8</div>
      <div class="key num-key" @click="onKey('9')">9</div>
      <div class="key action-key" @click="onDelete">
        <van-icon name="delete-o" size="24" />
      </div>

      <div class="key num-key" @click="onKey('4')">4</div>
      <div class="key num-key" @click="onKey('5')">5</div>
      <div class="key num-key" @click="onKey('6')">6</div>
      <div class="key operator-key" @click="onOperator('+')">+</div>

      <div class="key num-key" @click="onKey('1')">1</div>
      <div class="key num-key" @click="onKey('2')">2</div>
      <div class="key num-key" @click="onKey('3')">3</div>
      <div class="key operator-key" @click="onOperator('-')">-</div>

      <div class="key num-key" @click="onKey('.')">.</div>
      <div class="key num-key" @click="onKey('0')">0</div>
      <div class="key confirm-key" :class="{ 'is-calc': isCalculating }" @click="onConfirm">
        {{ isCalculating ? '=' : '完成' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { playHaptic } from '@/utils/haptics'

const props = defineProps<{
  modelValue: string // 当前输入的金额字符串
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'confirm'): void
}>()

const expression = ref(props.modelValue)
const isCalculating = computed(() => {
  return expression.value.includes('+') || expression.value.includes('-')
})

const triggerVibrate = () => {
  playHaptic('medium')
}

const onKey = (key: string) => {
  triggerVibrate()
  let val = expression.value

  // 防止开头输入多个点或者多个0
  if (key === '.' && val.includes('.') && !isCalculating.value) return 
  if (val === '0' && key !== '.') {
    val = key
  } else {
    // 限制长度和精度，简单处理
    if (val.length >= 15) return
    val += key
  }
  
  expression.value = val
  emit('update:modelValue', val)
}

const onOperator = (op: string) => {
  triggerVibrate()
  if (isCalculating.value) {
    // 如果已经有算式，先求值
    calculate()
  }
  const lastChar = expression.value.slice(-1)
  if (lastChar !== '+' && lastChar !== '-') {
    expression.value += op
    emit('update:modelValue', expression.value)
  }
}

const onDelete = () => {
  triggerVibrate()
  if (expression.value.length > 0) {
    expression.value = expression.value.slice(0, -1)
    if (expression.value === '') {
      expression.value = '0'
    }
    emit('update:modelValue', expression.value)
  }
}

const calculate = () => {
  try {
    // 简单的解析与计算（无需 eval 以防安全或者性能问题）
    let result = 0
    if (expression.value.includes('+')) {
      const parts = expression.value.split('+')
      result = parseFloat(parts[0]) + (parseFloat(parts[1]) || 0)
    } else if (expression.value.includes('-')) {
      const parts = expression.value.split('-')
      result = parseFloat(parts[0]) - (parseFloat(parts[1]) || 0)
    }
    
    // 修复浮点数精度
    expression.value = String(Math.round(result * 100) / 100)
    emit('update:modelValue', expression.value)
  } catch(e) {
    expression.value = '0'
    emit('update:modelValue', expression.value)
  }
}

const onConfirm = () => {
  triggerVibrate()
  if (isCalculating.value) {
    calculate()
  } else {
    emit('confirm')
    expression.value = '0' // 完成后重置
    emit('update:modelValue', '0')
  }
}
</script>

<style lang="scss" scoped>
.custom-keyboard {
  background-color: var(--bg-color-secondary);
  padding: 8px 6px 34px; // 底部预留安全区
  
  .keyboard-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 48px);
    gap: 6px;
    
    .key {
      background-color: var(--bg-color-primary);
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      font-weight: 500;
      color: var(--text-color-primary);
      box-shadow: 0 1px 0 rgba(0,0,0,0.05); // iOS拟物轻投影
      cursor: pointer;
      user-select: none;
      transition: background-color 0.1s;
      
      &:active {
        background-color: var(--border-color);
      }
    }
    
    .confirm-key {
      grid-column: 3 / span 2; // 占据两列
      background-color: var(--van-primary-color);
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      box-shadow: none;
      
      &:active {
        opacity: 0.8;
      }
      
      &.is-calc {
        background-color: var(--van-warning-color, #ff976a);
      }
    }
    
    .action-key, .operator-key {
      font-size: 20px;
      background-color: var(--bg-color-secondary); // 略深的颜色区分功能键
      
      &:active {
        background-color: rgba(0,0,0,0.1);
      }
    }
  }
}
</style>
