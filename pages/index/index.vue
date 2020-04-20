<template>
	<view>
		<view class="header">
			<text class="title">GoEasy示例</text>
			<text class="title">聊天室（直播间）</text>
		</view>
		<view class="content">
			<input :class='showUserNameNotice ? "input-notice uni-input" : "uni-input"'
			:value="loginCommand.nickname" 
			placeholder="请输入昵称" 
			@input="onInputUserName">
			<view class="avatar-container">
				<view class="avatar-notice">
					<text>请选择头像</text>
					<text class="avatar-notice-info" v-if="showAvatarNotice">请选一个头像哦!!!</text>
				</view>
				<view class="avatar-box">
					<view 
					:class="avatarActiveKey == key ? 'avatar-box-item active' : 'avatar-box-item '" 
					v-for="(value, key) in avatarList" :key="key" 
					@click="handleCheckAvatar(key, value.imgUrl)">
						<image :src="value.imgUrl"></image>
					</view>
				</view>
			</view>
			<view class="room-container">
				<text class="room-title">请选择聊天室</text>
				<view class="room-box">
					<text 
					class="room-box-item" 
					v-for="(value, key) in roomList" 
					:key="key"
					@click="handleLogin(value)">{{value.name}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				showAvatarNotice : true,
				showUserNameNotice : true,
				avatarActiveKey : -1,
				loginCommand : {
					avatar : '',
					roomId :null,
					roomName : '',
					nickname : ''
				},
				avatarList : [
					{imgUrl :'../../static/images/1.png'},
					{imgUrl :'../../static/images/2.png'},
					{imgUrl :'../../static/images/3.png'},
					{imgUrl :'../../static/images/4.png'},
					{imgUrl :'../../static/images/5.png'},
					{imgUrl :'../../static/images/6.png'},
					{imgUrl :'../../static/images/7.png'},
					{imgUrl :'../../static/images/8.png'}
				],
				roomList : [
					{roomId:"001", name:"程序员集散地"},
					{roomId:"002", name:"舌尖上的中国"},
					{roomId:"003", name:"驴友之家"},
					{roomId:"004", name:"球迷乐翻天"}
				]
			}
		},
		onShow () {
			Object.assign(this.$data, this.$options.data());
		},
		methods: {
			onInputUserName(event) {// 输入用户名
				this.loginCommand.nickname = event.target.value;
				this.showUserNameNotice = this.loginCommand.nickname .trim() == "" ? true : false;
			},
			handleCheckAvatar (key, imgUrl) {//选择头像
				this.avatarActiveKey = key;
				this.showAvatarNotice = false;
				this.loginCommand.avatar = imgUrl;
			},
			handleLogin(value) {//登录
				if(this.showAvatarNotice || this.loginCommand.nickname  == "") {
					return
				}
				this.loginCommand.roomId = value.roomId;
				this.loginCommand.roomName = value.name;
				var params = JSON.stringify(this.loginCommand)
				uni.navigateTo({
					url:"/pages/chatroom/chatroom?index=" + params
				})
			}
		}
	}
</script>

<style>
	.header {
		padding: 70rpx 0;
		font-size: 28rpx;
		line-height: 48rpx;
		text-align: center;
		display: flex;
		flex-direction: column;
		font-family: Microsoft YaHei UI;
	}
	.title{
		color:#D02129;
		font-weight: bold;
		font-size:52rpx;
		line-height: 66rpx;
	}
	.content{
		display: flex;
		justify-content: center;
		flex-direction: column;
		padding: 0 60rpx;
	}
	.uni-input{
		height: 72rpx;
		border:2rpx solid rgba(0,0,0,0.1);
		outline: none;
		border-radius: 200rpx;
		padding:16rpx 30rpx;
		box-sizing: border-box;
		font-size:24rpx;
		text-align: center;
	}
	.avatar-container{
		padding:60rpx 0;
	}
	.avatar-notice{
		line-height: 56rpx;
		font-size:28rpx;
	}
	.avatar-notice-info{
		padding-left:20rpx;
		color:#D02129;
	}
	.avatar-box{
		height:300rpx;
		display: flex;
		flex-wrap: wrap;
		
	}
	.avatar-box-item{
		height:140rpx;
		width: 140rpx;
		box-sizing: border-box;
		margin:8rpx;
	}
	.avatar-box-item image{
		height:124rpx;
		width: 124rpx;
		background-color: #F0AD4E;
		border-radius: 35px;
	}
	.avatar-box .active{
		border: 8rpx solid red;
		box-sizing: border-box;
		border-radius: 129rpx;
	}
	.avatar-box .active image{
		border:8rpx solid #fff;
		box-sizing: border-box;
	}
	.room-container{
		height: 370rpx;
	}
	.room-title{
		font-size: 30rpx;
		line-height: 38rpx;
	}
	.room-box{
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}
	.room-box-item{
		width:288rpx;
		height:90rpx;
		line-height: 90rpx;
		text-align: center;
		box-sizing: border-box;
		background-color: #D02129;
		border-radius: 100rpx;
		color: #fff;
		margin-top:32rpx ;
		font-size:26rpx;
	}
	.input-notice{
		border: 1px solid #D02129;
	}
	::-webkit-input-placeholder{
		color: #D02129;
	}

</style>
