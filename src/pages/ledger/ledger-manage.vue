<template>
  <div class="ledger-manage-container">
    <van-nav-bar
      title="账本管理"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    
    <div class="section-title">我的账本</div>
    
    <div class="ledger-list">
      <van-swipe-cell v-for="ledger in store.ledgers" :key="ledger.id">
        <div class="ledger-item">
          <div class="icon-wrap" :class="{ 'is-active': store.currentLedgerId === ledger.id }">
            <van-icon :name="ledger.icon" size="24" />
          </div>
          <div class="info">
            <div class="top">
              <span class="name">{{ ledger.name }}</span>
              <van-tag v-if="ledger.isDefault" type="primary" plain class="default-tag">默认账本</van-tag>
              <van-tag v-if="store.currentLedgerId === ledger.id" type="success" class="current-tag">当前使用</van-tag>
            </div>
            <div class="time">创建于: {{ new Date(ledger.createdAt).toLocaleDateString() }}</div>
          </div>
          <div class="action-btn">
            <van-button 
              v-if="store.currentLedgerId !== ledger.id" 
              size="small" 
              type="primary" 
              plain
              @click="onSwitch(ledger.id)"
            >进入此账本</van-button>
          </div>
        </div>
        <template #right>
          <van-button 
            v-if="!ledger.isDefault && store.currentLedgerId !== ledger.id" 
            square 
            text="删除" 
            type="danger" 
            class="delete-button" 
            @click="onDelete(ledger)" 
          />
        </template>
      </van-swipe-cell>
    </div>
    
    <div class="bottom-action">
      <van-button block type="primary" class="add-btn" @click="showAdd = true">
        新建账本
      </van-button>
    </div>

    <!-- 新增账本弹窗 -->
    <van-dialog v-model:show="showAdd" title="新建账本" show-cancel-button @confirm="onConfirmAdd">
      <van-field v-model="newLedgerName" label="账本名称" placeholder="输入1-10个字符" maxlength="10" />
      <div class="icon-picker">
        <div class="picker-label">选择图标</div>
        <div class="icon-grid">
          <div 
            class="icon-cell" 
            v-for="icon in iconList" 
            :key="icon"
            :class="{ active: newLedgerIcon === icon }"
            @click="newLedgerIcon = icon"
          >
            <van-icon :name="icon" size="24" />
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useLedgerStore, type Ledger } from '@/stores/ledger'

const router = useRouter()
const store = useLedgerStore()

const onClickLeft = () => {
  router.back()
}

// 账本预设图标库
const iconList = [
  'label-o', 'coupon-o', 'balance-list-o', 'diamond-o', 
  'shop-o', 'hotel-o', 'flight-pay', 'logistics'
]

const showAdd = ref(false)
const newLedgerName = ref('')
const newLedgerIcon = ref('label-o')

const onConfirmAdd = () => {
  if (!newLedgerName.value.trim()) {
    showToast('请输入账本名称')
    return false
  }
  store.addLedger(newLedgerName.value.trim(), newLedgerIcon.value)
  showToast('新建成功')
  newLedgerName.value = ''
  newLedgerIcon.value = 'label-o'
}

const onSwitch = (id: string) => {
  store.switchLedger(id)
  showToast('切换账本成功')
}

const onDelete = (ledger: Ledger) => {
  showConfirmDialog({
    title: '警告',
    message: `确定要删除账本 [${ledger.name}] 吗？请注意，删除账本后该账本下的流水无法恢复！`,
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    store.deleteLedger(ledger.id)
    showToast('删除成功')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.ledger-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  
  .section-title {
    padding: 16px 16px 8px;
    font-size: 14px;
    color: var(--text-color-secondary);
  }
  
  .ledger-list {
    flex: 1;
    overflow-y: auto;
    
    .ledger-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: #fff;
      border-bottom: 1px solid #f5f6f7;
      
      .icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background-color: #f7f8fa;
        color: var(--text-color-secondary);
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 16px;
        
        &.is-active {
          background-color: rgba(var(--van-primary-color-rgb, 25, 137, 250), 0.1);
          color: var(--van-primary-color);
        }
      }
      
      .info {
        flex: 1;
        
        .top {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
          
          .name {
            font-size: 16px;
            font-weight: 500;
            margin-right: 8px;
          }
          
          .default-tag, .current-tag {
            margin-left: 4px;
          }
        }
        
        .time {
          font-size: 12px;
          color: var(--text-color-secondary);
        }
      }
    }
  }
  
  .delete-button {
    height: 100%;
  }
  
  .bottom-action {
    padding: 16px;
    background-color: #fff;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  }
  
  .icon-picker {
    padding: 0 16px 16px;
    
    .picker-label {
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--text-color-secondary);
    }
    
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      
      .icon-cell {
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        background-color: #f7f8fa;
        color: var(--text-color-secondary);
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
