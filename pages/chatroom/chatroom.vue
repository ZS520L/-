<template>
	<view class="chat-room">
		<view class="online-avatar-container">
			<view style="font-size: 40rpx;">
				<text style="margin-bottom: 50rpx;">奇方：</text>
				<image :src="currentRoom.onlineUsers.users[0].avatar" style="width: 80rpx;
				height: 80rpx;
				border-radius: 40rpx;"></image>
				<text style="margin-bottom: 20rpx;">偶方：</text>
				<image :src="currentRoom.onlineUsers.users[1].avatar" style="width: 80rpx;
				height: 80rpx;
				border-radius: 40rpx;"></view>
			<view class="online-avatar-item" v-for="(user, key) in currentRoom.onlineUsers.users" :key="key"
				:style="(currentRoom.onlineUsers.users.length-1)===key?'':'transform:translateX('+((currentRoom.onlineUsers.users.length-1-key)*20+20)+'rpx)'">
				<image :src="user.avatar"></image>
			</view>
			<view class="online-count">{{currentRoom.onlineUsers.count}}</view>
		</view>
		
		
		
		<view class="box" style="margin-top: 70px; position: relative;">
			<view class="centent"><canvas @touchend="syncAction" canvas-id="canvas" class="canvas" style="width: 730rpx;height: 730rpx;"></canvas></view>
			<view>
				<view style="z-index: 9999;"
					:class="value.class"
					:style="{ left: value.left, top: value.top, transform: value.transform, boxShadow: value.boxShadow}"
					v-for="(value, index) in game.h"
					:key="index"
				>
					{{ value.text }}
				</view>
			</view>
			<view class="winner">
				<view class="state-chess Bchess"></view>
				<view class="chessName"></view>
			</view>
		</view>
		
		
		
		<view class="chat-room-container">
			<view class="scroll-view">
				<view class="message-box" v-for="(message, key) in currentRoom.messages" :key="key" :id="'message-box'+ key">
					<view class="message-item">
						<text class="user-name">{{message && message.senderNickname}}:</text>
						<text :class="message.senderUserId == currentRoom.currentUser.id ? 'user-message self' : 'user-message' ">
							{{message && message.content}}
						</text>
					</view>
				</view>
			</view>
			<view class="chat-room-input">
				<view style="position: relative;">
					<input class="uni-input" :value="newMessageContent" placeholder="说点什么..." @input="onInputMessage"/>
					<view class="uni-btn" @click="sendMessage(MessageType.CHAT, newMessageContent)">↑</view>
				</view>
				<image class="heart" @click="sendMessage(MessageType.PROP, Prop.HEART)"
					   src="../../static/images/handle-heart.png"></image>
				<image class="rocket" @click="sendMessage(MessageType.PROP, Prop.ROCKET)"
					   src="../../static/images/rocket.png"></image>
			</view>
		</view>
		<view class="show-animation" v-if="propDisplay.play">
			<view v-if="propDisplay.showPropType == Prop.HEART">
				<image class="prop-heart" v-for="(value, key) in 4" :key="key" src="../../static/images/heart.png" ></image>
			</view>
			<view  v-if="propDisplay.showPropType == Prop.ROCKET">
				<image class="prop-rocket" src="../../static/images/rocket.png"></image>
			</view>
		</view>
	</view>
</template>

<script>
	import chess from '../chess/index.vue'
	let goEasy = getApp().globalData.goEasy;
	let pubSub = goEasy.pubsub;
	export default {
		data() {
			return {
				userInfo:{
					chessRole:1, // 1为白棋，2为黑棋
					roundFlag:true, // 表示是否为自己的回合
					enemy:'',
					name:''
				},
				chessMassage:{
					body:'',
					playerA:'',
					playerB:'',
					chessRole:1,
					mode:1
				},
				MoveMode:{
					a2b:1,
					b2a:2
				},
				all:[[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],],
				game: {
				ctx: null,
				e: 0,
				chess_Board: [],
				chess_Name: ['黑棋', '白棋'],
				h: [],
				um: 0,
				lianz: [],
				winXY: [[1, 0], [0, 1], [1, 1], [1, -1]],
				chessOff: true
			},
			cName: '黑棋走',
			sChesee: 'Bchess',
				currentRoom: null,
				// 道具展示
				propDisplay: {
					showPropType: 0,
					play: false,
					timer: null
				},
				newMessageContent: "",
				// 道具类型
				Prop: {
					HEART: 0,//桃心
					ROCKET: 1//火箭
				},
				
				// 消息类型
				MessageType: {
					CHAT: 0,//文字聊天
					PROP: 1,//道具
					CHESS:2 // 下棋
				}
			}
		},
		components:{chess},
		onLoad(options) {
			//获取数据
			let roomToken = JSON.parse(options.roomToken);
			// 初始化room
			this.currentRoom = {
				roomId: roomToken.roomId,
				roomName: roomToken.roomName,
				onlineUsers: {
					count: 0,
					users: []
				},
				messages: [],
				currentUser: {
					id: roomToken.userId,
					nickname: roomToken.nickname,
					avatar: roomToken.avatar
				}
			};
			this.userInfo.name  = roomToken.nickname
			// 设置导航标题
			uni.setNavigationBarTitle({
				title: roomToken.roomName
			});

			// 连接goEasy
			this.connectGoEasy();

            // 监听用户上下线
            this.listenUsersOnlineOffline();


            // 加载最后10条消息历史
            this.loadHistory();

            // 监听新消息
            this.listenNewMessage();



        },
		onReady() {
			this.game.ctx = uni.createCanvasContext('canvas');
			this.drawLine();
		},
		onUnload() {
			// 断开连接
			goEasy.disconnect({
				onSuccess(){
					console.log("GoEasy disconnect successfully");
				},
				onFailed(error){
					console.log("GoEasy disconnect failed"+JSON.stringify(error));
				}
			});
		},
		methods: {
			// 连接goEasy
			connectGoEasy(){
				let self = this;
				let userData = {
					avatar: this.currentRoom.currentUser.avatar,
					nickname: this.currentRoom.currentUser.nickname
				}
				goEasy.connect({
					id : this.currentRoom.currentUser.id,
					data : userData,
					onSuccess: function(){
						console.log("GoEasy connect successfully.")

                        // 加载在线用户列表
                        self.loadOnlineUsers();
					},
					onFailed: function(error){
						console.log("Failed to connect GoEasy, code:"+error.code+ ",error:"+error.content);
					},
					onProgress: function(attempts){
						console.log("GoEasy is connecting", attempts);
					}
				});
			},
			// 监听用户上下线
			listenUsersOnlineOffline(){
				let self = this;
				let roomId = this.currentRoom.roomId;
				pubSub.subscribePresence({
					channel: roomId,
					onPresence: function (presenceEvents) {
						self.currentRoom.onlineUsers.count = presenceEvents.clientAmount;
						presenceEvents.events.forEach(function (event) {
							let userData = event.data;
							if (event.action === "join" || event.action === "online") {
								//进入房间
								let userId = event.id;
								let avatar = userData.avatar;
								let nickname = userData.nickname;
								let user = {
									id: userId,
									avatar: avatar,
									nickname: nickname
								};
								//添加新用户
								self.currentRoom.onlineUsers.users.push(user);
								// if (this.chessMassage.playerA){
								// 	this.chessMassage.playerA = userId
								// }
								// else if (this.chessMassage.playerB){
								// 	this.chessMassage.playerB = userId
								// }
								//添加进入房间的消息
								let message = {
									content: " 进入房间",
									senderUserId: userId,
									senderNickname: nickname,
									type: self.MessageType.CHAT
								};
								self.currentRoom.messages = [];
								self.currentRoom.messages.push(message);
							} else {
								//退出房间
								self.currentRoom.onlineUsers.users.forEach((user, index) => {
									if (event.id === user.id) {
										// 删除当前聊天室列表中离线的用户
										let offlineUser = self.currentRoom.onlineUsers.users.splice(index, 1);
										let message = {
											content: " 退出房间",
											senderUserId: offlineUser[0].id,
											senderNickname: offlineUser[0].nickname,
											type: self.MessageType.CHAT
										};
										// console.log(self.currentRoom.messages.length);
										self.currentRoom.messages = []
										self.currentRoom.messages.push(message);
									}
								});
							}
							self.scrollToBottom();
						});
					},
					onSuccess : function () {
						console.log("用户上下线监听成功")
					},
					onFailed : function (error) {
						console.log("监听用户上下线失败, code:"+error.code+ ",content:"+error.content);
                    }
				})
			},
			// 监听新消息
			listenNewMessage(){
				// 监听当前聊天室的消息
				let self = this;
				let roomId = this.currentRoom.roomId;
				pubSub.subscribe({
					channel: roomId,
					onMessage : function (message) {
						let messageContent = "";
						let content = JSON.parse(message.content);
						//聊天消息
						if(content.type === self.MessageType.CHAT) {
							messageContent = content.content;
						}
						//道具消息
						if(content.type === self.MessageType.PROP) {
							if (content.content === self.Prop.ROCKET) {
								messageContent = "送出了一枚大火箭";
							}
							if (content.content === self.Prop.HEART) {
								messageContent = "送出了一个大大的比心";
							}
						}
						
						 console.log("监听消息成功==",content)
						if(content.type === self.MessageType.CHESS){
														
							self.canvasClick(content.body,content.chessRole)
							self.userInfo.roundFlag = true
						}
						//添加消息
						let newMessage = {
							content: messageContent,
							senderUserId: content.senderUserId,
							senderNickname: content.senderNickname,
							type: self.MessageType.CHAT
						};
						if (newMessage.content){
							// self.currentRoom.messages = []
							if (self.currentRoom.messages.length<2){
								self.currentRoom.messages.push(newMessage);
							}
							else{
								self.currentRoom.messages.shift();
								self.currentRoom.messages.push(newMessage);
							}
							}
						if (content.type === self.MessageType.PROP) {
							self.propAnimation(parseInt(content.content))
						}
						self.scrollToBottom();
					},
					onSuccess : function () {
					  console.log("监听新消息成功")
					},
					onFailed : function(error) {
						console.log("订阅消息失败, code:"+error.code+ ",错误信息:"+error.content);
					}
				})
			},
			// 加载在线用户列表
			loadOnlineUsers(){
				let self = this;
				let roomId = this.currentRoom.roomId;
				pubSub.hereNow({
					channels : [roomId],
					includeUsers : true,
					distinct : true,
					onSuccess: function (result) {
						let users = [];
						let currentRoomOnlineUsers = result.content.channels[roomId];
						currentRoomOnlineUsers.users.forEach(function (onlineUser) {
							let userData = onlineUser.data;
							let user = {
								id: onlineUser.id,
								nickname: userData.nickname,
								avatar: userData.avatar
							};
							users.push(user);
						});
						self.currentRoom.onlineUsers = {
							users: users,
							count: currentRoomOnlineUsers.clientAmount
						};
						// 如果是第一个进房的就自动设为白棋
						// 如果是第二个进房的就是设为黑棋
						if(users.length==1){
							self.userInfo.chessRole = 1
							self.userInfo.name = users[0].nickname
						}
						if(users.length==2){
							self.userInfo.chessRole = 2
							self.userInfo.name = users[1].nickname
						}
						
					},
					onFailed: function (error) {
						//获取失败
                        console.log("获取在线用户失败, code:" + error.code + ",错误信息:" + error.content);
					}
				});
			},
			// 加载最后10条消息历史
			loadHistory(){
				let self = this;
				let roomId = this.currentRoom.roomId;
				pubSub.history({
					channel: roomId, //必需项
					limit: 2, //可选项，返回的消息条数
					onSuccess:function(response){
						let messages = [];
						response.content.messages.map(message => {
							let historyMessage = JSON.parse(message.content);
							//道具消息
							if (historyMessage.type === self.MessageType.PROP) {
								if (historyMessage.content === self.Prop.ROCKET) {
									historyMessage.content = "送出了一枚大火箭";
								}
								if (historyMessage.content === self.Prop.HEART) {
									historyMessage.content = "送出了一个大大的比心";
								}
							}
							messages.push(historyMessage);
						});
						self.currentRoom.messages = messages;
					},
					onFailed: function (error) {
                        console.log("获取历史消息失败, code:" + error.code + ",错误信息:" + error.content);
					}
				});
			},
			onInputMessage(event) {//双向绑定消息 兼容
				this.newMessageContent = event.target.value;
			},
			sendMessage(messageType, content) {
				//发送消息
				if (content === "" && messageType === this.MessageType.CHAT) {
					return;
				}
				var message = {
					senderNickname: this.currentRoom.currentUser.nickname,
					senderUserId: this.currentRoom.currentUser.id,
					type: messageType,
					content: content
				};
				
				if(messageType === this.MessageType.CHESS){
					this.chessMassage.body = content
					this.chessMassage.chessRole = this.userInfo.chessRole
					let userNum=this.currentRoom.onlineUsers.users.length
					
					message = {
						senderNickname: this.currentRoom.currentUser.nickname,
						senderUserId: this.currentRoom.currentUser.id,
						type: messageType,
						body:content,
						playerA:'',
						playerB:'',
						chessRole:this.userInfo.chessRole,
						mode:1,
						userNum:userNum
					}
				}
				console.log("发送==",message);
				pubSub.publish({
					channel : this.currentRoom.roomId,
					message : JSON.stringify(message),
					onSuccess : function () {
						console.log("发送成功");
					},
					onFailed : function (error) {
						console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
					}
				});
				this.newMessageContent = "";
			},
			propAnimation(type) {//道具动画
				//动画的实现
				if (this.propDisplay.timer) {
					return;
				}
				this.propDisplay.showPropType = type;
				this.propDisplay.play = true;
				this.propDisplay.timer = setTimeout(() => {
					this.propDisplay.play = false;
					this.propDisplay.timer = null;
				}, 2000)
			},
			scrollToBottom () {
				this.$nextTick(function(){
					uni.pageScrollTo({
						scrollTop: 2000000,
						duration : 10
					})
				})
			},
			// ==== 五指棋控制逻辑  ===
			drawLine() {
				let s = uni.upx2px(730);
				let dis = Math.floor(s / 15);
				let w = dis * 14;
				for (let i = 1; i <= 14; i++) {
					this.game.ctx.moveTo(i * dis + 0.5, w);
					this.game.ctx.lineTo(i * dis + 0.5, dis);
					this.game.ctx.moveTo(dis, i * dis + 0.5);
					this.game.ctx.lineTo(w, i * dis + 0.5);
					this.game.ctx.setStrokeStyle('#a5aa6b');
					this.game.ctx.stroke();
				}
				this.game.ctx.draw();
				for (let i = 0; i <= 13; i++) {
					this.game.chess_Board[i] = [];
					this.game.lianz[i] = [];
					for (let j = 0; j <= 13; j++) {
						this.game.chess_Board[i][j] = 0;
						this.game.lianz[i][j] = 0;
					}
				}
			},
			syncAction(e){
				// 统计非零个数
				var count = 0;
				for (var i = 0; i < 14; i++) {
				    for (var j = 0; j < 14; j++) {
				        if (this.all[i][j] != 0) {
				            count++;
				        }
				    }
				}
				console.log(this.currentRoom.currentUser.id, 'and', this.currentRoom.onlineUsers.users[0].id);
				if(this.currentRoom.currentUser.id==this.currentRoom.onlineUsers.users[count%2].id){
									
					
					
					this.canvasClick(e,this.userInfo.cheeRole)
					
					this.userInfo.roundFlag = false
				}else{
					uni.showModal({
						content: '还未到你的回合！'
					});
				}
				
			},
			canvasClick(e,chessRole) {
				console.log(JSON.stringify(e));
				let s = uni.upx2px(730);
				let dis = Math.floor(s / 15);
				let dx = parseInt(Math.floor(e.changedTouches[0].x + dis / 2) / dis);
				let dy = parseInt(Math.floor(e.changedTouches[0].y + dis / 2) / dis);
				let WBobj = {
					ox: dx * dis - dis / 2 + 10,
					oy: dy * dis - dis / 2 + 10,
					left: dx * dis - dis / 2 + 7 + 'px',
					top: dy * dis - dis / 2 + 12 + 'px',
					transform: '',
					boxShadow: '',
					text: '',
					mz: this.game.chess_Name[this.game.e % 2],
					class: this.game.e % 2 == 1 ? 'Wchess' : 'Bchess',
					list: this.game.um++
				};
				if (dx < 1 || (dx > dis - 1) | (dy < 1) || dy > dis - 1) return;
				if (this.game.chess_Board[dx - 1][dy - 1] == 0 ) {
					if (this.currentRoom.onlineUsers.users.length==1){
						uni.showModal({
							content: '对手未就位'
						});
					}
					else if (!this.can(dx-1, dy-1)){
						uni.showModal({
							content: '你不能下这里'
						});
					}
					else{
						console.log('???????????????????????')
						this.game.h.push(WBobj);
						this.game.chess_Board[dx - 1][dy - 1] = this.game.chess_Name[this.game.e % 2];
						this.game.lianz[dx - 1][dy - 1] = WBobj;
						this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[0], this.game.e % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[1], this.game.e % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[2], this.game.e % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[3], this.game.e % 2);
						this.cName = this.game.e % 2 == 0 ? this.game.chess_Name[1] + '走' : this.game.chess_Name[0] + '走';
						this.sChesee = chessRole==2? 'Bchess' : 'Wchess';
						this.game.e++;
						this.sendMessage(this.MessageType.CHESS,e)
					}
				}
			},
			can(y, x) {
				// 统计非零个数
				var count = 0;
				for (var i = 0; i < 14; i++) {
				    for (var j = 0; j < 14; j++) {
				        if (this.all[i][j] != 0) {
				            count++;
				        }
				    }
				}
				
				//
				count += 1
				console.log(x, y, 'xy')
				
				// 横向
				let horizontalSum = 0;
				for (let i = 0; i < 14; i++) {
				  horizontalSum += this.all[x][i];
				}
				
				// 纵向
				let verticalSum = 0;
				for (let i = 0; i < 14; i++) {
				  verticalSum += this.all[i][y];
				}
				
				// 正斜向
				let positiveSlopeSum = 0;
				let i1 = x;
				let j1 = y;
				while (i1 >= 0 && j1 >= 0) {
				  positiveSlopeSum += this.all[i1][j1];
				  i1--;
				  j1--;
				}
				i1 = x + 1;
				j1 = y + 1;
				while (i1 < 14 && j1 < 14) {
				  positiveSlopeSum += this.all[i1][j1];
				  i1++;
				  j1++;
				}
				
				// 反斜向
				let negativeSlopeSum = 0;
				let i2 = x;
				let j2 = y;
				while (i2 >= 0 && j2 < 14) {
				  negativeSlopeSum += this.all[i2][j2];
				  i2--;
				  j2++;
				}
				i2 = x + 1;
				j2 = y - 1;
				while (i2 < 14 && j2 >= 0) {
				  negativeSlopeSum += this.all[i2][j2];
				  i2++;
				  j2--;
				}
				console.log(this.all, horizontalSum,verticalSum,positiveSlopeSum,negativeSlopeSum,count,'>>>>>>>>>>')
				
				if (count<3){
					this.all[x][y]=count%3
					return true
				}
				else{
					if (horizontalSum % 2 == 0 || verticalSum % 2 == 0 || positiveSlopeSum % 2 == 0 || negativeSlopeSum % 2 == 0) {
						console.log("四个数存在偶数");
						//说明偶数在下
						if (count%2==0){
							this.all[x][y]=2;
							return true;
						}
						
					} 
					if (horizontalSum % 2 == 1 || verticalSum % 2 == 1 || positiveSlopeSum % 2 == 1 || negativeSlopeSum % 2 == 1) {
						console.log("四个数存在奇数");
						if (count%2==1){
							this.all[x][y]=1;
							return true;
						}
						
					} 
					
					this.all[x][y] = 0;
					return false;
					
				}
				
			},
			win(x, y, c, m, li) {
				console.log('win', x, y, c, m, li)
				let ms = 1;
				var continuity = [];
				for (let i = 1; i < 5; i++) {
					if (this.game.chess_Board[x + i * m[0]]) {
						if (this.game.chess_Board[x + i * m[0]][y + i * m[1]] === c) {
							continuity.push([x + i * m[0], y + i * m[1]]);
							ms++;
						} else {
							break;
						}
					}
				}
			
				for (let i = 1; i < 5; i++) {
					if (this.game.chess_Board[x - i * m[0]]) {
						if (this.game.chess_Board[x - i * m[0]][y - i * m[1]] === c) {
							continuity.push([x - i * m[0], y - i * m[1]]);
							ms++;
						} else {
							break;
						}
					}
				}
			
				if (ms >= 5) {
					setTimeout(function() {
						console.log(c + '赢了');
					}, 600);
					continuity.push([x, y]);
					this.game.chessOff = false;
					let s = 5;
					let ls = [270, 300, 330, 360, 390];
					let ls1 = [390, 420, 450, 480, 510];
					let _this = this;
					continuity.forEach(function(value, index) {
						let time = setInterval(function() {
							_this.game.lianz[value[0]][value[1]].transform = 'scale(0.9)';
							_this.game.lianz[value[0]][value[1]].boxShadow = '0px 0px 2px 2px #ffd507';
							s--;
							s <= 0 ? clearInterval(time) : clearInterval(time);
						}, ls[index]);
						let time2 = setInterval(function() {
							_this.game.lianz[value[0]][value[1]].transform = 'scale(1)';
							_this.game.lianz[value[0]][value[1]].boxShadow = '0px 0px 2px 2px #ffd507';
							s++;
							s >= 5 ? clearInterval(time2) : clearInterval(time2);
						}, ls1[index]);
					});
			
					for (var i = 0; i < this.game.chess_Board.length; i++) {
						for (var j = 0; j < this.game.chess_Board.length; j++) {
							if (this.game.chess_Board[i][j] === 0) {
								this.game.chess_Board[i][j] = 'null';
							}
						}
					}
			
					this.game.h.forEach(function(value, index) {
						value.text = value.list;
					});
			
					uni.showModal({
						content: c + '赢了'
					});
				}
			},
			regret() {
				if (this.game.chessOff) {
					if (this.game.h.length > 0) {
						let s = uni.upx2px(730);
						let dis = Math.floor(s / 15);
						let obj = this.game.h.pop();
						this.cName = this.game.e % 2 == 0 ? this.game.chess_Name[1] + '走' : this.game.chess_Name[0] + '走';
						this.sChesee = this.game.e % 2 == 1 ? 'Bchess' : 'Wchess';
						this.game.e -= 1;
						this.game.um -= 1;
						this.game.chess_Board[parseInt(obj.ox / dis)][parseInt(obj.oy / dis)] = 0;
					} else {
						return;
					}
				} else {
					return;
				}
			},
			anewClick() {
				this.game.h = [];
				this.game.um = 0;
				this.game.chessOff = true;
				for (let i = 0; i <= 13; i++) {
					this.game.chess_Board[i] = [];
					this.game.lianz[i] = [];
					for (let j = 0; j <= 13; j++) {
						this.game.chess_Board[i][j] = 0;
						this.game.lianz[i][j] = 0;
					}
				}
			}
		}
	}
</script>

<style>
	page {
		height: 100%;;
	}

	uni-page-body {
		height: 100%;;
	}

	.chat-room {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.online-avatar-container {
		position: fixed;
		right: 0;
		width: 100%;
		height: 80rpx;
		display: flex;
		justify-content: flex-end;
		padding: 28rpx;
		box-shadow: 10rpx 30rpx 50rpx #fff;
		z-index: 40;
		background: #ffffff;
	}

	.online-avatar-item {
		width: 80rpx;
		height: 80rpx;
		border-radius: 40rpx;
		text-align: center;
		line-height: 80rpx;
		background: rgba(51, 51, 51, 0.3);
		color: #fff;
		font-size: 18rpx 28rpx;
	}

	.online-count {
		width: 80rpx;
		height: 80rpx;
		border-radius: 40rpx;
		text-align: center;
		line-height: 80rpx;
		background: rgba(51, 51, 51, 0.3);
		color: #fff;
		font-size: 28rpx;
	}

	.online-avatar-item image {
		width: 80rpx;
		height: 80rpx;
	}

	.chat-room-container {
		/* padding-top: 100rpx; */
	}

	.scroll-view {
		position: static;
		overflow-y: scroll;
		padding: 20rpx 38rpx 130rpx 38rpx;
		box-sizing: border-box;
		-webkit-overflow-scrolling: touch;
	}

	.message-box {
		margin-top: 16rpx;
	}

	.message-item {
		box-sizing: border-box;
		height: 72rpx;
		background-color: rgba(196, 196, 196, 0.2);
		display: inline-block;
		font-size: 28rpx;
		border-radius: 100rpx;
		padding: 18rpx 30rpx;
		font-family: Microsoft YaHei UI;
	}

	.user-name {
		color: #D02129;
		font-family: Microsoft YaHei UI;
	}

	.user-message {
		color: #333;
		font-family: Microsoft YaHei UI;
	}

	.chat-room-input {
		position: fixed;
		bottom: 0;
		height: 92rpx;
		line-height: 92rpx;
		padding: 10rpx 28rpx 20rpx 28rpx;
		display: flex;
		background: #ffffff;
	}

	.uni-input {
		width: 528rpx;
		background-color: rgba(51, 51, 51, 0.1);
		height: 92rpx;
		border-radius: 100rpx;
		box-sizing: border-box;
		padding: 26rpx 40rpx;
		font-size: 28rpx;
	}

	.uni-btn {
		position: absolute;
		z-index: 1000;
		width: 72rpx;
		height: 72rpx;
		background: #D02129;
		right: 10rpx;
		top: 10rpx;
		border-radius: 72rpx;
		text-align: center;
		line-height: 72rpx;
		color: #fff;
		font-weight: bold;
		font-size: 32rpx;
	}

	.heart {
		width: 80rpx;
		height: 92rpx;
		padding: 0 15rpx;
	}

	.rocket {
		width: 40rpx;
		height: 92rpx;
	}

	.self {
		color: #D02129;
	}

	.show-animation {
		width: 80rpx;
		height: 320rpx;
		position: fixed;
		z-index: 44;
		left: 50%;
		bottom: 80rpx;
		margin: 0 -40rpx;
		justify-content: flex-end;
		animation: myanimation 2s linear;
	}

	.prop-heart {
		height: 80rpx;
		width: 80rpx;
	}

	.prop-rocket {
		height: 160rpx;
		width: 80rpx;
	}

	@keyframes myanimation {
		from {
			bottom: 80rpx;
		}
		to {
			bottom: 600rpx;
		}
	}






.box {
	position: relative;
	margin: 50rpx auto;
	width: 750rpx;
	height: 810rpx;
	background: #e6e7ec;
}

.centent {
	position: absolute;
	width: 730rpx;
	height: 730rpx;
	border: 1px solid #9e9e9e;
	overflow: hidden;
	border-radius: 8rpx;
	box-shadow: 0rpx 0rpx 5rpx 0rpx #9e9e9e;
	left: 10rpx;
	top: 20rpx;
}

.canvas {
	z-index: 9;
	background: #f7e6b7;
}

.button,
.anew,
.state,
.winner {
	position: absolute;
	display: block;
	width: 100rpx;
	height: 55rpx;
	border-radius: 10rpx;
	outline: none;
	font-size: 22rpx;
	box-sizing: border-box;
	color: #00bcd4;
	background: #fff;
	border: none;
	box-shadow: 1rpx 1rpx 3rpx 1rpx #9e9e9e;
	top: 760rpx;
	left: 270rpx;
	user-select: none;
}
.anew {
	left: 150rpx;
}
.state {
	left: 400rpx;
	width: 140rpx;
}
.state .state-chess,
.winner .state-chess {
	position: absolute;
	width: 30rpx;
	height: 30rpx;
	top: 11rpx;
	left: 10rpx;
}

.state .chessName,
.winner .chessName {
	position: absolute;
	width: 80rpx;
	height: 30rpx;
	top: 12rpx;
	left: 45rpx;
	text-align: center;
	line-height: 30rpx;
	font-size: 15rpx;
}

.button:active,
.anew:active {
	transition-property: all;
	transition-duration: 1s;
	transition-timing-function: ease;
	transition-delay: 0s;
	transform: scale(0.8);
}

.Bchess {
	position: absolute;
	width: 40rpx;
	height: 40rpx;
	border-radius: 40rpx;
	background: radial-gradient(#9e9e9e -100%, #000000 100%);
	box-shadow: 1rpx 1rpx 2rpx 0rpx #000000;
	font-size: 10rpx;
	line-height: 50rpx;
	text-align: center;
	color: #fff;
}

.Wchess {
	position: absolute;
	width: 40rpx;
	height: 40rpx;
	border-radius: 40rpx;
	background: radial-gradient(#e4e4e4 10%, #b7aaaa);
	box-shadow: 1rpx 1rpx 2rpx 0rpx #0000006e;
	font-size: 10rpx;
	line-height: 50rpx;
	text-align: center;
	color: #000000;
}

.winner {
	width: 120rpx;
	left: 12rpx;
	display: none;
}
</style>
