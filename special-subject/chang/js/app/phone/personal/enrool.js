/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
	var $ = require("jquery"),
	sdk = require("./../../../util/ppsdk/sdkUtil");
	window.enroll = {},en=enroll;

	if( $("#enrollStatus").val() != "0"){
		$(".wraper.enroll_w").addClass("after");
	}
	en.press = function(obj){
		var className = obj.className;
		obj.className += " pressed";
		setTimeout(function(){
			obj.className = className;
		},100);
	}
	en.go_enroll = function(obj,type){
		en.press(obj);
		var url = "";
		if(type=="s"){
			url = 'app://iph.pptv.com/v4/activity/enroll?activity=singtofame&mode=0';
		}else{
			url = 'app://iph.pptv.com/v4/activity/enroll?activity=singtofame&mode=1';
		}
		
		sdk("openNativePage",{
		    pageUrl: url,
		  	success: function () {

			},
			error: function(code, msg) {
				
			}
		});
		//en.open(url);
	}
})

