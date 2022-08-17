<template>
  <div class="tips" ref="tipsRef" @click="clickHandle" v-html="tips"></div>
</template>

<script setup lang="ts">
defineProps<{ tips: string }>();

const clickHandle = () => {
  document.dispatchEvent(
      new CustomEvent("test", {
        detail: {name: 'hello'}
      })
  )
}
</script>

<style scoped lang="less">
.tips {
  left: 0;
  top: 0;
  position: absolute;
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  padding: 5px 10px;
  display: none;
}
</style>
