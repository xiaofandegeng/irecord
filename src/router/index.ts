import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/pages/auth/login-index.vue'),
        meta: { requiresAuth: false }
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
        path: '/category-manage',
        name: 'CategoryManage',
        component: () => import('@/pages/category/category-manage.vue'),
        meta: { title: '分类管理' }
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

router.beforeEach((to, _from, next) => {
    // We import dynamically to avoid initialization issues before pinia is ready
    import('@/stores/user').then(module => {
        const userStore = module.useUserStore()

        if (to.path !== '/login' && !userStore.isLoggedIn) {
            // If going somewhere other than login and not logged in, redirect to login
            next('/login')
        } else if (to.path === '/login' && userStore.isLoggedIn) {
            // If going to login but already logged in, redirect to home
            next('/home')
        } else {
            next()
        }
    })
})

export default router
