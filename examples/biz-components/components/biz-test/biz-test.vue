<script setup lang="ts">
import { onMounted } from 'vue'
import { testUtil } from '../../utils'

onMounted(() => {
  testUtil('test')
})
</script>

<template>
  <view><text>Test Component</text></view>
</template>
