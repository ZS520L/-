<template>
	<view class="goBang u-border-top">
		<!-- 对战信息 -->
		<view class="goBang-user flexItems" style="display: flex; flex-direction: row;">
			<view class="flexCenter flexColumn flex1 box" style="padding-left: 180rpx;">
				<image class="goBang-chess" src="../../static/images/black.png" size="50"></image>
				<view class="u-m-t-20 fontBold c757575">玩家</view>
			</view>
			<view class="fontBold cmain u-font-40" style="padding-left: 100rpx;padding-top: 20rpx; color: #00a1d6;">VS</view>
			<view class="flexCenter flexColumn flex1 box" style="padding-left: 100rpx;">
				<image class="goBang-chess" src="../../static/images/white.png" size="50"></image>
				<view class="u-m-t-20 fontBold c757575">电脑</view>
			</view>
		</view>
		<view class="goBang-container boxtb">
			
			
			
			<!-- 棋盘底座 -->
			<view class="goBang-board u-rela">
				<!-- 棋盘网格 -->
				<view class="goBang-grid-box u-rela">
					<view class="goBang-grid">
						<view class="goBang-grid-tr" v-for="(item,index) in 14" :key="index">
							<view class="goBang-grid-td" v-for="(item,index) in 14" :key="index"></view>
						</view>
					</view>
				
				</view>
				<!-- 隐藏的棋盘网格  用于下棋子用的 -->
				<view class="goBang-check" style="width: 700;height: 660;">
					<view class="goBang-check-tr" v-for="(item1,index1) in chessBoard" :key="index1">
						<view class="goBang-check-td" v-for="(item2,index2) in item1" :key="index2" @click="playerChess(index1,index2)">
							<image class="goBang-check-chess" :src="player[item2]" v-if="item2!=0"></image>
						</view>
					</view>
				</view>
			</view>
			
			
			
			
			<!-- 规则说明 -->
			<view class="boxtb">
				<view class="u-m-t-10 fontBold u-font-32 c757575">规则说明:</view>
				<view class="u-m-t-20 c757575">1、玩家先手</view>
				<view class="u-m-t-10 c757575">2、其他规则，自行探索</view>
			</view>
		</view>
		
		<!-- 功能按钮 -->
		<view class="goBang-btns">
			<view class="goBang-btn" @click="regret" v-if="!isOver">
				<u-icon name="thumb-down-fill" size="30" color="#999"></u-icon>
				<text>悔棋</text>
			</view>
			<view class="goBang-btn" @click="restart">
				<u-icon name="reload" size="30" color="#999"></u-icon>
				<text>重来</text>
			</view>
			<view class="goBang-btn" @click="defeat" v-if="!isOver">
				<u-icon name="fingerprint" size="30" color="#999"></u-icon>
				<text>认输</text>
			</view>
		</view>
	</view>
</template>


<script>
	export default {
		data() {
			return {
				player: {	// 0=没有子  1=电脑  2=玩家
					0: null, 
					1: '../../static/images/white.png', 
					2: '../../static/images/black.png'
				}, 
				chessBoard: [],  	// 棋盘数组
				isWho: true,  		// 该谁下
				isOver: false,		// 游戏是否结束
				allWins: [], 		// 全部赢法的数组
				allCount: 0,		// 一共有多少种赢法
				playerWins: [],		// 玩家赢法的数组
				computerWins: [],	// 电脑赢法的数组
			};
		},
		onLoad() {
			this.chess_init();
			uni.showToast({title: "欢迎来到五子棋~", icon:'none'});
		},
		methods:{
			// 悔棋
			regret(){
				uni.showToast({title: "世上没有后悔药~", icon:'none'});
			},
			// 重来
			restart(){
				uni.showToast({title: "欢迎来到五子棋~", icon:'none'});
				this.chessBoard = [];
				this.isOver = false;
				this.isWho = true;
				this.chess_init();
			},
			// 认输
			defeat(){
				if(this.isOver){
					uni.showToast({title: "游戏已结束，可以重新开始了", icon:'none'});
				}else{
					this.isOver = true
					uni.showToast({title: "就这？就这？就这？回家喂猪吧!", icon:'none'});
				}
			},
			// 玩家落子
			playerChess(x, y){
				// 当此点有棋子 或者 游戏结束 或者 不论到你时，则不能落子
				if(this.chessBoard[x][y] != 0 || !this.isWho || this.isOver){
					return;
				}
				// 落子
				this.chessBoard[x][y] = 2; 		
				this.$forceUpdate();
				// 判断输赢
				setTimeout(()=>{				
					for(let k = 0; k < this.allCount; k++){
						if(this.allWins[x][y][k] == true){
							this.playerWins[k]++;
							this.computerWins[k] = 6;
							if(this.playerWins[k] == 5){
								this.isOver = true;
								uni.showToast({title: "玩家获胜!!!!"});
							}
						}
					}
				},50)
				// 如果玩家没获胜 则该电脑落子
				setTimeout(()=>{
					if(!this.isOver){			
						this.isWho = !this.isWho;
						this.computerChess();
					}
				},100)
			},
			// 电脑落子
			computerChess(){
				// 电脑落子 利用算法————权重值
				// 判断哪一点的值最高，也就是对电脑的利益最大
				// 每下一步，就会判断某点对于玩家利益大还是自身利益大，来进行围堵和进攻
				const playerScore = [];  	// 对于玩家而言，每一个空点的数值集合
				const computerScore = [];	// 对于电脑而言，每一个空点的数值集合
				let maxScore = 0;			// 最大值
				let x = 0, y = 0;			// 最后决定电脑落子的位置
				
				// 初始化玩家和电脑每个点的数值
				for(let i = 0; i < 15; i++){
					playerScore[i] = [];
					computerScore[i] = [];
					for(let j = 0; j < 15; j++){
						playerScore[i][j] = 0;
						computerScore[i][j] = 0;
					}
				}
				// 开始遍历棋盘（查看当前棋盘中所有空点）
				for(let i = 0; i < 15; i++){
					for(let j = 0; j < 15; j++){
						if(this.chessBoard[i][j] == 0){		// 此点可落子
							
							// 遍历所有赢法 给玩家和电脑的每个空点 打分 分值最高的点则是电脑落子点
							for(let k = 0; k < this.allCount; k++){		
								if(this.allWins[i][j][k] == true){		// 判断当前点的赢法中有没有玩家或者电脑的棋子
									
									// 如果有玩家的棋子
									if(this.playerWins[k] === 1){		// 赢法中包含一个玩家棋子...
										playerScore[i][j] += 100;
									}else if(this.playerWins[k] === 2){
										playerScore[i][j] += 400;
									}else if(this.playerWins[k] === 3){
										playerScore[i][j] += 800;
									}else if(this.playerWins[k] === 4){
										playerScore[i][j] += 2000;
									}
									// 如果有电脑的棋子
									// 相同棋子数时，电脑的权重值要比玩家的高，首先考虑自己；
									// 但是当玩家达到三颗时，自身如果没有机会，则玩家权重值大
									if(this.computerWins[k] === 1){		// 赢法中包含一个电脑棋子...
										computerScore[i][j] += 150;
									}else if(this.computerWins[k] === 2){
										computerScore[i][j] += 450;
									}else if(this.computerWins[k] === 3){
										computerScore[i][j] += 950;
									}else if(this.computerWins[k] === 4){
										computerScore[i][j] += 10000;
									}
									
								}
							}
							
							// 比较玩家和电脑在某点的分值
							// 玩家
							if(playerScore[i][j] > maxScore){
								maxScore = playerScore[i][j];
								x = i;
								y = j;
							}else if(playerScore[i][j] == maxScore){		
								// 如果玩家在当前点的分跟前一个相等，就再跟电脑自身在该点的值进行比较
								// 如果电脑在当前点，比在上一个点的分大，说明电脑下这个点的优势更大， 以此类推，推出所有点的结果
								if(computerScore[i][j] > computerScore[x][y]){
									maxScore = computerScore[i][j];
									x = i;
									y = j;
								}
							}
							// 电脑
							if(computerScore[i][j] > maxScore){
								maxScore = computerScore[i][j];
								x = i;
								y = j;
							}else if(computerScore[i][j] == maxScore){
								if(playerScore[i][j] > playerScore[x][y]){
									maxScore = playerScore[i][j];
									x = i;
									y = j;
								}
							}
							
						}
					}
				}
				
				// 此时电脑就可以落子了
				this.chessBoard[x][y] = 1;
				this.$forceUpdate();
				// 判断电脑是否获胜
				setTimeout(()=>{
					for(let k = 0; k < this.allCount; k++){
						if(this.allWins[x][y][k] == true){
							this.computerWins[k]++;
							this.playerWins[k] = 6;
							if(this.computerWins[k] == 5){
								this.isOver = true;
								uni.showToast({title: "电脑获胜！"});
							}
						}
					}
				},50)
				
				if(!this.isOver){
					this.isWho = !this.isWho;
				}
			},
			
			// 初始化
			chess_init(){
				//棋盘 
				for(let i = 0; i < 15; i++){
					this.chessBoard[i] = [];
					for(let j = 0; j < 15; j++){
						this.chessBoard[i][j] = 0;
					}
				}
				// 初始化所有赢法的数组
				for(let i = 0; i < 15; i++){
					this.allWins[i] = [];
					for(let j = 0; j < 15; j++){
						this.allWins[i][j] = [];
					}
				}
				// 横向赢法
				for(let i = 0; i < 15; i++){
					for(let j = 0; j < 11; j++){
						for(let k = 0; k < 5; k++){
							this.allWins[i][j+k][this.allCount] = true;
						}
						this.allCount++;
					}
				}
				// 竖向赢法
				for(let i = 0; i < 11; i++){
					for(let j = 0; j < 15; j++){
						for(let k = 0; k < 5; k++){
							this.allWins[i+k][j][this.allCount] = true;
						}
						this.allCount++;
					}
				}
				// 斜向（左上 -> 右下）
				for(let i = 0; i < 11; i++){
					for(let j = 0; j < 11; j++){
						for(let k = 0; k < 5; k++){
							this.allWins[i+k][j+k][this.allCount] = true;
						}
						this.allCount++;
					}
				}
				// 斜向（右上 -> 左下）
				for(let i = 0; i < 11; i++){
					for(let j = 14; j > 3; j--){
						for(let k = 0; k < 5; k++){
							this.allWins[i+k][j-k][this.allCount] = true;
						}
						this.allCount++;
					}
				}
				// console.log(this.allCount); // 572种赢法
				
				// 统计玩家与电脑的赢法数组
				// 简单来说，玩家和电脑都有572种赢法，每种赢法初始值是0；
				// 例如当玩家在第一种赢法中落一颗子，与之对应的赢法就+1，当前加到5的时候，说明第一种赢法中有了玩家五颗子，所以玩家赢。
				// 反之，当第一种赢法中玩家落了四颗，但是电脑落了一颗，那么第一种赢法对应的玩家就+4，电脑+1，这样在第一种赢法里，玩家与电脑都不能获胜。
				// 以此类推其他的赢法...
				for(let i = 0; i < this.allCount; i++){
					this.playerWins[i] = 0;
					this.computerWins[i] = 0;
				}
			},
		}
	}
</script>


<style>
	page{background-color: #F3F2F7;}
</style>
<style lang="scss" scoped>
// #F7E7B6 棋盘背景		 #C0A47C 网格条纹
.goBang{padding: 30rpx;}
.goBang-chess{width: 50rpx;height: 50rpx; border-radius: 50%;box-shadow: 0 0 8rpx 4rpx rgba(0,0,0,.2);}
.goBang-board{
	width: 650rpx;height: 650rpx;background-color: #f7e7b6;border-radius: 10rpx;border: 2rpx solid rgba(0,0,0,.05);box-shadow: 0 0 6rpx 2rpx rgba(0,0,0,.1);padding: 20rpx;
	.goBang-grid-box{
		width: 100%;height: 100%;
		.point-c{position: absolute;width: 14rpx;height: 14rpx;border-radius: 50%;background-color: #C0A47C; top: 50%;left: 50%;transform: translate(-50%,-50%);}
		.point-1{position: absolute;width: 14rpx;height: 14rpx;border-radius: 50%;background-color: #C0A47C; top: 21.5%;left: 21.5%;transform: translate(-50%,-50%);}
		.point-2{position: absolute;width: 14rpx;height: 14rpx;border-radius: 50%;background-color: #C0A47C; top: 21.5%;right: 21.5%;transform: translate(50%,-50%);}
		.point-3{position: absolute;width: 14rpx;height: 14rpx;border-radius: 50%;background-color: #C0A47C; bottom: 21.5%;right: 21.5%;transform: translate(50%,50%);}
		.point-4{position: absolute;width: 14rpx;height: 14rpx;border-radius: 50%;background-color: #C0A47C; bottom: 21.5%;left: 21.5%;transform: translate(-50%,50%);}
	}
	.goBang-grid{
		width: 100%;height: 100%;border-top: 2rpx solid #C0A47C;border-left: 2rpx solid #C0A47C;display: flex;flex-direction: column;
		.goBang-grid-tr{width: 100%;display: flex;flex: 1;}
		.goBang-grid-td{flex: 1;border-right: 2rpx solid #C0A47C;border-bottom: 2rpx solid #C0A47C;}
	}
	.goBang-check{
		display: flex;flex-direction: column;position: absolute;width: 650rpx;height: 650rpx;top: 125rpx;right: 0;left: 0;bottom: 0;z-index: 9999;border-radius: 10rpx;
		.goBang-check-tr{width: 100%;display: flex;flex: 1;}
		.goBang-check-td{flex: 1;display: flex;align-items: center;justify-content: center;}
		.goBang-check-chess{width: 50rpx;height: 50rpx;border-radius: 50%;box-shadow: 0 2rpx 10rpx 0rpx rgba(0,0,0,.5);}
	}
}
.goBang-btns{
	display: flex;align-items: center;justify-content: center; position: fixed;bottom: 30rpx;right: 0;left: 0;padding: 30rpx;
	.goBang-btn{
		width: 90rpx;height: 90rpx; border-radius: 50%;background-color: #fff;box-shadow: 0 0 10rpx 4rpx rgba(0,0,0,.1);
		display: flex;align-items: center;justify-content: center;flex-direction: column;
		margin-left: 30rpx;color: #999;font-size: 24rpx;
	}
}
</style>


