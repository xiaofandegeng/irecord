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
        meta: { requiresAuth: false, depth: 0 }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/pages/home/home-index.vue'),
        meta: { depth: 1 }
    },
    {
        path: '/detail',
        name: 'Detail',
        component: () => import('@/pages/detail/detail-index.vue'),
        meta: { depth: 1 }
    },
    {
        path: '/report',
        name: 'Report',
        component: () => import('@/pages/report/report-index.vue'),
        meta: { depth: 1 }
    },
    {
        path: '/mine',
        name: 'Mine',
        component: () => import('@/pages/mine/mine-index.vue'),
        meta: { depth: 1 }
    },
    {
        path: '/category-manage',
        name: 'CategoryManage',
        component: () => import('@/pages/category/category-manage.vue'),
        meta: { depth: 2, title: '分类管理' }
    },
    {
        path: '/account-manage',
        name: 'AccountManage',
        component: () => import('@/pages/account/account-manage.vue'),
        meta: { depth: 2, title: '资产管理' }
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/pages/search/search-index.vue'),
        meta: { depth: 2, title: '搜索' }
    },
    {
        path: '/import',
        name: 'Import',
        component: () => import('@/pages/import/import-index.vue'),
        meta: { depth: 2, title: '导入账单' }
    },
    {
        path: '/recurring-manage',
        name: 'RecurringManage',
        component: () => import('@/pages/recurring/recurring-manage.vue'),
        meta: { depth: 2, title: '周期记账' }
    },
    {
        path: '/ledger-manage',
        name: 'LedgerManage',
        component: () => import('@/pages/ledger/ledger-manage.vue'),
        meta: { depth: 2, title: '账本管理' }
    },
    {
        path: '/goal-manage',
        name: 'GoalManage',
        component: () => import('@/pages/goal/goal-manage.vue'),
        meta: { depth: 2, title: '存钱计划' }
    },
    {
        path: '/sync-manage',
        name: 'SyncManage',
        component: () => import('@/pages/sync/sync-manage.vue'),
        meta: { depth: 2, title: '数据同步' }
    },
    {
        path: '/reimburse-manage',
        name: 'ReimburseManage',
        component: () => import('@/pages/reimburse/reimburse-manage.vue'),
        meta: { depth: 2, title: '报销管理' }
    },
    {
        path: '/debt-manage',
        name: 'DebtManage',
        component: () => import('@/pages/debt/debt-manage.vue'),
        meta: { depth: 2, title: '借贷管理' }
    },
    {
        path: '/profile-edit',
        name: 'ProfileEdit',
        component: () => import('@/pages/mine/profile-edit.vue'),
        meta: { depth: 2, title: '个人资料' }
    },
    {
        path: '/calendar-index',
        name: 'CalendarIndex',
        component: () => import('@/pages/calendar/calendar-index.vue'),
        meta: { depth: 2, title: '账单日历' }
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
