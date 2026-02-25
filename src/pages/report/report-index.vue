<template>
  <div class="icost-report-container">
    <!-- 顶部高斯模糊导航栏 -->
    <div class="glass-header">
      <div class="header-inner">
        <!-- 左侧日期选择 -->
        <div class="date-selector" @click="showPicker = true">
          <span class="date-text">{{ displayDateText }}</span>
          <van-icon name="arrow-down" class="arrow" />
        </div>
        
        <!-- 居中 Pill 切换器复用首页逻辑 -->
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
        </div>
        
        <!-- 右侧操作 -->
        <div class="right-action">
          <van-icon name="photograph" size="20" @click="generatePoster" />
        </div>
      </div>
    </div>

    <!-- 主要滚动视窗 -->
    <div ref="posterRef" class="scroll-content">
      <!-- 洞察卡片区 (可有可无) -->
      <InsightCard class="insight-space" />

      <!-- 横滑的标签过滤行 -->
      <div class="tags-row" v-if="store.globalTags && store.globalTags.length > 0">
        <div class="tags-scroll">
          <div 
            class="tag-pill" 
            :class="{ active: activeTags.length === 0 }"
            @click="activeTags = []"
          >全部标签</div>
          <div 
            v-for="t in store.globalTags" 
            :key="t" 
            class="tag-pill"
            :class="{ active: activeTags.includes(t) }"
            @click="toggleFilterTag(t)"
          >
            #{{ t }}
          </div>
        </div>
      </div>

      <!-- 中心视觉：特大总金额 -->
      <div class="hero-amount-section">
        <div class="amount-label">总{{ recordType === 1 ? '支出' : '收入' }}</div>
        <div class="amount-value">
          <span class="symbol">¥</span>
          {{ accountStore.privacyMode ? '****' : totalAmount.toFixed(2) }}
        </div>
      </div>

      <!-- 数据为空时 -->
      <div v-if="chartData.length === 0" class="empty-state">
        <van-empty image="search" description="本期暂无账单数据" />
      </div>

      <template v-else>
        <!-- iOS 拟态图表卡片 -->
        <div class="widget-card">
          <div class="widget-title">收支趋势</div>
          <div class="chart-wrapper">
             <ChartLine 
              :xAxisData="lineXAxisData" 
              :seriesData="lineSeriesData" 
              :color="recordType === 1 ? '#1989fa' : '#ff976a'" 
            />
          </div>
        </div>

        <div class="widget-card">
          <div class="widget-title">分类占比</div>
          <div class="chart-wrapper">
             <ChartPie :data="chartData" />
          </div>
        </div>

        <!-- 排行榜卡片 -->
        <div class="widget-card rank-widget">
          <div class="widget-title">分类排行榜</div>
          <div class="rank-list">
            <div class="rank-item" v-for="item in rankedData" :key="item.id">
              <div class="icon-wrap">
                <van-icon :name="getCategoryIcon(item.id)" size="20" />
              </div>
              <div class="info">
                <div class="title-row">
                  <span class="name">{{ item.name }}</span>
                  <span class="amount">{{ accountStore.privacyMode ? '****' : item.value.toFixed(2) }}</span>
                </div>
                <!-- 平滑胶囊形进度条 -->
                <div class="smooth-progress">
                  <div class="fill" :style="{ width: `${(item.value / maxAmount) * 100}%`, backgroundColor: recordType === 1 ? 'var(--van-primary-color)' : 'var(--van-warning-color)' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div> <!-- scroll-content -->

    <!-- 日期选择器 -->
    <van-popup v-model:show="showPicker" position="bottom" round>
      <div class="picker-tabs">
        <van-tabs v-model:active="dateType" color="var(--van-primary-color)">
          <van-tab title="按月" name="month"></van-tab>
          <van-tab title="按年" name="year"></van-tab>
        </van-tabs>
      </div>
      <van-date-picker 
        v-model="pickerValue"
        title="选择区间"
        :min-date="minDate"
        :max-date="maxDate"
        :columns-type="dateType === 'month' ? ['year', 'month'] : ['year']"
        @confirm="onConfirmDate"
        @cancel="showPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InsightCard from '@/components/InsightCard.vue'
import { showImagePreview, showToast, showLoadingToast } from 'vant'
import html2canvas from 'html2canvas'
import { useRecordStore, type RecordItem } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import ChartPie from '@/components/ChartPie.vue'
import ChartLine from '@/components/ChartLine.vue'

const posterRef = ref<HTMLElement | null>(null)
const store = useRecordStore()
const accountStore = useAccountStore()

const recordType = ref<1 | 2>(1)
const dateType = ref<'month' | 'year'>('month')
const activeTags = ref<string[]>([])

// 日期选择逻辑
const now = new Date()
const pickerValue = ref([String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')])
const displayDateText = ref(`${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`)

watch(dateType, (newVal) => {
  if (newVal === 'year') {
    pickerValue.value = [String(now.getFullYear())]
    displayDateText.value = `${now.getFullYear()}年`
  } else {
    pickerValue.value = [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')]
    displayDateText.value = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`
  }
})

const showPicker = ref(false)
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(now.getFullYear() + 5, 11, 31)

const onConfirmDate = ({ selectedValues }: any) => {
  if (dateType.value === 'month') {
    const [year, month] = selectedValues
    displayDateText.value = `${year}年${month}月`
    pickerValue.value = [year, month]
  } else {
    const [year] = selectedValues
    displayDateText.value = `${year}年`
    pickerValue.value = [year]
  }
  showPicker.value = false
}

// 辅助函数
const getCategoryIcon = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.icon : 'question-o'
}
const getCategoryName = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.name : '未知'
}

const toggleFilterTag = (tag: string) => {
  if (activeTags.value.includes(tag)) {
    activeTags.value = activeTags.value.filter(t => t !== tag)
  } else {
    activeTags.value.push(tag)
  }
}

// 获取过滤数据
const filteredRecords = computed(() => {
  return store.currentLedgerRecords.filter((r: RecordItem) => {
    if (r.type !== recordType.value) return false
    
    if (r.accountId) {
      const acc = accountStore.accounts.find(a => a.id === r.accountId)
      if (acc && acc.type === 4) return false
    }
    
    if (activeTags.value.length > 0) {
      if (!r.tags || r.tags.length === 0) return false
      const hasMatch = activeTags.value.some(t => r.tags!.includes(t))
      if (!hasMatch) return false
    }

    const d = new Date(r.recordTime)
    if (dateType.value === 'month') {
      const [year, month] = pickerValue.value
      return String(d.getFullYear()) === year && String(d.getMonth() + 1).padStart(2, '0') === month
    } else {
      const [year] = pickerValue.value
      return String(d.getFullYear()) === year
    }
  })
})

const totalAmount = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + (r.amount * (r.exchangeRate || 1)), 0)
})

const chartData = computed(() => {
  const map: Record<string, number> = {}
  filteredRecords.value.forEach(r => {
    if (!map[r.categoryId]) map[r.categoryId] = 0
    map[r.categoryId] += (r.amount * (r.exchangeRate || 1))
  })
  return Object.keys(map).map(id => ({
    id,
    name: getCategoryName(id),
    value: map[id]
  }))
})

const rankedData = computed(() => [...chartData.value].sort((a, b) => b.value - a.value))

const lineXAxisData = computed(() => {
  if (dateType.value === 'month') {
    const [yearStr, monthStr] = pickerValue.value
    const days = new Date(Number(yearStr), Number(monthStr), 0).getDate()
    return Array.from({ length: days }, (_, i) => `${i + 1}日`)
  } else {
    return Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
  }
})

const lineSeriesData = computed(() => {
  const data = new Array(lineXAxisData.value.length).fill(0)
  filteredRecords.value.forEach(r => {
    const d = new Date(r.recordTime)
    const convertedAmount = r.amount * (r.exchangeRate || 1)
    if (dateType.value === 'month') {
      const dayIndex = d.getDate() - 1
      data[dayIndex] += convertedAmount
    } else {
      const monthIndex = d.getMonth()
      data[monthIndex] += convertedAmount
    }
  })
  return data.map(v => Number(v.toFixed(2)))
})

const maxAmount = computed(() => rankedData.value.length > 0 ? rankedData.value[0].value : 1)

const generatePoster = async () => {
  if (!posterRef.value) return
  if (chartData.value.length === 0) {
    showToast('暂无数据可以生成长图')
    return
  }
  const toast = showLoadingToast({ message: '生成中...', forbidClick: true })
  try {
    const canvas = await html2canvas(posterRef.value, { scale: 2, useCORS: true, backgroundColor: '#fcfcfc' })
    const imgUrl = canvas.toDataURL('image/png')
    showImagePreview({ images: [imgUrl], closeable: true, showIndex: false })
    toast.close()
    showToast('长按保存')
  } catch (err) {
    toast.close()
    showToast('生成海报失败')
  }
}
</script>

<style lang="scss" scoped>
.icost-report-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary); // 底层背景浅灰，衬托白色卡片
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  
  /* 毛玻璃悬浮导航 */
  .glass-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.05); // iOS风格细线
    
    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      
      .date-selector {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color-primary);
        
        .arrow {
          font-size: 14px;
          margin-left: 4px;
          color: var(--text-color-secondary);
        }
      }
      
      .type-switch-pill {
        display: flex;
        background-color: var(--bg-color-secondary); // 深一点的槽
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
            background-color: var(--bg-color-primary); // 白色滑块
            color: var(--text-color-primary);
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          }
        }
      }
      
      .right-action {
        color: var(--van-primary-color);
        width: 30px; // 保持平衡
        text-align: right;
      }
    }
  }

  .scroll-content {
    padding: 16px 16px 40px;
    background-color: var(--bg-color-secondary);
  }

  /* 标签横向滑动列 */
  .tags-row {
    margin-bottom: 24px;
    
    .tags-scroll {
      display: flex;
      overflow-x: auto;
      gap: 10px;
      padding-bottom: 4px;
      
      &::-webkit-scrollbar { display: none; }
      
      .tag-pill {
        padding: 6px 14px;
        background-color: var(--bg-color-primary);
        color: var(--text-color-secondary);
        border-radius: 16px;
        font-size: 13px;
        flex-shrink: 0;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        transition: all 0.2s;
        
        &.active {
          background-color: var(--van-primary-color);
          color: #fff;
          box-shadow: 0 2px 6px rgba(25, 137, 250, 0.2);
        }
      }
    }
  }

  /* 特大全局总金额 */
  .hero-amount-section {
    text-align: center;
    margin-bottom: 32px;
    padding-top: 10px;
    
    .amount-label {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    .amount-value {
      font-size: 42px;
      font-weight: bold;
      font-family: 'Din', 'Arial', sans-serif;
      color: var(--text-color-primary);
      line-height: 1;
      
      .symbol {
        font-size: 24px;
        margin-right: 2px;
        color: var(--text-color-regular);
      }
    }
  }

  /* 通用Widget圆角卡片 */
  .widget-card {
    background-color: var(--bg-color-primary);
    border-radius: 16px;
    padding: 20px 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03); // 更大更柔和的阴影
    
    .widget-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-color-primary);
      margin-bottom: 16px;
    }
    
    .chart-wrapper {
      width: 100%;
      // 为依赖尺寸的绘制区域建立约束
      min-height: 180px;
    }
  }

  /* 排行榜区 */
  .rank-widget {
    .rank-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .rank-item {
        display: flex;
        align-items: center;
        
        .icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          background-color: var(--bg-color-secondary);
          color: var(--text-color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .info {
          flex: 1;
          
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 15px;
            margin-bottom: 8px;
            
            .name { font-weight: 500; color: var(--text-color-primary); }
            .amount { font-family: 'Din', sans-serif; font-size: 16px; font-weight: bold; }
          }
          
          .smooth-progress {
            height: 6px; // 纤细的 iOS 感
            background-color: var(--bg-color-secondary);
            border-radius: 3px;
            overflow: hidden;
            
            .fill {
              height: 100%;
              border-radius: 3px;
              transition: width 0.4s cubic-bezier(0.1, 0.7, 0.1, 1);
            }
          }
        }
      }
    }
  }

  .insight-space {
    margin-bottom: 16px;
  }
}

// 适配暗黑模式底色
:deep([data-theme='dark']) .glass-header {
  background-color: rgba(0, 0, 0, 0.6) !important;
  border-bottom-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
