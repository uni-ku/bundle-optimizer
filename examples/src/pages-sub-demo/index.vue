<!-- eslint-disable no-console -->
<script lang="ts" setup>
import SubComponent from '@/pages-sub-async/component.vue?async'
import { onMounted } from 'vue'

function goSubPage() {
  uni.navigateTo({
    url: '/pages-sub-async/index',
  })
}

onMounted(() => {
  AsyncImport('@/pages-sub-async/plugin').then((res) => {
    res.AsyncPluginDemo().run()
  })
})
</script>

<template>
  <view>
    <view class="center">
      子包页面
    </view>
    <view class="center lighter padding-0">
      <text>------</text>
      <SubComponent />
    </view>
    <button @click="goSubPage">
      go go go
    </button>
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

.padding-0 {
  padding: 0;
}

.small {
  font-size: 12px;
}

.lighter {
  font-weight: lighter;
}
</style>
