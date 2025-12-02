import { createRouter, createWebHistory } from 'vue-router'
import UserPage from '@/views/UserPage.vue'
import EditPage from '@/views/EditPage.vue'
import TestVideoLibrary from '@/views/TestVideoLibrary.vue'

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
    },
    {
      path: '/test',
      name: 'TestVideoLibrary',
      component: TestVideoLibrary
    }
  ]
})

export default router