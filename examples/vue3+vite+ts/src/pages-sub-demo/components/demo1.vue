<script lang="ts" setup>
import { ref } from 'vue'
function openConfirm(msg: string, data: { name: string }) {
  uni.showToast({ title: msg, icon: 'none' })
}

const btnStatus = ref<number>(0)
function changeStatus() {
  btnStatus.value = 1 - btnStatus.value
}
const getBtns = (item: { status: number }) => {
  const { status } = item

  return [
    {
      name: '取消',
      func: (item: any) => openConfirm('取消', item),
      show: status === 1
    },
    {
      name: '拒绝',
      func: (item: any) => openConfirm('拒绝', item),
      show: status === 0
    },
    {
      name: '同意',
      func: (item: any) => openConfirm('同意', item),
      show: status === 0
    },
  ]
}
</script>

<template>
  <view style="display: flex;margin: 32rpx 0;">
    <button @click="changeStatus" style="background-color: bisque;">切换状态</button>
    <template v-for="(btn, index) in getBtns({ status: btnStatus })" :key="index">
      <button v-if="btn.show" @click.stop="btn.func(btn)">{{ btn.name }}</button>
    </template>
  </view>
</template>
