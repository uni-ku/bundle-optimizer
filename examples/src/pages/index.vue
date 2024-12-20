<script setup lang="ts">
function goDemoSubPage() {
  uni.navigateTo({
    url: '/pages-sub-demo/index',
  })
}
</script>

<template>
  <view class="center">
    uniapp 分包优化
  </view>

  <button @click="goDemoSubPage">
    前往子包
  </button>
</template>

<style lang="css" scoped>
.center {
  color: red;
  padding: 20px 0;
  font-size: 20px;
  font-weight: bolder;
  text-align: center;
}
</style>
