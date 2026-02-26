<template>
  <div class="profile-container">
    <van-nav-bar
      title="编辑个人资料"
      left-arrow
      @click-left="router.back()"
      :border="false"
      class="transparent-nav"
    />

    <div class="hero-avatar">
      <div class="avatar-wrap">
        <van-image round width="96" height="96" :src="currentAvatar" />
      </div>
      <div class="user-id">UID: {{ userStore.userInfo?.id || '——' }}</div>
    </div>

    <!-- 用户名编辑 -->
    <van-cell-group inset class="form-group">
      <van-field
        v-model="currentName"
        label="昵称"
        placeholder="给你的账本起个名字吧"
        clearable
        maxlength="12"
        label-align="left"
        input-align="right"
      />
    </van-cell-group>

    <!-- 头像库选择 -->
    <div class="avatar-gallery">
      <div class="section-title">选择预设头像</div>
      <div class="grid-wrap">
        <div 
          class="avatar-item" 
          v-for="(url, idx) in DEFAULT_AVATARS" 
          :key="idx"
          :class="{ 'is-active': currentAvatar === url }"
          @click="selectAvatar(url)"
        >
          <van-image round width="56" height="56" :src="url" />
          <div class="active-badge" v-if="currentAvatar === url">
            <van-icon name="success" size="14" color="#fff" />
          </div>
        </div>
      </div>
    </div>

    <!-- 主题颜色选择 -->
    <div class="theme-gallery">
      <div class="section-title">应用主题色</div>
      <div class="color-wrap">
        <div 
          class="color-item" 
          v-for="color in THEME_COLORS" 
          :key="color"
          :style="{ backgroundColor: color }"
          :class="{ 'is-active': settingStore.primaryColor === color }"
          @click="selectTheme(color)"
        >
          <van-icon name="success" size="16" color="#fff" v-if="settingStore.primaryColor === color" />
        </div>
      </div>
    </div>

    <!-- 隐私安全设置 -->
    <div class="privacy-settings">
      <div class="section-title">安全隐私</div>
      <van-cell-group inset>
        <van-cell title="应用安全锁" label="打开App时需要验证密码">
          <template #right-icon>
            <van-switch v-model="localEnablePasscode" @change="onPasscodeSwitchChange" size="24" :active-color="settingStore.primaryColor" />
          </template>
        </van-cell>
        <van-cell 
          v-if="localEnablePasscode" 
          title="修改安全密码" 
          is-link 
          @click="openPasscodeEdit"
        />
      </van-cell-group>
    </div>

    <!-- 记账设置 -->
    <div class="accounting-settings">
      <div class="section-title">记账设置</div>
      <van-cell-group inset>
        <van-cell
          title="起账日设置"
          :value="`每月 ${settingStore.billingStartDay} 日`"
          is-link
          @click="showStartDayPicker = true"
          label="每月账单周期开始的日期"
        />
      </van-cell-group>
    </div>

    <div class="action-btn">
      <van-button round block type="primary" size="large" @click="saveProfile">
        保 存
      </van-button>
    </div>

    <!-- 修改/设置密码键盘弹窗 -->
    <van-popup v-model:show="showKeyboardPopup" position="bottom" round safe-area-inset-bottom @closed="onKeyboardClosed">
      <div class="passcode-setup-header">
        <div class="title">{{ passcodeStep === 1 ? '请设置 4 位安全密码' : '请再次确认密码' }}</div>
      </div>
      <div class="passcode-input-wrap">
        <van-password-input
          :value="tempPasscode"
          :focused="showKeyboardPopup"
          :length="4"
          :error-info="passcodeError"
          @focus="showKeyboardPopup = true"
        />
      </div>
      <van-number-keyboard
        v-model="tempPasscode"
        :show="showKeyboardPopup"
        :maxlength="4"
        @blur="showKeyboardPopup = false"
      />
    </van-popup>

    <!-- 记账起始日选择 -->
    <van-popup v-model:show="showStartDayPicker" position="bottom" round safe-area-inset-bottom>
      <van-picker
        :columns="startDayColumns"
        @confirm="onStartDayConfirm"
        @cancel="showStartDayPicker = false"
        title="选择起账日"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useUserStore, DEFAULT_AVATARS } from '@/stores/user'
import { useSettingStore } from '@/stores/setting'
import { playHaptic } from '@/utils/haptics'

const router = useRouter()
const userStore = useUserStore()
const settingStore = useSettingStore()

const THEME_COLORS = [
  '#07c160', // iCost绿
  '#3451b2', // 暗夜蓝
  '#f498ad', // 樱花粉
  '#ff6b00', // 活力橙
  '#7059e4'  // 薰衣紫
]

const currentName = ref(userStore.userInfo?.username || '')
const currentAvatar = ref(userStore.userInfo?.avatar || DEFAULT_AVATARS[1])

const selectTheme = (color: string) => {
  playHaptic('medium')
  settingStore.setPrimaryColor(color)
}

const selectAvatar = (url: string) => {
  playHaptic('light')
  currentAvatar.value = url
}

// ==== 安全隐私设定逻辑 ====
const localEnablePasscode = ref(settingStore.enablePasscode)
const showKeyboardPopup = ref(false)
const passcodeStep = ref(1) // 1: 创设, 2: 确认
const tempPasscode = ref('')
const firstPasscode = ref('')
const passcodeError = ref('')

const onPasscodeSwitchChange = (val: boolean) => {
  if (val) {
    if (!settingStore.passcode) {
      // 从未设置过，强制去设置
      localEnablePasscode.value = false
      openPasscodeEdit()
    } else {
      settingStore.setPasscodeContext(true, settingStore.passcode)
    }
  } else {
    // 关闭
    showDialog({
      title: '关闭安全锁',
      message: '确定要关闭启动应用时的密码保护吗？',
      showCancelButton: true
    }).then(() => {
      settingStore.setPasscodeContext(false, '')
    }).catch(() => {
      localEnablePasscode.value = true
    })
  }
}

const openPasscodeEdit = () => {
  passcodeStep.value = 1
  tempPasscode.value = ''
  firstPasscode.value = ''
  passcodeError.value = ''
  showKeyboardPopup.value = true
}

const onKeyboardClosed = () => {
  tempPasscode.value = ''
  passcodeError.value = ''
}

watch(tempPasscode, (val) => {
  if (val.length === 4) {
    if (passcodeStep.value === 1) {
      // 步骤1完成
      playHaptic('light')
      firstPasscode.value = val
      passcodeStep.value = 2
      tempPasscode.value = ''
      passcodeError.value = ''
    } else if (passcodeStep.value === 2) {
      // 步骤2完成
      if (val === firstPasscode.value) {
        playHaptic('medium')
        settingStore.setPasscodeContext(true, val)
        localEnablePasscode.value = true
        showKeyboardPopup.value = false
        showToast('安全锁设置成功')
      } else {
        playHaptic('heavy')
        passcodeError.value = '两次输入的密码不一致，请重试'
        tempPasscode.value = ''
      }
    }
  } else {
    passcodeError.value = ''
  }
})

// ==== 起账日逻辑 ====
const showStartDayPicker = ref(false)
const startDayColumns = [
  ...Array.from({ length: 28 }, (_, i) => ({
    text: `${i + 1}日`,
    value: i + 1
  }))
]

const onStartDayConfirm = ({ selectedOptions }: any) => {
  if (selectedOptions && selectedOptions[0]) {
    playHaptic('medium')
    settingStore.setBillingStartDay(selectedOptions[0].value)
    showToast('起账日已更新')
  }
  showStartDayPicker.value = false
}

const saveProfile = () => {
  if (!currentName.value.trim()) {
    showToast('昵称不能为空')
    return
  }
  
  playHaptic('heavy')
  userStore.updateProfile(currentName.value.trim(), currentAvatar.value)
  showToast({
    message: '保存成功',
    icon: 'success'
  })
  
  setTimeout(() => {
    router.back()
  }, 500)
}
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  
  :deep(.transparent-nav) {
    background-color: transparent;
    .van-nav-bar__title {
      font-weight: 600;
      color: var(--text-color-primary);
    }
  }

  .hero-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 24px 0 32px;
    
    .avatar-wrap {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: var(--bg-color-primary);
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      border: 3px solid #fff;
    }
    
    .user-id {
      margin-top: 12px;
      font-size: 13px;
      color: var(--text-color-secondary);
      font-family: 'Din', sans-serif;
    }
  }
  
  .form-group {
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    margin: 0 16px 24px;
    
    :deep(.van-cell) {
      padding: 16px;
      align-items: center;
    }
    :deep(.van-field__label) {
      font-weight: 500;
      color: var(--text-color-primary);
    }
  }
  
  .avatar-gallery {
    padding: 0 16px;
    
    .section-title {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .grid-wrap {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: var(--bg-color-primary);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      
      .avatar-item {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s;
        
        &:active {
          transform: scale(0.9);
        }
        
        .van-image {
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        
        &.is-active {
          .van-image {
            border-color: var(--van-primary-color);
          }
        }
        
        .active-badge {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--van-primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
          border: 2px solid #fff;
        }
      }
    }
  }

  .theme-gallery {
    padding: 24px 16px 0;
    
    .section-title {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .color-wrap {
      display: flex;
      justify-content: space-between;
      background: var(--bg-color-primary);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      
      .color-item {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        
        &:active {
          transform: scale(0.85);
        }
        
        &.is-active {
          transform: scale(1.1);
          border-color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      }
    }
  }

  .privacy-settings,
  .accounting-settings {
    margin-top: 24px;
    padding: 0 16px;
    
    .section-title {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
      padding-left: 8px;
    }
  }
  
  .action-btn {
    margin: auto 24px 40px;
  }

  .passcode-setup-header {
    text-align: center;
    padding: 24px 0 16px;
    .title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }
  }

  .passcode-input-wrap {
    padding: 0 24px 24px;
    :deep(.van-password-input__item) {
      background: var(--bg-color-secondary);
      border-radius: 8px;
    }
  }
  
  .action-btn {
    margin-top: 40px;
    
    .van-button {
      border-radius: 16px;
      font-weight: 600;
      box-shadow: 0 6px 16px rgba(7, 193, 96, 0.25);
    }
  }
}

[data-theme='dark'] {
  .hero-avatar .avatar-wrap {
    border-color: #333;
  }
  .avatar-item .active-badge {
    border-color: #333;
  }
}
</style>
