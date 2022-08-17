export default {
  state: {
    screenWidth: document.body.clientWidth, //  屏幕宽度
    diskType: localStorage.getItem('disk') || 1 //  当前网盘类型(公共：1/个人：2)
  },
  mutations: {
    /**
     * 改变屏幕宽度
     * @description 表格显示列保存在 Vuex 和 cookie 中
     * @param {object} state Vuex 的 state 对象
     * @param {[]} data 屏幕宽度
     */
    changeScreenWidth(state, data) {
      state.screenWidth = data
    },
    // 设置网盘类型(公共：1/个人：2)
    setDiskType(state, data) {
      state.diskType = data;
      localStorage.setItem('disk', data);
    }
  }
}
