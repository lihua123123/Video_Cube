import { createRouter, createWebHistory } from 'vue-router'
import UserPage from '@/views/UserPage.vue'
import EditPage from '@/views/EditPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/user'
    },
    {
      path: '/user',
      name: 'UserPage',
      component: UserPage
    },
    {
      path: '/edit',
      name: 'EditPage',
      component: EditPage
    }
  ]
})

export default router