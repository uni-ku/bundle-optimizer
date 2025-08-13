<script setup lang="ts">
import { testUtil } from '../../utils'
import { onMounted } from 'vue';

onMounted(() => {
  testUtil('test')
})
</script>

<template>
  <view><text>Test Component</text></view>
</template>