<script>
import GoEasy from "./lib/goeasy-2.0.0.js";
export default {
	globalData:{
		goEasy: GoEasy.getInstance({
			host:"hangzhou.goeasy.io",//应用所在的区域地址: 【hangzhou.goeasy.io |singapore.goeasy.io】
      appkey:"BC-xxxx",// common key,
      // true表示支持通知栏提醒，false则表示不需要通知栏提醒
      allowNotification:true, //仅有效于app，小程序和H5将会被自动忽略
      modules: ['PUBSUB'],
		})
	},
	onLaunch: function() {
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
