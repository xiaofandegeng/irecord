<template>
  <div class="import-container">
    <van-nav-bar
      title="账单导入"
      left-arrow
      @click-left="onClickLeft"
    />

    <div class="import-content">
      <div class="intro">
        <h3>智能账单导入</h3>
        <p>目前支持微信支付或支付宝导出的账单 CSV 文件。导入后会自动识别账单信息，并可供您勾选批量入账。</p>
      </div>

      <div class="upload-area">
        <input 
          type="file" 
          accept=".csv" 
          class="file-input" 
          @change="onFileChange"
          id="csv-upload"
        />
        <label for="csv-upload" class="upload-btn">
          <van-icon name="add-o" size="32" />
          <span>选择 CSV 文件</span>
        </label>
      </div>

      <div class="preview-section" v-if="parsedRecords.length > 0">
        <div class="preview-header">
          <span>识别到 {{ parsedRecords.length }} 条记录</span>
          <van-button size="small" type="primary" @click="confirmImport">确认导入</van-button>
        </div>
        
        <div class="record-list">
          <div v-for="(item, index) in parsedRecords" :key="index" class="record-item">
            <div class="record-left">
              <div class="time">{{ new Date(item.recordTime || 0).toLocaleString() }}</div>
              <div class="remark van-ellipsis">{{ item.remark }}</div>
              <div class="cat-tag" @click="openCategoryPicker(item)">
                <van-tag type="primary" plain round>{{ getCategoryName(item.categoryId) }} <van-icon name="edit" /></van-tag>
              </div>
            </div>
            <div class="record-right" :class="item.type === 1 ? 'expense' : 'income'">
              {{ item.type === 1 ? '-' : '+' }}{{ (item.amount || 0).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-action-sheet 
      v-model:show="showCategoryPicker" 
      :actions="categoryActions" 
      cancel-text="取消"
      @select="onSelectCategory" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast } from 'vant'
import { useRecordStore } from '@/stores/record'
import { parseBillCsv } from '@/utils/bill-parser'
import { matchCategory } from '@/utils/category-matcher'
import type { RecordItem } from '@/stores/record'

const router = useRouter()
const store = useRecordStore()

const parsedRecords = ref<Partial<RecordItem>[]>([])
const showCategoryPicker = ref(false)
const currentEditItem = ref<Partial<RecordItem> | null>(null)

const categoryActions = computed(() => {
  const type = currentEditItem.value?.type || 1
  const cats = type === 1 ? store.expenseCategories : store.incomeCategories
  return cats.map(c => ({
    name: c.name,
    value: c.id
  }))
})

const onClickLeft = () => {
  router.back()
}

const getCategoryName = (id?: string) => {
  return store.categories.find(c => c.id === id)?.name || '未知分类'
}

const openCategoryPicker = (item: Partial<RecordItem>) => {
  currentEditItem.value = item
  showCategoryPicker.value = true
}

const onSelectCategory = (action: any) => {
  if (currentEditItem.value) {
    currentEditItem.value.categoryId = action.value
  }
  showCategoryPicker.value = false
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  
  const file = target.files[0]
  if (!file.name.endsWith('.csv')) {
    showToast('只能解析 CSV 文件哦')
    return
  }

  const toast = showLoadingToast({
    message: '解析中...',
    forbidClick: true,
  })

  try {
    const text = await file.text()
    const rawRecords = parseBillCsv(text)
    
    // 智能挂载分类
    const records = rawRecords.map((r: Partial<RecordItem>) => ({
      ...r,
      categoryId: r.categoryId || matchCategory(r.remark || '', r.type || 1)
    }))
    if (records.length === 0) {
      showToast('未能识别到有效的账单记录')
    } else {
      parsedRecords.value = records
      showToast(`成功解析 ${records.length} 条账单`)
    }
  } catch (err: any) {
    showToast('解析失败: ' + err.message)
  } finally {
    toast.close()
    target.value = '' // reset
  }
}

const confirmImport = () => {
  if (parsedRecords.value.length === 0) return
  
  // 简单的默认分类与账户
  const defaultExpenseCatId = store.expenseCategories[0]?.id || 'c1'
  const defaultIncomeCatId = store.incomeCategories[0]?.id || 'c6'
  
  let successCount = 0
  let skipCount = 0

  parsedRecords.value.forEach(r => {
    // 粗略防重：同一天的相同金额与类型
    const rTime = r.recordTime || Date.now()
    const rAmount = r.amount || 0
    const rType = r.type || 1

    const isDuplicate = store.records.some(existing => {
      // 时间差在一分钟以内，并且金额和类型一致
      const timeDiff = Math.abs(existing.recordTime - rTime)
      return timeDiff < 60000 && existing.amount === rAmount && existing.type === rType
    })

    if (!isDuplicate) {
      // 过滤掉原生的 id, 避免冲突；保留其他全量字段
      const { id, createTime, ...rest } = r
      store.addRecord({
        ...rest,
        type: rType,
        amount: rAmount,
        categoryId: r.categoryId || (rType === 1 ? defaultExpenseCatId : defaultIncomeCatId),
        recordTime: rTime,
        remark: r.remark && r.remark.includes('导入') ? r.remark : (r.remark || '') + ' [导入]',
      })
      successCount++
    } else {
      skipCount++
    }
  })

  showToast({
    message: `成功入账 ${successCount} 条, 跳过 ${skipCount} 条重复记录`,
    icon: 'success'
  })
  
  parsedRecords.value = []
  setTimeout(() => {
    router.replace('/detail')
  }, 1500)
}
</script>

<style lang="scss" scoped>
.import-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-secondary);

  .import-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    .intro {
      background-color: var(--bg-color-primary);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      h3 {
        margin: 0 0 8px;
        font-size: 16px;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: var(--text-color-secondary);
        line-height: 1.5;
      }
    }

    .upload-area {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;

      .file-input {
        display: none;
      }

      .upload-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 140px;
        height: 140px;
        background-color: var(--bg-color-primary);
        border: 2px dashed var(--van-primary-color);
        border-radius: 16px;
        color: var(--van-primary-color);
        cursor: pointer;
        transition: all 0.2s;
        
        &:active {
          opacity: 0.8;
          transform: scale(0.98);
        }

        .van-icon {
          margin-bottom: 8px;
        }

        span {
          font-size: 14px;
        }
      }
    }

    .preview-section {
      background-color: var(--bg-color-primary);
      border-radius: 12px;
      padding: 16px;
      
      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-size: 14px;
        font-weight: bold;
      }
      
      .record-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        
        .record-item {
          display: flex;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f5f5f5;
          align-items: center;
          
          &:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .record-left {
            flex: 1;
            overflow: hidden;
            margin-right: 12px;
            
            .time {
              font-size: 12px;
              color: var(--text-color-secondary);
            }
            .remark {
              font-size: 14px;
              margin-top: 4px;
              color: var(--text-color-primary);
            }
            .cat-tag {
              margin-top: 6px;
              cursor: pointer;
            }
          }

          .record-right {
            font-size: 16px;
            font-weight: bold;
            &.expense {
              color: var(--text-color-primary);
            }
            &.income {
              color: var(--van-danger-color);
            }
          }
        }
      }
    }
  }
}
</style>
