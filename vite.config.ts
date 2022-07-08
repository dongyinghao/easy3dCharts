import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const {resolve} = require('path');

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  server: {
    open:true,
    proxy: {
      // '/api': {
      //   target: 'http://222.180.171.210:8082/',
      //   ws: true,
      //   changeOrigin: true,
      // },
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        charset: false,
        additionalData: `@import "./src/assets/css/base.less";`,
      }
    }
  }
})
