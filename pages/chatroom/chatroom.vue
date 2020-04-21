<template>
	<view class="chat-room">
		<view class="online-avatar-container">
			<view class="online-avatar-item" v-for="(value, key) in onlineUsers.users" :key="key" :style="countPosition(key)">
				<image :src="value.avatar"></image>
			</view>
			<view class="online-count">{{onlineUsers.count}}</view>
		</view>
		<view class="chat-room-container">
			<scroll-view class="chat-room-box" scroll-y="true" :scroll-into-view="scrollIntoViewKey" show-scrollbar="true">
				<view class="message-box" v-for="(value, key) in onlineUserMsg" :key="key" :id="'message-box'+ key">
					<view class="message-item">
						<text class="user-name">{{value.content && value.content.senderNickname}}: </text>
						<text :class="value.selfSent ? 'user-message self' : 'user-message' ">{{value.content && value.content.content}}</text>
					</view>
				</view>
			</scroll-view>
			<view class="chat-room-input">
				<view style="position: relative;">
					<input class="uni-input" :value="myMessage" placeholder="说点什么..." @input="handleInputMessage" />
					<view class="uni-btn" @click="sendMessage(0,myMessage)">↑</view>
				</view>
				<image class="heart" @click="handleHeart" src="../../static/images/handle-heart.png"></image>
				<image class="rocket" @click="handleRocket" src="../../static/images/rokect.png"></image>
			</view>
		</view>
		<view class="show-animation" v-show="prop.show">
			<image 
			v-for="(value, key) in prop.repeat" 
			:key="key"
			:class="prop.class"
			:src="prop.imgUrl"></image>
		</view>
	</view>
</template>

<script>
	import Goeasy from 'lib/goeasy-1.0.6.js';
	const MyService  = require('lib/service.js')
	export default {
		data () {
			return {
				onlineUsers : {
					count :1,
					users : []
				},
				onlineUserMsg : [],
				goeasy : null,
				user : function (id,nickname,avatar) {
					return {
						id : id,
						nickname : nickname,
						avatar : avatar
					}
				},
				currentUserMsg : {
					senderNickname : "",
					senderUserId : null,
					type : 0,
					content : null
				},
				currentRoomId : null,
				myMessage : '',
				scrollIntoViewKey : '',
				prop : {
					show : false,
					repeat : 1,
					imgUrl : ''
				},
				propTimer : null,
				throttlePrev : Date.now(),
				throttleTimer : null,
				myService : null
			}
		},
		onLoad(options) {
			
			//获取数据
			var loginCommand = JSON.parse(options.index);
			//保存当前用户
			this.currentUserMsg = {
				senderUserId : (Math.random() * 1000).toString(),
				senderNickname : loginCommand.nickname
			};
			//保存当前房间id
			this.currentRoomId = loginCommand.roomId;
			uni.setNavigationBarTitle({
			    title: loginCommand.roomName
			});
			//获取历史消息
			this.onlineUserMsg = this.uniFindChatHistory(loginCommand.roomId).map(item => {
				if(typeof item.content == 'string') {
					item.content = JSON.parse(item.content)
				}
				return item;
			});
			
			this.myService = new MyService({
				// appkey :'BC-cb2b54aa56b948bfad5e971970681d6e',
				appkey : 'BC-ede22e1d66834d838fe1dee6709c4dc3'
			},{
				//todo 所有的逻辑回调
				onConnectFailed : this.onConnectFailed,
				onHereNowSuccess : this.onHereNowSuccess,
				onHereNowFailed : this.onHereNowFailed,
				onPresenceOnline : this.onPresenceOnline,
				onPresenceOffline : this.onPresenceOffline,
				onPresenceFailed : this.onPresenceFailed,
				onMessageSuccess : this.onMessageSuccess,
				// saveChatMessage : this.uniSaveChatMessage,
				onPublishSuccess : this.onPublishSuccess
			});
			this.myService.initGoeasy(this.user(this.currentUserMsg.senderUserId, this.currentUserMsg.senderNickname, loginCommand.avatar));
			this.myService.initialOnlineUsers([loginCommand.roomId]);
			this.myService.subscriberPresence(loginCommand.roomId);
			this.myService.subscriberNewMessage(loginCommand.roomId)
		},
		onBackPress () {//返回取消订阅
			this.myService.unsubscribe(this.currentRoomId)
			this.myService.unsubscribePresence(this.currentRoomId)
			this.myService.disconnect();
		},
		methods: {
			showUniToast (msg) {//弹框提示
				var message = msg ? msg : "GoEasy连接失败，请确认service.js文件70行appkey和host配置正确.";
				uni.showToast({
					title:message,
					duration:6000,
					icon:"none"
				});
			},
			onConnectFailed () {//连接失败
				this.showUniToast()
			},
			onHereNowSuccess (res) {//初始化onlineUsers对象 成功
				this.onlineUsers.users = res.onlineUsers;
				this.onlineUsers.count = res.onlineUserCount;
			},
			onHereNowFailed (code) {//初始化onlineUsers对象 其他状态码
				if(code == 401) {
					let msg = "您还没有高级功能的权限，付费用户请联系GoEasy开通";
					this.showUniToast(msg)
				}
			},
			onPresenceOnline (res) {//用户上线监听
				this.onlineUsers.users.push(res.onlineUser)
				this.onlineUsers.count = res.onlineUserCount
				this.onNewMessage({
					senderNickname : res.onlineUser.nickname,
					content : '进入房间'
				},false);
			},
			onPresenceOffline (res) {//用户下线 监听
				let offlineUserIdex = this.onlineUsers.users.findIndex(item => item.id == event.userId);
				if(offlineUserIdex>-1) {
					//将离开的用户从onlineUsers中删掉
					let offlineUser = Object.assign(this.onlineUsers.users[offlineUserIdex]);
					this.onlineUsers.users.splice(offlineUserIdex, 1);
					this.onlineUsers.count--;
					this.onNewMessage({
						senderNickname : offlineUser.nickname,
						content : '退出房间'
					},false);
				}
			},
			onPresenceFailed () {//监听上下线失败
				var msg = "您还没有高级功能的权限，付费用户请联系GoEasy开通";
				this.showUniToast(msg)
			},
			onMessageSuccess (res) {//监听消息 成功
				//显示消息 0 表示文字消息，1为道具
				console.log(res.type)
				if (res.type == 0) {
					let selfSent = res.senderUserId == this.currentUserMsg.senderUserId;
					this.onNewMessage(res, selfSent);
				}
				if (res.type == 1) {
					//0为比心 1为火箭
					if (res.content == 1) {
						//todo 动画
						this.handleProps.call(res,'rocket')
						this.onNewMessage({
							senderNickname : res.senderNickname,
							content : '送出了一枚大火箭'
						},false);
	
					}
					if (res.content == 0) {
						//todo  动画
						this.handleProps.call(this,'heart')
						this.onNewMessage({
							senderNickname : res.senderNickname,
							content : '送出了一个大大的比心'
						},false);
					}
				}
			},
			onNewMessage (content, selfSent) {//收到新消息处理
				this.onlineUserMsg.push({
					content : content,
					selfSent : selfSent
				})
				//滚动到对应位置
				setTimeout(() => {
					this.scrollIntoViewKey = 'message-box'+(this.onlineUserMsg.length-1);
				}, 300)
			},
			sendMessage (messageType, content) {//发送消息
				if(content == "" && messageType == 0) return;
				this.currentUserMsg.type = messageType;
				this.currentUserMsg.content = content;
				this.myService.publish(this.currentRoomId, this.currentUserMsg)
			},
			onPublishSuccess () {//发送成功回调
				this.myMessage = ""
			},
			handleHeart () {//比心
				//比心
				this.throttle(this.sendMessage.bind(this,1,0),2000)
			},
			handleRocket(){//发送火箭
				//火箭
				this.throttle(this.sendMessage.bind(this,1,1),2000)
			},
			handleProps (type) {//道具动画
				//动画的实现，可以不用关心
				var heart = {
					repeat :4,
					imgUrl : '../../static/images/heart.png',
					show : true,
					class:"prop-heart"
				};
				var rocket = {
					repeat :1,
					imgUrl : '../../static/images/rokect.png',
					show : true,
					class : 'prop-rocket'
				};
				if(this.propTimer) {
					this.prop = {
						repeat: 0,
						imgUrl:"",
						show:false,
						class: ""
					}
					clearTimeout(this.propTimer)
					this.propTimer = null;
				}
				this.prop = type == 'heart' ? heart : rocket;
				
				this.propTimer = setTimeout(() => {
					this.prop = {
						repeat: 0,
						imgUrl:"",
						show:false,
						class: ""
					}
				},1800)
			},
			throttle (func, delay) {//节流函数
				//动画的性能处理，和goeasy实现没有联系，可以不用关心
				var now = Date.now();
				
				var remaining = delay - (now - this.throttlePrev);
				clearTimeout(this.throttleTimer);
				if(remaining <= 0){
					func();
					this.throttlePrev = Date.now();
				}else {
					this.throttleTimer = setTimeout(func,remaining)
				}
			},
			handleInputMessage (event) {//双向绑定消息 兼容
				this.myMessage = event.target.value;
			},
			countPosition (key) {//头像位置
				return {
					right: key*54 + 108 +'rpx',
					zIndex : 100-key
				}
			},
			uniSaveChatMessage (uni ,roomId, chatMessage) {//uniapp缓存方式
			    // let localStorageKey = 'room_' + roomId;
			    // let arr = [];
			    // try {
			    //     const jsonStr = uni.getStorageSync(localStorageKey);
			    //     if (jsonStr) {
			    //         arr = [chatMessage,...JSON.parse(jsonStr)]
			    //     }
			    //     uni.setStorageSync(localStorageKey,JSON.stringify(arr))
			    // }catch(e) {
			    //     console.log(e)
			    // }
			},
			
			uniFindChatHistory(uni, roomId) {
			    // let localStorageKey = 'room_' + roomId;
			    // let arr = [];
			    // try{
			    //     var jsonStr = uni.getStorageSync(localStorageKey);
			    //     if(jsonStr){
			    //         arr = JSON.parse(jsonStr)
			    //     }
			    // }catch(e) {
			    //     console.log(e)
			    // }
			    // return arr;
				return [];
			}
		}
	}
</script>

<style>
	page{
		height: 100%;;
	}
	uni-page-body{
		height: 100%;;
	}
	.chat-room{
		display: flex;
		flex-direction: column;
		height: 100%;;
	}
	.online-avatar-container{
		height: 80rpx;
		display: flex;
		justify-content: flex-end;
		padding:28rpx ;
		box-shadow: 10rpx 30rpx 50rpx #fff;
		z-index: 40;
		position: relative;
	}
	.online-avatar-item{
		width:80rpx;
		height:80rpx;
		border-radius: 40rpx;
		text-align: center;
		line-height: 80rpx;
		background: rgba(51,51,51,0.3);
		color: #fff;
		font-size:18rpx 28rpx;
		position: absolute;
	}
	.online-count{
		width:80rpx;
		height:80rpx;
		border-radius: 40rpx;
		text-align: center;
		line-height: 80rpx;
		background: rgba(51,51,51,0.3);
		color: #fff;
		font-size:28rpx;
	}
	.online-avatar-item image{
		width:80rpx;
		height: 80rpx;
		border: none;
		outline: none;
	}
	.chat-room-container{
		flex:1;
		display: flex;
		flex-direction: column;
	}
	.chat-room-box{
		flex:1;
		padding: 10rpx 38rpx;
		overflow: auto;
		padding-top:20rpx;
		box-sizing: border-box;
	}
	.message-box{
		margin-top:16rpx;
	}
	.message-item{
		box-sizing: border-box;
		height: 72rpx;
		background-color: rgba(196,196,196,0.2);
		display: inline-block;
		font-size: 28rpx;
		border-radius: 100rpx;
		padding:18rpx 30rpx;
		font-family: Microsoft YaHei UI;
	}
	.user-name{
		color: #D02129;
		font-family: Microsoft YaHei UI;
	}
	.user-message{
		color: #333;
		font-family: Microsoft YaHei UI;
	}
	.chat-room-input{
		height: 92rpx;
		line-height: 92rpx;
		padding:28rpx;
		display: flex;
	}
	.uni-input{
		width:528rpx;
		background-color: rgba(51,51,51,0.1);
		height:92rpx;
		border-radius: 100rpx;
		box-sizing: border-box;
		padding:26rpx 40rpx ;
		font-size: 28rpx;
	}
	.uni-btn{
		position: absolute;
		width: 72rpx;
		height: 72rpx;
		background: #D02129;
		right: 10rpx;
		top:10rpx;
		border-radius: 72rpx;
		text-align: center;
		line-height: 72rpx;
		color: #fff;
		font-weight: bold;
		font-size: 32rpx;
	}
	.heart{
		width:80rpx;
		height: 92rpx;
		padding:0 15rpx;
	}
	.rocket{
		width:40rpx;
		height: 92rpx;
	}
	.self{
		color: #D02129;
	}
	.show-animation{
		width:80rpx;
		height: 320rpx;
		position: fixed;
		z-index: 44;
		left:50%;
		bottom:80rpx;
		margin:0 -40rpx;
		justify-content: flex-end;
		animation: myanimation 2s linear;
	}
	.show-animation image{
		width:80rpx;
	}
	.show-animation .prop-heart{
		height: 80rpx;
	}
	.show-animation .prop-rocket{
		height:160rpx;
	}
	@keyframes myanimation{
		from{bottom:  80rpx;}
		to{bottom: 600rpx;}
	}
	
</style>
