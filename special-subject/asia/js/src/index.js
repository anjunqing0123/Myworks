define(function(require) {
	var $ = require('jquery');
	var isLoadSdk = false;
	window.ppsdkReady = false;
	$(document).ready(function () {
		ppsdk.config({
		});
		isLoadSdk = true;
		ppsdk.ready(function(){
			window.ppsdkReady = true;
		});
		ppsdk.error(function(code,msg){
			window.ppsdkReady = false;
		});
		var determineOS = function () {
			var ua = navigator.userAgent.toLowerCase();
			if (ua.indexOf("ipad") > 0 && ua.indexOf("linux") < 0) {
				return 1;
			} else if (ua.indexOf("iphone") > 0 && ua.indexOf("linux") < 0) {
				return 2;
			} else if (ua.indexOf("android") > 0 && ua.indexOf("linux") > 0) {
				return 3;
			} else if (ua.indexOf("windows phone") > 0) {
				return 4;
			} else if (ua.indexOf("windows") > 0) {
				return 5;
			} else if (ua.indexOf("mac") > 0 && ua.indexOf("linux") < 0) {
				return 6;
			} else {
				//非智能机
				return 7;
			}
		};
		window.isIOS = determineOS() == 2?true:false;
	});
	var Book = require('./book.js');
	activity = require('./activity.js');
	
	function MusicActPre() {
		this.act = new activity();
		this.act.init();
	}
	
	MusicActPre.prototype = {
		init : function(){
			
		}
	}
	var m = new MusicActPre() ;
});