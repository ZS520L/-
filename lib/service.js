/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//引入方式随框架环境变化
const Goeasy  = require('./goeasy-1.0.6');

var MyService = (function () {
	
	function User(id, nickname, avatar) {
	    this.id = id;
	    this.nickname = nickname;
	    this.avatar = avatar;
	}
	
	function MyService(config,callback) {
	
	    this.goeasy = null;
	    this.config = config;
		
	    this.onConnectFailed = function () {
	        console.log("GoEasy连接失败，请确认service.js文件70行appkey和host配置正确.")
	    };
	
	    this.onHereNowSuccess = function () {};
	
	    this.onHereNowFailed = function () {};
	
	    this.onPresenceOnline = function () {};
	
	    this.onPresenceOffline = function () {};
	
	    this.onPresenceFailed = function () {
	        console.log("监听失败")
	    };
	
	    this.saveChatMessage = saveChatMessage;
	
	    this.findChatMessage = findChatMessage;
	
	    this.onMessageSuccess = function () {};
	
	    this.onPublishSuccess = function () {
	        console.log("发送成功")
	    };
	
	    initCallBack(this, callback)
	}
	
	/**
	 * 初始化goeasy
	 * @param {Object} user
	 */
	MyService.prototype.initGoeasy = function (user) {
		this.goeasy = Goeasy({
			host : this.config.host,
			appkey : this.config.appkey,
			userId : user.id,
			userData : '{"nickname":"' + user.nickname + '","avatar":"' + user.avatar + '"}',
			onConnected : function () {
				console.log( "GoEasy connect successfully.");
			},
			onDisconnected : function () {
				console.log("GoEasy disconnected.");
			},
			onConnectFailed : this.onConnectFailed
		})
	};
	
	/**
	 * 初始化在线用户
	 * @param {Object} roomId
	 */
	MyService.prototype.initialOnlineUsers = function(roomId) {
		let self = this;
		this.goeasy.hereNow({
			channels : [roomId],
			includeUsers : true,
			distinct : true
		}, function (result) {
			let obj = {
				onlineUsers : [],
				onlineUserCount : 0
			};
			if(result.code == 200) {
				//todo 多个roomId处理方式更多
				let currentRoomOnlineUsers = result.content.channels[roomId];
				currentRoomOnlineUsers.users.forEach(function(onlineUser) {
					let userData = JSON.parse(onlineUser.data);
					obj.onlineUsers.unshift({
						userId : onlineUser.id,
						nickname :userData.nickname,
						avatar : userData.avatar
					});
				});
				obj.onlineUserCount = currentRoomOnlineUsers.clientAmount;
				self.onHereNowSuccess(obj)
			}else {
				self.onHereNowFailed(result.code)
			}
		})
	};
	
	/**
	 * 监听用户上下线时间，维护onlineUsers对象
	 * @param {Object} roomId
	 */
	MyService.prototype.subscriberPresence = function (roomId) {
		let self = this;
		this.goeasy.subscribePresence({
			channel : roomId,
			onPresence : function (presenceEvents) {
				let obj = {
					onlineUserCount : 0,
					onlineUser : null
				};
				obj.onlineUserCount = presenceEvents.clientAmount;
				presenceEvents.events.forEach(function(event) {
					//如果有用户进入聊天室
					if (event.action == "join" || event.action == "online") {
						let userData = JSON.parse(event.userData);
						//将新用户加入onlineUsers列表
						obj.onlineUser = new User(event.userId,userData.nickname,userData.avatar);
						self.onPresenceOnline(obj);
					} else {
						self.onPresenceOffline(event.userId)
					}
				});
			},
			onSuccess : function () {
				console.log("监听成功")
			},
			onFailed : function () {
				self.onPresenceFailed()
			}
		})
	};
	
	/**
	 * 监听消息或道具
	 * @param {Object} roomId
	 */
	MyService.prototype.subscriberNewMessage = function (roomId) {
		let self = this;
		this.goeasy.subscribe({
			channel: roomId,
			onMessage : function (message) {
				let chatMessage = JSON.parse(message.content);
				self.saveChatMessage(roomId, message);
				self.onMessageSuccess(chatMessage);
			}
		})
	};
	
	/**
	 * 发布消息
	 * @param {Object} roomId
	 * @param {Object} message
	 */
	MyService.prototype.publish = function (roomId, message) {
		this.goeasy.publish({
			channel : roomId,
			message : JSON.stringify(message),
			onSuccess : this.onPublishSuccess,
			onFailed : function (error) {
				console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
			}
		})
	};
	
	/**
	 * 取消监听
	 * @param {Object} roomId
	 */
	MyService.prototype.unsubscribePresence = function (roomId) {
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
	
	/**
	 * 断开连接
	 */
	MyService.prototype.disconnect = function () {
		this.goeasy.disconnect()
	}
	
	/**
	 * 查询聊天历史
	 * @param roomId
	 * @returns {*[]|any}
	 */
	function findChatMessage (roomId) {
	    let localStorageKey = 'room_' + roomId;
	    let chatHistoryAsString = localStorage.getItem(localStorageKey);
	    if (chatHistoryAsString != null) {
	        let chatHistory = JSON.parse(chatHistoryAsString);
	        return chatHistory;
	    }
	    return [];
	};
	
	/**
	 * 保存聊天信息
	 * @param roomId
	 * @param chatMessage
	 */
	function saveChatMessage (roomId, chatMessage) {
	    let localStorageKey = 'room_' + roomId;
	    let chatHistoryAsString = localStorage.getItem(localStorageKey);
	    let chatHistory;
	    if (chatHistoryAsString == null || chatHistoryAsString == "") {
	        chatHistory = [];
	    } else {
	        chatHistory = JSON.parse(chatHistoryAsString);
	    }
	    chatHistory.push(chatMessage);
	    chatHistoryAsString = JSON.stringify(chatHistory);
	    localStorage.setItem(localStorageKey, chatHistoryAsString);
	};
	
	/**
	 * 初始化回调
	 * @param ge
	 * @param callback
	 */
	function initCallBack(ge, callback) {
	    if(callback) {
	        for(let key in callback) {
	            if(typeof callback[key] != 'function') {
	                console.error(key.toString() + ' is not function')
	            }else{
	                ge[key] = callback[key];
	            }
	        }
	    }
	};
	
	return MyService
})()

module.exports = MyService

