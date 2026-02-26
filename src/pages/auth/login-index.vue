<template>
  <div class="login-container">
    <div class="logo-area">
      <div class="logo-icon-wrap">
        <van-icon name="gold-coin" size="52" color="#fff" />
      </div>
      <h1 class="title">iRecord</h1>
      <p class="subtitle">极简极速的美学记账</p>
    </div>

    <div class="form-area">
      <div class="form-card">
        <van-form @submit="onSubmit">
          <van-cell-group inset :border="false" class="custom-inset-group">
            <van-field
              v-model="username"
              name="username"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请填写用户名' }]"
              clearable
            />
            <van-field
              v-model="password"
              type="password"
              name="password"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请填写密码' }]"
              clearable
            />
          </van-cell-group>
          <div class="submit-action">
            <van-button round block type="primary" native-type="submit" class="auth-btn">
              {{ isLoginMode ? '登 录' : '注 册' }}
            </van-button>
          </div>
          <div class="switch-mode" @click="toggleMode">
            {{ isLoginMode ? '没有账号？创建新账号' : '已有账号？立刻登录' }}
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLoginMode = ref(true)
const username = ref('')
const password = ref('')

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  username.value = ''
  password.value = ''
}

const onSubmit = (values: any) => {
  const toast = showLoadingToast({
    message: isLoginMode.value ? '登录中...' : '注册中...',
    forbidClick: true,
  })

  // 模拟 API 请求延迟
  setTimeout(() => {
    toast.close()
    
    // 模拟后端返回 Token
    const fakeToken = 'mock_jwt_token_' + Date.now()
    userStore.setToken(fakeToken)
    userStore.setUserInfo({
      id: 'u_1001',
      username: values.username,
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
    })
    
    showToast({
      message: isLoginMode.value ? '登录成功' : '注册成功',
      icon: 'success'
    })
    
    router.replace('/home')
  }, 1000)
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-secondary);
  
  .logo-area {
    margin-top: 80px;
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .logo-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: var(--van-primary-color);
      opacity: 0.9;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 16px rgba(7, 193, 96, 0.3);
      margin-bottom: 16px;
    }
    
    .title {
      font-family: 'Din', sans-serif;
      font-size: 36px;
      font-weight: bold;
      color: var(--text-color-primary);
      letter-spacing: 1px;
    }
    
    .subtitle {
      margin-top: 8px;
      font-size: 15px;
      color: var(--text-color-secondary);
      letter-spacing: 1px;
    }
  }
  
  .form-area {
    padding: 0 16px;
    
    .form-card {
      background-color: var(--bg-color-primary);
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      padding: 24px 0 32px;
      overflow: hidden;
      
      .custom-inset-group {
        margin: 0;
        background-color: transparent;
        box-shadow: none;
      }
      
      :deep(.van-cell) {
        background-color: transparent;
        padding: 16px 24px;
        
        &::after {
          left: 24px;
          right: 24px;
        }
      }
      
      :deep(.van-field__label) {
        color: var(--text-color-primary);
        font-weight: 500;
      }
      
      .submit-action {
        margin: 40px 24px 16px;
        
        .auth-btn {
          border-radius: 16px;
          height: 48px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 6px 16px rgba(7, 193, 96, 0.25);
          border: none;
        }
      }
      
      .switch-mode {
        text-align: center;
        font-size: 14px;
        color: var(--van-primary-color);
        margin-top: 20px;
        cursor: pointer;
        padding: 8px;
        opacity: 0.9;
        transition: opacity 0.2s;
        
        &:active {
          opacity: 0.6;
        }
      }
    }
  }
}
</style>
