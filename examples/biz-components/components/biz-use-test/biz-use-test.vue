<script setup lang="ts">
import BizTest from "../biz-test/biz-test.vue";
import { testUtil } from '../../utils'
import { onMounted } from 'vue';

onMounted(() => {
  testUtil('use-test')
})
</script>

<template>
  <BizTest />
</template>
