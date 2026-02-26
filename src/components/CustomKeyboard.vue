<template>
  <div class="custom-keyboard">
    <div class="keyboard-grid">
      <div class="key action-key" @click="onClear">C</div>
      <div class="key operator-key" @click="onOperator('/')">÷</div>
      <div class="key operator-key" @click="onOperator('*')">×</div>
      <div class="key action-key" @click="onDelete">
        <van-icon name="delete-o" size="24" />
      </div>

      <div class="key num-key" @click="onKey('7')">7</div>
      <div class="key num-key" @click="onKey('8')">8</div>
      <div class="key num-key" @click="onKey('9')">9</div>
      <div class="key operator-key" @click="onOperator('-')">-</div>

      <div class="key num-key" @click="onKey('4')">4</div>
      <div class="key num-key" @click="onKey('5')">5</div>
      <div class="key num-key" @click="onKey('6')">6</div>
      <div class="key operator-key" @click="onOperator('+')">+</div>

      <div class="key num-key" @click="onKey('1')">1</div>
      <div class="key num-key" @click="onKey('2')">2</div>
      <div class="key num-key" @click="onKey('3')">3</div>
      <div class="key confirm-key" :class="{ 'is-calc': isCalculating }" @click="onConfirm">
        {{ isCalculating ? '=' : '完成' }}
      </div>

      <div class="key num-key zero-key" @click="onKey('0')">0</div>
      <div class="key num-key" @click="onKey('.')">.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { playHaptic } from '@/utils/haptics'

const props = defineProps<{
  modelValue: string // 当前输入的金额字符串或表达式
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'confirm', value: number): void
}>()

const expression = ref(props.modelValue || '0')

watch(() => props.modelValue, (newVal) => {
  if (newVal !== expression.value) {
    expression.value = newVal || '0'
  }
})

const isCalculating = computed(() => {
  return /[\+\-\*\/]/.test(expression.value)
})

const triggerVibrate = () => {
  playHaptic('medium')
}

const evaluateSafe = (expr: string): number => {
  try {
    // 移除末尾潜在的悬空运算符
    const cleanExpr = expr.replace(/[\+\-\*\/]$/, '')
    const sanitized = cleanExpr.replace(/[^\d\.\+\-\*\/]/g, '')
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized || 0}`)()
    if (!isFinite(result) || isNaN(result)) return 0
    return Math.round(result * 100) / 100
  } catch (e) {
    return 0
  }
}

const onKey = (key: string) => {
  triggerVibrate()
  let val = expression.value

  const segments = val.split(/[\+\-\*\/]/)
  const lastSegment = segments[segments.length - 1]

  if (key === '.') {
    if (lastSegment.includes('.')) return // 该段数值已有小数点
  }
  
  if (val === '0' && key !== '.') {
    val = key
  } else {
    if (val.length >= 20) return // 过长防爆
    val += key
  }
  
  expression.value = val
  emit('update:modelValue', val)
}

const onOperator = (op: string) => {
  triggerVibrate()
  const lastChar = expression.value.slice(-1)
  
  if (['+', '-', '*', '/'].includes(lastChar)) {
    // 替换最后的运算符
    expression.value = expression.value.slice(0, -1) + op
  } else {
    // 自动求值，防止长串
    if (isCalculating.value) {
       const res = evaluateSafe(expression.value)
       expression.value = String(res) + op
    } else {
       expression.value += op
    }
  }
  
  emit('update:modelValue', expression.value)
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

const onClear = () => {
  triggerVibrate()
  expression.value = '0'
  emit('update:modelValue', expression.value)
}

const onConfirm = () => {
  triggerVibrate()
  if (isCalculating.value) {
    const res = evaluateSafe(expression.value)
    expression.value = String(res)
    emit('update:modelValue', expression.value)
  } else {
    // 完成记录
    const res = evaluateSafe(expression.value)
    emit('confirm', res)
    expression.value = '0'
    emit('update:modelValue', '0')
  }
}
</script>

<style lang="scss" scoped>
.custom-keyboard {
  padding: 8px;
  background-color: var(--bg-color-secondary);
  
  .keyboard-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(5, 50px);
    gap: 8px;
    
    .key {
      background-color: var(--bg-color-primary);
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      font-weight: 500;
      color: var(--text-color-primary);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      cursor: pointer;
      user-select: none;
      transition: all 0.1s;
      
      &:active {
        transform: scale(0.95);
        background-color: var(--border-color);
      }
    }

    .zero-key {
      grid-column: 1 / span 2;
    }
    
    .confirm-key {
      grid-column: 4;
      grid-row: 4 / span 2;
      background-color: var(--van-primary-color);
      color: #fff;
      font-size: 20px;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(var(--van-primary-color-rgb, 25,137,250), 0.3);
      
      &:active {
        opacity: 0.8;
        transform: scale(0.95);
      }
      
      &.is-calc {
        background-color: var(--van-warning-color, #ff976a);
        box-shadow: 0 2px 6px rgba(255,151,106, 0.3);
      }
    }
    
    .action-key {
      font-size: 20px;
      background-color: var(--bg-color-secondary);
      border: 1px solid var(--border-color);
      box-shadow: none;
      color: var(--text-color-regular);
    }

    .operator-key {
      font-size: 24px;
      background-color: var(--bg-color-secondary);
      border: 1px solid var(--border-color);
      box-shadow: none;
      color: var(--text-color-primary);
    }
  }
}
</style>
