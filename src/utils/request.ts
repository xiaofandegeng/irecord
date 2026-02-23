import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { showToast } from 'vant'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || '/api', // 基础路径，通过环境变量配置
    timeout: 10000, // 请求超时时间
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    }
})

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        // 可以在这里添加 Token 等鉴权信息
        const token = localStorage.getItem('token')
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data
        // 假设后端返回格式为 { code: 200, data: any, msg: string }
        // 根据具体业务协商修改
        if (res.code && res.code !== 200) {
            showToast(res.msg || '请求出错')
            // 如果是 401 token 失效等，可在此处做统一处理跳转登录
            return Promise.reject(new Error(res.msg || 'Error'))
        } else {
            return res.data !== undefined ? res.data : res
        }
    },
    (error) => {
        let msg = error.message
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    msg = '请先登录'
                    break
                case 403:
                    msg = '拒绝访问'
                    break
                case 404:
                    msg = '请求地址错误'
                    break
                case 500:
                    msg = '服务器内部错误'
                    break
            }
        }
        showToast(msg)
        return Promise.reject(error)
    }
)

export default service
