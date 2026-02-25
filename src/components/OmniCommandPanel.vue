<script setup lang="ts">
import { ref } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { useRecordStore } from '@/stores/record'
import { parseOmniCommand } from '@/utils/omni-parser'

const visible = ref(false)
const commandInput = ref('')
const recordStore = useRecordStore()

const openPanel = () => {
  visible.value = true
  // 短暂延迟保证弹窗渲染完再获得焦点
  setTimeout(() => {
    const inputEl = document.querySelector('.omni-input input') as HTMLInputElement
    if (inputEl) inputEl.focus()
  }, 100)
}

const onConfirm = async () => {
    if (!commandInput.value.trim()) return
    
    const parsedData = parseOmniCommand(commandInput.value, recordStore.categories)
    if (!parsedData) {
        showFailToast('格式有误，请包含金额 (例: 打车 25)')
        return
    }

    try {
        await recordStore.addRecord({
            amount: parsedData.amount,
            categoryId: parsedData.categoryId,
            type: parsedData.type,
            remark: parsedData.remark,
            recordTime: Date.now()
        })
        showSuccessToast('⚡️ 速记成功')
        commandInput.value = ''
        visible.value = false
    } catch (e) {
        showFailToast('速记失败')
    }
}

// 供外部引用的快捷呼出能力
defineExpose({ openPanel })
</script>

<template>
  <div class="omni-trigger">
    <!-- 全局悬浮组件 FAB -->
    <div class="fab-btn" @click="openPanel">
      <van-icon name="plus" />
    </div>

    <!-- 极速记账弹窗 -->
    <van-popup
      v-model:show="visible"
      position="bottom"
      :style="{ height: 'auto', borderRadius: '16px 16px 0 0' }"
      class="omni-popup"
    >
      <div class="omni-panel-content">
        <h3 class="omni-title">⚡️ Omni 速记面板</h3>
        <p class="omni-subtitle">支持 NLP 智能识别。示例: <code>@餐饮 麦当劳 35</code> 或 <code>打车去公司 28.5</code></p>
        
        <van-field
          v-model="commandInput"
          class="omni-input"
          placeholder="请输入命令..."
          clearable
          size="large"
          @keyup.enter="onConfirm"
        />
        
        <div class="omni-actions">
          <van-button @click="visible = false" round size="small">取消</van-button>
          <van-button type="primary" @click="onConfirm" round size="small">执行记账</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style lang="scss" scoped>
.fab-btn {
  position: fixed;
  right: 20px;
  bottom: 80px; /* 避开 tabbar */
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1989fa, #0570e6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  z-index: 99;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.9);
  }
}

.omni-panel-content {
  padding: 24px;
  background: var(--van-background-2);
  
  .omni-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: bold;
  }

  .omni-subtitle {
    font-size: 12px;
    color: var(--van-text-color-2);
    margin: 0 0 16px 0;
    
    code {
      background: var(--van-gray-2);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .omni-input {
    background: var(--van-gray-1);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 500;
  }

  .omni-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
