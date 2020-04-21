/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//引入方式随框架环境变化
const Goeasy  = require('./goeasy-1.0.6');

var MyService = (function () {
	const geDefaultCfg = {
	    host : "hangzhou.goeasy.io",
	    appkey : "您的key"
	};
	
	function GeConfig(config) {
	    this.appkey = config.appkey;
	    this.host = config.host;
	}
	
	function User(id, nickname, avatar) {
	    this.id = id;
	    this.nickname = nickname;
	    this.avatar = avatar;
	}
	
	function MyService(config,callback) {
	
	    this.goeasy = null;
	    this.config = null;
	
	    this.onConnected = function () {
	        console.log( "GoEasy connect successfully.");
	    };
	    this.onDisconnected = function () {
	        console.log("GoEasy disconnected.");
	    };
	    this.onConnectFailed = function () {
	        console.log("GoEasy连接失败，请确认service.js文件70行appkey和host配置正确.")
	    };
	
	    this.onHereNowSuccess = function () {};
	
	    this.onHereNowFailed = function () {};
	
	    this.onPresenceOnline = function () {};
	
	    this.onPresenceOffline = function () {};
	
	    this.onPresenceSuccess = function () {
	        console.log("监听成功")
	    };
	
	    this.onPresenceFailed = function () {
	        console.log("监听失败")
	    };
	
	    this.saveChatMessage = saveChatMessage;
	
	    this.findChatMessage = findChatMessage;
	
	    this.onMessageSuccess = function () {};
	
	    this.onPublishSuccess = function () {
	        console.log("发送成功")
	    };
	
	    this.onPublishFailed = function (error) {
	        console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
	    };
	
	    this.unsubscribeSuccess = function () {};
	
	    this.unsubscribeFailed = function () {};
	
	    this.unsubscribePresenceSuccess = function () {
	        console.log("Presence取消成功。");
	    };
	
	    this.unsubscribePresenceFailed = function (error) {
	        console.log("Presence取消失败，错误编码：" + error.code + " 错误信息：" + error.content)
	    };
	
	    initConfig(this, config)
	
	    initCallBack(this, callback)
	}
	
	MyService.prototype = {
		initGoeasy : function (user) {
			this.goeasy = Goeasy({
			    host : this.config.host,
			    appkey : this.config.appkey,
			    userId : user.id,
			    userData : '{"nickname":"' + user.nickname + '","avatar":"' + user.avatar + '"}',
			    onConnected : this.onConnected,
			    onDisconnected : this.onDisconnected,
			    onConnectFailed : this.onConnectFailed
			})
		},
		initialOnlineUsers : function(roomIds, includeUsers = true, distinct = true) {
			let self = this;
			this.goeasy.hereNow({
			    channels : roomIds,
			    includeUsers : includeUsers,
			    distinct : distinct
			}, function (result) {
			    let obj = {
			        onlineUsers : [],
			        onlineUserCount : 0
			    };
			    if(result.code == 200) {
					//todo 多个roomId处理方式更多
			        let currentRoomOnlineUsers = result.content.channels[roomIds[0]];
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
		},
		subscriberPresence : function (roomId) {
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
			        self.onPresenceSuccess()
			    },
			    onFailed : function () {
			        self.onPresenceFailed()
			    }
			})
		},
		subscriberNewMessage : function (roomId) {
			let self = this;
			this.goeasy.subscribe({
			    channel: roomId,
			    onMessage : function (message) {
			        let chatMessage = JSON.parse(message.content);
					console.log(typeof chatMessage)
			        self.saveChatMessage(roomId, message);
			        self.onMessageSuccess(chatMessage);
			    }
			})
		},
		publish : function (roomId, message) {
			this.goeasy.publish({
			    channel : roomId,
			    message : JSON.stringify(message),
			    onSuccess : this.onPublishSuccess,
			    onFailed : this.onPublishFailed
			})
		},
		unsubscribe : function (roomId) {
			this.goeasy.unsubscribe({
			    channel : roomId,
			    onSuccess : this.unsubscribeSuccess,
			    onFailed : this.unsubscribeFailed
			})
		},
		unsubscribePresence : function (roomId) {
			this.goeasy.unsubscribePresence({
			    channel: roomId,
			    onSuccess: this.unsubscribePresenceSuccess,
			    onFailed : this.unsubscribePresenceFailed
			})
		},
		disconnect : function () {
			this.goeasy.disconnect()
		}
		
	}
	
	// MyService.prototype.initGoeasy = function (user) {
	//     initGoeasy(this, user);
	// };
	
	// MyService.prototype.initialOnlineUsers = function (roomIds, includeUsers = true, distinct = true) {
	//     initialOnlineUsers(this, roomIds, includeUsers, distinct)
	// };
	
	// MyService.prototype.subscriberPresence = function (roomId) {
	//     subscriberPresence(this, roomId)
	// };
	
	// MyService.prototype.subscriberNewMessage = function (roomId) {
	//     subscriberNewMessage(this, roomId)
	// };
	
	// MyService.prototype.publish = function (roomId, message) {
	//     publish(this, roomId, message)
	// };
	
	// MyService.prototype.unsubscribe = function (roomId) {
	//     unsubscribe(this, roomId)
	// };
	
	// MyService.prototype.unsubscribePresence = function (roomId) {
	//     unsubscribePresence(roomId)
	// };
	
	// MyService.prototype.disconnect = function () {
	//     this.goeasy.disconnect()
	// }
	
	/**
	 * 初始化
	 * @param ge
	 * @param user
	 */
	// function initGoeasy(ge, user) {
	//     ge.goeasy = Goeasy({
	//         host : ge.config.host,
	//         appkey : ge.config.appkey,
	//         user Id : user.id,
	//         userData : '{"nickname":"' + user.nickname + '","avatar":"' + user.avatar + '"}',
	//         onConnected : ge.onConnected,
	//         onDisconnected : ge.onDisconnected,
	//         onConnectFailed : ge.onConnectFailed
	//     })
	// }
	
	/**
	 * 初始化在线用户
	 * @param ge
	 * @param roomIds
	 * @param includeUsers
	 * @param distinct
	 */
	// function initialOnlineUsers(ge, roomIds, includeUsers, distinct){
	//     ge.goeasy.hereNow({
	//         channels : roomIds,
	//         includeUsers : includeUsers,
	//         distinct : distinct
	//     }, function (result) {
	//         let obj = {
	//             onlineUsers : [],
	//             onlineUserCount : 0
	//         };
	//         if(result.code == 200) {
	//             let currentRoomOnlineUsers = result.content.channels[roomIds[0]];
	//             currentRoomOnlineUsers.users.forEach(function(onlineUser) {
	//                 let userData = JSON.parse(onlineUser.data);
	//                 obj.onlineUsers.unshift({
	//                     userId : onlineUser.id,
	//                     nickname :userData.nickname,
	//                     avatar : userData.avatar
	//                 });
	//             });
	//             obj.onlineUserCount = currentRoomOnlineUsers.clientAmount;
	//             ge.onHereNowSuccess(obj)
	//         }else {
	//             ge.onHereNowFailed(result.code)
	//         }
	//     })
	// }
	
	/**
	 * 监听用户上下线
	 * @param ge
	 * @param roomId
	 */
	// function subscriberPresence(ge, roomId) {
	//     ge.goeasy.subscribePresence({
	//         channel : roomId,
	//         onPresence : function (presenceEvents) {
	//             let obj = {
	//                 onlineUserCount : 0,
	//                 onlineUser : null
	//             };
	//             obj.onlineUserCount = presenceEvents.clientAmount;
	//             presenceEvents.events.forEach(function(event) {
	//                 //如果有用户进入聊天室
	//                 if (event.action == "join" || event.action == "online") {
	//                     let userData = JSON.parse(event.userData);
	//                     //将新用户加入onlineUsers列表
	//                     obj.onlineUser = new User(event.userId,userData.nickname,userData.avatar);
	//                     ge.onPresenceOnline(obj);
	//                 } else {
	//                     ge.onPresenceOffline(event.userId)
	//                 }
	//             });
	//         },
	//         onSuccess : function () {
	//             ge.onPresenceSuccess()
	//         },
	//         onFailed : function () {
	//             ge.onPresenceFailed()
	//         }
	//     })
	// }
	
	/**
	 * 监听消息
	 * @param ge
	 * @param roomId
	 */
	// function subscriberNewMessage(ge, roomId) {
	//     ge.goeasy.subscribe({
	//         channel: roomId,
	//         onMessage : function (message) {
	//             let chatMessage = JSON.parse(message.content);
	//             ge.saveChatMessage(roomId, message);
	//             ge.onMessageSuccess(chatMessage);
	//         }
	//     })
	// }
	
	/**
	 * 发布消息
	 * @param ge
	 * @param roomId
	 * @param message
	 */
	// function publish(ge, roomId, message) {
	//     ge.goeasy.publish({
	//         channel : roomId,
	//         message : JSON.stringify(message),
	//         onSuccess : ge.onPublishSuccess,
	//         onFailed : ge.onPublishFailed
	//     })
	// }
	
	/**
	 * 取消订阅
	 * @param ge
	 * @param roomId
	 */
	// function unsubscribe(ge, roomId) {
	//     ge.goeasy.unsubscribe({
	//         channel : roomId,
	//         onSuccess : ge.unsubscribeSuccess,
	//         onFailed : ge.unsubscribeFailed
	//     })
	// }
	
	/**
	 * 取消监听
	 * @param ge
	 * @param roomId
	 */
	// function unsubscribePresence(ge, roomId) {
	//     ge.goeasy.unsubscribePresence({
	//         channel: roomId,
	//         onSuccess: ge.unsubscribePresenceSuccess,
	//         onFailed : ge.unsubscribePresenceFailed
	//     })
	// }
	
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
	
	/**
	 * 初始化配置
	 * @param ge
	 * @param config
	 */
	function initConfig(ge, config) {
	    const cfg = new GeConfig(geDefaultCfg);
	    if(config != null) {
	        if(config.host) {
	            cfg.host = config
	        }
	        if(config.appkey) {
	            cfg.appkey = config.appkey
	        }
	    }
	    ge.config = cfg;
	};
	
	return MyService
})()

module.exports = MyService

