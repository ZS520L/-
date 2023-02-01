<template>
	<view class="chat-room">
		<view class="box" style="margin-top: 70px; position: relative;">
			<view style="font-size: 20rpx; position: absolute;"
				:class="value.class"
				:style="{ left: value.left, top: value.top, transform: value.transform, boxShadow: value.boxShadow}"
				v-for="(value, index) in game.h"
				:key="index"
			>
				{{ value.text }}
			</view>
			<view class="centent"><canvas @touchend="syncAction" canvas-id="canvas" class="canvas" style="width: 730rpx;height: 730rpx;"></canvas></view>
				
			<view class="winner">
				<view class="state-chess Bchess"></view>
				<view class="chessName"></view>
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
				winflag:0,
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
				chessBoard: [],  	// 棋盘数组
				isWho: true,  		// 该谁下
				isOver: false,		// 游戏是否结束
				allWins: [], 		// 全部赢法的数组
				allCount: 0,		// 一共有多少种赢法
				playerWins: [],		// 玩家赢法的数组
				computerWins: [],	// 电脑赢法的数组
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
			sroomId:'',
			nickname:'',
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
			console.log(roomToken.nickname,'积分')
			this.nickname = roomToken.nickname
			console.log('s'+roomToken.roomId,'ssss')
			this.sroomId = 's'+roomToken.roomId;
			
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
			// this.connectGoEasy();

            // 监听用户上下线
            // this.listenUsersOnlineOffline();


            // 加载最后10条消息历史
            // this.loadHistory();

            // 监听新消息
            // this.listenNewMessage();



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
		onHide(){
			uni.reLaunch({
				url: "/pages/index/index"
			})
		},
		methods: {
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
				
				this.canvasClick(e,this.userInfo.cheeRole)
				
				// this.userInfo.roundFlag = false
				
			},
			canvasClick(e,chessRole) {
				var count = this.game.h.length;
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
					mz: this.game.chess_Name[count % 2],
					class: count % 2 == 1 ? 'Wchess' : 'Bchess',
					list: this.game.um++
				};
				if (dx < 1 || (dx > dis - 1) | (dy < 1) || dy > dis - 1) return;
				if (this.game.chess_Board[dx - 1][dy - 1] == 0 ) {
					
					// 黑棋出现偶数，白棋未统计？？
					if (!this.can(dx-1, dy-1)){
						uni.showModal({
							content: '你不能下这里'
						});
					}
					else{
						this.game.h.push(WBobj);
						this.all[dy-1][dx-1]=1;
						this.game.chess_Board[dx - 1][dy - 1] = this.game.chess_Name[count % 2];
						this.game.lianz[dx - 1][dy - 1] = WBobj;
						this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[0], count % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[1], count % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[2], count % 2);
						this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[3], count % 2);
						this.cName = count % 2 == 0 ? this.game.chess_Name[1] + '走' : this.game.chess_Name[0] + '走';
						this.sChesee = chessRole==2? 'Bchess' : 'Wchess';
						if (!this.winflag){
							this.randdown();
							// this.score();
							
						}
						
					}
				}
			},
			ai(chessboard, size) {
			    let midu = new Array(size).fill(0).map(() => new Array(size).fill(0));
			    for (let i = 1; i < size - 1; i++) {
			        for (let j = 1; j < size - 1; j++) {
			            midu[i][j] = 
			                chessboard[i - 1][j - 1] + chessboard[i - 1][j] + chessboard[i - 1][j + 1] +
			                chessboard[i][j - 1] + chessboard[i][j + 1] + chessboard[i][j]
			                chessboard[i + 1][j - 1] + chessboard[i + 1][j] + chessboard[i + 1][j + 1];
			        }
			    }
			    midu = midu.map((row, i) => row.map((col, j) => col - chessboard[i][j]));
			    console.log(midu);
			
			    let max = 0;
			    let max_row = 0;
			    let max_col = 0;
			    for (let i = 1; i < size - 1; i++) {
			        for (let j = 1; j < size - 1; j++) {
			            if (midu[i][j] > max) {
			                max = midu[i][j];
			                max_row = i;
			                max_col = j;
			            }
			        }
			    }
				// while(!this.can(max_row, max_col)){
				// 	midu[max_row][max_col] = -1;
				// 	for (let i = 1; i < size - 1; i++) {
				// 	    for (let j = 1; j < size - 1; j++) {
				// 	        if (midu[i][j] > max) {
				// 	            max = midu[i][j];
				// 	            max_row = i;
				// 	            max_col = j;
				// 	        }
				// 	    }
				// 	}
				// }
			    console.log("最大值位于：",max_row,max_col);
				return [max_row,max_col]
			},
			randdown(){
				var count = this.game.h.length;
				let dx = 10;
				let dy = 10;
				let pos = this.ai(this.all, 14);
				var arr = [[pos[0],pos[1]]];
				
				for(var i = 1; i < 3; i++){
				    arr.push([pos[0]-i,pos[1]-i]);
					arr.push([pos[0]-i,pos[1]]);
					arr.push([pos[0],pos[1]-i]);
					arr.push([pos[0]+i,pos[1]]);
					arr.push([pos[0],pos[1]+i]);
				    arr.push([pos[0]+i,pos[1]-i]);
				    arr.push([pos[0]-i,pos[1]+i]);
				    arr.push([pos[0]+i,pos[1]+i]);
				}
				console.log('arr:',Math.floor(Math.random() * arr.length)+arr.length)
				var x = 10;
				while (true){
					let dd = arr[Math.floor(Math.random() * arr.length)];
					dx = dd[0];
					dy = dd[1];
					if(!this.can(dx-1, dy-1)){
						console.log('AI计算中')
					}else if(this.all[dy-1][dx-1]>0){
						console.log('AI试图覆盖')
						if (x==0){
							break;
						}else{
							x--;
						}
					}else{
						break;
					}
				}
				
				let s = uni.upx2px(730);
				let dis = Math.floor(s / 15);
				let WBobj = {
					ox: dx * dis - dis / 2 + 10,
					oy: dy * dis - dis / 2 + 10,
					left: dx * dis - dis / 2 + 7 + 'px',
					top: dy * dis - dis / 2 + 12 + 'px',
					transform: '',
					boxShadow: '',
					text: '',
					mz: this.game.chess_Name[count % 2],
					class: count % 2 == 1 ? 'Wchess' : 'Bchess',
					list: this.game.um++
				};
					this.game.h.push(WBobj);
					this.all[dy-1][dx-1]=2;
					this.game.chess_Board[dx - 1][dy - 1] = this.game.chess_Name[count % 2];
					this.game.lianz[dx - 1][dy - 1] = WBobj;
					this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[0], count % 2);
					this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[1], count % 2);
					this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[2], count % 2);
					this.win(dx - 1, dy - 1, this.game.chess_Name[count % 2], this.game.winXY[3], count % 2);
					this.cName = count % 2 == 0 ? this.game.chess_Name[1] + '走' : this.game.chess_Name[0] + '走';
					this.sChesee = 'Wchess';
				
			},
			can(y, x) {
				if (x<1 || x>14 || y<1 || y>14) {
					return false;
				}
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
				console.log(this.all, horizontalSum,verticalSum,positiveSlopeSum,negativeSlopeSum,this.game.h.length+1,'>>>>>>>>>>')
				var count = this.game.h.length;
				if (count<2){
					this.all[x][y]=count%2+1;
					return true
				}
				else{
					if ((horizontalSum > 0 && horizontalSum % 2 == 0) || (verticalSum>0&&verticalSum % 2 == 0) || (positiveSlopeSum>0&&positiveSlopeSum % 2 == 0) || (negativeSlopeSum>0&&negativeSlopeSum % 2 == 0)) {
						// console.log("四个数存在偶数");
						//说明偶数在下
						if (count%2==1){
							return true;
						}
						
					} 
					if (horizontalSum % 2 == 1 || verticalSum % 2 == 1 || positiveSlopeSum % 2 == 1 || negativeSlopeSum % 2 == 1) {
						// console.log("四个数存在奇数");
						if (count%2==0){
							return true;
						}
						
					} 
					
					this.all[x][y] = 0;
					return false;
					
				}
				
			},
			win(x, y, c, m, li) {
				// console.log('win', x, y, c, m, li)
				let ms = 1;
				let black = 0;
				let white = 0;
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
					this.winflag = 1
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
					var num = 1;
					this.game.h.forEach(function(value, index) {
						value.text = num;
						num += 1
					});
			
					// uni.showModal({
					// 	content: c + '赢了'
					// });
					uni.showModal({
					    title: '提示',
					    content: '游戏结束：'+ c + '赢了',
					    success: function (res) {
					        if (res.confirm) {
					            uni.reLaunch({
					            	url: "/pages/index/index"
					            })
					        } else if (res.cancel) {
								
					            console.log('用户点击取消');
					        }
					    }
					});
					
				}
			},
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
		padding: 0rpx 38rpx 130rpx 38rpx;
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
		padding: 0 22.5rpx;
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
	z-index: 10;
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
	z-index: 9998;
	width: 40rpx;
	height: 40rpx;
	border-radius: 40rpx;
	background: radial-gradient(#9e9e9e -100%, #000000 100%);
	/* box-shadow: 1rpx 1rpx 2rpx 0rpx #000000; */
	font-size: 10rpx;
	line-height: 50rpx;
	text-align: center;
	color: #fff;
}
.Wchess {
	position: absolute;
	z-index: 9998;
	width: 40rpx;
	height: 40rpx;
	border-radius: 40rpx;
	background: radial-gradient(#e4e4e4 10%, #b7aaaa);
	/* box-shadow: 1rpx 1rpx 2rpx 0rpx #0000006e; */
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
