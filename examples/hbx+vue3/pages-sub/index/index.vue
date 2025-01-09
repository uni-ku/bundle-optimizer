<template>
	<view>
		111
	</view>
</template>

<script>
	import lodash from "lodash"
	import { getSubPackageTestApi } from '../api';
	
	export default {
		data() {
			return {
				list: Array.from({ length: 10 }).map((_, index) => ({
					id: index,
					name: `name_${index}`
				}))
			}
		},
		methods: {
			
		},
		mounted() {
			getSubPackageTestApi("子包 api 请求模拟");
			console.log(lodash.groupBy(this.list, "name"));
		}
	}
</script>

<style>

</style>
