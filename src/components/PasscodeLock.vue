<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSettingStore } from '@/stores/setting'
import { playHaptic } from '@/utils/haptics'

const settingStore = useSettingStore()

// If true, the lock screen is visible blocking the app
const showLock = ref(false)

// The entered value
const value = ref('')

// Whether to show the keyboard
const showKeyboard = ref(false)

const errorInfo = ref('')

const checkPasscode = () => {
    if (value.value === settingStore.passcode) {
        playHaptic('medium')
        showLock.value = false
        value.value = ''
        errorInfo.value = ''
        showKeyboard.value = false
        sessionStorage.setItem('irecord_unlocked', 'true')
    } else {
        playHaptic('heavy')
        errorInfo.value = '密码错误，请重试'
        value.value = ''
    }
}

watch(value, (newVal) => {
    if (newVal.length === 4) {
        checkPasscode()
    } else {
        errorInfo.value = ''
    }
})

// Focus the keyboard
const onFocus = () => {
    if (showLock.value) {
        showKeyboard.value = true
    }
}

// Logic to show lock on load or visibility change
const applyLockLogic = () => {
    if (settingStore.enablePasscode && settingStore.passcode) {
        const unlocked = sessionStorage.getItem('irecord_unlocked') === 'true'
        // If not unlocked this session, or returning from background, we could lock.
        // For simplicity, we lock on initial load in this PR. 
        // More strict would be to clear `sessionStorage` on visibilitychange hidden.
        if (!unlocked) {
            showLock.value = true
            showKeyboard.value = true
        }
    } else {
        showLock.value = false
    }
}

const handleVisibilityChange = () => {
    if (document.hidden) {
        sessionStorage.removeItem('irecord_unlocked')
    } else {
        applyLockLogic()
    }
}

onMounted(() => {
    applyLockLogic()
    document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
})

</script>

<template>
  <van-popup
    v-model:show="showLock"
    position="bottom"
    :style="{ height: '100%', width: '100vw', zIndex: 9999 }"
    :close-on-click-overlay="false"
    class="passcode-lock-container"
  >
    <div class="lock-screen-content">
      <div class="icon-wrap">
        <van-icon name="lock" class="lock-icon" />
      </div>
      <div class="title">输入密码以解锁</div>
      <div class="subtitle" v-if="errorInfo">{{ errorInfo }}</div>
      <div class="subtitle text-secondary" v-else>保护您的财务隐私数据</div>

      <!-- 密码输入框 -->
      <van-password-input
        :value="value"
        :focused="showKeyboard"
        @focus="onFocus"
        :length="4"
        :error-info="errorInfo"
        class="custom-pwd-input"
      />
    </div>

    <!-- 数字键盘 -->
    <van-number-keyboard
      v-model="value"
      :show="showKeyboard"
      @blur="showKeyboard = false"
      :maxlength="4"
      safe-area-inset-bottom
      class="custom-pwd-keyboard"
    />
  </van-popup>
</template>

<style scoped lang="scss">
.passcode-lock-container {
  background: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
}

.lock-screen-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 25vh; /* Push up so keyboard doesn't hide it instantly */

  .icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: linear-gradient(135deg, var(--van-primary-color), var(--van-primary-color));
    opacity: 0.9;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    
    .lock-icon {
      font-size: 36px;
    }
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-color-primary);
  }

  .subtitle {
    font-size: 14px;
    margin-bottom: 40px;
    color: var(--van-danger-color);
    &.text-secondary {
       color: var(--text-color-secondary);
    }
  }

  .custom-pwd-input {
    width: 280px;

    :deep(.van-password-input__item) {
      background: var(--bg-color-primary);
      border-radius: 12px;
      margin: 0 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
  }
}
</style>
