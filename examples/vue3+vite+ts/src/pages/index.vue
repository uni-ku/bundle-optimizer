<script setup lang="ts">
import SubComponent from '@/pages-sub-async/component.vue?async'
import SubDemo from '@/pages-sub-demo/index.vue?async'
import { onMounted } from 'vue'
import { getMainPackageTestApi } from "@/api";

function goDemoSubPage() {
  uni.navigateTo({
    url: '/pages-sub-demo/index',
  })
}

onMounted(async () => {
  getMainPackageTestApi("主包 api 请求模拟")
})
</script>

<template>
  <view class="center">
    uniapp 分包优化
  </view>

  <button @click="goDemoSubPage">
    前往子包
  </button>
  <view class="center black">
    <text>----------------</text>
    <SubDemo />
    <SubComponent />
  </view>
</template>

<style lang="css" scoped>
.black {
  color: black !important;
}

.center {
  color: red;
  padding: 20px 0;
  font-size: 20px;
  font-weight: bolder;
  text-align: center;
}
</style>
