'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	let {roomId}=event;
	let res=await db.collection(event.roomId).get();
	//返回数据给客户端
	return res
};
