<template>
  <div class="insight-card">
    <div class="header">
      <div class="title">
        <van-icon name="bulb-o" />
        AI 财务洞察
      </div>
      <div class="score-badge" :class="scoreClass">
        <span class="label">健康分</span>
        <span class="value">{{ insight.score.toFixed(0) }}</span>
      </div>
    </div>
    
    <div class="content">
      <div v-for="(msg, index) in insight.messages" :key="index" class="message-item">
        <van-icon name="scan" class="bullet" />
        <span>{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRecordStore } from '@/stores/record'

const store = useRecordStore()
const insight = computed(() => store.financialInsight)

const scoreClass = computed(() => {
  const score = insight.value.score
  if (score >= 80) return 'is-good'
  if (score >= 60) return 'is-warn'
  return 'is-danger'
})
</script>

<style lang="scss" scoped>
.insight-card {
  margin: 16px;
  background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  color: var(--text-color-primary);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .title {
      font-size: 15px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
      
      .van-icon {
        color: #ffca28;
      }
    }
    
    .score-badge {
      display: flex;
      align-items: baseline;
      gap: 4px;
      background: rgba(0,0,0,0.03);
      padding: 4px 10px;
      border-radius: 12px;
      
      .label {
        font-size: 12px;
        opacity: 0.8;
      }
      .value {
        font-size: 18px;
        font-weight: 800;
      }
      
      &.is-good { color: var(--brand-income); background: rgba(79,192,141,0.08); }
      &.is-warn { color: #ff976a; background: rgba(255,151,106,0.08); }
      &.is-danger { color: #ee0a24; background: rgba(238,10,36,0.08); }
    }
  }
  
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .message-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-color-secondary);
      
      .bullet {
        margin-top: 3px;
        font-size: 14px;
        color: var(--van-primary-color);
        opacity: 0.8;
      }
    }
  }
}
</style>
