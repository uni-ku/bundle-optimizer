<script setup lang="ts">
import { onMounted } from 'vue'
import { testUtil } from '../../utils'
import BizTest from '../biz-test/biz-test.vue'

onMounted(() => {
  testUtil('use-test')
})
</script>

<template>
  <BizTest />
</template>
