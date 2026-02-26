<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showNotify } from 'vant'
import { useRecurringStore } from '@/stores/recurring'
import { useSettingStore } from '@/stores/setting'
import OmniCommandPanel from '@/components/OmniCommandPanel.vue'
import { playHaptic } from '@/utils/haptics'

const activeTab = ref(0)
const recurringStore = useRecurringStore()
const route = useRoute()
const router = useRouter()
useSettingStore() // initialize theme

const transitionName = ref('fade')

router.afterEach((to, from) => {
  const toDepth = (to.meta.depth as number) || 0
  const fromDepth = (from.meta.depth as number) || 0
  
  // If moving between tabs or same-level pages
  if (toDepth === fromDepth) {
    transitionName.value = 'fade'
  } else {
    // Going to a deeper page = slide left. Going back = slide right.
    transitionName.value = toDepth < fromDepth ? 'slide-right' : 'slide-left'
  }
})

onMounted(() => {
  // 检查是否有到达日期的周期账单需要自动入账
  const triggeredCount = recurringStore.checkAndTrigger()
  if (triggeredCount && triggeredCount > 0) {
    showNotify({ type: 'success', message: `自动入账了 ${triggeredCount} 笔周期账单` })
  }
})

// 控制底栏和全能加号是否显示（例如：登录注册页不显示）
const showFooter = computed(() => {
  const hides = ['/login']
  return !hides.includes(route.path)
})
</script>

<template>
  <div class="app-container">
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>

    <template v-if="showFooter">
      <van-tabbar v-model="activeTab" route fixed placeholder @change="playHaptic('light')">
        <van-tabbar-item replace to="/home" icon="edit">记账</van-tabbar-item>
        <van-tabbar-item replace to="/detail" icon="orders-o">明细</van-tabbar-item>
        <van-tabbar-item replace to="/report" icon="chart-trending-o">报表</van-tabbar-item>
        <van-tabbar-item replace to="/mine" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>

      <!-- 全局悬浮的自然语言速记面板 -->
      <OmniCommandPanel />
    </template>
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
    overflow-x: hidden;
  }
}

/* 页面切换动画 (iOS 级别) */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Fade - 用于同一层级的切换 (如 Tabbar) */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Left - Push 进入下一级页面 */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}

/* Slide Right - Pop 返回上一级页面 */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}
</style>
