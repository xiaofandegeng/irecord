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
        name: 'RecurringManage',
        component: () => import('@/pages/recurring/recurring-manage.vue'),
        meta: { title: '周期记账' }
    },
    {
        path: '/ledger-manage',
        name: 'LedgerManage',
        component: () => import('@/pages/ledger/ledger-manage.vue'),
        meta: { title: '账本管理' }
    },
    {
        path: '/goal-manage',
        name: 'GoalManage',
        component: () => import('@/pages/goal/goal-manage.vue'),
        meta: { title: '存钱计划' }
    },
    {
        path: '/sync-manage',
        name: 'SyncManage',
        component: () => import('@/pages/sync/sync-manage.vue'),
        meta: { title: '数据同步' }
    },
    {
        path: '/reimburse-manage',
        name: 'ReimburseManage',
        component: () => import('@/pages/reimburse/reimburse-manage.vue'),
        meta: { title: '报销管理' }
    },
    {
        path: '/debt-manage',
        name: 'DebtManage',
        component: () => import('@/pages/debt/debt-manage.vue'),
        meta: { title: '借贷管理' }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
