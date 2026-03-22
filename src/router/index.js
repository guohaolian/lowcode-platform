import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/form' },
  { path: '/form',   name: 'form',   component: () => import('../components/form/FormDesigner.vue') },
  { path: '/page',   name: 'page',   component: () => import('../components/page/PageBuilder.vue') },
  { path: '/flow',   name: 'flow',   component: () => import('../components/flow/FlowEditor.vue') },
  { path: '/report', name: 'report', component: () => import('../components/report/ReportDesigner.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
