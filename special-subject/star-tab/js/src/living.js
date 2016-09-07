define(function(require, exports, module) {
	var $ = require('jquery');
	var Chat = require('chat');
	var $md5 = require('md5');
	require('libs/RongEmoji');
	require('libs/RongIMLib');

	var RONGYUN_APPKEY = "x4vkb1qpvp95k"; //融云appkey
	var GET_TOKEN = "http://fans.mobile.ppqa.com/rongtoken/get"; //获取融云token
	//	var $Token = "edFipDasCzvgJAwN/8YGy8/OArmqCeVIzuJKPWN14mxwDsECI9C4ucBNb7AdD667lIXXihPK1DpifT7mry45jb8cMvGKk5ug"; //@@@@test
	var　 $Token,
		$chatRoomID,
		$userid, //uuid
		$nickname = 'starLive1',
		$livebox,
		$currentTime, //当前时间
		$endTime,
		$lastCount = 10; // 拉取最近聊天最多 10 条。

	var Living = function() {}
	Living.prototype = {
		initPlayer: function(videoPlayer_options) { //version 播放器JS版本号
			var self = this;
			if (videoPlayer_options.livebox && videoPlayer_options.cid) {
				$livebox = $('.' + videoPlayer_options.livebox)[0];
				$chatRoomID = videoPlayer_options.chatID;
				var $width = $livebox.clientWidth;
				var $height = $livebox.clientHeight;
				if (videoPlayer_options.liveImg)
					$('<img src=' + videoPlayer_options.liveImg + '>').appendTo($livebox);
				var $playerIframe = $('<iframe style="top: 0;left: 0; z-index: 100;position:absolute;" id="player-iframe" src="http://pub.pptv.com/player/iframe/index.html#id=' + videoPlayer_options.cid + '&ctx=o%3dm.pptv.com" allowtransparency="true" width="100%" height="100%" scrolling="no" frameborder="0"></iframe>').appendTo($livebox);
				if (videoPlayer_options.endTime) {
					$endTime = videoPlayer_options.endTime;
					$currentTime = new Date().getTime();
					var endTime = setInterval(function() {
						$currentTime = new Date().getTime();
						if ($currentTime >= $endTime) {
							self.stopPlayer();
							clearInterval(endTime);
						}
					}, 1000);
				}
			}
		},
		stopPlayer: function() {
			var $iframe = $('iframe');
			$iframe.remove();
			var $stop = $('<div class="livestop"><span>直播已结束</span></div>').appendTo($livebox);
		},
		initChat: function(data) {
			var self = this;
			if (data.chatbox) {
				chatRoom = new Chat({
					box: data.chatbox
				});
				chatRoom.init();
				RongIMClient.init(RONGYUN_APPKEY);
				RongIMLib.RongIMEmoji.init();
				self.connectionStatus();
				self.receiveMessageListener();
				this.getChatToken();
			};
		},
		getChatToken: function() {
			var self = this;
			$userid = (this.getUUID()) ? this.getUUID() : this.newUuid() ;
			this.saveUUID($userid);
			console.log('userid = ' + $userid);
			//			var $t = new Date().getTime();
			//			var $t1 = $t ^ 1731311517;
			//			var $salt = '8a3298c37cb2210ce7ed2aa18bd5d092';
			//			var $params = 'userid=' + $userid + '&nickname=' + $nickname + '&platform=h5';
			//			var $sign = $md5.hex_md5($t1 + $salt + $params);
			var $url = GET_TOKEN + '?userid=' + $userid + '&nickname=' + $nickname + '&platform=h5';
			$.ajax({
				type: 'get',
				url: $url,
				dataType: 'jsonp',
				jsonpCallback: 'cb',
				cache: false,
				timeout: 30 * 1000,
				success: function(result) {
					if (result.code == 200) {
						$Token = result['data']['token'];
						self.connect();
					} else {
						console.log("通讯失败或返回数据非格式>>"　, 　result);
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					console.log("通讯失败或返回数据非格式");
				}
			});
		},
		newUuid: function(len, radix) {
			var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
			var uuid = [],
				i;
			radix = radix || chars.length;
			if (len) {
				// Compact form
				for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
			} else {
				// rfc4122, version 4 form
				var r;
				// rfc4122 requires these characters
				uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
				uuid[14] = '4';
				// Fill in random data.  At i==19 set the high bits of clock sequence as
				// per rfc4122, sec. 4.1.5
				for (i = 0; i < 36; i++) {
					if (!uuid[i]) {
						r = 0 | Math.random() * 16;
						uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
					}
				}
			}
			return uuid.join('');
		},
		connect: function() {
			var self = this;
			// 连接融云服务器。
			RongIMClient.connect($Token, {
				onSuccess: function(userId) {
					console.log("Login successfully." + userId);
					self.joinChatRoom();
				},
				onTokenIncorrect: function() {
					console.log('token无效');
				},
				onError: function(errorCode) {
					var info = '';
					switch (errorCode) {
						case RongIMLib.ErrorCode.TIMEOUT:
							info = '超时';
							break;
						case RongIMLib.ErrorCode.UNKNOWN_ERROR:
							info = '未知错误';
							break;
						case RongIMLib.ErrorCode.UNACCEPTABLE_PaROTOCOL_VERSION:
							info = '不可接受的协议版本';
							break;
						case RongIMLib.ErrorCode.IDENTIFIER_REJECTED:
							info = 'appkey不正确';
							break;
						case RongIMLib.ErrorCode.SERVER_UNAVAILABLE:
							info = '服务器不可用';
							break;
					}
					console.log(errorCode);
				}
			});
		},
		joinChatRoom: function() {
			console.log('尝试加入聊天室'  +  $chatRoomID);
			RongIMClient.getInstance().joinChatRoom($chatRoomID, $lastCount, {
				onSuccess: function() {
					console.log('加入聊天室成功');
				},
				onError: function(error) {
					console.log('加入聊天室失败');
				}
			});
		},
		connectionStatus: function() {
			var self = this;
			// 设置连接监听状态 （ status 标识当前连接状态）
			// 连接状态监听器
			RongIMClient.setConnectionStatusListener({
				onChanged: function(status) {
					switch (status) {
						case RongIMLib.ConnectionStatus.CONNECTED:
							console.log('链接成功');
							break;
						case RongIMLib.ConnectionStatus.CONNECTING:
							console.log('正在链接');
							break;
						case RongIMLib.ConnectionStatus.DISCONNECTED:
							console.log('断开连接');
							break;
						case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
							console.log('其他设备登录');
							self.getChatToken();
							break;
						case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
							console.log('网络不可用');
							break;
					}
				}
			});
		},
		receiveMessageListener: function() {
			var self = this;
			// 消息监听器
			RongIMClient.setOnReceiveMessageListener({
				// 接收到的消息
				onReceived: function(message) {
					// 判断消息类型
					switch (message.messageType) {
						case RongIMClient.MessageType.TextMessage:		
						var content=JSON.parse(message.content.content);
							if (chatRoom && content.contents)
							{
								var contents = content.contents;
								contents.forEach(function(e){
									chatRoom.sendMsg({
									userName: (e.nickName) ? e.nickName : e.userName,
									content: (e.content) ? RongIMLib.RongIMEmoji.emojiToHTML(e.content) : '',
									userPic: (e.facePic) ? e.facePic : 'http://rongcloud-web.qiniudn.com/docs_demo_rongcloud_logo.png',
									});
								})								
							}							
							break;
					}
				}
			});
		},
		loadJs: function(url, callback, chaset) {
			var $script = document.createElement("script");
			$script.src = url;
			$script.charset = chaset || "utf-8";
			$script.type = "text/javascript";
			if (callback) {
				if ($script.readyState) {
					$script.onreadystatechange = function() {
						var rs = $script.readyState;
						if (rs === "loaded" || rs === "complete")
							callback();
					};
				} else {
					$script.onload = callback;
				}
			}
			document.getElementsByTagName("head")[0].appendChild($script);
		},
		saveUUID : function(value){
			if(value == "") return;
			if(window.localStorage){
				var type = "UUID";
				localStorage[type] = value;
			}
		},
		getUUID: function(){
			var type = "UUID";
			var value = localStorage[type];
			return value;
		}
	}

	module.exports = Living;
});