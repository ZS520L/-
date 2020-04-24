<template>
    <view class="chat-room">
        <view class="online-avatar-container">
            <view class="online-avatar-item" v-for="(user, key) in room.onlineUsers.users" :key="key"
                  :style="realignAvatar(key)">
                <image :src="user.avatar"></image>
            </view>
            <view class="online-count">{{room.onlineUsers.count}}</view>
        </view>
        <view class="chat-room-container">
            <scroll-view class="chat-room-box" scroll-y="true" :scroll-into-view="contentPosition"
                         show-scrollbar="true">
                <view class="message-box" v-for="(message, key) in room.messages" :key="key" :id="'message-box'+ key">
                    <view class="message-item">
                        <text class="user-name">{{message && message.senderNickname}}:</text>
                        <text :class="message.senderUserId == room.currentUser.id ? 'user-message self' : 'user-message' ">
                            {{message && message.content}}
                        </text>
                    </view>
                </view>
            </scroll-view>
            <view class="chat-room-input">
                <view style="position: relative;">
                    <input class="uni-input" :value="newMessageContent" placeholder="说点什么..." @input="onInputMessage"/>
                    <view class="uni-btn" @click="sendMessage(room.MessageType.CHAT, newMessageContent)">↑</view>
                </view>
                <image class="heart" @click="sendMessage(room.MessageType.PROP, room.Prop.HEART)"
                       src="../../../static/images/handle-heart.png"></image>
                <image class="rocket" @click="sendMessage(room.MessageType.PROP, room.Prop.ROCKET)"
                       src="../../../static/images/rokect.png"></image>
            </view>
        </view>
        <view class="show-animation" v-if="prop.play">
            <image class="prop-heart" v-for="(value, key) in 4" :key="key" src="../../../static/images/heart.png"
                   v-if="prop.showPropType == room.Prop.HEART"></image>
            <image class="prop-rocket" src="../../../static/images/rokect.png"
                   v-if="prop.showPropType == room.Prop.ROCKET"></image>
        </view>
    </view>
</template>

<script>
    import ChatRoomService from '../../../lib/chatroomservice.js';

    export default {
        data() {
            return {
                room: null,
                prop: {
                    showPropType: 0,
                    play: false,
                    timer: null
                },
                newMessageContent: "",
                contentPosition: '',
                chatRoomService: null

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

            //当前用户
            var currentUser = {
                id: roomToken.userId,
                nickname: roomToken.nickname,
                avatar: roomToken.avatar
            };

            //构造chatRoomService
            this.chatRoomService = new ChatRoomService(roomToken.roomId, currentUser, this.whenNewMessage);

            //获取当前聊天室数据
            this.room = this.chatRoomService.room;

        },
        onBackPress() {//返回按钮
            //断开连接
            this.chatRoomService.quitRoom(this.roomId);
        },
        methods: {

            realignAvatar(key) {//排列头像
                return {
                    right: key * 54 + 108 + 'rpx',
                    zIndex: 100 - key
                }
            },
            onInputMessage(event) {//双向绑定消息 兼容
                this.newMessageContent = event.target.value;
            },
            whenNewMessage(message) {//新消息监听
                if (message.type == this.room.MessageType.PROP) {
                    this.propAnimation(parseInt(message.content))
                }
                setTimeout(() => {
                    this.contentPosition = 'message-box' + (this.room.messages.length - 1);
                }, 300)
            },
            sendMessage(messageType, content) {//发送消息

                if (content == "" && messageType == this.room.MessageType.CHAT) return;
                var message = {
                    senderNickname: this.room.currentUser.nickname,
                    senderUserId: this.room.currentUser.id,
                    type: messageType,
                    content: content
                }
                this.chatRoomService.sendMessages(this.room.id, message);
                this.newMessageContent = "";
            },
            propAnimation(type) {//道具动画
                //动画的实现，可以不用关心
                if (this.prop.timer) {
                    return;
                }
                ;
                this.prop.showPropType = type;
                this.prop.play = true;
                this.prop.timer = setTimeout(() => {
                    this.prop.play = false;
                    this.prop.timer = null;
                }, 2000)
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
        height: 100%;;
    }

    .online-avatar-container {
        height: 80 rpx;
        display: flex;
        justify-content: flex-end;
        padding: 28 rpx;
        box-shadow: 10 rpx 30 rpx 50 rpx #fff;
        z-index: 40;
        position: relative;
    }

    .online-avatar-item {
        width: 80 rpx;
        height: 80 rpx;
        border-radius: 40 rpx;
        text-align: center;
        line-height: 80 rpx;
        background: rgba(51, 51, 51, 0.3);
        color: #fff;
        font-size: 18 rpx 28 rpx;
        position: absolute;
    }

    .online-count {
        width: 80 rpx;
        height: 80 rpx;
        border-radius: 40 rpx;
        text-align: center;
        line-height: 80 rpx;
        background: rgba(51, 51, 51, 0.3);
        color: #fff;
        font-size: 28 rpx;
    }

    .online-avatar-item image {
        width: 80 rpx;
        height: 80 rpx;
    }

    .chat-room-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .chat-room-box {
        flex: 1;
        padding: 10 rpx 38 rpx;
        overflow: auto;
        padding-top: 20 rpx;
        box-sizing: border-box;
    }

    .message-box {
        margin-top: 16 rpx;
    }

    .message-item {
        box-sizing: border-box;
        height: 72 rpx;
        background-color: rgba(196, 196, 196, 0.2);
        display: inline-block;
        font-size: 28 rpx;
        border-radius: 100 rpx;
        padding: 18 rpx 30 rpx;
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
        height: 92 rpx;
        line-height: 92 rpx;
        padding: 28 rpx;
        display: flex;
    }

    .uni-input {
        width: 528 rpx;
        background-color: rgba(51, 51, 51, 0.1);
        height: 92 rpx;
        border-radius: 100 rpx;
        box-sizing: border-box;
        padding: 26 rpx 40 rpx;
        font-size: 28 rpx;
    }

    .uni-btn {
        position: absolute;
        width: 72 rpx;
        height: 72 rpx;
        background: #D02129;
        right: 10 rpx;
        top: 10 rpx;
        border-radius: 72 rpx;
        text-align: center;
        line-height: 72 rpx;
        color: #fff;
        font-weight: bold;
        font-size: 32 rpx;
    }

    .heart {
        width: 80 rpx;
        height: 92 rpx;
        padding: 0 15 rpx;
    }

    .rocket {
        width: 40 rpx;
        height: 92 rpx;
    }

    .self {
        color: #D02129;
    }

    .show-animation {
        width: 80 rpx;
        height: 320 rpx;
        position: fixed;
        z-index: 44;
        left: 50%;
        bottom: 80 rpx;
        margin: 0 -40 rpx;
        justify-content: flex-end;
        animation: myanimation 2s linear;
    }

    .prop-heart {
        height: 80 rpx;
        width: 80 rpx;
    }

    .prop-rocket {
        height: 160 rpx;
        width: 80 rpx;
    }

    @keyframes myanimation {
        from {
            bottom: 80 rpx;
        }
        to {
            bottom: 600 rpx;
        }
    }

</style>
