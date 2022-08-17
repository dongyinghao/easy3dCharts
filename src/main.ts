import { createApp } from 'vue'
import store from './store'
import router from './router'
import App from './App.vue'
import './assets/css/base.less'

createApp(App).use(router).use(store).mount('#app')
