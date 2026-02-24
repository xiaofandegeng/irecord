<template>
  <div class="chart-line">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册必须的组件
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

const props = defineProps<{
  xAxisData: string[]
  seriesData: number[]
  title?: string
  color?: string
}>()

const option = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥ {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.xAxisData,
      axisLine: {
        lineStyle: {
          color: '#ebedf0'
        }
      },
      axisLabel: {
        color: '#969799'
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#ebedf0',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#969799'
      }
    },
    series: [
      {
        name: '金额',
        type: 'line',
        smooth: true,
        data: props.seriesData,
        itemStyle: {
          color: props.color || '#1989fa'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
                offset: 0, color: props.color ? `${props.color}66` : 'rgba(25,137,250, 0.4)' // 40%
            }, {
                offset: 1, color: props.color ? `${props.color}00` : 'rgba(25,137,250, 0)' // 0%
            }],
            global: false
          }
        }
      }
    ]
  }
})
</script>

<style lang="scss" scoped>
.chart-line {
  width: 100%;
  height: 220px;
  
  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>
