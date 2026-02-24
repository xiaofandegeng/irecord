import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建 Axios 实例
const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // mock 接口前缀
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    }
})

// 请求拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const userStore = useUserStore()
        // 如果有 token，则在请求头携带
        if (userStore.token) {
            config.headers['Authorization'] = `Bearer ${userStore.token}`
        }
        return config
    },
    (error: any) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data
        // 假设后端返回结构为: { code: 200, data: any, message: string }
        if (res.code && res.code !== 200) {
            showToast(res.message || '请求失败')

            // 处理 Token 失效的情况
            if (res.code === 401 || res.code === 403) {
                const userStore = useUserStore()
                userStore.logout()
                router.replace('/login')
            }
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            // 兼容直接返回数据结构的 mock 或后端
            return res.data !== undefined ? res.data : res
        }
    },
    (error: any) => {
        let msg = error.message
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    msg = '请先登录'
                    useUserStore().logout()
                    router.replace('/login')
                    break
                case 403:
                    msg = '没有权限访问'
                    break
                case 404:
                    msg = '请求资源不存在'
                    break
                case 500:
                    msg = '服务器内部错误'
                    break
                default:
                    msg = '网络错误'
            }
        }
        showToast({ message: msg, type: 'fail' })
        return Promise.reject(error)
    }
)

export default service
