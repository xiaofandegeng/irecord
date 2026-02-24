import { MockMethod } from 'vite-plugin-mock'

export default [
    {
        url: '/api/auth/login',
        method: 'post',
        response: ({ body }: any) => {
            const { username } = body
            return {
                code: 200,
                message: 'success',
                data: {
                    token: 'mock-jwt-token-123456',
                    user: {
                        id: 'u_1001',
                        username: username || '记账达人',
                        avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
                    }
                }
            }
        }
    },
    {
        url: '/api/auth/profile',
        method: 'get',
        response: () => {
            return {
                code: 200,
                message: 'success',
                data: {
                    id: 'u_1001',
                    username: '记账达人',
                    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
                }
            }
        }
    },
    {
        url: '/api/records',
        method: 'get',
        response: ({ query }: any) => {
            // 简单模拟返回数据，实际联调中再做复杂拼装
            return {
                code: 200,
                message: 'success',
                data: []
            }
        }
    },
    {
        url: '/api/records',
        method: 'post',
        response: ({ body }: any) => {
            return {
                code: 200,
                message: 'success',
                data: {
                    ...body,
                    id: 'mock_record_' + Date.now(),
                    createTime: Date.now()
                }
            }
        }
    }
] as MockMethod[]
