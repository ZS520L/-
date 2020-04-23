var RestApi = {

    webfindChatHistory: function(roomId) {
        var localStorageKey = 'room_' + roomId;
        var chatHistoryAsString = localStorage.getItem(localStorageKey);
        if (chatHistoryAsString != null) {
            var chatHistory = JSON.parse(chatHistoryAsString);
            return chatHistory;
        }
        return [];
    },

    webSveChatMessage : function(roomId, chatMessage) {
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
    },


    uniappSaveChatMessage:function(uni) {//uniapp缓存方式
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
    },

    uniappFindChatMessages:function(roomId) {//uniapp 查找缓存
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
};
