<template>
  <div class="calendar-insights-container">
    <van-nav-bar
      title="日历视图"
      left-arrow
      @click-left="onClickLeft"
      class="transparent-nav"
    />

    <div class="calendar-wrapper shadow-1">
      <van-calendar
        title="账单日历"
        :poppable="false"
        :show-confirm="false"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
        @select="onSelectDate"
        color="var(--van-primary-color)"
        class="custom-calendar"
      />
    </div>

    <!-- 当日流水弹窗 -->
    <van-popup
      v-model:show="showDailySheet"
      position="bottom"
      round
      safe-area-inset-bottom
      class="daily-sheet"
    >
      <div class="sheet-title">
        {{ selectedDateTitle }}
      </div>
      
      <div class="summary-bar">
        <div class="summary-item">
          <span class="label">支出</span>
          <span class="value expense">{{ dailyExpense.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">收入</span>
          <span class="value income">{{ dailyIncome.toFixed(2) }}</span>
        </div>
      </div>

      <div class="records-list">
        <div v-if="dailyRecords.length === 0" class="empty">
          <EmptyState type="search" description="今日无账单" />
        </div>
        <div v-else class="record-item" v-for="record in dailyRecords" :key="record.id">
          <div class="icon-wrap" :class="{'is-income': record.type === 2, 'is-transfer': record.type === 3}">
            <van-icon :name="getCategoryIcon(record.categoryId)" size="20" />
          </div>
          <div class="content">
            <div class="top">
              <span class="name">{{ getCategoryName(record.categoryId, record.type) }}</span>
              <span class="amount din-font" :class="{'is-income': record.type === 2}">
                {{ record.type === 1 ? '-' : '+' }}{{ accountStore.privacyMode ? '****' : record.amount.toFixed(2) }}
              </span>
            </div>
            <div class="bottom" v-if="record.remark">
              <span class="remark text-ellipsis">{{ record.remark }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore } from '@/stores/record'
import { useAccountStore } from '@/stores/account'
import dayjs from 'dayjs'
import { playHaptic } from '@/utils/haptics'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const store = useRecordStore()
const accountStore = useAccountStore()

const records = computed(() => store.currentLedgerRecords)

// 日历范围
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

// 用于把所有记录按 YYYY-MM-DD 归组并算出合计
const dailyMap = computed(() => {
  const map: Record<string, { expense: number, income: number }> = {}
  records.value.forEach(r => {
    const d = dayjs(r.recordTime).format('YYYY-MM-DD')
    if (!map[d]) {
      map[d] = { expense: 0, income: 0 }
    }
    if (r.type === 1) {
      map[d].expense += r.amount * (r.exchangeRate || 1)
    } else if (r.type === 2) {
      map[d].income += r.amount * (r.exchangeRate || 1)
    }
  })
  return map
})

// Vant Calendar formatter
const formatter = (day: any) => {
  const dateStr = dayjs(day.date).format('YYYY-MM-DD')
  const stats = dailyMap.value[dateStr]

  if (stats && (stats.expense > 0 || stats.income > 0)) {
    // 渲染在底部，用简单的文字标记
    // Vant 支持 bottomInfo
    let info = ''
    if (stats.expense > 0) {
      info += `-${Math.round(stats.expense)}`
    }
    day.bottomInfo = info
    // 也可以再塞一点自定义的 class (如果是通过 slot 会更好，但 Vant-calendar 的 formatter 只能设置内建属性)
    day.className = stats.expense > 0 ? 'has-expense' : 'has-income'
  }

  // 给今天标注
  if (dayjs(day.date).isSame(dayjs(), 'day')) {
    day.text = '今天'
  }

  return day
}

const showDailySheet = ref(false)
const selectedDateStr = ref('')

const dailyRecords = computed(() => {
  if (!selectedDateStr.value) return []
  return records.value.filter(r => dayjs(r.recordTime).format('YYYY-MM-DD') === selectedDateStr.value)
    .sort((a, b) => b.recordTime - a.recordTime)
})

const dailyExpense = computed(() => {
  return dailyRecords.value.filter(r => r.type === 1).reduce((sum, r) => sum + r.amount * (r.exchangeRate || 1), 0)
})

const dailyIncome = computed(() => {
  return dailyRecords.value.filter(r => r.type === 2).reduce((sum, r) => sum + r.amount * (r.exchangeRate || 1), 0)
})

const selectedDateTitle = computed(() => {
  if (!selectedDateStr.value) return ''
  return dayjs(selectedDateStr.value).format('MM月DD日')
})

const onClickLeft = () => {
  router.back()
}

const onSelectDate = (date: Date) => {
  playHaptic('medium')
  selectedDateStr.value = dayjs(date).format('YYYY-MM-DD')
  showDailySheet.value = true
}

const getCategoryName = (id: string, type: number) => {
  if (type === 3) return '转账'
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.name : '未知'
}

const getCategoryIcon = (id: string) => {
  const cat = store.categories.find(c => c.id === id)
  return cat ? cat.icon : 'exchange'
}
</script>

<style lang="scss" scoped>
.calendar-insights-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;

  :deep(.transparent-nav) {
    background: transparent;
    .van-nav-bar__title {
      font-weight: 600;
    }
  }

  .calendar-wrapper {
    margin: 16px;
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    flex: 1;

    .custom-calendar {
      height: 100%;
      
      :deep(.van-calendar__bottom-info) {
        font-size: 10px;
        transform: scale(0.9);
        color: var(--van-danger-color);
        margin-top: 2px;
      }
      
      :deep(.has-income) {
        .van-calendar__bottom-info {
          color: var(--van-success-color);
        }
      }
    }
  }

  .daily-sheet {
    height: 60vh;
    display: flex;
    flex-direction: column;

    .sheet-title {
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      padding: 20px 0 10px;
      color: var(--text-color-primary);
    }

    .summary-bar {
      display: flex;
      justify-content: space-around;
      padding: 10px 20px 20px;
      border-bottom: 1px solid var(--border-color-light);

      .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .label {
          font-size: 13px;
          color: var(--text-color-secondary);
          margin-bottom: 4px;
        }

        .value {
          font-size: 18px;
          font-weight: bold;
          &.expense { color: var(--text-color-primary); }
          &.income { color: var(--van-success-color); }
        }
      }
    }

    .records-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;

      .empty {
        margin-top: 40px;
      }

      .record-item {
        display: flex;
        align-items: center;
        background: var(--bg-color-secondary);
        padding: 12px 16px;
        border-radius: 12px;
        margin-bottom: 12px;

        .icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffebe8;
          color: var(--van-danger-color);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 12px;

          &.is-income {
            background: #e8f5e9;
            color: var(--van-success-color);
          }
          &.is-transfer {
            background: #e6f7ff;
            color: #1677ff;
          }
        }

        .content {
          flex: 1;

          .top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .name {
              font-size: 15px;
              font-weight: 500;
              color: var(--text-color-primary);
            }

            .amount {
              font-size: 16px;
              color: var(--text-color-primary);
            }
          }

          .bottom {
            .remark {
              font-size: 13px;
              color: var(--text-color-secondary);
            }
          }
        }
      }
    }
  }
}
</style>
