<template>
  <div class="chart-pie">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingStore } from '@/stores/setting'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册必须的组件
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const props = defineProps<{
  data: Array<{ name: string; value: number }>
  title?: string
}>()

const settingStore = useSettingStore()

const option = computed(() => {
  const isDark = settingStore.isDark
  const textColor = isDark ? '#f5f5f5' : '#323233'
  const borderColor = isDark ? '#1c1c1e' : '#fff'

  return {
    title: {
      text: props.title || '消费占比',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: textColor
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: borderColor,
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data
      }
    ]
  }
})
</script>

<style lang="scss" scoped>
.chart-pie {
  width: 100%;
  height: 250px;
  
  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>
