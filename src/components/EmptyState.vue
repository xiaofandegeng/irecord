<template>
  <div class="custom-empty-state" :class="{ 'is-animated': animated }">
    <div class="empty-illustration">
      <div class="blob-bg"></div>
      <van-icon :name="iconName" class="floating-icon" />
    </div>
    <div class="empty-text">{{ description }}</div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  description: { type: String, default: '暂无数据' },
  type: { type: String, default: 'smile' },
  animated: { type: Boolean, default: true }
})

const iconName = computed(() => {
  if (props.type === 'calendar') return 'calendar-o'
  if (props.type === 'search') return 'search'
  if (props.type === 'wallet') return 'idcard'
  if (props.type === 'smile') return 'smile-o'
  return props.type
})
</script>

<style lang="scss" scoped>
.custom-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .empty-illustration {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
    
    .blob-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background: var(--van-primary-color);
      opacity: 0.15;
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      animation: morph 8s ease-in-out infinite;
    }
    
    .floating-icon {
      font-size: 48px;
      color: var(--van-primary-color);
      z-index: 1;
    }
  }
  
  &.is-animated .floating-icon {
    animation: float 3s ease-in-out infinite;
  }
  
  .empty-text {
    font-size: 14px;
    color: var(--text-color-secondary);
    font-weight: 500;
  }
}

@keyframes morph {
  0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
  67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
