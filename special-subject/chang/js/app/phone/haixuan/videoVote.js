/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
	var $ = require('jquery');
	var loader = require('./../../../util/loader/loader');

	var voteBefore = function(obj){
		$(obj).addClass("voting");
	}
	var voteAfter = function(obj,result){
		$(obj).removeClass("voting");
		$(obj).addClass( result ? "voated" : "");
	}
	var token = function(obj,type,id){
		loader.load(
			'http://api.chang.pptv.com/vote/csrf',
			{},
			function(data){
				var token = data.token;
				increase(obj,type,id,token);
			},
			'',
			function(data){
				alert("获取Token失败");
				voteAfter(obj,false)
			}
		);
	}

	var increase = function(obj,type,id,token){
		loader.load(
			"http://api.chang.pptv.com/vote/"+id+"/increase",
			{token:token},
			function(data){
				console.info(data);
				if(data.errors){
					alert(data.errors.message)
					voteAfter(obj,false)
				}else{
					voteAfter(obj,true)
				}
			},
			function(){
				console.info('error');
			}
		);
	}

	var vote = function(obj,type,id){
		//console.info(arguments);
		voteBefore(obj);
		token(obj,type,id);

	}
	module.exports = vote;
});
