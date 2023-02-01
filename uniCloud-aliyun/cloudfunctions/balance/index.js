'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	var res = false;
	if (event.mode){
		res=await db.collection('balance').get();
	}
	else{
		res=await db.collection('balance').update({
			black:event.newblack,
			white:event.newwhite
		});
	}
	//返回数据给客户端
	return res
};
