import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: () => import('@/views/map/index.vue'),
    meta: {
      requireAuth: false,
      title: '首页',
      content: {
        description: '首页'
      }
    }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/test/index.vue'),
    meta: {
      title: '测试',
      requireAuth: false }
  },
  {
    path: '/bar',
    name: 'Map',
    component: () => import('@/views/bar/index.vue'),
    meta: {
      title: '测试',
      requireAuth: false }
  },
  {
    path: '/:pathMath(.*)',
    name: 'Error',
    component: () => import('@/views/errorPage/index.vue'),
    meta: { title: '链接不存在' }
  }
];

export default routes;
