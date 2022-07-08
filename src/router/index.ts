import {createRouter, createWebHistory} from 'vue-router'
import routes from './routes'

export const router = createRouter({
    history: createWebHistory(),
    routes
});

// 路由全局前置守卫
router.beforeEach((to, from, next) => {
  // 当前路由需要登录才可进入
  if (to.meta.requireAuth) {
    next('/');
  } else {
    next();
  }
  if (to.meta.title) {
    document.title =`${to.meta.title}`
  }
});

export default router;

