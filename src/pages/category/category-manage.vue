<template>
  <div class="category-manage-container">
    <van-nav-bar
      title="分类管理"
      left-arrow
      @click-left="onClickLeft"
      class="transparent-nav"
      :border="false"
    />
    
    <van-tabs v-model:active="activeTab" sticky background="transparent">
      <van-tab title="支出分类" :name="1">
        <CategoryList :type="1" />
      </van-tab>
      <van-tab title="收入分类" :name="2">
        <CategoryList :type="2" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryList from './CategoryList.vue'

const router = useRouter()
const activeTab = ref(1)

const onClickLeft = () => {
  router.back()
}
</script>

<style lang="scss" scoped>
.category-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  
  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title, .van-icon {
      color: var(--text-color-primary);
    }
  }
  
  :deep(.van-tabs__nav) {
    background-color: transparent;
  }
}
</style>
