<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
</script>

<template>
  <div class="app-container">
    <div class="content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
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
</style>
