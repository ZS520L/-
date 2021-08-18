<script>
export default {
	onLaunch: function() {
        //为了支持nvue能读到全局对象. 如果不需要支持nvue，main.js里挂在Vue.prototype,其他页面通过this.goEasy就可以获取
		this.globalData.goEasy = this.goEasy;
		console.log('App Launch');
	},
	onShow: function() {
		console.log('App Show');
	},
	onHide: function() {
		console.log('App Hide');
	}
};
</script>

<style>
/* 解决头条小程序组件内引入字体不生效的问题 */
/* #ifdef MP-TOUTIAO */
@font-face {
	font-family: uniicons;
	src: url('/static/uni.ttf');
}
/* #endif */
</style>
