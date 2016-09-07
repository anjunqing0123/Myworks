define(function(require, exports, module) {
	 var $ = require('jquery');
	  require("util/scroller");
		//  聊天室
	function Chat(options) {
		this.options = $.extend( {
			id: "Chat-" + +new Date(),
			box: null, 						//聊天室容器
			username: '',
			nickname: '',
			counter: 0, 					//消息条数
			max: 150,						//最大条数
			userPic: ''
		},options);
		this.chatbox = $('.' + this.options.box);
	}
	
		Chat.prototype = {
		init: function() {
			var self = this;
			if (!this.chatbox) {
				alert("调用容器不存在!");
				return false;
			};

			this.chatUL = this.chatbox.find("ul");//聊天室列表
			this.initlize();
			return this.chatbox;
		},
		//初始化
		initlize: function() {
			this.initScroll();
		},
		//初始化滚动条
		initScroll: function() {
			if(this.scroller)
			{
				this.scroller.rebuild();
			}
			else
				this.scroller = this.chatbox.ppScroller({}).scroll();
        },
        
        scrollToCurrentHandler: function(num) {
           if(this.scroller)  num == "0" ? this.scroller.scrollTo(0) : this.scroller.scrollTo(this.chatUL.height());
        },
        
        //发送聊天数据 params：聊天数据   flag：是否回调到播放器
		sendMsg: function(params) {
			this.showChatMsg(params);
			this.options.counter++;
			
			if (this.options.counter > this.options.max) {
				 this.removeFMsg();
			}
			return this;
		},
				//在聊天框里显示消息
		showChatMsg: function(params) {
			/**
			 * [消息格式定义]
			 * @type {Object}             *
			 * {
			 *     userName : 'lin04com',
			 * 	   userPic  : '用户头像'  图片路径或者空
			 *     content : '你吃饭了吗？'
			 * }
			 */
			var self = this;
			if (!params.userName) return;
			var msgText = params.content.replace(/\<(script|img|iframe|background|link|style|meta|base|a|body)/gi, "$1");
			var $li = $('<li class="living-board"><div class="living-star-pic"><img src=' + params.userPic + ' alt=""></div><div class="living-board-detail"><div class="living-board-name">' + this.htmlEncode(params.userName) +'</div><div class="living-board-info"><i></i><span class="content">' + msgText + '</span></div></div></div></li>').appendTo(this.chatUL);;
			this.scrollToCurrentHandler();
		},
		//清除首条聊天信息
        removeFMsg: function() {
           this.options.counter--;
           this.chatUL.children().first().remove();
        },
		htmlEncode: function(str) {
			if(str && str.length > 0)
				return str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;").replace(/'/gm, "&#039;");
		},

		htmlDecode: function(str) {
			if (str) {
				return str.replace(/&lt;/gm, "<").replace(/&gt;/gm, ">").replace(/&amp;/gm, "&").replace(/&#039;/gm, "'").replace(/&quot;/gm, '"').replace(/&apos;/gm, "'").replace(/&nbsp;/gm, " ");
			}
		},
	}		
		module.exports = Chat;
})
