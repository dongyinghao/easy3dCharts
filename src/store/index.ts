import { createStore } from 'vuex'
import common from './modules/common'

export default createStore({
  getters: {
    isLogin: (state:any) => state.user.isLogin
  },
    modules: { common }
})
