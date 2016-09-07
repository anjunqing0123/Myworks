/**
 * 个人中心修改信息
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
	//需要重新验证正确性
	var $ = require('zepto'),
		loader = require('./../../../util/loader/loader'),
		edit = require('./edit'),
		alertBox = require('./../../../util/log/alertBox')
	;
	var person = {};
	person.config = {
		personalSpace   :  'http://api.chang.pptv.com/api/personalSpace', //获取参赛者个人空间信息接口
		sign            :  'http://api.chang.pptv.com/api/sign',
		personalCenter  :  'http://api.chang.pptv.com/api/personalCenter',
		videolist       :  'http://chang.pptv.com/api/video_list',
		checksign       :  'http://api.chang.pptv.com/api/checksign',
		playerinfobycid :  "http://api.chang.pptv.com/api/playerinfobycid",
		onlinescope     :  "http://api.chang.pptv.com/api/onlinescope",
	};
	/**
	 * [personalSpace 个人空间]
	 * @param  {[type]} data    [description]
	 * @param  {[type]} success [description]
	 * @param  {[type]} error   [description]
	 * @return {[type]}         [description]
	 */
	var update = function(data,success,error){
		loader.load(
			'http://api.chang.pptv.com/api/unpass_modify',
			data,
			success,
			error
		);
	};

	var success = function(data){
		var msg = {
			'-1':'参数不能空',
			'-2':'不是组合',
			'-3':'用户未报名',
			'-4':'用户审核状态不符合要求',
			'-5':'系统正忙，请稍后再试',
			'1':'操作成功'
		};
		if(data.status){
			alertBox({
				type:"mini",
				msg:msg[data.status]
			});
			if( data.status == 1 ){
				window.location.reload();
			}
		}else{
			alertBox({
				type:"mini",
				msg:'操作成功'+"<br/>" +  JSON.stringify(data)
			});
			window.location.reload();
		}
	};
	var error = function(){
		alertBox({
			type:"mini",
			msg:'系统异常'
		});
	};

	person.updateName = function(name,isGroup){
		var data = {};
		!isGroup ? ( data.cname = name ) : ( data.group_name = name ) ;
		update(data,success,error)
	};

	person.updatePic = function(url){
		update({photo:url},success,error)
	};

	person.edit = function(placeholder,validate){
		return edit(placeholder,validate);
	};

	module.exports = person;

});
