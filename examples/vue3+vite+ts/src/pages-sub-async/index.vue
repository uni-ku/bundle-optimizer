<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import groupBy from 'lodash/groupBy'
import cloneDeep from 'lodash/cloneDeep'
import { MathUtils } from '@/lib/demo'
import { getSubPackages } from '@/lib/pages'

/** 刷新页面 */
function refresh() {
  uni.reLaunch({
    url: '/pages-sub-async/index',
  })
}

const result = ref<any>(null)
onMounted(async () => {
  import('@/pages-sub-async/plugin').then((res) => {
    res.AsyncPluginDemo().run()
  })

  // TODO: 对 vue 文件的这种引用会和分包优化的一个行为有冲突，导致目标组件对应的页面、组件空白
  // import('@/pages-sub-demo/index.vue').then((res) => {
  //   console.log('[async-import-component]', res.default)
  //   setTimeout(() => {
  //     result.value = res.default
  //   }, 1000)
  // })
  await import('@/pages-sub-async/plugin').then((res) => {
    res.AsyncPluginDemo().run()
  })
  console.log(MathUtils.add(1, 1), cloneDeep({}));
  console.log(getSubPackages());
})
</script>

<template>
  <view class="center">
    pages-sub-async
  </view>
  <biz-test />
  <button @click="refresh">
    刷新
  </button>
  <view style="padding: 0 10px;">
    <view>异步引入vue文件结果 =></view>
    <template v-if="result">
      <view>------</view>
      <view>{{ groupBy([result, result], '__name') }}</view>
      <view class="desc">
        此处使用了lodash的groupBy方法，可以表现出分包优化的效果，可使用微信开发者工具查看分包情况
      </view>
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

.desc {
  color: gray;
  font-size: 12px;
  font-weight: bold;
}
</style>
