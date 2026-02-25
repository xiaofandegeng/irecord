<template>
  <div class="category-manage">
    <van-nav-bar
      title="分类管理"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />
    
    <div class="content">
      <van-tabs v-model:active="activeType" color="var(--van-primary-color)">
        <van-tab title="支出" :name="1" />
        <van-tab title="收入" :name="2" />
      </van-tabs>

      <div class="category-list">
        <van-swipe-cell v-for="cat in currentCategories" :key="cat.id">
          <van-cell center @click="openEditBudget(cat)">
            <template #title>
              <div>{{ cat.name }}</div>
              <div class="cat-budget" v-if="cat.budgetLimit">预算: ¥{{ cat.budgetLimit }}</div>
            </template>
            <template #icon>
              <div class="icon-wrap" :class="{'is-income': cat.type === 2}">
                <van-icon :name="cat.icon" size="20" />
              </div>
            </template>
            <template #right-icon>
              <van-tag type="primary" plain v-if="cat.isSystem">系统预设</van-tag>
              <van-tag type="warning" plain v-else>自定义</van-tag>
              <van-icon name="arrow" class="cell-arrow" />
            </template>
          </van-cell>
          <template #right>
            <van-button 
              square 
              text="删除" 
              type="danger" 
              class="delete-button" 
              :disabled="cat.isSystem"
              @click="onDelete(cat)"
            />
          </template>
        </van-swipe-cell>
      </div>

      <div class="add-btn-wrap">
        <van-button type="primary" block icon="plus" class="add-btn" @click="showAdd = true">新建分类</van-button>
      </div>
    </div>

    <!-- 添加分类弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" style="height: 60%">
      <div class="add-popup-content">
        <div class="popup-header">
          <span class="cancel" @click="showAdd = false">取消</span>
          <span class="title">新增{{ activeType === 1 ? '支出' : '收入' }}分类</span>
          <span class="confirm" @click="onConfirmAdd">保存</span>
        </div>
        
        <van-field v-model="newCatName" label="分类名称" placeholder="输入分类名称 (如：宠物)" />
        <van-field v-model="newCatBudget" label="独立预算" type="number" placeholder="选填本分类月度限额" />
        <van-field 
          v-model="newCatKeywords" 
          label="匹配关键字" 
          type="textarea" 
          rows="2" 
          autosize 
          placeholder="导入自动记账用，如：猫粮,狗粮,医院 (逗号分隔)" 
        />
        
        <div class="icon-picker">
          <div class="section-title">选择图标</div>
          <div class="grid">
            <div 
              v-for="icon in iconList" 
              :key="icon" 
              class="icon-item"
              :class="{ active: newCatIcon === icon }"
              @click="newCatIcon = icon"
            >
              <van-icon :name="icon" size="28" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 编辑特定分类配置弹窗 (主要用于设置预算和修改关键字) -->
    <van-dialog v-model:show="showEditDialog" title="分类设置" show-cancel-button @confirm="onConfirmEdit">
      <van-field v-model="editingCat.budgetLimit" label="月度预算" type="number" placeholder="选填，如: 2000" />
      <van-field v-model="editingCat.keywordsStr" label="匹配关键字" type="textarea" rows="2" autosize placeholder="逗号分隔" />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useRecordStore, type Category } from '@/stores/record'

const router = useRouter()
const store = useRecordStore()

const activeType = ref<1 | 2>(1)
const showAdd = ref(false)
const showEditDialog = ref(false)

const newCatName = ref('')
const newCatBudget = ref('')
const newCatKeywords = ref('')
const newCatIcon = ref('apps-o')

// 后续可以引入图标库，先提供常见的 Vant 图标
const iconList = [
  'shop-o', 'cart-o', 'bag-o', 'smile-o', 'balance-o', 
  'gift-o', 'gem-o', 'flower-o', 'home-o', 'setting-o',
  'phone-o', 'video-o', 'music-o', 'hot-o', 'star-o',
  'location-o', 'flight-pay', 'notes-o', 'apps-o'
]

const currentCategories = computed(() => {
  return activeType.value === 1 ? store.expenseCategories : store.incomeCategories
})

const onClickLeft = () => {
  router.back()
}

const onDelete = (cat: Category) => {
  if (cat.isSystem) return
  showConfirmDialog({
    title: '删除提示',
    message: `确定要删除分类【${cat.name}】吗？这不会影响历史记账记录。`
  }).then(() => {
    const idx = store.categories.findIndex(c => c.id === cat.id)
    if (idx !== -1) {
      store.categories.splice(idx, 1)
      showToast('删除成功')
    }
  }).catch(() => {})
}

const onConfirmAdd = () => {
  if (!newCatName.value.trim()) {
    showToast('请输入名称')
    return
  }
  
  const kwList = newCatKeywords.value.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0)
  
  const newCat: Category = {
    id: `c_custom_${Date.now()}`,
    name: newCatName.value.trim(),
    icon: newCatIcon.value,
    type: activeType.value,
    sort: 99,
    isSystem: false,
    keywords: kwList.length > 0 ? kwList : undefined,
    budgetLimit: newCatBudget.value ? parseFloat(newCatBudget.value) : undefined
  }
  
  store.categories.push(newCat)
  showToast('添加成功')
  showAdd.value = false
  newCatName.value = ''
  newCatBudget.value = ''
  newCatKeywords.value = ''
}

// ------ 编辑已有分类逻辑 ------
const editingCat = ref<{id: string, budgetLimit: string, keywordsStr: string}>({id: '', budgetLimit: '', keywordsStr: ''})
const openEditBudget = (cat: Category) => {
  editingCat.value = {
    id: cat.id,
    budgetLimit: cat.budgetLimit ? String(cat.budgetLimit) : '',
    keywordsStr: cat.keywords ? cat.keywords.join(', ') : ''
  }
  showEditDialog.value = true
}

const onConfirmEdit = () => {
  const cat = store.categories.find(c => c.id === editingCat.value.id)
  if (cat) {
    const bgt = parseFloat(editingCat.value.budgetLimit)
    cat.budgetLimit = !isNaN(bgt) && bgt > 0 ? bgt : undefined
    
    const kwList = editingCat.value.keywordsStr.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0)
    cat.keywords = kwList.length > 0 ? kwList : undefined
    
    showToast('更新成功')
  }
}
</script>

<style lang="scss" scoped>
.category-manage {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .category-list {
    flex: 1;
    overflow-y: auto;
    margin-top: 12px;
    
    .icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--bg-color-secondary);
      color: var(--van-primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      
      &.is-income {
        color: #ff976a;
      }
    }
    
    .cat-budget {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-top: 4px;
    }
    
    .cell-arrow {
      margin-left: 8px;
      color: var(--text-color-secondary);
    }
    
    .delete-button {
      height: 100%;
    }
  }

  .add-btn-wrap {
    padding: 20px 16px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
    background-color: var(--bg-color-primary);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    
    .add-btn {
      border-radius: 8px;
    }
  }

  .add-popup-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--bg-color-secondary);
    
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: var(--bg-color-primary);
      font-size: 16px;
      
      .cancel { color: var(--text-color-secondary); }
      .title { font-weight: bold; color: var(--text-color-primary); }
      .confirm { color: var(--van-primary-color); font-weight: 500; }
    }
    
    .icon-picker {
      padding: 16px;
      
      .section-title {
        font-size: 14px;
        color: var(--text-color-secondary);
        margin-bottom: 12px;
      }
      
      .grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        
        .icon-item {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color-primary);
          border-radius: 8px;
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
}
</style>
