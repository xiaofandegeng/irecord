<template>
  <div class="login-container">
    <div class="logo-area">
      <van-icon name="gold-coin" size="64" color="var(--van-primary-color)" />
      <h1 class="title">iRecord</h1>
      <p class="subtitle">极简极速的美学记账</p>
    </div>

    <div class="form-area">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div style="margin: 32px 16px 16px;">
          <van-button round block type="primary" native-type="submit">
            {{ isLoginMode ? '登 录' : '注 册' }}
          </van-button>
        </div>
        <div class="switch-mode" @click="toggleMode">
          {{ isLoginMode ? '没有账号？去注册' : '已有账号？去登录' }}
        </div>
      </van-form>
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-secondary);
  
  .logo-area {
    margin-top: 100px;
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .title {
      margin-top: 16px;
      font-size: 28px;
      font-weight: bold;
      color: var(--text-color-primary);
    }
    
    .subtitle {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }
  
  .form-area {
    padding: 0 16px;
    
    .switch-mode {
      text-align: center;
      font-size: 14px;
      color: var(--van-primary-color);
      margin-top: 16px;
      cursor: pointer;
    }
  }
}
</style>
