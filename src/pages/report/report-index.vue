<template>
  <div class="report-container">
    <div class="header">
      <div class="filter-bar">
        <span class="month-selector" @click="showPicker = true">
          {{ displayDateText }} <van-icon name="arrow-down" />
        </span>
        <van-button size="small" type="primary" plain icon="photo-o" @click="generatePoster">生成长图</van-button>
      </div>
      <van-tabs v-model:active="recordType" type="card" color="var(--van-primary-color)">
        <van-tab title="支出" :name="1"></van-tab>
        <van-tab title="收入" :name="2"></van-tab>
      </van-tabs>
    </div>

    <!-- 海报截取区域 -->
    <div ref="posterRef" class="poster-wrapper">
      <InsightCard />
    
      <!-- Tags Filter -->
    <div class="tag-filter-bar" v-if="store.globalTags && store.globalTags.length > 0">
      <span class="label">按标签筛选:</span>
      <div class="tags-scroll">
        <van-tag 
          v-for="t in store.globalTags" 
          :key="t" 
          :plain="!activeTags.includes(t)" 
          type="primary" 
          size="medium"
          class="filter-tag"
          @click="toggleFilterTag(t)"
        >
          #{{ t }}
        </van-tag>
      </div>
    </div>
    
    <div class="summary-card">
      <div class="total-label">总{{ recordType === 1 ? '支出' : '收入' }}</div>
      <div class="total-amount">{{ accountStore.privacyMode ? '****' : `¥ ${totalAmount.toFixed(2)}` }}</div>
    </div>

    <!-- 图表区 -->
    <div class="chart-section" v-if="chartData.length > 0">
      <div class="chart-title">收支趋势</div>
      <ChartLine 
        :xAxisData="lineXAxisData" 
        :seriesData="lineSeriesData" 
        :color="recordType === 1 ? '#1989fa' : '#ff976a'" 
      />
      <div class="chart-title" style="margin-top: 16px;">分类占比</div>
      <ChartPie :data="chartData" />
    </div>
    
    <!-- 排名列表 -->
    <div class="rank-list" v-if="chartData.length > 0">
      <div class="section-title">分类排行榜</div>
      <div class="rank-item" v-for="item in rankedData" :key="item.id">
        <div class="icon-wrap">
          <van-icon :name="getCategoryIcon(item.id)" size="20" />
        </div>
        <div class="info">
          <div class="title-row">
            <span class="name">{{ item.name }}</span>
            <span class="amount">{{ accountStore.privacyMode ? '****' : item.value.toFixed(2) }}</span>
          </div>
          <div class="progress-bar">
            <!-- 直接使用内联样式驱动进度条宽度，计算占最高支出的比例 -->
            <div class="fill" :style="{ width: `${(item.value / maxAmount) * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <van-empty image="error" description="本月暂无数据" />
    </div>
    </div> <!-- end poster-wrapper -->

    <!-- 日期选择器 -->
    <van-popup v-model:show="showPicker" position="bottom">
      <div class="picker-tabs">
        <van-tabs v-model:active="dateType">
          <van-tab title="按月" name="month"></van-tab>
          <van-tab title="按年" name="year"></van-tab>
        </van-tabs>
      </div>
      <van-date-picker 
        v-model="pickerValue"
        title="选择时间"
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
import { useSettingStore } from '@/stores/setting'

const posterRef = ref<HTMLElement | null>(null)

const store = useRecordStore()
const accountStore = useAccountStore()
const settingStore = useSettingStore()

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

// 获取分类信息辅助函数
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

// 提取当前选中时长的数据
const filteredRecords = computed(() => {
  return store.currentLedgerRecords.filter((r: RecordItem) => {
    // 基础过滤
    if (r.type !== recordType.value) return false
    
    // 排除投资理财账户的流水记录
    if (r.accountId) {
      const acc = accountStore.accounts.find(a => a.id === r.accountId)
      if (acc && acc.type === 4) return false
    }
    
    // 标签过滤
    if (activeTags.value.length > 0) {
      if (!r.tags || r.tags.length === 0) return false
      // 只要包含选中的任意一个标签即可
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

// 聚合数据供图表使用
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

// 排行榜数据与最大值
const rankedData = computed(() => {
  return [...chartData.value].sort((a, b) => b.value - a.value)
})

// 折线图数据 (按天或按月聚合)
const lineXAxisData = computed(() => {
  if (dateType.value === 'month') {
    const [yearStr, monthStr] = pickerValue.value
    // 计算当月天数
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
      const dayIndex = d.getDate() - 1 // 1号对应索引0
      data[dayIndex] += convertedAmount
    } else {
      const monthIndex = d.getMonth() // 0-11
      data[monthIndex] += convertedAmount
    }
  })
  
  // 保留两位小数
  return data.map(v => Number(v.toFixed(2)))
})
const maxAmount = computed(() => {
  return rankedData.value.length > 0 ? rankedData.value[0].value : 1
})

const generatePoster = async () => {
  if (!posterRef.value) return
  if (chartData.value.length === 0) {
    showToast('暂无数据，无需生成长图')
    return
  }
  
  const toast = showLoadingToast({
    message: '正在生成专属海报...',
    forbidClick: true,
  })

  try {
    const canvas = await html2canvas(posterRef.value, {
      scale: 2, // 提高清晰度
      useCORS: true,
      backgroundColor: settingStore.isDark ? '#000000' : '#f7f8fa' // 确保背景色填充
    })
    
    const imgUrl = canvas.toDataURL('image/png')
    
    // 打开预览模式供用户长按保存
    showImagePreview({
      images: [imgUrl],
      closeable: true,
      showIndex: false
    })
    
    toast.close()
    showToast('长按图片可保存分享')
  } catch (err) {
    toast.close()
    showToast('生成海报失败')
    console.error(err)
  }
}
</script>

<style lang="scss" scoped>
.report-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: var(--bg-color-secondary);
  min-height: 100%;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .month-selector {
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
    
  .poster-wrapper {
    background-color: var(--bg-color-secondary);
    padding-bottom: 24px; // 避免切图时底部太紧凑
  }

  .tag-filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .label {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    .tags-scroll {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 4px;
      
      &::-webkit-scrollbar {
        display: none;
      }
      
      .filter-tag {
        cursor: pointer;
        white-space: nowrap;
      }
    }
  }
  
  .summary-card {
    background-color: var(--bg-color-primary);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    
    .total-label {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }
    
    .total-amount {
      font-size: 32px;
      font-weight: bold;
      color: var(--text-color-primary);
    }
  }
  
  .chart-section {
    background-color: var(--bg-color-primary);
    border-radius: 12px;
    padding: 16px 0;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    
    .chart-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color-primary);
      padding: 0 16px;
      margin-bottom: 8px;
    }
  }
  
  .rank-list {
    background-color: var(--bg-color-primary);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    
    .rank-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .icon-wrap {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--bg-color-secondary);
        color: var(--van-primary-color);
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
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .progress-bar {
          height: 6px;
          background-color: var(--bg-color-secondary);
          border-radius: 3px;
          overflow: hidden;
          
          .fill {
            height: 100%;
            background-color: var(--van-primary-color);
            border-radius: 3px;
            transition: width 0.3s ease;
          }
        }
      }
    }
  }
}
</style>
