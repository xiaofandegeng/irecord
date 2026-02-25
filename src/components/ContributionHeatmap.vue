<script setup lang="ts">
import { computed } from 'vue'
import { showToast } from 'vant'

const props = defineProps<{
  // 记录对象的字典，按日期 "YYYY-MM-DD" 进行分组
  groupedRecords: Record<string, { type: number, amount: number }[]>
  days?: number // 显示过去多少天的热力，默认 182 天（约半年）
}>()

const showDays = props.days || 182

// 生成过去 showDays 天的日期数组，保证终点是今天
const heatmapData = computed(() => {
  const data = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 找到 182 天前的起始日
  const startDay = new Date(today)
  startDay.setDate(today.getDate() - showDays + 1)
  
  // 补齐前面的空白，使得 startDay 对应的星期几能够对齐 (0=周日，1=周一)
  const emptyPrefix = startDay.getDay() 
  for (let i = 0; i < emptyPrefix; i++) {
    data.push(null) // 占位空格
  }

  // 填充真实数据
  for (let d = new Date(startDay); d <= today; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateKey = `${y}-${m}-${day}`
    
    // 计算当天的支出总和
    const records = props.groupedRecords[dateKey] || []
    let expenseSum = 0
    let incomeSum = 0
    records.forEach(r => {
      if (r.type === 1) expenseSum += r.amount
      else incomeSum += r.amount
    })

    data.push({
      dateKey,
      expenseSum,
      incomeSum
    })
  }
  return data
})

const getLevel = (expenseSum: number) => {
  if (expenseSum === 0) return 0
  if (expenseSum <= 50) return 1
  if (expenseSum <= 200) return 2
  if (expenseSum <= 800) return 3
  return 4
}

const getClassName = (item: any) => {
  if (!item) return 'cell-empty'
  const level = getLevel(item.expenseSum)
  return `cell-level-${level}`
}

const onCellClick = (item: any) => {
  if (!item) return
  if (item.expenseSum === 0 && item.incomeSum === 0) {
    showToast(`${item.dateKey} 无收支记录`)
    return
  }
  showToast({
    message: `${item.dateKey}\n支出 ¥${item.expenseSum.toFixed(2)}\n收入 ¥${item.incomeSum.toFixed(2)}`,
    position: 'bottom'
  })
}
</script>

<template>
  <div class="heatmap-wrapper">
    <div class="heatmap-header">
      <div class="h-title">
        <van-icon name="fire-o" color="#ff976a" /> 活跃热力图
      </div>
      <div class="h-desc">展示过去半年的生活轨迹 (颜色越深支出越多)</div>
    </div>
    <div class="heatmap-scroll">
      <div class="calendar-grid">
        <div 
          v-for="(item, index) in heatmapData" 
          :key="index"
          class="calendar-cell"
          :class="getClassName(item)"
          @click="onCellClick(item)"
        ></div>
      </div>
    </div>
    <div class="heatmap-legend">
      <span>少</span>
      <div class="cell-level-0 legend-cell"></div>
      <div class="cell-level-1 legend-cell"></div>
      <div class="cell-level-2 legend-cell"></div>
      <div class="cell-level-3 legend-cell"></div>
      <div class="cell-level-4 legend-cell"></div>
      <span>多</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heatmap-wrapper {
  padding: 16px;
  background: var(--bg-color-primary, #fff);
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .heatmap-header {
    margin-bottom: 12px;
    
    .h-title {
      font-size: 15px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .h-desc {
      font-size: 11px;
      color: var(--van-gray-6);
      margin-top: 4px;
    }
  }

  .heatmap-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    /* 隐藏滚动条但允许滚动 */
    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
  }

  .calendar-grid {
    display: grid;
    /* 一周7天，按列排布。由于数据是一维平铺，所以我们需要设置 grid-auto-flow: column */
    grid-template-rows: repeat(7, 12px);
    grid-auto-flow: column;
    gap: 4px;
    // 使得内容始终靠右对齐（最新日期在右侧）
    justify-content: end;
  }

  .calendar-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    cursor: pointer;
  }

  .cell-empty {
    background-color: transparent;
  }

  /* 仿 Github 色阶，但偏向温暖的橙红色代表花钱 */
  .cell-level-0 { background-color: var(--heatmap-level-0, var(--van-gray-2)); }
  .cell-level-1 { background-color: var(--heatmap-level-1, #ffd8c2); }
  .cell-level-2 { background-color: var(--heatmap-level-2, #ffb892); }
  .cell-level-3 { background-color: var(--heatmap-level-3, #ff976a); }
  .cell-level-4 { background-color: var(--heatmap-level-4, #e87a4a); }

  :global([data-theme='dark']) {
    .heatmap-wrapper {
      box-shadow: none;
    }
    .cell-level-0 { --heatmap-level-0: #2c2c2e; }
    .cell-level-1 { --heatmap-level-1: #6b3a21; }
    .cell-level-2 { --heatmap-level-2: #8a4827; }
    .cell-level-3 { --heatmap-level-3: #ab562c; }
    .cell-level-4 { --heatmap-level-4: #c9622d; }
  }

  .heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 12px;
    gap: 4px;
    font-size: 10px;
    color: var(--van-gray-6);

    .legend-cell {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  }
}
</style>
