import { createRouter, createWebHistory } from 'vue-router'
import EditorPage from '../views/EditorPage.vue'

const routes = [
  {
    path: '/',
    name: 'editor',
    component: EditorPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router