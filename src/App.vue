<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showNotify } from 'vant'
import { useRecurringStore } from '@/stores/recurring'

const activeTab = ref(0)
const recurringStore = useRecurringStore()

onMounted(() => {
  // 检查是否有到达日期的周期账单需要自动入账
  const triggeredCount = recurringStore.checkAndTrigger()
  if (triggeredCount && triggeredCount > 0) {
    showNotify({ type: 'success', message: `自动入账了 ${triggeredCount} 笔周期账单` })
  }
})
</script>

<template>
  <div class="app-container">
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>

    <van-tabbar v-model="activeTab" route fixed placeholder>
      <van-tabbar-item replace to="/home" icon="edit">记账</van-tabbar-item>
      <van-tabbar-item replace to="/detail" icon="orders-o">明细</van-tabbar-item>
      <van-tabbar-item replace to="/report" icon="chart-trending-o">报表</van-tabbar-item>
      <van-tabbar-item replace to="/mine" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;

  .content {
    flex: 1;
    overflow-y: scroll;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
