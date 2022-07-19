<template>
  <div class="tips" ref="tipsRef" v-html="tips"></div>
</template>

<script setup lang="ts">
defineProps<{ tips: string }>()
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
