/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//引入方式随框架环境变化

const GoEasy = require("./goeasy-1.0.6");
const RestApi = require("./newRestApi.js");

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
 */
function Message (senderUserId, senderNickname, content) {
	this.senderNickname = senderNickname;
	this.senderUserId = null;
	this.content = content;

}

/**
 * 聊天室
 */
function Room (id, currentUser) {
	
	this.id = id;
	this.currentUser = currentUser;
	
	this.onlineUsers = {
		count : 0,
		users : []
	};
	this.prop = {
		received : false,
		type : 0  //0 表示心  1 表示火箭
	};
	this.messages = [];
	
}

function ChatRoomService(roomId, user) {
	this.goeasy = null;

	this.restapi = new RestApi();
	
	this.room = new Room(roomId, user);
	
	this.initGoeasy(user);
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
			this.restapi.toast("GoEasy连接失败，请确认service.js文件35行appkey和host配置正确.",  6000)
		}
	})

	this.loadOnlineUsers(this.room.id);
	this.listenUserOnlineOffline(this.room.id);
	this.listenNewMessage(this.room.id);
};

/**
 * 装载在线用户数据
 * @param roomId
 * @param loadOnlineUserCallback
 */
ChatRoomService.prototype.loadOnlineUsers = function (roomId, onLoadOnlineUser) {
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
				users.unshift(new User(onlineUser.id, userData.nickname, userData.avatar));
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
ChatRoomService.prototype.listenUserOnlineOffline = function (roomId ,onUserOnline, onUserOffline) {
	let self = this;
	this.goeasy.subscribePresence({
		channel : roomId,
		onPresence : function (presenceEvents) {
			self.room.onlineUsers.count = presenceEvents.clientAmount;
			presenceEvents.events.forEach(function(event) {
				//如果有用户进入聊天室
				if (event.action == "join" || event.action == "online") {
					let userData = JSON.parse(event.userData);
					//添加新用户
					let user = new User(event.userId,userData.nickname,userData.avatar);
					self.room.onlineUsers.users.push(user);
					//添加进入房间的消息
					let message = new Message(event.userId,userData.nickname, " 进入房间");
					self.room.messages.push(message);
				} else {
					let offlineUserIndex = self.room.onlineUsers.users.findIndex(item => item.id == event.id);
					if(offlineUserIndex>-1) {
						//将离开的用户从onlineUsers中删掉
						let offlineUser = Object.assign(self.room.onlineUsers.users[offlineUserIndex]);
						self.room.onlineUsers.users.splice(offlineUserIndex, 1);
						//添加离开消息
						let message = new Message(offlineUser.senderUserId,offlineUser.senderNickname, " 退出房间")
						this.room.messages.push(message);
					}
				}
			});
		},
		onSuccess : function () {
			console.log("监听成功")
		},
		onFailed : function (error) {
			console.log(error)
			console.log("您还没有高级功能的权限，付费用户请联系GoEasy开通")
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
				//添加一条消息
				let newMessage = new Message(content.senderUserId, content.senderNickname, content.content);
				self.room.messages.push(newMessage);
				
				//todo 副作用代码 如何处理  
			}
			if(content.type == 1) {
				let newMessage = null;
				if (content.content == 1) {
					// this.propAnimation.call(res,'rocket')
					newMessage = new Message(content.senderUserId, content.senderNickname, "送出了一枚大火箭");
				}
				if (content.content == 0) {
					// this.propAnimation.call(this,'heart')
					//todo 动画代码 
					newMessage = new Message(content.senderUserId, content.senderNickname, "送出了一个大大的比心");
				}
				self.room.messages.push(newMessage);
			}
		},
		onFailed : function() {
			console.log("您还没有高级功能的权限，付费用户请联系GoEasy开通")
		}
	})
};

/**
 * 装载用户消息
 * @param roomId
 */
ChatRoomService.prototype.loadChatMessages = function () {
	//todo 装载用户消息 是否为loadHistoryMessage
	return this.restapi.findChatHistory(this.room.id).reverse();
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

module.exports = ChatRoomService;

