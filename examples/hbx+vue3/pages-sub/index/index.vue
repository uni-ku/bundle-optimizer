<template>
	<view>
		111
	</view>
</template>

<script>
	import lodash from "lodash"
	
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
			console.log(lodash.groupBy(this.list, "name"));
		}
	}
</script>

<style>

</style>
