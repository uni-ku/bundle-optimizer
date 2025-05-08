<!-- eslint-disable no-console -->
<script lang="ts" setup>
import SubComponent from '@/pages-sub-async/component.vue?async'
import { onMounted, shallowRef } from 'vue'
import { getSubPackageTestApi } from './api'
import { MathUtils } from '@/lib/demo'
import cloneDeep from 'lodash/cloneDeep'
import demo from '@/api/test'

demo('sub')

function goSubPage() {
  uni.navigateTo({
    url: '/pages-sub-async/index',
  })
}

const asyncComponent = shallowRef<any>()

onMounted(async () => {
  AsyncImport('@/pages-sub-async/plugin').then((res) => {
    res.AsyncPluginDemo().run()
  })
  getSubPackageTestApi("子包 api 请求模拟")
  console.log(MathUtils.add(0.1, 0.2), cloneDeep({}));

  // 加载异步组件
  AsyncImport('./components/demo1.vue').then((res) => {
    asyncComponent.value = res.default
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
    <view>
      <!-- 只有非小程序端，才支持动态组件渲染 -->
      <!-- #ifndef MP -->
      <component :is="asyncComponent"></component>
      <!-- #endif -->
      <!-- #ifdef MP -->
      <view style="background-color: gray;color: aliceblue;font-size: small;padding: 16rpx;margin: 16rpx;">小程序端无法动态渲染远程组件</view>
      <!-- #endif -->
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
