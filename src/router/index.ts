import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/pages/home/home-index.vue')
    },
    {
        path: '/detail',
        name: 'Detail',
        component: () => import('@/pages/detail/detail-index.vue')
    },
    {
        path: '/report',
        name: 'Report',
        component: () => import('@/pages/report/report-index.vue')
    },
    {
        path: '/mine',
        name: 'Mine',
        component: () => import('@/pages/mine/mine-index.vue')
    },
    {
        path: '/category-manage',
        name: 'CategoryManage',
        component: () => import('@/pages/category/category-manage.vue')
    },
    {
        path: '/account-manage',
        name: 'AccountManage',
        component: () => import('@/pages/account/account-manage.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/pages/search/search-index.vue')
    },
    {
        path: '/import',
        name: 'Import',
        component: () => import('@/pages/import/import-index.vue')
    },
    {
        path: '/recurring-manage',
        name: 'recurring-manage',
        component: () => import('@/pages/recurring/recurring-manage.vue'),
        meta: { title: '周期记账', keepAlive: false }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
