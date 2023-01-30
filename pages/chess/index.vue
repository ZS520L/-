<template>
	<view>
		<view class="box">
			<view class="centent"><canvas @touchend="canvasClick" canvas-id="canvas" class="canvas" style="width: 730rpx;height: 730rpx;"></canvas></view>
			<view>
				<view
					:class="value.class"
					:style="{ left: value.left, top: value.top, transform: value.transform, boxShadow: value.boxShadow }"
					v-for="(value, index) in game.h"
					:key="index"
				>
					{{ value.text }}
				</view>
			</view>
			<!-- <button class="button" @tap="regret">撤回</button>
			<button class="anew" @tap="anewClick">重开</button>
			<view class="state">
				<view class="state-chess" :class="sChesee"></view>
				<view class="chessName">{{ cName }}</view>
			</view> -->
			<view class="winner">
				<view class="state-chess Bchess"></view>
				<view class="chessName"></view>
			</view>
		</view>
	</view>
</template>

<script>
	/**
	 * 本代码遵循MIT协议，任何使用本代码的用户代表同意该协议
	 * 任何个人或者机构直接使用本代码请标记出处
	 */
export default {
	data() {
		return {
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
			sChesee: 'Bchess'
		};
	},
	created() {
		this.game.ctx = uni.createCanvasContext('canvas');
		this.drawLine();
	},
	onLoad() {},
	onReady() {
		
	},
	methods: {
		drawLine() {
			let s = uni.upx2px(730);
			let dis = Math.floor(s / 15);
			let w = dis * 14;
			for (let i = 1; i <= 14; i++) {
				this.game.ctx.moveTo(i * dis + 0.5, w);
				this.game.ctx.lineTo(i * dis + 0.5, dis);
				this.game.ctx.moveTo(dis, i * dis + 0.5);
				this.game.ctx.lineTo(w, i * dis + 0.5);
				this.game.ctx.setStrokeStyle('#1ac03b');
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
		canvasClick(e) {
			console.log(JSON.stringify(e));
			let s = uni.upx2px(730);
			let dis = Math.floor(s / 15);
			let dx = parseInt(Math.floor(e.changedTouches[0].x + dis / 2) / dis);
			let dy = parseInt(Math.floor(e.changedTouches[0].y + dis / 2) / dis);
			let WBobj = {
				ox: dx * dis - dis / 2 + 10,
				oy: dy * dis - dis / 2 + 10,
				left: dx * dis - dis / 2 + 10 + 'px',
				top: dy * dis - dis / 2 + 10 + 'px',
				transform: '',
				boxShadow: '',
				text: '',
				mz: this.game.chess_Name[this.game.e % 2],
				class: this.game.e % 2 == 1 ? 'Wchess' : 'Bchess',
				list: this.game.um++
			};
			if (dx < 1 || (dx > dis - 1) | (dy < 1) || dy > dis - 1) return;
			if (this.game.chess_Board[dx - 1][dy - 1] == 0) {
				this.game.h.push(WBobj);
				this.game.chess_Board[dx - 1][dy - 1] = this.game.chess_Name[this.game.e % 2];
				this.game.lianz[dx - 1][dy - 1] = WBobj;
				this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[0], this.game.e % 2);
				this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[1], this.game.e % 2);
				this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[2], this.game.e % 2);
				this.win(dx - 1, dy - 1, this.game.chess_Name[this.game.e % 2], this.game.winXY[3], this.game.e % 2);
				this.cName = this.game.e % 2 == 0 ? this.game.chess_Name[1] + '走' : this.game.chess_Name[0] + '走';
				this.sChesee = this.game.e % 2 == 1 ? 'Bchess' : 'Wchess';
				this.game.e++;
			}
		},
		win(x, y, c, m, li) {
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
};
</script>

<style>
page {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	overflow: hidden;
	background: #e6e7ec;
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
