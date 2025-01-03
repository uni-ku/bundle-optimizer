<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
		<button @click="goSub">go sub</button>
		<SubPageAsync />
	</view>
</template>

<script>
	import SubPageAsync from "@/pages-sub/index/index.vue?async"
	export default {
		components: {
			SubPageAsync,
		},
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {
			AsyncImport("../../pages-sub/index/index.vue").then((res) => {
				console.log(111, res)
			})
			AsyncImport("@/pages-sub/plugins/index").then((res) => {
				res?.default?.test(222)
			})
		},
		methods: {
			goSub() {
				uni.navigateTo({
					url: "/pages-sub/index/index"
				})
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
