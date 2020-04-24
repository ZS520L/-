/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//引入方式随框架环境变化

import GoEasy from './goeasy-1.0.6';
import RestApi from './restapi.js';

function User(id, nickname, avatar) {
	this.id = id;
	this.nickname = nickname;
	this.avatar = avatar;
};

function ChatRoomService(user) {
	this.goeasy = null;

	this.initGoeasy(user);
	
	this.restapi = new RestApi();
}

/**
 * 初始化goeasy
 * @param {Object} user
 */
ChatRoomService.prototype.initGoeasy = function (user) {
	let self = this;
	this.goeasy = GoEasy({
		appkey : 'BC-ede22e1d66834d838fe1dee6709c4dc3',
		host : 'hangzhou.goeasy.io',
		userId : user.id,
		userData : '{"nickname":"' + user.nickname + '","avatar":"' + user.avatar + '"}',
		onConnected : function () {
			console.log( "GoEasy connect successfully.");
		},
		onDisconnected : function () {
			console.log("GoEasy disconnected.");
		},
		onConnectFailed : function () {
			console.log("GoEasy连接失败，请确认service.js文件appkey和host配置正确.")
		}
	})

};

/**
 * 装载在线用户数据
 * @param roomId
 * @param loadOnlineUserCallback
 */
ChatRoomService.prototype.loadOnlineUsers = function (roomId, onLoadOnlineUser) {
	this.goeasy.hereNow({
		channels : [roomId],
		includeUsers : true,
		distinct : true
	}, function (result) {
		if(result.code == 200) {
			let currentRoomOnlineUsers = result.content.channels[roomId];
			currentRoomOnlineUsers.users.forEach(function(onlineUser) {
				let userData = JSON.parse(onlineUser.data);
				onlieUsers.users.unshift(new User(onlineUser.id, userData.nickname, userData.avatar));
			});
			let onlieUsers = {
				users : currentRoomOnlineUsers,
				count : currentRoomOnlineUsers.clientAmount
			};
			onLoadOnlineUser(onlieUsers)
		}else {
			console.log("您还没有高级功能的权限，付费用户请联系GoEasy开通")
		}
	})
};

/**
 * 用户上下线
 * @param roomId
 * @param userOnlineCallback
 * @param userOfflineCallback
 */
ChatRoomService.prototype.listenUserOnlineOffline = function (roomId ,onUserOnline, onUserOffline) {
	this.goeasy.subscribePresence({
		channel : roomId,
		onPresence : function (presenceEvents) {
			let count = presenceEvents.clientAmount;
			presenceEvents.events.forEach(function(event) {
				//如果有用户进入聊天室
				if (event.action == "join" || event.action == "online") {
					let userData = JSON.parse(event.userData);
					let eventUser = new User(event.userId,userData.nickname,userData.avatar);
					onUserOnline(eventUser, count);
				} else {
					//todo:怪怪的
					let eventUser = new User(event.userId, "", "");
					onUserOffline(eventUser, count)
				}
			});
		},
		onSuccess : function () {
			console.log("监听成功")
		},
		onFailed : function (error) {
			console.log(error)
		}
	})
};

/**
 * 监听用户消息和道具
 * @param roomId
 * @param newMessageCallback
 * @param newPropCallback
 */
ChatRoomService.prototype.listenNewMessage = function (roomId, onNewMessage, onNewProp) {
	var self = this;
	this.goeasy.subscribe({
		channel: roomId,
		onMessage : function (message) {
			let content = JSON.parse(message.content);
			if(content.type == 0) {
				self.restapi.saveChatMessage(roomId, content);
				onNewMessage(content)
			}
			if(content.type == 1) {
				onNewProp(content)
			}
		},
		onSuccess : function () {
			console.log("监听成功")
		},
		onFailed : function(error) {
			console.log('订阅失败')
		}
	})
};

/**
 * 装载用户消息
 * @param roomId
 */
ChatRoomService.prototype.loadChatMessages = function (roomId) {
	return this.restapi.findChatHistory(roomId).reverse();
};

/**
 * 发送消息
 * @param roomId
 * @param sendSuccessCallBack
 */
ChatRoomService.prototype.sendMessages = function (roomId, message) {
	this.goeasy.publish({
		channel : roomId,
		message : JSON.stringify(message),
		onSuccess : function () {
			console.log("发送成功")
		},
		onFailed : function (error) {
			console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
		}
	})
};

/**
 * 退出聊天室
 * @param roomId
 */
ChatRoomService.prototype.quitRoom = function (roomId) {
	this.unsubscribe(roomId)
	this.unsubscribePresence(roomId)
	this.goeasy.disconnect()
};

/**
 * 取消订阅
 * @param roomId
 */
ChatRoomService.prototype.unsubscribe = function (roomId) {
	this.goeasy.unsubscribe({
		channel: roomId,
		onSuccess: function() {
			console.log("订阅取消成功。");
		},
		onFailed: function(error) {
			console.log("取消订阅失败，错误编码：" + error.code + " 错误信息：" + error.content)
		}
	});
};

/**
 * 取消监听
 * @param roomId
 */
ChatRoomService.prototype.unsubscribePresence = function (roomId) {
	this.goeasy.unsubscribePresence({
		channel: roomId,
		onSuccess: function () {
			console.log("Presence取消成功。");
		},
		onFailed : function (error) {
			console.log("Presence取消失败，错误编码：" + error.code + " 错误信息：" + error.content)
		}
	})
};

export default ChatRoomService;

