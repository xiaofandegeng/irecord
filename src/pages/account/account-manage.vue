<template>
  <div class="account-manage">
    <van-nav-bar
      title="资产账户管理"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      class="transparent-nav"
      :border="false"
    />
    
    <div class="container">
      <div class="header-card">
        <div class="label">资产总计 (元)</div>
        <div class="amount din-font">{{ accountStore.privacyMode ? '****' : accountStore.totalNetAsset.toFixed(2) }}</div>
      </div>
      
      <div class="section-title">我的账户 ({{ accountStore.accounts.length }})</div>
      
      <van-cell-group inset class="custom-inset-group">
        <van-cell 
          v-for="acc in accountStore.accounts" 
          :key="acc.id" 
          center 
          @click="onEditAccount(acc)"
          is-link
          clickable
        >
          <template #icon>
            <div class="icon-wrap" :style="{ backgroundColor: acc.color }">
              <van-icon name="gold-coin-o" size="20" color="#fff" />
            </div>
          </template>
          <template #title>
            <span class="custom-title">{{ acc.name }}</span>
          </template>
          <template #label>
            <span v-if="acc.type === 1">储蓄/现金</span>
            <span v-else-if="acc.type === 2">信用/借贷</span>
            <span v-else>其他</span>
          </template>
          <template #right-icon>
            <span class="balance din-font" :class="{'is-debt': acc.balance < 0}">
              ¥ {{ accountStore.privacyMode ? '****' : acc.balance.toFixed(2) }}
            </span>
          </template>
        </van-cell>
      </van-cell-group>
      
      <div class="action-wrap">
        <van-button type="primary" block round @click="showAdd = true">新增账户</van-button>
      </div>
    </div>

    <!-- 添加账户弹窗 -->
    <van-dialog v-model:show="showAdd" title="新增账户" show-cancel-button @confirm="onConfirmAdd">
      <van-field v-model="newAccName" label="账户名" placeholder="例如：招商银行" />
      <van-field name="radio" label="账户类型">
        <template #input>
          <van-radio-group v-model="newAccType" direction="horizontal">
            <van-radio :name="1">储蓄/现金</van-radio>
            <van-radio :name="2">信用/借贷</van-radio>
            <van-radio :name="3">其他</van-radio>
          </van-radio-group>
        </template>
      </van-field>
      <van-field v-model="newAccBalance" type="number" label="初始余额" placeholder="默认0.00" />
    </van-dialog>

    <!-- 平账修改弹窗 -->
    <van-dialog v-model:show="showEdit" title="修改平账" show-cancel-button @confirm="onConfirmEdit">
      <div style="padding: 16px; font-size: 14px; color: #666; text-align: center">
        正在修改「{{ currentEditAcc?.name }}」
      </div>
      <van-field v-model="editBalance" type="number" label="调整为(元)" placeholder="输入最新的余额" />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAccountStore, type AccountEntity } from '@/stores/account'

const router = useRouter()
const accountStore = useAccountStore()

const showAdd = ref(false)
const newAccName = ref('')
const newAccType = ref<1|2|3>(1)
const newAccBalance = ref('')

const showEdit = ref(false)
const currentEditAcc = ref<AccountEntity | null>(null)
const editBalance = ref('')

const onClickLeft = () => {
  router.back()
}

const onEditAccount = (acc: AccountEntity) => {
  currentEditAcc.value = acc
  editBalance.value = String(acc.balance)
  showEdit.value = true
}

const onConfirmEdit = () => {
  if (currentEditAcc.value) {
    const val = parseFloat(editBalance.value) || 0
    currentEditAcc.value.balance = val
    showToast('平账成功')
  }
}

const onConfirmAdd = () => {
  if (!newAccName.value.trim()) {
    showToast('请输入账户名')
    return
  }
  const accIds = accountStore.accounts.map(a => parseInt(a.id.replace('a','')) || 0)
  const maxId = accIds.length ? Math.max(...accIds) : 0
  
  const colors = ['#07c160', '#1677ff', '#ee0a24', '#fba414', '#7232dd']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  
  accountStore.accounts.push({
    id: `a${maxId + 1}`,
    name: newAccName.value.trim(),
    type: newAccType.value,
    balance: parseFloat(newAccBalance.value) || 0,
    color: randomColor
  })
  
  showToast('添加账户成功')
  newAccName.value = ''
  newAccType.value = 1
  newAccBalance.value = ''
}
</script>

<style lang="scss" scoped>
.account-manage {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  
  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title, .van-icon {
      color: var(--text-color-primary);
    }
  }
  
  .container {
    padding-bottom: 80px;
    padding-top: 12px;
    
    .header-card {
      margin: 0 16px 20px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--van-primary-color), #23d47a);
      color: #fff;
      padding: 30px 20px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(7, 193, 96, 0.2);
      
      .label {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
        font-weight: 500;
      }
      .amount {
        font-size: 36px;
        font-weight: bold;
      }
    }
    
    .section-title {
      padding: 0 24px 8px;
      font-size: 13px;
      color: var(--text-color-secondary);
      font-weight: 500;
    }
    
    .custom-inset-group {
      margin: 0 16px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      
      [data-theme='dark'] & {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      }
      
      .icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }
      
      .custom-title {
        font-size: 15px;
        font-weight: 500;
      }
      
      .balance {
        font-size: 16px;
        font-weight: bold;
        color: var(--text-color-primary);
        line-height: inherit;
        
        &.is-debt {
          color: var(--van-danger-color);
        }
      }
      
      :deep(.van-cell) {
        background-color: var(--bg-color-primary);
        padding: 14px 16px;
        transition: background-color 0.2s;
        
        &::after {
          left: 64px;
          right: 16px;
        }
        
        &:active {
          background-color: var(--van-active-color);
        }
      }
    }
    
    .action-wrap {
      padding: 32px 16px;
    }
  }
}
</style>
