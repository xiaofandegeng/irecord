<template>
  <div class="debt-manage-container">
    <van-nav-bar
      title="借入与借出账单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <van-tabs v-model:active="activeTab" sticky color="var(--van-primary-color)">
      <van-tab title="我借出的 (待收)" :name="1">
        <div class="summary-box lent-box">
          <div class="label">当前总待收</div>
          <div class="val">{{ debtStore.getLedgerTotals().lent.toFixed(2) }}</div>
        </div>
        <div class="list-section">
          <van-cell-group inset v-if="lentDebts.length > 0">
            <van-swipe-cell v-for="debt in lentDebts" :key="debt.id">
              <van-cell center class="debt-cell">
                <template #title>
                  <div class="d-title">
                    <span class="person">{{ debt.person }}</span>
                    <van-tag type="success" plain v-if="debt.isCleared">已结清</van-tag>
                    <van-tag type="warning" plain v-else>待收回</van-tag>
                  </div>
                </template>
                <template #label>
                  <div class="d-label">
                    <div>借出日期: {{ formatTime(debt.recordTime) }}</div>
                    <div class="remark">备注: {{ debt.remark || '无' }}</div>
                    <div class="progress-info">
                      进度: <span class="repaid">{{ debt.repaidAmount.toFixed(2) }}</span> / {{ debt.amount.toFixed(2) }}
                    </div>
                  </div>
                </template>
                <template #value>
                  <div class="d-val">
                    <div class="remain" :class="{ cleared: debt.isCleared }">{{ (debt.amount - debt.repaidAmount).toFixed(2) }}</div>
                  </div>
                </template>
              </van-cell>
              <template #right>
                <van-button square type="primary" text="还款入账" class="action-btn" @click="openRepaymentModal(debt)" />
                <van-button square type="danger" text="删除" class="action-btn" @click="handleDelete(debt.id)" />
              </template>
            </van-swipe-cell>
          </van-cell-group>
          <van-empty v-else description="暂无借出记录" />
        </div>
      </van-tab>

      <van-tab title="我借入的 (待还)" :name="2">
        <div class="summary-box borrowed-box">
          <div class="label">当前总待还</div>
          <div class="val">{{ debtStore.getLedgerTotals().borrowed.toFixed(2) }}</div>
        </div>
        <div class="list-section">
          <van-cell-group inset v-if="borrowedDebts.length > 0">
            <van-swipe-cell v-for="debt in borrowedDebts" :key="debt.id">
              <van-cell center class="debt-cell">
                <template #title>
                  <div class="d-title">
                    <span class="person">{{ debt.person }}</span>
                    <van-tag type="success" plain v-if="debt.isCleared">已结清</van-tag>
                    <van-tag type="danger" plain v-else>待归还</van-tag>
                  </div>
                </template>
                <template #label>
                  <div class="d-label">
                    <div>借入日期: {{ formatTime(debt.recordTime) }}</div>
                    <div class="remark">备注: {{ debt.remark || '无' }}</div>
                    <div class="progress-info">
                      进度: <span class="repaid">{{ debt.repaidAmount.toFixed(2) }}</span> / {{ debt.amount.toFixed(2) }}
                    </div>
                  </div>
                </template>
                <template #value>
                  <div class="d-val">
                    <div class="remain danger" :class="{ cleared: debt.isCleared }">{{ (debt.amount - debt.repaidAmount).toFixed(2) }}</div>
                  </div>
                </template>
              </van-cell>
              <template #right>
                <van-button square type="primary" text="还款出账" class="action-btn" @click="openRepaymentModal(debt)" />
                <van-button square type="danger" text="删除" class="action-btn" @click="handleDelete(debt.id)" />
              </template>
            </van-swipe-cell>
          </van-cell-group>
          <van-empty v-else description="暂无借入记录" />
        </div>
      </van-tab>
    </van-tabs>

    <div class="fixed-bottom">
      <van-button type="primary" block round @click="showAddModal = true">
        新增借贷记录
      </van-button>
    </div>

    <!-- 添加债务弹窗 -->
    <van-action-sheet v-model:show="showAddModal" title="新建借贷" class="add-sheet">
      <van-form @submit="onAddDebt">
        <van-cell-group inset>
          <van-field name="type" label="类型">
            <template #input>
              <van-radio-group v-model="addForm.type" direction="horizontal">
                <van-radio :name="1" checked-color="#07c160">借出 (待收)</van-radio>
                <van-radio :name="2" checked-color="#ee0a24">借入 (待还)</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field
            v-model="addForm.person"
            name="person"
            label="对方姓名"
            placeholder="如：张三"
            :rules="[{ required: true, message: '请填写姓名' }]"
          />
          <van-field
            v-model="addForm.amount"
            type="number"
            name="amount"
            label="总金额"
            placeholder="请输入借款总额"
            :rules="[{ required: true, message: '请填写金额' }]"
          />
          <van-field
            v-model="addForm.remark"
            name="remark"
            label="备注信息"
            placeholder="如：请客垫付"
          />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit">确认保存</van-button>
        </div>
      </van-form>
    </van-action-sheet>

    <!-- 还款/收款 弹窗 -->
    <van-action-sheet v-model:show="showRepayModal" :title="repayTitle" class="add-sheet">
      <van-form @submit="onRepayDebt">
        <van-cell-group inset>
          <van-cell title="待结清尾款" :value="`¥ ${repayMaxAmount.toFixed(2)}`" />
          <van-field
            v-model="repayForm.amount"
            type="number"
            name="amount"
            label="本次金额"
            placeholder="请输入本次操作金额"
            :rules="[{ required: true, message: '请填写金额' }]"
          />
          <van-field name="accountId" label="资金账户">
            <template #input>
              <van-radio-group v-model="repayForm.accountId">
                <van-radio v-for="acc in accountStore.accounts" :key="acc.id" :name="acc.id" checked-color="var(--van-primary-color)" style="margin-bottom: 8px;">
                  {{ acc.name }} (¥{{ acc.balance.toFixed(2) }})
                </van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field v-model="repayForm.remark" name="remark" label="备注" placeholder="选填" />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit">提交并记账</van-button>
        </div>
      </van-form>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useDebtStore, DebtItem } from '@/stores/debt'
import { useAccountStore } from '@/stores/account'

const router = useRouter()
const route = useRoute()
const debtStore = useDebtStore()
const accountStore = useAccountStore()

// 初始化 Tab (根据路由传参)
const initialType = Number(route.query.type)
const activeTab = ref(initialType === 2 ? 2 : 1)

// 数据源
const currentLedgerAllDebts = computed(() => {
  return debtStore.currentLedgerDebts.sort((a, b) => b.recordTime - a.recordTime)
})

const lentDebts = computed(() => currentLedgerAllDebts.value.filter(d => d.type === 1))
const borrowedDebts = computed(() => currentLedgerAllDebts.value.filter(d => d.type === 2))

// 工具
const onClickLeft = () => {
  router.back()
}
const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 新增借贷
const showAddModal = ref(false)
const addForm = ref({
  type: activeTab.value,
  person: '',
  amount: '',
  remark: ''
})

const onAddDebt = () => {
  const amt = parseFloat(addForm.value.amount)
  if (amt <= 0) {
    showToast('金额必须大于 0')
    return
  }
  debtStore.addDebt({
    type: addForm.value.type as 1 | 2,
    amount: amt,
    person: addForm.value.person,
    recordTime: Date.now(),
    remark: addForm.value.remark
  })
  showToast('添加成功')
  showAddModal.value = false
  addForm.value.person = ''
  addForm.value.amount = ''
  addForm.value.remark = ''
  // 切换到对应tab
  activeTab.value = addForm.value.type
}

// 删除
const handleDelete = (id: string) => {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后无法恢复，同时包含的还款记录也会清空，但不会撤销已同步产生的流水，确认删除吗？',
  }).then(() => {
    debtStore.deleteDebt(id)
    showToast('已删除')
  }).catch(() => {})
}

// 还款操作
const showRepayModal = ref(false)
const currentRepayDebt = ref<DebtItem | null>(null)
const repayForm = ref({
  amount: '',
  accountId: accountStore.accounts[0]?.id || '',
  remark: ''
})

const repayTitle = computed(() => {
  if (!currentRepayDebt.value) return ''
  return currentRepayDebt.value.type === 1 ? '收回欠款' : '归还借款'
})

const repayMaxAmount = computed(() => {
  if (!currentRepayDebt.value) return 0
  return currentRepayDebt.value.amount - currentRepayDebt.value.repaidAmount
})

const openRepaymentModal = (debt: DebtItem) => {
  if (debt.isCleared) {
    showToast('该账单已结清')
    return
  }
  currentRepayDebt.value = debt
  repayForm.value.amount = String(debt.amount - debt.repaidAmount)
  repayForm.value.remark = ''
  showRepayModal.value = true
}

const onRepayDebt = () => {
  const amt = parseFloat(repayForm.value.amount)
  if (amt <= 0) {
    showToast('金额输入有误')
    return
  }
  if (amt > repayMaxAmount.value) {
    showToast('超过待结清尾款')
    return
  }
  if (!repayForm.value.accountId) {
    showToast('请选择记账账户')
    return
  }

  debtStore.addRepayment(
    currentRepayDebt.value!.id,
    amt,
    repayForm.value.accountId,
    repayForm.value.remark
  )

  showToast('操作成功并已记账')
  showRepayModal.value = false
}
</script>

<style lang="scss" scoped>
.debt-manage-container {
  min-height: 100vh;
  background-color: var(--bg-color-primary);
  padding-bottom: 80px;

  .summary-box {
    margin: 16px;
    padding: 20px;
    border-radius: 12px;
    color: #fff;
    
    .label {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 6px;
    }
    .val {
      font-size: 28px;
      font-weight: bold;
    }
    
    &.lent-box {
      background: linear-gradient(135deg, #07c160, #40d885);
    }
    &.borrowed-box {
      background: linear-gradient(135deg, #ee0a24, #ff5c73);
    }
  }

  .list-section {
    .debt-cell {
      padding: 16px;
      
      .d-title {
        display: flex;
        align-items: center;
        gap: 8px;
        .person {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-color-primary);
        }
      }
      
      .d-label {
        font-size: 12px;
        color: var(--text-color-secondary);
        margin-top: 6px;
        line-height: 1.6;
        
        .progress-info {
          margin-top: 4px;
          .repaid { color: #07c160; }
        }
      }
      
      .d-val {
        .remain {
          font-size: 18px;
          font-weight: bold;
          color: #07c160;
          &.danger { color: #ee0a24; }
          &.cleared { color: #999; text-decoration: line-through; }
        }
      }
    }
    
    .action-btn {
      height: 100%;
    }
  }

  .add-sheet {
    .van-action-sheet__content {
      padding-bottom: 20px;
    }
  }

  .fixed-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 16px 20px 24px;
    background-color: var(--bg-color-primary);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 100;
  }
}
</style>
