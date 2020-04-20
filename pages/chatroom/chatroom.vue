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
			:style="{bottom:key*100 + 'rpx'}"
			:src="prop.imgUrl"></image>
		</view>
	</view>
</template>

<script>
	import Goeasy from 'lib/goeasy-1.0.6.js'
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
				throttleTimer : null
			}
		},
		onLoad(options) {
			//获取数据
			var loginCommand = JSON.parse(options.index);
			var self = this;
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
			this.onlineUserMsg = this.findChatHistory(loginCommand.roomId).map(item => {
				if(typeof item.content == 'string') {
					item.content = JSON.parse(item.content)
				}
				return item;
			});
			//初始化goeasy
			this.initGoeasy(loginCommand);
		},
		onBackPress () {//返回取消订阅
			this.goeasy.unsubscribe({
				channel: this.currentRoomId,
				onSuccess: function() {
					console.log("订阅取消成功。");
				},
				onFailed: function(error) {
					console.log("取消订阅失败，错误编码：" + error.code + " 错误信息：" + error.content)
				}
			});
			
			this.goeasy.unsubscribePresence({
				channel: this.currentRoomId,
				onSuccess: function() {
					console.log("Presence取消成功。");
				},
				onFailed: function(error) {
					console.log("Presence取消失败，错误编码：" + error.code + " 错误信息：" + error.content)
				}
			});
			this.goeasy.disconnect();
		},
		methods: {
			initGoeasy (loginCommand) {//初始化goeasy
				var self = this;
				this.goeasy = Goeasy({
					host: "hangzhou.goeasy.io",
					appkey: "您的key",
					userId: self.currentUserMsg.senderUserId,
					userData: '{"nickname":"' + loginCommand.nickname + '","avatar":"' + loginCommand.avatar + '"}',
					onConnected: function () {
					    console.log( "GoEasy connect successfully.")
					},
					onDisconnected: function () {
					    console.log("GoEasy disconnected.")
					},
					onConnectFailed: function (error) {
					    uni.showToast({
							title:"GoEasy连接失败，请确认service.js文件70行appkey和host配置正确.",
							duration:6000,
							icon:"none"
					    });
					}
				})
				//本应该有相应的回调关系，但goeasy已经做了处理，未连接的状态，所有的监听都会处于等待状态，可以放心这样使用
				//为了更好的性能，也可以在成功回调里对应做处理
				this.initialOnlineUsers(loginCommand);
				this.subscriberPresence(loginCommand);
				this.subscriberNewMessage(loginCommand);
			},
			initialOnlineUsers (loginCommand) {//初始化onlineUsers对象
				var self = this;
				this.goeasy.hereNow({
					channels: [loginCommand.roomId],
					includeUsers: true,
					distinct: true
				}, function(result) {
					if (result.code == 200) {
						var currentRoomOnlineUsers = result.content.channels[loginCommand.roomId];
				        currentRoomOnlineUsers.users.forEach(function(onlineUser) {
							var userData = JSON.parse(onlineUser.data);
				            self.onlineUsers.users.unshift(self.user(onlineUser.id,userData.nickname,userData.avatar));
						});
				        //赋值
						self.onlineUsers.count = currentRoomOnlineUsers.clientAmount;
					}
					if(result.code == 401) {
						uni.showToast({
							title:"您还没有高级功能的权限，付费用户请联系GoEasy开通",
							duration:6000,
							icon : "none"
						});
					}
				});
			},
			subscriberPresence (loginCommand) {//监听用户上下线时间
				var self = this;
				this.goeasy.subscribePresence({
					channel: loginCommand.roomId,
					onPresence: function(presenceEvents) {
						//更新onlineUsers在线用户数
						self.onlineUsers.count = presenceEvents.clientAmount;
						presenceEvents.events.forEach(function(event) {							
							//如果有用户进入聊天室
							if (event.action == "join" || event.action == "online") {
								//todo 是否优化相同用户加入的情况 demo 可忽略
								var userData = JSON.parse(event.userData);
								//将新用户加入onlineUsers列表
								self.onlineUsers.users.push(self.user(event.userId,userData.nickname,userData.avatar));
								self.onNewMessage({
									senderNickname : userData.nickname,
									content : '进入房间'
								},false);
							} else {
								var leavingUserIndex = self.onlineUsers.users.findIndex(item => item.id == event.userId);
								if(leavingUserIndex>-1) {
									//将离开的用户从onlineUsers中删掉
									var leavingUser = Object.assign(self.onlineUsers.users[leavingUserIndex]);
									self.onlineUsers.users.splice(leavingUserIndex, 1);
									self.onNewMessage({
										senderNickname : leavingUser.nickname,
										content : '退出房间'
									},false);
								}
							}
						});
						
					},
					onSuccess : function () {
						console.log("监听成功")
					},
					onFailed : function () {
						console.log("监听失败")
						uni.showToast({
							title:"您还没有高级功能的权限，付费用户请联系GoEasy开通",
							duration:6000,
							icon : "none"
						});
					}
				});
			},
			subscriberNewMessage (loginCommand) {//监听消息或道具
				var self = this;
				this.goeasy.subscribe({
					channel: loginCommand.roomId, //替换为您自己的channel
					onMessage: function(message) {
						var chatMessage = JSON.parse(message.content);
						//todo:事实上不推荐在前端收到时保存, 一个用户开多个窗口，会导致重复保存, 建议所有消息都是都在发送时在服务器端保存，这里只是为了演示
						self.saveChatMessage(loginCommand.roomId, message);
						//显示消息 0 表示文字消息，1为道具
						if (chatMessage.type == 0) {
							var selfSent = chatMessage.senderUserId == self.currentUserMsg.senderUserId;
							self.onNewMessage(chatMessage, selfSent);
						}
						if (chatMessage.type == 1) {
							//0为比心 1为火箭
							if (chatMessage.content == 1) {
								//todo 动画
								self.throttle(self.handleProps.bind(self,'rocket'), 2000)
								self.onNewMessage({
									senderNickname : chatMessage.senderNickname,
									content : '送出了一枚大火箭'
								},false);

							}
							if (chatMessage.content == 0) {
								//todo  动画
								self.throttle(self.handleProps.bind(self,'heart'), 2000)
								self.onNewMessage({
									senderNickname : chatMessage.senderNickname,
									content : '送出了一个大大的比心'
								},false);
							}
						}
					}
				});
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
				var self = this;
				this.goeasy.publish({
					channel: self.currentRoomId,
					message: JSON.stringify(this.currentUserMsg),
					onSuccess: function() {
						console.log("消息发布成功。");
						self.myMessage = ""
					},
					onFailed: function(error) {
						console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
					}
				});
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
			findChatHistory (roomId) {//查找历史记录
				var localStorageKey = 'room_' + roomId;
				var arr = [];
				try{
					var jsonStr = uni.getStorageSync(localStorageKey);
					if(jsonStr){
						arr = JSON.parse(jsonStr)
					}
				}catch(e) {
					console.log(e)
				}
				return arr;
			},
			saveChatMessage (roomId,chatMessage) {//缓存历史记录
				var localStorageKey = 'room_' + roomId;
				var arr = [];
				try {
					const jsonStr = uni.getStorageSync(localStorageKey);
					if (jsonStr) {
					    arr = [chatMessage,...JSON.parse(jsonStr)]
					}
					uni.setStorageSync(localStorageKey,JSON.stringify(arr))
				}catch(e) {
					console.log(e)
				}
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
		height: 400rpx;
		position: fixed;
		z-index: 44;
		left:50%;
		bottom:80rpx;
		margin:0 -40rpx;
		animation: myanimation 2s linear;
	}
	.show-animation image{
		position: absolute;
		bottom: 0rpx;
		left:0;
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
