<template>
	<view class="chat-room">
		<view class="online-avatar-container">
			<view class="online-avatar-item" v-for="(value, key) in onlineUsers.users" :key="key" :style="realignAvatar(key)">
				<image :src="value.avatar"></image>
			</view>
			<view class="online-count">{{onlineUsers.count}}</view>
		</view>
		<view class="chat-room-container">
			<scroll-view class="chat-room-box" scroll-y="true" :scroll-into-view="contentPosition" show-scrollbar="true">
				<view class="message-box" v-for="(message, key) in messages" :key="key" :id="'message-box'+ key">
					<view class="message-item">
						<text class="user-name">{{message && message.senderNickname}}: </text>
						<text :class="message.senderUserId == currentUser.id ? 'user-message self' : 'user-message' ">{{message && message.content}}</text>
					</view>
				</view>
			</scroll-view>
			<view class="chat-room-input">
				<view style="position: relative;">
					<input class="uni-input" :value="newMessage.content" placeholder="说点什么..." @input="onInputMessage" />
					<view class="uni-btn" @click="sendMessage(0,newMessage.content)">↑</view>
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
	import ChatRoomService from 'lib/service';
	export default {
		data () {
			return {
				roomId : null,
				onlineUsers : {
					count :0,
					users : []
				},
				currentUser : {
					nickname : "",
					id : null,
					avatar : ""
				},
				messages : [],
				newMessage : {
					type : 0,
					content : ""
				},
				contentPosition : '',
				showProp : false,
				showAnimation : false,
				chatRoomService : null,
				propTimer : null
			}
		},
		onLoad(options) {	
			//获取数据
			var roomToken = JSON.parse(options.roomToken);

			//保存当前房间id
			this.roomId = roomToken.roomId;
			
			//设置导航标题
			uni.setNavigationBarTitle({
			    title: roomToken.roomName
			});

			//保存当前用户
			this.currentUser = {
				id : roomToken.userId,
				nickname : roomToken.nickname,
				avatar: roomToken.avatar
			};

			//构造chatRoomService
			this.chatRoomService = new ChatRoomService(this.currentUser, uni);

			this.chatRoomService.loadOnlineUsers(this.roomId, this.onLoadOnlineUser)
			this.chatRoomService.listenUserOnlineOffline(this.roomId, this.onUserOnline, this.onUserOffline);
			this.chatRoomService.listenNewMessage(this.roomId, this.onNewMessage, this.onNewProp);

			this.messages = this.chatRoomService.loadChatMessages(this.roomId)

		},
		onBackPress () {//返回按钮
			//断开连接
			this.chatRoomService.quitRoom(this.roomId);
		},
		methods: {

			onLoadOnlineUser (onlineUsers) {//初始化onlineUsers
				this.onlineUsers.users = onlineUsers.users;
				this.onlineUsers.count = onlineUsers.count;
			},
			onUserOnline (user, count) {//用户上线
				this.onlineUsers.users.push(user)
				this.onlineUsers.count = count;
				this.onNewMessage({
					senderNickname : user.nickname,
					content : '进入房间'
				});
			},
			onUserOffline (user, count) {//用户下线
				//user未返回nickName
				let offlineUserIndex = this.onlineUsers.users.findIndex(item => item.id == user.id);
				if(offlineUserIndex>-1) {
					//将离开的用户从onlineUsers中删掉
					let offlineUser = Object.assign(this.onlineUsers.users[offlineUserIndex]);
					this.onlineUsers.users.splice(offlineUserIndex, 1);
					this.onlineUsers.count = count;
					this.onNewMessage({
						senderNickname : offlineUser.nickname,
						content : '退出房间'
					});
				}
			},

			realignAvatar (key) {//头像位置
				return {
					right: key*54 + 108 +'rpx',
					zIndex : 100-key
				}
			},
			onInputMessage (event) {//双向绑定消息 兼容
				this.newMessage.content = event.target.value;
			},
			onNewMessage(message) {//收到消息
				this.pushIntoMessages(message);
			},
			pushIntoMessages (message) {//向messages添加消息
				this.messages.push(message)
				//滚动到对应位置
				setTimeout(() => {
					this.contentPosition = 'message-box'+(this.messages.length-1);
				}, 300)
			},

			onNewProp (res) {//收到道具 0为比心 1为火箭
				if (res.content == 1) {
					this.propAnimation.call(res,'rocket')
					this.onNewMessage({
						senderNickname : res.senderNickname,
						content : '送出了一枚大火箭'
					});
				}
				if (res.content == 0) {
					this.propAnimation.call(this,'heart')
					this.onNewMessage({
						senderNickname : res.senderNickname,
						content : '送出了一个大大的比心'
					});
				}
			},
			propAnimation (type) {//道具动画
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

			sendMessage (messageType, content) {//发送消息
				if(content == "" && messageType == 0) return;
				var message = {
					senderNickname : this.currentUser.nickname ,
					senderUserId : this.currentUser.id,
					type : messageType,
					content : content
				}
				this.chatRoomService.sendMessages(this.roomId, message);
				this.newMessage.content = ""
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
