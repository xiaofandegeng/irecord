<template>
  <div class="category-list-wrapper">
    <van-cell-group inset class="list-group">
      <van-swipe-cell v-for="cat in categories" :key="cat.id" :disabled="cat.id.startsWith('default_')">
        <van-cell :title="cat.name" center>
          <template #icon>
            <div class="icon-wrap">
              <van-icon :name="cat.icon" size="20" />
            </div>
          </template>
        </van-cell>
        
        <template #right>
          <van-button 
            square 
            type="danger" 
            text="删除" 
            class="delete-button" 
            @click="deleteCategory(cat)"
          />
        </template>
      </van-swipe-cell>
    </van-cell-group>
    
    <div class="add-btn-wrap">
      <van-button icon="plus" type="primary" block round @click="showAddDialog = true">
        添加新分类
      </van-button>
    </div>

    <!-- 添加弹窗 -->
    <van-dialog v-model:show="showAddDialog" :title="`添加${props.type === 1 ? '支出' : '收入'}分类`" show-cancel-button @confirm="confirmAdd">
      <van-field v-model="newCatName" label="分类名称" placeholder="输入名称(如: 零食)" maxlength="4" />
      <div class="icon-picker-area">
        <p class="label">选择图标</p>
        <div class="icon-grid">
          <div 
            v-for="icon in predefinedIcons" 
            :key="icon" 
            class="icon-item"
            :class="{ active: newCatIcon === icon }"
            @click="newCatIcon = icon"
          >
            <van-icon :name="icon" size="24" />
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRecordStore } from '@/stores/record'

const props = defineProps<{
  type: 1 | 2
}>()

const store = useRecordStore()

const categories = computed(() => {
  return props.type === 1 ? store.expenseCategories : store.incomeCategories
})

const showAddDialog = ref(false)
const newCatName = ref('')
const newCatIcon = ref('apps-o')

// 基础图标库选项
const predefinedIcons = [
  'shop-o', 'bag-o', 'cart-o', 'gift-o', 'bullhorn-o',
  'tv-o', 'desktop-o', 'phone-o', 'video-o', 'music-o',
  'smile-o', 'star-o', 'like-o', 'setting-o', 'apps-o',
  'hot-o', 'gem-o', 'flower-o', 'logistics', 'balance-list-o'
]

const confirmAdd = () => {
  if (!newCatName.value.trim()) {
    showToast('名字不能为空')
    return false
  }
  
  store.addCategory({
    type: props.type,
    name: newCatName.value.trim(),
    icon: newCatIcon.value
  })
  
  showToast('添加成功')
  newCatName.value = ''
  newCatIcon.value = 'apps-o'
  return true
}

const deleteCategory = (cat: any) => {
  if (cat.id.startsWith('default_')) {
    showToast('内置分类不可删除')
    return
  }
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除分类 [${cat.name}] 吗？\n删除后历史记账数据的该分类关联可能丢失。`
  }).then(() => {
    store.removeCategory(cat.id, props.type)
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.category-list-wrapper {
  padding: 16px 0 80px;

  .list-group {
    .icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--van-primary-color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }

    .delete-button {
      height: 100%;
    }
  }

  .add-btn-wrap {
    position: fixed;
    bottom: 24px;
    left: 24px;
    right: 24px;
    z-index: 10;
  }
  
  .icon-picker-area {
    padding: 0 16px 16px;
    
    .label {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }
    
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      
      .icon-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border-radius: 8px;
        background-color: var(--bg-color-secondary);
        color: var(--text-color-primary);
        transition: all 0.2s;
        
        &.active {
          background-color: var(--van-primary-color);
          color: #fff;
        }
      }
    }
  }
}
</style>
