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

    <div class="action-btn">
      <van-button round block type="primary" size="large" @click="saveProfile">
        保 存
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
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
  
  .action-btn {
    margin: auto 24px 40px;
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
