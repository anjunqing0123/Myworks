/**
 * press 添加点击自添加press样式 需要有press效果的，直接在css中加&.press就行了
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
	var $ = require('jquery');
	$("body *").click(function(){
		if( !$(this).is(".press") ){
			$(this).addClass("press");
			var self = this;
			setTimeout(function(){
				clearPress(self);
			},300);
		}
	});
	function clearPress(obj){
		$(obj).removeClass("press");
	}
});