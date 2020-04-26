/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//引入方式随框架环境变化

const GoEasy = require("./goeasy-1.0.7");
const RestApi = require("./restapi.js");

/**
 * 用户
 * @param {Object} id
 * @param {Object} nickname
 * @param {Object} avatar
 */
function User(id, nickname, avatar) {
	this.id = id;
	this.nickname = nickname;
	this.avatar = avatar;
};

/**
 * 消息
 * @param {Object} senderUserId
 * @param {Object} senderNickname
 * @param {Object} content
 */
function Message (senderUserId, senderNickname, content, type) {
	this.senderNickname = senderNickname;
	this.senderUserId = senderUserId;
	this.content = content;
	this.type = type
}

/**
 * 聊天室
 * @param {Object} id
 * @param {Object} currentUser
 */
function Room (id, currentUser) {
	
	this.id = id;
	this.currentUser = currentUser;
	
	this.onlineUsers = {
		count : 0,
		users : []
	};

	this.messages = [];
	
	this.MessageType = {
		CHAT: 0,//文字聊天
		PROP: 1//道具
	};
	
	this.Prop = {
		HEART: 0,//桃心
		ROCKET: 1//火箭
	};	
}

function ChatRoomService(roomId, user , whenNewMessage) {
	
	this.goeasy = null;

	this.restapi = new RestApi();
	
	this.room = new Room(roomId, user);
	
	this.whenNewMessage = whenNewMessage;
	
	this.initGoeasy(user);
}

/**
 * 初始化goeasy
 * @param {Object} user
 */
ChatRoomService.prototype.initGoeasy = function (user) {
	let self = this;
	this.goeasy = GoEasy({
		appkey : '您的appkey',
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
			console.log("GoEasy连接失败，请确认chatRoomService.js文件appkey和host配置正确")
		}
	})

	this.loadOnlineUsers(this.room.id);
	this.listenUserOnlineOffline(this.room.id);
	this.listenNewMessage(this.room.id);
	
	this.room.messages = this.loadChatMessages();
};

/**
 * 装载在线用户数据
 * @param roomId
 * @param loadOnlineUserCallback
 */
ChatRoomService.prototype.loadOnlineUsers = function (roomId) {
	let self = this;
	this.goeasy.hereNow({
		channels : [roomId],
		includeUsers : true,
		distinct : true
	}, function (result) {
		if(result.code == 200) {
			let currentRoomOnlineUsers = result.content.channels[roomId];
			let users = [];
			currentRoomOnlineUsers.users.forEach(function(onlineUser) {
				let userData = JSON.parse(onlineUser.data);
				let user = new User(onlineUser.id, userData.nickname, userData.avatar);
				users.unshift(user);
			});
			self.room.onlineUsers = {
				users:users,
				count : currentRoomOnlineUsers.clientAmount
			};
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
ChatRoomService.prototype.listenUserOnlineOffline = function (roomId) {
	let self = this;
	this.goeasy.subscribePresence({
		channel : roomId,
		onPresence : function (presenceEvents) {
			self.room.onlineUsers.count = presenceEvents.clientAmount;
			presenceEvents.events.forEach(function(event) {
				if (event.action == "join" || event.action == "online") {//进入房间
					let userData = JSON.parse(event.userData);
					//添加新用户
					let user = new User(event.userId, userData.nickname, userData.avatar);
					self.room.onlineUsers.users.unshift(user);
					//添加进入房间的消息
					let message = new Message(event.userId, userData.nickname, " 进入房间", self.room.MessageType.CHAT);
					self.room.messages.push(message);
					self.whenNewMessage(message);
				} else {//退出房间
					let offlineUserIndex = self.room.onlineUsers.users.findIndex(item => item.id == event.userId);
					if(offlineUserIndex>-1) {
						//将离开的用户从onlineUsers中删掉
						let offlineUser = Object.assign(self.room.onlineUsers.users[offlineUserIndex]);
						//添加离开消息
						let message = new Message(offlineUser.id, offlineUser.nickname, " 退出房间", self.room.MessageType.CHAT)
						self.room.onlineUsers.users.splice(offlineUserIndex, 1);
						self.room.messages.push(message);
						self.whenNewMessage(message);
					}
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
ChatRoomService.prototype.listenNewMessage = function (roomId) {
	var self = this;
	this.goeasy.subscribe({
		channel: roomId,
		onMessage : function (message) {
			let content = JSON.parse(message.content);
			let messageContent = "";
			//聊天消息
			if(content.type == self.room.MessageType.CHAT) {
				self.restapi.saveChatMessage(roomId, content);
				messageContent = content.content;
			}
			//道具消息
			if(content.type == self.room.MessageType.PROP) {
				if (content.content == self.room.Prop.ROCKET) {
					messageContent = "送出了一枚大火箭";
				}
				if (content.content == self.room.Prop.HEART) {
					messageContent = "送出了一个大大的比心";
				}
			}
			//添加消息
			let newMessage = new Message(content.senderUserId, content.senderNickname, messageContent);
			self.room.messages.push(newMessage);
			//收到消息以后的监听器
			self.whenNewMessage(content)
		},
		onFailed : function() {
			console.log("订阅失败。")
		}
	})
};

/**
 * 装载用户消息
 * @param roomId
 */
ChatRoomService.prototype.loadChatMessages = function () {
	return this.restapi.findChatHistory(this.room.id).reverse();
};

/**
 * 发送消息
 * @param roomId
 * @param message
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

module.exports = ChatRoomService;

