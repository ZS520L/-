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
				<view class="message-box" v-for="(value, key) in chatMessage" :key="key" :id="'message-box'+ key">
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
				<image class="heart" @click="sendMessage.call(this,1,0)" src="../../static/images/handle-heart.png"></image>
				<image class="rocket" @click="sendMessage.call(this,1,1)" src="../../static/images/rokect.png"></image>
			</view>
		</view>
		<view class="show-animation" v-if="showAnimation">
			<image class="prop-heart" v-for="(value, key) in 4" :key="key" src="../../static/images/heart.png" v-if="showHeart"></image>
			<image class="prop-rocket" src="../../static/images/rokect.png" v-if="!showHeart"></image>
		</view>
	</view>
</template>

<script>
	const MyService  = require('lib/service.js')
	export default {
		data () {
			return {
				onlineUsers : {
					count :1,
					users : []
				},
				chatMessage : [],
				user : function (id,nickname,avatar) {
					return {
						id : id,
						nickname : nickname,
						avatar : avatar
					}
				},
				currentUser : {
					senderNickname : "",
					senderUserId : null,
					type : 0,
					content : null
				},
				currentRoomId : null,
				myMessage : '',
				scrollIntoViewKey : '',
				showHeart : false,
				showAnimation : false,
				myService : null,
				propTimer : null
			}
		},
		onLoad(options) {	
			//获取数据
			var loginCommand = JSON.parse(options.index);
			//保存当前用户
			this.currentUser = {
				senderUserId : (Math.random() * 1000).toString(),
				senderNickname : loginCommand.nickname
			};
			//保存当前房间id
			this.currentRoomId = loginCommand.roomId;
			
			//设置导航标题
			uni.setNavigationBarTitle({
			    title: loginCommand.roomName
			});
			//获取历史消息
			this.chatMessage = this.uniFindChatHistory(loginCommand.roomId).map(item => {
				if(typeof item.content == 'string') {
					item.content = JSON.parse(item.content)
				}
				return item;
			});
			
			let callback = {
				onHereNowSuccess : this.onHereNowSuccess,
				onPresenceOnline : this.onPresenceOnline,
				onPresenceOffline : this.onPresenceOffline,
				onMessageSuccess : this.onMessageSuccess,
				saveChatMessage : this.uniSaveChatMessage,
				onPublishSuccess : this.onPublishSuccess
			};
			let user = this.user(this.currentUser.senderUserId, this.currentUser.senderNickname, loginCommand.avatar)
			
			//构造myservice
			this.myService = new MyService(callback);
			//初始化service
			this.myService.initGoeasy(user, loginCommand.roomId);
			
		},
		onBackPress () {//返回按钮
			//断开连接
			this.myService.disconnect(this.currentRoomId);
		},
		methods: {
			onHereNowSuccess (res) {//初始化onlineUsers对象 成功
				this.onlineUsers.users = res.onlineUsers;
				this.onlineUsers.count = res.onlineUserCount;
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
				let offlineUserIndex = this.onlineUsers.users.findIndex(item => item.id == event.userId);
				if(offlineUserIndex>-1) {
					//将离开的用户从onlineUsers中删掉
					let offlineUser = Object.assign(this.onlineUsers.users[offlineUserIndex]);
					this.onlineUsers.users.splice(offlineUserIndex, 1);
					this.onlineUsers.count--;
					this.onNewMessage({
						senderNickname : offlineUser.nickname,
						content : '退出房间'
					},false);
				}
			},
			onMessageSuccess (res) {//监听消息 成功
				//显示消息 0 表示文字消息，1为道具
				if (res.type == 0) {
					let selfSent = res.senderUserId == this.currentUser.senderUserId;
					this.onNewMessage(res, selfSent);
				}
				if (res.type == 1) {
					//0为比心 1为火箭
					if (res.content == 1) {
						this.handleProps.call(res,'rocket')
						this.onNewMessage({
							senderNickname : res.senderNickname,
							content : '送出了一枚大火箭'
						},false);
	
					}
					if (res.content == 0) {
						this.handleProps.call(this,'heart')
						this.onNewMessage({
							senderNickname : res.senderNickname,
							content : '送出了一个大大的比心'
						},false);
					}
				}
			},
			onNewMessage (content, selfSent) {//收到新消息处理
				this.chatMessage.push({
					content : content,
					selfSent : selfSent
				})
				//滚动到对应位置
				setTimeout(() => {
					this.scrollIntoViewKey = 'message-box'+(this.chatMessage.length-1);
				}, 300)
			},
			sendMessage (messageType, content) {//发送消息
				if(content == "" && messageType == 0) return;
				this.currentUser.type = messageType;
				this.currentUser.content = content;
				this.myService.publish(this.currentRoomId, this.currentUser)
			},
			onPublishSuccess () {//发送成功回调
				this.myMessage = ""
			},
			handleProps (type) {//道具动画
				//动画的实现，可以不用关心
				if(this.propTimer) {
					return;
				};
				this.showHeart = type == 'heart' ? true : false;
				this.showAnimation = true;
				this.propTimer = setTimeout(() => {
					this.showAnimation = false;
					this.propTimer = null;
				},2000)
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
			uniSaveChatMessage (roomId, chatMessage) {//uniapp缓存方式
			    let localStorageKey = 'room_' + roomId;
			    let arr = [];
			    try {
			        const jsonStr = uni.getStorageSync(localStorageKey);
			        if (jsonStr) {
			            arr = [chatMessage,...JSON.parse(jsonStr)]
			        }
			        uni.setStorageSync(localStorageKey,JSON.stringify(arr))
			    }catch(e) {
			        console.log(e)
			    }
			},
			
			uniFindChatHistory(roomId) {//uniapp 查找缓存
			    let localStorageKey = 'room_' + roomId;
			    let arr = [];
			    try{
			        var jsonStr = uni.getStorageSync(localStorageKey);
			        if(jsonStr){
			            arr = JSON.parse(jsonStr)
			        }
			    }catch(e) {
			        console.log(e)
			    }
			    return arr;
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
	.prop-heart{
		height: 80rpx;
		width:80rpx;
	}
	.prop-rocket{
		height:160rpx;
		width:80rpx;
	}
	@keyframes myanimation{
		from{bottom:  80rpx;}
		to{bottom: 600rpx;}
	}
	
</style>
