<template>
	<div class="error-404-wrapper">
		<h2 class="title">您的页面飞走了……</h2>
    <img :src="errorImg" />
	</div>
</template>

<script lang="ts" setup>
import errorImg from '@/assets/images/error/404.png'


</script>

<style lang="less" scoped>
.error-404-wrapper {
  padding: 100px 0;
  text-align: center;
  .title {
    padding-bottom: 20px;
  }
}
</style>
