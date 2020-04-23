function RestApi () {
	
}

RestApi.prototype.findChatHistory = function(roomId) {
	return this.uniappFindChatMessages(roomId)
};
	
RestApi.prototype.saveChatMessage = function (roomId,chatMessage) {
	return this.uniappSaveChatMessage(roomId, chatMessage)
};

RestApi.prototype.toast = function(msg, duration) {
	let message = msg ? msg : '您还没有高级功能的权限，付费用户请联系GoEasy开通';
	this.uniToast(msg, showToast)
};

RestApi.prototype.uniToast = function(message, duration) {
	uni.showToast({
	    title: message,
	    duration: duration,
		icon : false
	});
};

RestApi.prototype.webfindChatHistory= function(roomId) {
	var localStorageKey = 'room_' + roomId;
	var chatHistoryAsString = localStorage.getItem(localStorageKey);
	if (chatHistoryAsString != null) {
		var chatHistory = JSON.parse(chatHistoryAsString);
		return chatHistory;
	}
	return [];
};

RestApi.prototype.webSaveChatMessage = function(roomId, chatMessage) {
	var localStorageKey = 'room_' + roomId;
	var chatHistoryAsString = localStorage.getItem(localStorageKey);
	var chatHistory;
	if (chatHistoryAsString == null || chatHistoryAsString == "") {
		chatHistory = [];
	} else {
		chatHistory = JSON.parse(chatHistoryAsString);
	}
	chatHistory.push(chatMessage);
	chatHistoryAsString = JSON.stringify(chatHistory);
	localStorage.setItem(localStorageKey, chatHistoryAsString);
};


RestApi.prototype.uniappSaveChatMessage=function(roomId,chatMessage) {//uniapp缓存方式
	let localStorageKey = 'room_' + roomId;
	let arr = [];
	try {
		const jsonStr = uni.getStorageSync(localStorageKey);
		if (jsonStr) {
			arr = [chatMessage,...JSON.parse(jsonStr)]
		}
		uni.setStorageSync(localStorageKey,JSON.stringify(arr))
	}catch(e) {
		console.log(e)
	}
};

RestApi.prototype.uniappFindChatMessages=function(roomId) {//uniapp 查找缓存
	let localStorageKey = 'room_' + roomId;
	let arr = [];
	try{
		var jsonStr = uni.getStorageSync(localStorageKey);
		if(jsonStr){
			arr = JSON.parse(jsonStr)
		}
	}catch(e) {
		console.log(e)
	}
	return arr;
}

module.exports = RestApi;
