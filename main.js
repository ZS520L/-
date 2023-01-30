import Vue from 'vue'
import App from './App'
import GoEasy from "./lib/goeasy-2.4.6.min";

const goEasy = GoEasy.getInstance({
	host:"hangzhou.goeasy.io",//应用所在的区域地址: 【hangzhou.goeasy.io |singapore.goeasy.io】
	appkey:"BC-e39f92984919475db1cb53c9be2330c4",// common key,
	modules: ['pubsub']
});

Vue.prototype.goEasy = goEasy;

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
	...App
})
app.$mount()
