/**
 * 个人中心弹出修改框
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){

	var $ = require('zepto');
		alertBox = require('./../../../util/log/alertBox')
	;

	var uuid = 0;
	var listener = {};
	listener.height = -1;
	listener.res = null;

	listener.fixedWatch =  function (el) {
		if (listener.height == -1 ) listener.height = $("body").height();
		if(document.activeElement.nodeName == 'INPUT'){
			el.css('position', 'static');
		} else {
			el.css('position', 'fixed');
			if(listener.res) { clearInterval(listener.res); listener.res  = null; }
		}
	};

	listener.listen =  function () {
		if(!listener.res) {
			listener.fixedWatch($('.mask .input_w'));
			listener.res = setInterval(function () {
			  listener.fixedWatch($('.mask .input_w'));
			}, 500);
		}
	};
	listener.enableScroller = function(e){
		e.preventDefault();
	};
	var edit = (function(){
		var edit = function(placeholder,validate){
			this.init(placeholder,validate);
		};
		var prop = edit.prototype;

		prop.init = function(placeholder,validate){
			$("body").scrollTop(0);
			uuid++;
			this.id = "mask_"+uuid;
			var html = [
			'<div class="mask" id="'+this.id+'">',
			'	<div class="input_w">',
			'		<input type="text" placeholder="'+placeholder+'"/>',
			'		<div class="error_v">',
			'			<span></span>',
			'		</div>',
			'		<div class="clear"></div>',
			' 		<div class="sure">确定</div>',
			'	</div>',
			'</div>'
			].join("");

			$("body").addClass("edit");
			$("body").append(html);

			this.bindClick();
			this.bindChange(validate);
			this.disableScroller();
		};

		prop.disableScroller = function(){
			document.addEventListener('touchmove', listener.enableScroller, false);
		};
		prop.enableScroller = function(){
			document.removeEventListener('touchmove', listener.enableScroller, false);
		};
		prop.bindClick = function(){
			var self = this;
			$("#"+this.id).find(".input_w .clear").click(function(){
				$("#"+self.id).find("input").val('');
				self.error('');
				$("#"+self.id).find("input").focus();
			});
		};

		prop.error = function(msg){
			$("#"+this.id).find(".error_v span").text(msg);
		};
		prop.bindChange = function(validate){
			var self = this;
			self.input = $("#"+this.id).find("input");
			$("#"+this.id).find("input").keyup(function(e){
				var keycode = e.which;
			    if (keycode == 13) {
			    	var value = self.trim($(this).val());
			    	$(this).val(value);
			        var val = validate.call(self,value);
					if( val ) self.remove();
			    }
			});
			$("#"+this.id).find(".sure").click(function(e){
				var value = self.trim($(self.input).val());
				$(self.input).val(value);
				var val = validate.call(self,value);
				if( val ) self.remove();
			});
			$("#"+this.id).find(".input_w").click(function(e){
				$(self.input).focus();
				e.preventDefault();
				return false;
			});
			$("#"+this.id).click(function(){
				self.remove();
			});
			$("#"+this.id).find("input").focus(function(){
				listener.listen();
			});
		};
		prop.remove = function(){
			$("#"+this.id).remove();
			this.enableScroller();
			$("body").removeClass("edit");
		};
		prop.trim = function(str){
			return $.trim(str)
		};
		return edit;
	})();

	module.exports = function(placeholder,validate){
		return new edit(placeholder,validate);
	};
});
