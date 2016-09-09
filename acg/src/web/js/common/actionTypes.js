/**
 * ...
 * @author minliang_1112@foxmail.com
 *
 * keyMirror可以帮助轻松创建与键值key相等的常量
 *
 */


import keyMirror from 'fbjs/lib/keyMirror';

export default keyMirror({
	
	ADD_TODO:null,//添加数据
	DELETE_TODO:null,//删除数据
	EDIT_TODO:null,//编辑数据
	COMPLETE_TODO:null,//数据完成
	COMPLETE_ALL:null,//数据集合完成
	CLEAR_COMPLETED:null,//清除数据

	LOG_IN:null,//用户登陆
	LOG_OUT:null,//用户登出
	THIRD_PARTY_LOG:null,//第三方登陆行为
	THIRD_PARTY_MOBILE_BIND:null,//第三方手机绑定行为
	GET_MSG_VAILD:null,//获取手机短信验证码
	REGISTER:null,//注册提交

	IMG_UPLOAD:null,//图片、封面、头像上传
	COMMIT_BTN:null, //保存 提交
	CANCEL_BTN:null,//取消
	SELECT_LINKAGE:null,//联动选择
	TAG_CHANGE:null,// 标签输入
	PREV_PAGE:null,//上一页
	NEXT_PAGE:null,//下一页
	SELECT_PAGE:null//页码选择
});


//等同于
//export const ADD_TODO = 'ADD_TODO'
//export const DELETE_TODO = 'DELETE_TODO'
//export const EDIT_TODO = 'EDIT_TODO'
//export const COMPLETE_TODO = 'COMPLETE_TODO'
//export const COMPLETE_ALL = 'COMPLETE_ALL'
//export const CLEAR_COMPLETED = 'CLEAR_COMPLETED'

