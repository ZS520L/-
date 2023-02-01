<template>
	<view>
		<!-- 顶部标题 -->
		<view class="title">积分排行榜
			<image src="../../static/images/gobang/cai.png"></image>
		</view>
		<!-- 排行榜分类的标题 -->
		<view class="pai">
			<view>排行</view>
			<view>用户名</view>
			<view>积分</view>
		</view>
		<!-- 排行列表 -->
		<view class="center" v-if="myname==rank[10][1]">
		    <view v-for="(value, index) in rank" :key="index" style="display: flex;flex-direction: row">
		        <view v-if="index<3" class="one">
		            <image :src="Images[index]"></image>
		        </view>
				
				<view class="one" v-if="index>2&&index<10">{{value[0]}}</view>
		        <view class="two" v-if="index<10">{{value[1]}}</view>
		        <view class="three" v-if="index<10">{{value[2]}}</view>
				
				<view class="one" style="color: coral;" v-if="index==10">{{value[0]}}</view>
				<view class="two" style="color: coral;" v-if="index==10">{{value[1]}}</view>
				<view class="three" style="color: coral;" v-if="index==10">{{value[2]}}</view>
		    </view>
		</view>
		
		<view class="center" v-if="myname!=rank[10][1]">
		    <view v-for="(value, index) in rank.slice(0,10)" :key="index" style="display: flex;flex-direction: row">
		        <view v-if="index<3" class="one">
		            <image :src="Images[index]"></image>
		        </view>
				
				<view class="one" v-if="index>2&&value[1]!=myname">{{index+1}}</view>
		        <view class="two" v-if="value[1]!=myname">{{value[1]}}</view>
		        <view class="three" v-if="value[1]!=myname">{{value[2]}}</view>
				
				<view class="one" style="color: coral;" v-if="value[1]==myname&&index>2">{{index+1}}</view>
				<view class="two" style="color: coral;" v-if="value[1]==myname">{{value[1]}}</view>
				<view class="three" style="color: coral;" v-if="value[1]==myname">{{value[2]}}</view>
		    </view>
		</view>
		
	</view>
</template>

<script>
	export default {
		data() {
			return {
				myname:'墨宝',
				Images:["../../static/images/gobang/1.png",
						"../../static/images/gobang/2.png",
						"../../static/images/gobang/3.png"],
				rank:[
						[10,'墨宝','520'],
				        [1,'白家军','456'],
				        [2,'张三','386'],
				        [3,'双手插兜','258'],
				        [4,'无所谓','245'],
				        [5,'独孤求败','131'],
				        [6,'大白','123'],
				        [7,'小黑','99'],
				        [8,'白小蝶','72'],
				        [9,'百事通','66'],
				        [99,'墨棋之王','16'],
				    ]//在数组里的每一项中，第一个代表排名，第二个是用户名，第三个是积分
			}
		},
		methods: {
			
		}
	}
</script>

<style>
page{
    background-color: rgb(160, 159, 157);
}

/* 顶部标题 */
.title{
    width: 750rpx;
    height: 220rpx;
    text-align: center;
    line-height:220rpx;
    font-size: 60rpx;
    color: rgb(224, 224, 15);
}
.title image{
    position: absolute;
    left: 116rpx;
    top: 84rpx;
    z-index: -1;
    width: 500rpx;
    height: 200rpx;
}
/* 排行榜分类的标题 */
.pai{
    margin: 0 auto;
    padding-bottom: 8rpx;
    margin-top: 20rpx; 
    width: 570rpx;   
    text-align: center;
    color:rgb(224, 224, 15); 
}
.pai view{
    display:inline-block;
    width: 190rpx;
    font-size: 40rpx;
}

/* 排行列表 */
.center{
    margin: 0 auto;
    padding-bottom: 10rpx;
    width: 600rpx;
    border-radius: 14rpx;
    background-color: rgb(97, 94, 90);
    box-shadow: 1rpx 1rpx 4rpx 2rpx #474545;
}
.center>view{
    width: 570rpx;
    height: 80rpx;
    margin: 0 auto;
    color:#efefef;
    line-height: 80rpx;
    border-bottom: 2rpx solid #b9b7b7;
}
.center view image{
    width: 26px;
    height: 30px;
    margin-top: -6rpx;
    vertical-align: middle;
}
.center view view{
    display: inline-block;
}
.one{
   text-align: center;
    width: 190rpx;
    height: 80rpx;
}
.two{
    text-align: center;
    width: 190rpx;
    height: 80rpx;
}
.three{
    text-align: center;
    width: 190rpx;
    height: 80rpx;
}

/* 我的积分及排名 */
.person{
    width: 570rpx;
    height: 80rpx;
    margin: 0 auto;
    background-color: aqua;
    line-height: 80rpx;
    border-bottom: 2rpx solid #efefef;
}

</style>
