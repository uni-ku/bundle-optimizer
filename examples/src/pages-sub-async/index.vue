<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, ref } from 'vue'

/** 刷新页面 */
function refresh() {
  uni.reLaunch({
    url: '/pages-sub-async/index',
  })
}

const result = ref<any>(null)
onMounted(() => {
  AsyncImport('@/pages-sub-demo/index.vue').then((res) => {
    console.log('[async-import-component]', res.default)
    setTimeout(() => {
      result.value = res.default
    }, 1000)
  })
})
</script>

<template>
  <view class="center">
    pages-sub-async
  </view>
  <button @click="refresh">
    刷新
  </button>
  <view style="padding: 0 10px;">
    <view>异步引入vue文件结果 =></view>
    <template v-if="result">
      <view>------</view>
      <view>{{ result }}</view>
    </template>
    <view v-else>
      <view class="center">
        loading...
      </view>
    </view>
  </view>
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
