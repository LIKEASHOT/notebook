import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Stats from '../views/Stats.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/stats', component: Stats }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
